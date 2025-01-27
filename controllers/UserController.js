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
  user_name: Joi.string().min(1).required(),
  user_email: Joi.string().email().required(),
  user_password: Joi.string().min(8).required(),
  user_uploaded_books: Joi.array().items(Joi.string()).default([]),
  user_uploaded_courses: Joi.array().items(Joi.string()).default([]),
});

module.exports = {
  async registerUser(req, res) {
    try {
      const { user_name, user_email, user_password } = req.body;

      // Validate input using Joi
      const { error } = userSchema.validate({ user_name, user_email, user_password, user_books: [], user_courses: [], user_role: "normal" });
      if (error) return res.status(400).json({ error: error.details.map((detail) => detail.message) });

      const existingUser = await UserModel.getUserByEmail(user_email);
      if (existingUser) return res.status(409).json({ error: "Email already exists. Please use a different email address." });

      const user_id = uuidv4();
      const hashedPassword = await bcrypt.hash(user_password, 10);

      // Initialize the user with empty books and courses
      const newUser = {
        user_id,
        user_name,
        user_email,
        user_password: hashedPassword,
        user_role: "normal",
        user_books: [],
        user_courses: [],
      };

      await UserModel.createUser(newUser);
      res.status(201).json({ message: "User registered successfully!", user: newUser });
    } catch (error) {
      res.status(500).json({ error: "Error registering user", details: error.message });
    }
  },

  async registerAdmin(req, res) {
    try {
      const { user_name, user_email, user_password, user_uploaded_books, user_uploaded_courses } = req.body;

      // Validate input using Joi
      const { error } = adminSchema.validate({ user_name, user_email, user_password, user_uploaded_books, user_uploaded_courses });
      if (error) return res.status(400).json({ error: error.details.map((detail) => detail.message) });

      const existingUser = await UserModel.getUserByEmail(user_email);
      if (existingUser) return res.status(409).json({ error: "Email already exists. Please use a different email address." });

      const user_id = uuidv4();
      const hashedPassword = await bcrypt.hash(user_password, 10);

      // Fetch full details for uploaded books and courses
      const fullUploadedBooks = await Promise.all(
        user_uploaded_books.map(async (bookId) => {
          const book = await BookModel.getBookById(bookId);
          if (!book) throw new Error(`Book with ID ${bookId} not found`);
          return book;
        })
      );

      const fullUploadedCourses = await Promise.all(
        user_uploaded_courses.map(async (courseId) => {
          const course = await CourseModel.getCourseById(courseId);
          if (!course) throw new Error(`Course with ID ${courseId} not found`);
          return course;
        })
      );

      const newAdmin = {
        user_id,
        user_name,
        user_email,
        user_password: hashedPassword,
        user_role: "admin",
        user_uploaded_books: fullUploadedBooks,
        user_uploaded_courses: fullUploadedCourses,
      };

      await UserModel.createUser(newAdmin);
      res.status(201).json({ message: "Admin registered successfully!", admin: newAdmin });
    } catch (error) {
      res.status(500).json({ error: "Error registering admin", details: error.message });
    }
  },

  async getUserById(req, res) {
    try {
      const { user_id } = req.params;
      const user = await UserModel.getUserById(user_id);
      if (!user) return res.status(404).json({ error: "User not found" });

      // Fetch full details for user_books and user_courses
      const fullBooks = await Promise.all(
        user.user_books.map(async (bookId) => {
          const book = await BookModel.getBookById(bookId);
          return book || { error: `Book with ID ${bookId} not found` };
        })
      );

      const fullCourses = await Promise.all(
        user.user_courses.map(async (courseId) => {
          const course = await CourseModel.getCourseById(courseId);
          return course || { error: `Course with ID ${courseId} not found` };
        })
      );

      user.user_books = fullBooks;
      user.user_courses = fullCourses;

      const { user_password, ...sanitizedUser } = user; // Exclude password
      res.status(200).json({ user: sanitizedUser });
    } catch (error) {
      res.status(500).json({ error: "Error fetching user", details: error.message });
    }
  },

  async updateUserById(req, res) {
    try {
      const { user_id } = req.params;
      const { user_role, user_books, user_courses, ...allowedUpdates } = req.body;
  
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
  
      const updatedFields = {};
      if (allowedUpdates.user_name !== undefined) updatedFields.user_name = allowedUpdates.user_name;
      if (allowedUpdates.user_email !== undefined) updatedFields.user_email = allowedUpdates.user_email;
  
      if (allowedUpdates.user_password !== undefined) {
        const hashedPassword = await bcrypt.hash(allowedUpdates.user_password, 10);
        updatedFields.user_password = hashedPassword;
      }
  
      await UserModel.updateUserById(user_id, updatedFields);
  
      // Enrich user_books and user_courses with full details
      const fullBooks = await Promise.all(
        user.user_books.map(async (bookId) => {
          const book = await BookModel.getBookById(bookId);
          return book || { error: `Book with ID ${bookId} not found` };
        })
      );
  
      const fullCourses = await Promise.all(
        user.user_courses.map(async (courseId) => {
          const course = await CourseModel.getCourseById(courseId);
          return course || { error: `Course with ID ${courseId} not found` };
        })
      );
  
      res.status(200).json({
        message: "User updated successfully!",
        user: {
          ...user,
          ...updatedFields,
          user_books: fullBooks,
          user_courses: fullCourses,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating user", details: error.message });
    }
  },
  async updateAdminById(req, res) {
    try {
      const { user_id } = req.params;
      const { user_role, user_id: bodyUserId, user_uploaded_books, user_uploaded_courses, ...allowedUpdates } = req.body;

      // Ensure user_id is constant
      if (bodyUserId && bodyUserId !== user_id) {
        return res.status(400).json({ error: "user_id cannot be updated." });
      }

      // Validate input using Joi, excluding restricted fields
      const { error } = adminSchema.validate({
        ...allowedUpdates,
        user_uploaded_books: user_uploaded_books || [],
        user_uploaded_courses: user_uploaded_courses || []
      }, { allowUnknown: true });
      if (error) return res.status(400).json({ error: error.details.map((detail) => detail.message) });

      const admin = await UserModel.getUserById(user_id);
      if (!admin) return res.status(404).json({ error: "Admin not found" });

      // Check if the updated email already exists for a different user
      if (allowedUpdates.user_email) {
        const existingUser = await UserModel.getUserByEmail(allowedUpdates.user_email);
        if (existingUser && existingUser.user_id !== user_id) {
          return res.status(409).json({ error: "Email already exists. Please use a different email address." });
        }
      }

      const updatedFields = {};
      if (allowedUpdates.user_name !== undefined) updatedFields.user_name = allowedUpdates.user_name;
      if (allowedUpdates.user_email !== undefined) updatedFields.user_email = allowedUpdates.user_email;

      if (allowedUpdates.user_password !== undefined) {
        const hashedPassword = await bcrypt.hash(allowedUpdates.user_password, 10);
        updatedFields.user_password = hashedPassword;
      }

      // Fetch full details for uploaded books and courses
      if (user_uploaded_books) {
        updatedFields.user_uploaded_books = await Promise.all(
          user_uploaded_books.map(async (bookId) => {
            const book = await BookModel.getBookById(bookId);
            if (!book) throw new Error(`Book with ID ${bookId} not found`);
            return book;
          })
        );
      }

      if (user_uploaded_courses) {
        updatedFields.user_uploaded_courses = await Promise.all(
          user_uploaded_courses.map(async (courseId) => {
            const course = await CourseModel.getCourseById(courseId);
            if (!course) throw new Error(`Course with ID ${courseId} not found`);
            return course;
          })
        );
      }

      await UserModel.updateUserById(user_id, updatedFields);

      res.status(200).json({ message: "Admin updated successfully!", admin: { ...admin, ...updatedFields } });
    } catch (error) {
      res.status(500).json({ error: "Error updating admin", details: error.message });
    }
  },
  async deleteUserById(req, res) {
    try {
      const { user_id } = req.params;

      const user = await UserModel.getUserById(user_id);
      if (!user) return res.status(404).json({ error: "User not found" });

      await UserModel.deleteUserById(user_id);
      res.status(200).json({ message: "User deleted successfully!" });
    } catch (error) {
      res.status(500).json({ error: "Error deleting user", details: error.message });
    }
  },

  async getAllAdmins(req, res) {
    try {
      const users = await UserModel.getAllUsers();
      const admins = users.filter(user => user.user_role === "admin");

      const enrichedAdmins = await Promise.all(
        admins.map(async (admin) => {
          const fullBooks = await Promise.all(
            admin.user_uploaded_books.map(async (bookId) => {
              const book = await BookModel.getBookById(bookId);
              return book || { error: `Book with ID ${bookId} not found` };
            })
          );

          const fullCourses = await Promise.all(
            admin.user_uploaded_courses.map(async (courseId) => {
              const course = await CourseModel.getCourseById(courseId);
              return course || { error: `Course with ID ${courseId} not found` };
            })
          );

          return {
            ...admin,
            user_uploaded_books: fullBooks,
            user_uploaded_courses: fullCourses,
          };
        })
      );

      res.status(200).json({ admins: enrichedAdmins });
    } catch (error) {
      res.status(500).json({ error: "Error fetching all admins", details: error.message });
    }
  },

  async getAllUsers(req, res) {
    try {
      const users = await UserModel.getAllUsers();
      const enrichedUsers = await Promise.all(
        users.map(async (user) => {
          const fullBooks = await Promise.all(
            user.user_books.map(async (bookId) => {
              const book = await BookModel.getBookById(bookId);
              return book || { error: `Book with ID ${bookId} not found` };
            })
          );

          const fullCourses = await Promise.all(
            user.user_courses.map(async (courseId) => {
              const course = await CourseModel.getCourseById(courseId);
              return course || { error: `Course with ID ${courseId} not found` };
            })
          );

          return {
            ...user,
            user_books: fullBooks,
            user_courses: fullCourses,
          };
        })
      );

      const sanitizedUsers = enrichedUsers.map(({ user_password, ...rest }) => rest); // Exclude passwords
      res.status(200).json({ users: sanitizedUsers });
    } catch (error) {
      res.status(500).json({ error: "Error fetching all users", details: error.message });
    }
  }
};