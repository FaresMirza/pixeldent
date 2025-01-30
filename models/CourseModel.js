const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "me-south-1" });
const dynamoDB = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = "COURSES";

module.exports = {
  async createCourse(course) {
    const params = { TableName: TABLE_NAME, Item: course };
    await dynamoDB.send(new PutCommand(params));
  },

  async getAllCourses() {
    const params = { TableName: TABLE_NAME };
    const result = await dynamoDB.send(new ScanCommand(params));
    return result.Items;
  },

  async getCourseById(course_id) {
    const params = { TableName: TABLE_NAME, Key: { course_id } };
    const result = await dynamoDB.send(new GetCommand(params));
    return result.Item || null;
  },
  async getCoursesByInstructor(admin_id) {
    try {
      const params = { TableName: TABLE_NAME };
      const result = await dynamoDB.send(new ScanCommand(params));
  
      // ✅ Filter by admin_id directly (since DynamoDB does not support nested queries)
      const filteredCourses = result.Items.filter(course =>
        course.course_instructor && course.course_instructor.user_id === admin_id
      );
  
      return filteredCourses;
    } catch (error) {
      throw new Error("Error fetching courses by instructor: " + error.message);
    }
  },

async updateCourseById(req, res) {
  try {
      const { course_id } = req.params;
      const { user_id, user_role } = req.user; // Extract user info from JWT

      // Only allow "admin" or "super" users to update a course
      if (!["admin", "super"].includes(user_role)) {
          return res.status(403).json({ error: "Access denied. Only admins and super users can update courses." });
      }

      // Validate input, allowing partial updates
      const { error } = courseSchema.validate(req.body, { allowUnknown: true });
      if (error) {
          return res.status(400).json({ error: error.details.map((detail) => detail.message) });
      }

      // Fetch the existing course
      const existingCourse = await CourseModel.getCourseById(course_id);
      if (!existingCourse) {
          return res.status(404).json({ error: "Course not found" });
      }

      // Ensure only the instructor (admin) or super admin can update the course
      if (user_role === "admin" && existingCourse.course_instructor.user_id !== user_id) {
          return res.status(403).json({ error: "Access denied. You can only update your own courses." });
      }

      // Extract updatable fields
      const {
          course_name,
          course_description,
          course_price,
          course_image,
          course_videos,
          course_lessons,
          course_files,
          course_published,
      } = req.body;

      // Construct updated course object (only update fields that are provided)
      const updatedFields = {
          course_name: course_name ?? existingCourse.course_name,
          course_description: course_description ?? existingCourse.course_description,
          course_price: course_price ?? existingCourse.course_price,
          course_image: course_image ?? existingCourse.course_image,
          course_videos: course_videos ?? existingCourse.course_videos,
          course_lessons: course_lessons ?? existingCourse.course_lessons,
          course_files: course_files ?? existingCourse.course_files,
          course_published: course_published ?? existingCourse.course_published,
      };

      // Update the course in the database
      const updatedCourse = await CourseModel.updateCourseById(course_id, updatedFields);
      if (!updatedCourse) {
          return res.status(500).json({ error: "Failed to update course" });
      }

      // Fetch instructor details
      const instructor = await UserModel.getUserById(user_id);
      if (!instructor) {
          return res.status(404).json({ error: "Instructor not found" });
      }

      // Update `user_uploaded_courses` for the instructor
      const updatedCourses = instructor.user_uploaded_courses.map(course =>
          course.course_id === course_id ? { ...course, ...updatedFields } : course
      );

      await UserModel.updateUserById(user_id, { user_uploaded_courses: updatedCourses });

      // Respond with the updated course
      res.status(200).json({
          message: "Course updated successfully!",
          course: updatedCourse,
      });

  } catch (error) {
      res.status(500).json({ error: "Error updating course", details: error.message });
  }
},

  async deleteCourseById(course_id) {
    const params = { TableName: TABLE_NAME, Key: { course_id } };
    await dynamoDB.send(new DeleteCommand(params));
    return true;
  },
};