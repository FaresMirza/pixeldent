const shortid = require("shortid");
const CourseModel = require("../models/CourseModel");
const UserModel = require("../models/UserModel");
const Joi = require("joi");

// Joi schema for course validation
const courseSchema = Joi.object({
  course_name: Joi.string().min(1).required(),
  course_description: Joi.string().required(),
  course_price: Joi.number().positive().required(),
  course_instructor: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
  course_image: Joi.string().optional(),
  course_videos: Joi.array().items(Joi.string()).required(), // New addition
  course_lessons: Joi.array().items(
    Joi.object({
      subject: Joi.string().required(),
      description: Joi.string().required(),
      vid_url: Joi.string().uri().required(),
    })
  ).required(),
  course_files: Joi.array().items(
    Joi.object({
      file_name: Joi.string().required(),
      file_url: Joi.string().uri().required(),
    })
  ).required(),
  course_published: Joi.boolean().required(),
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
        // Validate request body using Joi schema
        const { error } = courseSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details.map((detail) => detail.message) });
        }

        const {
            course_name,
            course_description,
            course_price,
            course_instructor,
            course_image,
            course_videos, // Now handled separately
            course_lessons,
            course_files,
            course_published,
        } = req.body;

        // Validate and fetch instructor details
        const instructorDetails = await fetchInstructorDetails(course_instructor);

        // Construct the new course object
        const newCourse = {
            course_id: shortid.generate(),
            course_name,
            course_description,
            course_price,
            course_instructor: instructorDetails.map(instructor => instructor.user_id), // Store only instructor IDs
            course_image,
            course_videos, // Included now
            course_lessons,
            course_files,
            course_published,
        };

        // Save the new course to the database
        await CourseModel.createCourse(newCourse);

        // Respond with the created course, including instructor details
        res.status(201).json({
            message: "Course added successfully!",
            course: { ...newCourse, course_instructor: instructorDetails }, // Return full instructor details
        });
    } catch (error) {
        res.status(error.message.includes("not found") ? 400 : 500).json({ error: error.message });
    }
},

  // Get all courses
  async getAllCourses(req, res) {
    try {
      const courses = await CourseModel.getAllCourses();

      // Enrich each course with instructor details
      const enrichedCourses = await Promise.all(
        courses.map(async (course) => {
          if (course.course_instructor) {
            const instructorDetails = await fetchInstructorDetails(course.course_instructor);
            course.course_instructor = instructorDetails;
          }
          return course;
        })
      );

      res.status(200).json({ courses: enrichedCourses });
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

      if (course.course_instructor) {
        const instructorDetails = await fetchInstructorDetails(course.course_instructor);
        course.course_instructor = instructorDetails;
      }

      res.status(200).json({ course });
    } catch (error) {
      res.status(500).json({ error: "Error fetching course", details: error.message });
    }
  },
  async getAllCoursesForAdmin(req, res) {
    try {
      // Extract `user_id` and `user_role` from the token (added by the verifyToken middleware)
      const { user_id, user_role } = req.user;
  
      // Ensure the user making the request is an admin or super
      if (user_role !== "admin" && user_role !== "super") {
        return res.status(403).json({ error: "Access denied. Only admins or super users can access this resource." });
      }
  
      // Fetch all courses and filter by the admin's or super's user_id
      const allCourses = await CourseModel.getAllCourses();
      const filteredCourses = user_role === "super" 
        ? allCourses 
        : allCourses.filter(course => course.course_instructor === user_id);
  
      res.status(200).json({ courses: filteredCourses });
    } catch (error) {
      res.status(500).json({ error: "Error fetching courses", details: error.message });
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
  async updateCourseById(req, res) {
    try {
        const { course_id } = req.params;

        // Validate input, allowing unknown fields to prevent Joi rejection of partial updates
        const { error } = courseSchema.validate(req.body, { allowUnknown: true });
        if (error) {
            return res.status(400).json({ error: error.details.map((detail) => detail.message) });
        }

        // Fetch existing course
        const existingCourse = await CourseModel.getCourseById(course_id);
        if (!existingCourse) {
            return res.status(404).json({ error: "Course not found" });
        }

        // Extract updatable fields
        const {
            course_name,
            course_description,
            course_price,
            course_instructor,
            course_image,
            course_videos, // Now handled separately
            course_lessons,
            course_files,
            course_published,
        } = req.body;

        // Fetch updated instructor details if needed
        let instructorDetails = [];
        if (course_instructor !== undefined) {
            instructorDetails = await fetchInstructorDetails(course_instructor);
        } else {
            instructorDetails = await fetchInstructorDetails(existingCourse.course_instructor);
        }

        // Construct updated fields object (only update if value exists)
        const updatedFields = {
            course_name: course_name ?? existingCourse.course_name,
            course_description: course_description ?? existingCourse.course_description,
            course_price: course_price ?? existingCourse.course_price,
            course_instructor: course_instructor ?? existingCourse.course_instructor,
            course_image: course_image ?? existingCourse.course_image,
            course_videos: course_videos ?? existingCourse.course_videos,
            course_lessons: course_lessons ?? existingCourse.course_lessons,
            course_files: course_files ?? existingCourse.course_files,
            course_published: course_published ?? existingCourse.course_published,
        };

        // Update course in DB
        const updated = await CourseModel.updateCourseById(course_id, updatedFields);
        if (!updated) {
            return res.status(500).json({ error: "Failed to update course" });
        }

        // Construct response object
        const updatedCourse = {
            ...updatedFields,
            course_instructor: instructorDetails, // Return detailed instructor info
        };

        res.status(200).json({
            message: "Course updated successfully!",
            course: updatedCourse,
        });

    } catch (error) {
        res.status(500).json({ error: "Error updating course", details: error.message });
    }
},

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