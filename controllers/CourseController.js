const shortid = require("shortid");
const CourseModel = require("../models/CourseModel");
const UserModel = require("../models/UserModel");
const Joi = require("joi");

// Joi schema for course validation
const courseSchema = Joi.object({
  course_name: Joi.string().min(1),
  course_description: Joi.string(),
  course_price: Joi.number().positive(),
  course_instructor: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
  course_image: Joi.string().optional(),
  course_videos: Joi.array().items(Joi.string()), // New addition
  course_lessons: Joi.array().items(
    Joi.object({
      subject: Joi.string(),
      description: Joi.string(),
      vid_url: Joi.string().uri(),
    })
  ),
  course_files: Joi.array().items(
    Joi.object({
      file_name: Joi.string(),
      file_url: Joi.string().uri(),
    })
  ),
  course_published: Joi.boolean(),
});

// Helper function to fetch instructor details and validate their existence
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
  // Register a new course
  async registerCourse(req, res) {
    try {
        // Extract user_id and user_role from the token
        const { user_id, user_role } = req.user;

        // Only allow "admin" or "super" users to register a course
        if (!["admin", "super"].includes(user_role)) {
            return res.status(403).json({ error: "Access denied. Only admins and super users can add courses." });
        }

        // Validate request body using Joi schema
        const { error } = courseSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details.map((detail) => detail.message) });
        }

        let {
            course_name,
            course_description,
            course_price,
            course_image,
            course_videos,
            course_lessons,
            course_files,
            course_published,
        } = req.body;

        // Generate a new course ID **ONCE**
        const course_id = shortid.generate();

        // Fetch instructor details using the user_id from the token
        const instructorDetails = await UserModel.getUserById(user_id);
        if (!instructorDetails) {
            return res.status(404).json({ error: "Instructor not found" });
        }

        // Construct the new course object
        const newCourse = {
            course_id,  // ✅ Ensuring the same course_id is used
            course_name,
            course_description,
            course_price,
            course_instructor: {
                user_id: instructorDetails.user_id,
                user_name: instructorDetails.user_name,
                user_email: instructorDetails.user_email,
                user_role: instructorDetails.user_role
            },
            course_image,
            course_videos,
            course_lessons,
            course_files,
            course_published,
        };

        // Save the course to the database
        await CourseModel.createCourse(newCourse);

        // Ensure `user_uploaded_courses` exists and update it **without creating a new course_id**
        const updatedCourses = instructorDetails.user_uploaded_courses || [];

        // Avoid duplicate course entries in user_uploaded_courses
        const courseExists = updatedCourses.some(course => course.course_id === course_id);
        if (!courseExists) {
            updatedCourses.push({
                course_id,  // ✅ Ensuring the same course_id is used
                course_name,
                course_description,
                course_price,
                course_image,
                course_videos,
                course_lessons,
                course_files,
                course_published,
            });

            // Update the instructor's uploaded courses in the database
            await UserModel.updateUserById(user_id, { user_uploaded_courses: updatedCourses });
        }

        // Respond with the created course
        res.status(201).json({
            message: "Course added successfully!",
            course: newCourse,
        });

    } catch (error) {
        res.status(error.message.includes("not found") ? 400 : 500).json({ error: error.message });
    }
},

  // Get all courses
  async getAllCourses(req, res) {
    try {
        const courses = await CourseModel.getAllCourses();
        res.status(200).json({ courses });
    } catch (error) {
        res.status(500).json({ error: "Error fetching courses", details: error.message });
    }
},

  // Get a single course by ID
  async getCourseById(req, res) {
    try {
        const { course_id } = req.params;

        const course = await CourseModel.getCourseById(course_id);
        if (!course) return res.status(404).json({ error: "Course not found" });

        res.status(200).json({ course });
    } catch (error) {
        res.status(500).json({ error: "Error fetching course", details: error.message });
    }
},

async getAllCoursesForAdmin(req, res) {
  try {
      // Extract `user_id` and `user_role` from the token (added by the verifyToken middleware)
      const { user_id, user_role } = req.user;

      // Ensure the user making the request is an admin or super admin
      if (!["admin", "super"].includes(user_role)) {
          return res.status(403).json({ error: "Access denied. Only admins or super users can access this resource." });
      }

      // Fetch all courses
      const allCourses = await CourseModel.getAllCourses();

      // If the user is an admin, filter courses by course_instructor.user_id
      const filteredCourses = user_role === "super"
          ? allCourses
          : allCourses.filter(course => course.course_instructor.user_id === user_id);

      res.status(200).json({ courses: filteredCourses });
  } catch (error) {
      res.status(500).json({ error: "Error fetching courses", details: error.message });
  }
},
  // Update a course by ID
  async updateCourseById(req, res) {
    try {
      const { course_id } = req.params;
      const { user_id, user_role } = req.user;

      // Only allow "admin" or "super" users to update a course
      if (!["admin", "super"].includes(user_role)) {
        return res.status(403).json({ error: "Access denied. Only admins and super users can update courses." });
      }

      // Validate request body using Joi schema
      const { error } = courseSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details.map((detail) => detail.message) });
      }

      let {
        course_name,
        course_description,
        course_price,
        course_image,
        course_videos,
        course_lessons,
        course_files,
        course_published,
      } = req.body;

      // Check if course exists
      const existingCourse = await CourseModel.getCourseById(course_id);
      if (!existingCourse) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Ensure the user updating the course is the original instructor (if not a super admin)
      if (user_role !== "super" && existingCourse.course_instructor.user_id !== user_id) {
        return res.status(403).json({ error: "Access denied. You can only update your own courses." });
      }

      // Construct updated course object
      const updatedCourse = {
        course_name,
        course_description,
        course_price,
        course_image,
        course_videos,
        course_lessons,
        course_files,
        course_published,
      };

      // Update the course in the database
      await CourseModel.updateCourseById(course_id, updatedCourse);

      // Fetch instructor details
      const instructorDetails = await UserModel.getUserById(existingCourse.course_instructor.user_id);
      if (!instructorDetails) {
        return res.status(404).json({ error: "Instructor not found" });
      }

      // Update the instructor's uploaded courses
      const updatedCourses = instructorDetails.user_uploaded_courses || [];

      // Find and update the course in user_uploaded_courses
      const courseIndex = updatedCourses.findIndex(course => course.course_id === course_id);
      if (courseIndex !== -1) {
        updatedCourses[courseIndex] = { course_id, ...updatedCourse };
      }

      // Save the updated user data
      await UserModel.updateUserById(instructorDetails.user_id, { user_uploaded_courses: updatedCourses });

      res.status(200).json({ message: "Course updated successfully!", course: { course_id, ...updatedCourse } });

    } catch (error) {
      res.status(500).json({ error: "Error updating course", details: error.message });
    }
  },
  
  async getAllCoursesForUser(req, res) {
    try {
      // Extract `user_id` and `user_role` from the token (added by the verifyToken middleware)
      const { user_id, user_role } = req.user;
  
      // Ensure the user making the request is a normal user
      if (user_role !== "normal") {
        return res.status(403).json({ error: "Access denied. Only normal users can access this resource." });
      }
  
      // Fetch all courses and filter by the user's enrolled courses
      const allCourses = await CourseModel.getAllCourses();
      const user = await UserModel.getUserById(user_id);
  
      if (!user || !user.user_courses) {
        return res.status(404).json({ error: "User or user courses not found." });
      }
  
      // Filter courses based on the user's enrolled courses
      const userCourses = allCourses.filter(course => user.user_courses.includes(course.course_id));
  
      res.status(200).json({ courses: userCourses });
    } catch (error) {
      res.status(500).json({ error: "Error fetching courses", details: error.message });
    }
  },

  // Update a course by ID
  

  // Delete a course by ID
  async deleteCourseById(req, res) {
    try {
      const { course_id } = req.params;

      const deleted = await CourseModel.deleteCourseById(course_id);
      if (!deleted) return res.status(404).json({ error: "Course not found" });

      res.status(200).json({ message: "Course deleted successfully!" });
    } catch (error) {
      res.status(500).json({ error: "Error deleting course", details: error.message });
    }
  },
};