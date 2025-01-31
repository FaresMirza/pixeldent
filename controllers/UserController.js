const UserModel = require("../models/UserModel");
const CourseModel = require("../models/CourseModel");
const BookModel = require("../models/BookModel");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

// Joi schema for user validation
const userSchema = Joi.object({
  user_name: Joi.string().min(1).optional(),
  user_email: Joi.string().email().optional(),
  user_password: Joi.string().min(8).optional(),
  user_books: Joi.array().items(Joi.string()).default([]), // Empty by default
  user_courses: Joi.array().items(Joi.string()).default([]), // Empty by default
  user_role: Joi.string().valid("admin", "normal", "super").default("normal"), // Optional with default value
});

// Joi schema for admin validation
const adminSchema = Joi.object({
  user_name: Joi.string().min(1).optional(),
  user_email: Joi.string().email().optional(),
  user_password: Joi.string().min(8).optional(),
  user_state: Joi.string().valid("active", "inactive").default("inactive"), // Default to inactive
});

const fetchInstructorDetails = async (instructors) => {
  const ids = Array.isArray(instructors) ? instructors : [instructors]; // Normalize to an array
  const details = await Promise.all(
    ids.map(async (id) => {
      const user = await UserModel.getAdminById(id);
      if (user && (user.user_role === "super" || user.user_role === "admin")) {
        return user;
      }
      return null;
    })
  );
  if (details.includes(null)) {
    const missingIds = ids.filter((_, i) => !details[i]); // Identify missing IDs
    throw new Error(`User(s) with ID(s) ${missingIds.join(", ")} not found or not authorized as instructors`);
  }
  return details;
};

module.exports = {
  async registerUser(req, res) {
    try {
      const { user_name, user_email, user_password } = req.body;
  
      // Validate input using Joi
      const { error } = userSchema.validate({
        user_name,
        user_email,
        user_password,
        user_books: [],
        user_courses: [],
        user_role: "normal",
      });
      if (error) {
        return res.status(400).json({ error: error.details.map((detail) => detail.message) });
      }
  
      const existingUser = await UserModel.getUserByEmail(user_email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already exists. Please use a different email address." });
      }
  
      const user_id = uuidv4();
      const hashedPassword = await bcrypt.hash(user_password, 10);
  
      // Initialize the user with empty books and courses and set the state to active
      const newUser = {
        user_id,
        user_name,
        user_email,
        user_password: hashedPassword,
        user_role: "normal",
        user_books: [],
        user_courses: [],
        user_state: "active", // Set user_state to active by default
      };
  
      await UserModel.createUser(newUser);

      // Generate JWT token
      const token = jwt.sign(
        {
          user_id: newUser.user_id,
          user_role: newUser.user_role,
        },
        process.env.JWT_SECRET, // Secret key from environment variables
        { expiresIn: "1h" } // Token expiration time
      );
  
      res.status(201).json({
        message: "User registered successfully!",
        user: {
          user_id: newUser.user_id,
          user_name: newUser.user_name,
          user_email: newUser.user_email,
          user_role: newUser.user_role,
          user_state: newUser.user_state,
        },
        token, // Include the generated token in the response
      });
    } catch (error) {
      res.status(500).json({ error: "Error registering user", details: error.message });
    }
  },
  //
  async registerAdmin(req, res) {
    try {
      const { user_name, user_email, user_password } = req.body;
  
      // Validate input using Joi
      const { error } = adminSchema.validate({
        user_name,
        user_email,
        user_password,
      });
      if (error) return res.status(400).json({ error: error.details.map((detail) => detail.message) });
  
      const existingUser = await UserModel.getUserByEmail(user_email);
      if (existingUser) return res.status(409).json({ error: "Email already exists. Please use a different email address." });
  
      const user_id = uuidv4();
      const hashedPassword = await bcrypt.hash(user_password, 10);
  
      const newAdmin = {
        user_id,
        user_name,
        user_email,
        user_password: hashedPassword,
        user_role: "admin",
        user_state: "inactive", // Set default state to inactive
        user_uploaded_courses: [], // Always set to an empty array, cannot be set by the user
      };
  
      await UserModel.createUser(newAdmin);
      res.status(201).json({ message: "Admin registered successfully!", admin: newAdmin });
    } catch (error) {
      res.status(500).json({ error: "Error registering admin", details: error.message });
    }
},
  async loginUser(req, res) {
    try {
      const { user_email, user_password } = req.body;
  
      // Validate email and password
      if (!user_email || !user_password) {
        return res.status(400).json({ error: "Email and password are required." });
      }
  
      // Find user by email
      const user = await UserModel.getUserByEmail(user_email);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
  
      // Check if the user is active
      if (user.user_state !== "active") {
        return res.status(403).json({ error: "User account is inactive. Please contact support." });
      }
  
      // Verify password
      const isPasswordValid = await bcrypt.compare(user_password, user.user_password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password." });
      }
  
      // Generate JWT token
      const token = jwt.sign(
        {
          user_id: user.user_id,
          user_role: user.user_role,
        },
        process.env.JWT_SECRET, // Use an environment variable for the secret
        { expiresIn: "1h" } // Token expiration time
      );
  
      // Return the response with user details and token
      res.status(200).json({
        message: "Login successful!",
        user: {
          user_id: user.user_id,
          user_role: user.user_role,
        },
        token,
      });
    } catch (error) {
      res.status(500).json({ error: "Error logging in", details: error.message });
    }
  },

  async getUserById(req, res) {
    try {
      const { user_id } = req.params;
      const requestingUser = req.user; // Extract user info from the token (middleware)
  
      // Check if the user is fetching their own data or if they are a super user
      if (requestingUser.user_id !== user_id && requestingUser.user_role !== "super") {
        return res.status(403).json({ error: "Access denied. You can only view your own information." });
      }
  
      const user = await UserModel.getUserById(user_id);
      if (!user) return res.status(404).json({ error: "User not found" });
  
      // Exclude password from the response
      const { user_password, ...sanitizedUser } = user;
      res.status(200).json({ user: sanitizedUser });
    } catch (error) {
      res.status(500).json({ error: "Error fetching user", details: error.message });
    }
  }
,
async getAdminById(req, res) {
  try {
    const { user_id } = req.params;

    // Validate user_id
    if (!user_id || typeof user_id !== "string") {
      return res.status(400).json({ error: "Invalid user_id format" });
    }

    // Ensure the requester is authorized
    const requestingUser = req.user; // Assuming `req.user` contains the logged-in user's info from the JWT token
    if (!requestingUser) {
      return res.status(403).json({ error: "Access denied. Unauthorized request." });
    }

    const admin = await UserModel.getAdminById(user_id);

    // Check if the admin exists and their role
    if (!admin || (admin.user_role !== "admin" && admin.user_role !== "super")) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Check if the requester is allowed to access this admin's details
    if (
      requestingUser.user_role !== "super" &&
      requestingUser.user_id !== user_id
    ) {
      return res.status(403).json({ error: "Access denied. You can only view your own information." });
    }

    const { user_password, ...sanitizedAdmin } = admin; // Exclude password
    res.status(200).json({ admin: sanitizedAdmin });
  } catch (error) {
    res.status(500).json({ error: "Error fetching admin", details: error.message });
  }
},

async updateUserById(req, res) {
  try {
    const { user_id } = req.params;
    const { user_role, user_books, user_courses, user_password, ...allowedUpdates } = req.body;

    // Ensure the requester is authorized
    const requestingUser = req.user; // Assuming `req.user` contains the logged-in user's info from the JWT token
    if (!requestingUser) {
      return res.status(403).json({ error: "Access denied. Unauthorized request." });
    }

    // Allow only the user themselves or a superadmin to update the user
    if (requestingUser.user_role !== "super" && requestingUser.user_id !== user_id) {
      return res.status(403).json({ error: "Access denied. You can only update your own information." });
    }

    // Validate input using Joi, excluding restricted fields
    const { error } = userSchema.validate(allowedUpdates, { allowUnknown: true });
    if (error) return res.status(400).json({ error: error.details.map((detail) => detail.message) });

    const user = await UserModel.getUserById(user_id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if the updated email already exists for a different user
    if (allowedUpdates.user_email) {
      const existingUser = await UserModel.getUserByEmail(allowedUpdates.user_email);
      if (existingUser && existingUser.user_id !== user_id) {
        return res.status(409).json({ error: "Email already exists. Please use a different email address." });
      }
    }

    // Hash the password if it's being updated
    if (user_password) {
      const hashedPassword = await bcrypt.hash(user_password, 10);
      allowedUpdates.user_password = hashedPassword;
    }

    const updatedUser = await UserModel.updateUserById(user_id, allowedUpdates);

    res.status(200).json({
      message: "User updated successfully!",
      user: updatedUser, // Use updated user attributes from DynamoDB
    });
  } catch (error) {
    res.status(500).json({ error: "Error updating user", details: error.message });
  }
},
  
  async updateUserBooksAndCourses(req, res) {
    try {
      const { user_id } = req.params;
      const { user_books, user_courses } = req.body;
  
      // Fetch the user
      const user = await UserModel.getUserById(user_id);
      if (!user) return res.status(404).json({ error: "User not found" });
  
      const updatedFields = {};
  
      // Fetch full book details
      if (user_books !== undefined) {
        const fullBooks = await Promise.all(
          user_books.map(async (bookId) => {
            const book = await BookModel.getBookById(bookId);
            if (!book) throw new Error(`Book with ID ${bookId} not found`);
            return book;
          })
        );
        updatedFields.user_books = fullBooks;
      }
  
      // Fetch full course details
      if (user_courses !== undefined) {
        const fullCourses = await Promise.all(
          user_courses.map(async (courseId) => {
            const course = await CourseModel.getCourseById(courseId);
            if (!course) throw new Error(`Course with ID ${courseId} not found`);
            return course;
          })
        );
        updatedFields.user_courses = fullCourses;
      }
  
      // Update the user with full objects
      await UserModel.updateUserById(user_id, updatedFields);
  
      res.status(200).json({
        message: "User's books and courses updated successfully!",
        user: {
          ...user,
          ...updatedFields,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating user's books and courses", details: error.message });
    }
  },
  async updateAdminById(req, res) {
    try {
        const { user_id } = req.params;
        const { user_role, user_state, ...allowedUpdates } = req.body;

        // Ensure only the admin themselves or a super admin can update the details
        const requestingUser = req.user;
        if (!requestingUser || (requestingUser.user_role !== "super" && requestingUser.user_id !== user_id)) {
            return res.status(403).json({ error: "Access denied." });
        }

        // Validate the input using Joi
        const { error } = adminSchema.validate(allowedUpdates, { allowUnknown: true });
        if (error) {
            return res.status(400).json({ error: error.details.map((detail) => detail.message) });
        }

        // Check if the admin exists
        const admin = await UserModel.getUserById(user_id);
        if (!admin || (admin.user_role !== "admin" && admin.user_role !== "super")) {
            return res.status(404).json({ error: "Admin not found" });
        }

        // Check if the updated email already exists for another user
        if (allowedUpdates.user_email) {
            const existingUser = await UserModel.getUserByEmail(allowedUpdates.user_email);
            if (existingUser && existingUser.user_id !== user_id) {
                return res.status(409).json({ error: "Email already exists. Use a different email address." });
            }
        }

        // Hash the password if it's being updated
        if (allowedUpdates.user_password) {
            allowedUpdates.user_password = await bcrypt.hash(allowedUpdates.user_password, 10);
        }

        // Update the admin in the database
        await UserModel.updateUserById(user_id, allowedUpdates);

        // Fetch updated admin details
        const updatedAdmin = await UserModel.getUserById(user_id);

        // Fetch all courses associated with the admin (without using indexes)
        const allCourses = await CourseModel.getAllCourses();
        const adminCourses = allCourses.filter(course => course.course_instructor.user_id === user_id);

        // Prepare updated instructor details (without sensitive fields)
        const updatedInstructorDetails = {
            user_id: updatedAdmin.user_id,
            user_name: updatedAdmin.user_name,
            user_email: updatedAdmin.user_email,
            user_role: updatedAdmin.user_role,
        };

        // Update each course's `course_instructor` field
        await Promise.all(
            adminCourses.map(async (course) => {
                await CourseModel.updateCourseById(course.course_id, {
                    course_instructor: updatedInstructorDetails,
                });
            })
        );

        return res.status(200).json({
            message: "Admin updated successfully!",
            admin: updatedAdmin,
        });

    } catch (error) {
        console.error("Error updating admin:", error);
        return res.status(500).json({ error: "Error updating admin", details: error.message });
    }
},
async updateAdminState(req, res) {
  try {
      const { user_id } = req.params; // Admin ID to update
      const { user_state } = req.body; // New state (active/inactive)

      // Validate `user_state` input
      if (!["active", "inactive"].includes(user_state)) {
          return res.status(400).json({ error: "Invalid state. Allowed values are 'active' or 'inactive'." });
      }

      // Verify if the user making the request is `super`
      const requestingUser = req.user; // Extract from JWT middleware
      if (!requestingUser || requestingUser.user_role !== "super") {
          return res.status(403).json({ error: "Access denied. Only super users can update admin state." });
      }

      // Fetch the admin from the database
      const admin = await UserModel.getUserById(user_id);
      if (!admin || admin.user_role !== "admin") {
          return res.status(404).json({ error: "Admin not found." });
      }

      // Update the admin's state in the database
      await UserModel.updateUserById(user_id, { user_state });

      // Fetch the **updated** admin details
      const updatedAdmin = await UserModel.getUserById(user_id); // Ensure the latest details

      // **Update courses where this admin is the instructor**
      const allCourses = await CourseModel.getAllCourses(); // Fetch all courses
      const instructorCourses = allCourses.filter(course => course.course_instructor.user_id === user_id);

      // Update only the courses where the admin is the instructor
      if (instructorCourses.length > 0) {
          await Promise.all(
              instructorCourses.map(async (course) => {
                  await CourseModel.updateCourseById(course.course_id, {
                      course_instructor: {
                          user_id: updatedAdmin.user_id,
                          user_name: updatedAdmin.user_name,
                          user_email: updatedAdmin.user_email,
                          user_role: updatedAdmin.user_role,
                          user_state: updatedAdmin.user_state, // Reflect new state
                      }
                  });
              })
          );
      }

      res.status(200).json({
          message: "Admin state updated successfully!",
          admin: updatedAdmin,
      });

  } catch (error) {
      console.error("Error updating admin state:", error);
      res.status(500).json({ error: "Error updating admin state", details: error.message });
  }
},
  async deleteUserById(req, res) {
    try {
      const { user_id } = req.params;
  
      // Verify if the user making the request is a superadmin
      const requestingUser = req.user; // Assume req.user is populated by the authentication middleware
      if (!requestingUser || requestingUser.user_role !== "super") {
        return res.status(403).json({ error: "Access denied. Only super users can delete users." });
      }
  
      // Fetch the user to be deleted
      const user = await UserModel.getUserById(user_id);
      if (!user) return res.status(404).json({ error: "User not found." });
  
      // Delete the user
      await UserModel.deleteUserById(user_id);
  
      res.status(200).json({ message: "User deleted successfully!" });
    } catch (error) {
      res.status(500).json({ error: "Error deleting user", details: error.message });
    }
  },

  async getAllAdmins(req, res) {
    try {
        // Fetch all users and filter for admins and super admins
        const users = await UserModel.getAllUsers();
        const admins = users.filter(user => user.user_role === "admin" || user.user_role === "super");

        // Sanitize data to avoid exposing sensitive information
        const sanitizedAdmins = admins.map(({ user_password, ...admin }) => admin);

        res.status(200).json({ admins: sanitizedAdmins });
    } catch (error) {
        res.status(500).json({ error: "Error fetching all admins", details: error.message });
    }
},

async getAllNormalUsers(req, res) {
  try {
      // Ensure only super admins can access
      const { user_role } = req.user;
      if (user_role !== "super") {
          return res.status(403).json({ error: "Access denied. Only super users can view normal users." });
      }

      // Fetch all users from the database
      const users = await UserModel.getAllUsers();

      // Filter only normal users and exclude passwords
      const normalUsers = users
          .filter(user => user.user_role === "normal")
          .map(({ user_password, ...rest }) => rest);

      res.status(200).json({ users: normalUsers });
  } catch (error) {
      res.status(500).json({ error: "Error fetching normal users", details: error.message });
  }
}
};