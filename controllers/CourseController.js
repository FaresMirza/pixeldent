const shortid = require("shortid");
const CourseModel = require("../models/CourseModel");
const AdminModel = require("../models/AdminModel");
const Joi = require("joi");

// Joi schema for course validation
const courseSchema = Joi.object({
  course_name: Joi.string().min(1).required(),
  course_description: Joi.string().required(),
  course_price: Joi.number().positive().required(),
  course_instructor: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
  course_image: Joi.string().optional(),
  course_content: Joi.object({
    course_videos: Joi.array().items(Joi.string()).required(),
    course_files: Joi.array().items(Joi.string()).required(),
  }).required(),
  course_published: Joi.boolean().required(),
});

// Helper function to fetch instructor details and validate their existence
const fetchInstructorDetails = async (instructors) => {
  const ids = Array.isArray(instructors) ? instructors : [instructors]; // Normalize to an array
  const details = await Promise.all(ids.map((id) => AdminModel.getAdminById(id))); // Fetch all instructor details
  if (details.includes(null)) {
    const missingIds = ids.filter((_, i) => !details[i]); // Identify missing IDs
    throw new Error(`Admin(s) with ID(s) ${missingIds.join(", ")} not found`);
  }
  return details;
};

module.exports = {
  // Register a new course
  async registerCourse(req, res) {
    try {
      const { error } = courseSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details.map((detail) => detail.message) });

      const {
        course_name,
        course_description,
        course_price,
        course_instructor,
        course_image,
        course_content,
        course_published,
      } = req.body;

      // Validate and fetch instructor details
      const instructorDetails = await fetchInstructorDetails(course_instructor);

      // Create the new course object
      const newCourse = {
        course_id: shortid.generate(),
        course_name,
        course_description,
        course_price,
        course_instructor,
        course_image,
        course_content,
        course_published,
      };

      // Save the new course to the database
      await CourseModel.createCourse(newCourse);

      // Respond with the newly created course, including instructor details
      res.status(201).json({
        message: "Course added successfully!",
        course: { ...newCourse, course_instructor: instructorDetails },
      });
    } catch (error) {
      res.status(error.message.includes("not found") ? 400 : 500).json({ error: error.message });
    }
  },

  // Get all courses
  // Get all courses
  async getAllCourses(req, res) {
  try {
    const courses = await CourseModel.getAllCourses();

    // Enrich each course with instructor details
    const enrichedCourses = await Promise.all(
      courses.map(async (course) => {
        // Fetch full instructor details if course has instructors
        if (course.course_instructor) {
          const instructorDetails = await fetchInstructorDetails(course.course_instructor);
          course.course_instructor = instructorDetails; // Replace instructor IDs with full details
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

      // Fetch the course by ID
      const course = await CourseModel.getCourseById(course_id);
      if (!course) return res.status(404).json({ error: "Course not found" });

      // Enrich the course with full instructor details
      if (course.course_instructor) {
        const instructorDetails = await fetchInstructorDetails(course.course_instructor);
        course.course_instructor = instructorDetails; // Replace instructor IDs with full details
      }

      res.status(200).json({ course });
    } catch (error) {
      res.status(500).json({ error: "Error fetching course", details: error.message });
    }
  },

  // Update a course by ID
  async updateCourseById(req, res) {
    try {
      const { course_id } = req.params;
      const { error } = courseSchema.validate(req.body, { allowUnknown: true });
      if (error) return res.status(400).json({ error: error.details.map((detail) => detail.message) });

      const {
        course_name,
        course_description,
        course_price,
        course_instructor,
        course_image,
        course_content,
        course_published,
      } = req.body;

      // Fetch the existing course
      const existingCourse = await CourseModel.getCourseById(course_id);
      if (!existingCourse) return res.status(404).json({ error: "Course not found" });

      // Build the fields to update, keeping existing values for unspecified fields
      const updatedFields = {
        course_name: course_name !== undefined ? course_name : existingCourse.course_name,
        course_description: course_description !== undefined ? course_description : existingCourse.course_description,
        course_price: course_price !== undefined ? course_price : existingCourse.course_price,
        course_instructor: course_instructor !== undefined ? course_instructor : existingCourse.course_instructor,
        course_image: course_image !== undefined ? course_image : existingCourse.course_image,
        course_content: course_content !== undefined ? course_content : existingCourse.course_content,
        course_published: course_published !== undefined ? course_published : existingCourse.course_published,
      };

      // Validate and fetch instructor details if `course_instructor` is being updated
      let instructorDetails = [];
      if (course_instructor !== undefined) {
        instructorDetails = await fetchInstructorDetails(course_instructor);
        updatedFields.course_instructor = instructorDetails;
      } else {
        instructorDetails = await fetchInstructorDetails(existingCourse.course_instructor);
      }

      // Update the course in the database
      const updated = await CourseModel.updateCourseById(course_id, updatedFields);
      if (!updated) return res.status(404).json({ error: "Failed to update course" });

      const updatedCourse = {
        ...updatedFields,
        course_instructor: instructorDetails,
      };

      res.status(200).json({ message: "Course updated successfully!", course: updatedCourse });
    } catch (error) {
      res.status(500).json({ error: "Error updating course", details: error.message });
    }
  },

  // Delete a course by ID
  async deleteCourseById(req, res) {
    try {
      const { course_id } = req.params;

      // Delete the course from the database
      const deleted = await CourseModel.deleteCourseById(course_id);
      if (!deleted) return res.status(404).json({ error: "Course not found" });

      res.status(200).json({ message: "Course deleted successfully!" });
    } catch (error) {
      res.status(500).json({ error: "Error deleting course", details: error.message });
    }
  },
};