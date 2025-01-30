const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const UserModel = require("../models/UserModel");
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
  async getCoursesByInstructor(instructorId) {
    try {
        const params = {
            TableName: TABLE_NAME,
            IndexName: "admin_id-index", // ✅ Make sure this matches your DynamoDB index name
            KeyConditionExpression: "course_instructor = :instructorId",
            ExpressionAttributeValues: {
                ":instructorId": instructorId,
            },
        };

        const result = await dynamoDB.send(new QueryCommand(params));

        return result.Items || [];
    } catch (error) {
        console.error("Error fetching courses by instructor:", error);
        throw new Error("Error fetching courses by instructor");
    }
},

async updateCourseById(course_id, updatedFields) {
  try {
      const updateExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.entries(updatedFields).forEach(([key, value]) => {
          const attributeKey = `#${key}`;
          const valueKey = `:${key}`;
          updateExpressions.push(`${attributeKey} = ${valueKey}`);
          expressionAttributeNames[attributeKey] = key;
          expressionAttributeValues[valueKey] = value;
      });

      if (updateExpressions.length === 0) return null; // No updates

      const params = {
          TableName: TABLE_NAME,
          Key: { course_id },
          UpdateExpression: `SET ${updateExpressions.join(", ")}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: "ALL_NEW",
      };

      const result = await dynamoDB.send(new UpdateCommand(params));
      if (!result.Attributes) return null;

      const updatedCourse = result.Attributes;

      // ✅ Fetch the course instructor's details (admin or super)
      const instructorId = updatedCourse.course_instructor?.user_id;
      if (!instructorId) {
          throw new Error("Instructor ID missing from course");
      }

      const instructor = await UserModel.getUserById(instructorId);
      if (!instructor || !["admin", "super"].includes(instructor.user_role)) {
          throw new Error("Instructor not found or unauthorized");
      }

      // ✅ Ensure `user_uploaded_courses` exists
      let updatedUploadedCourses = instructor.user_uploaded_courses || [];

      // ✅ Check if course exists in `user_uploaded_courses` & update it
      const courseIndex = updatedUploadedCourses.findIndex(course => course.course_id === course_id);
      if (courseIndex !== -1) {
          updatedUploadedCourses[courseIndex] = updatedCourse; // Update existing course
      } else {
          updatedUploadedCourses.push(updatedCourse); // If missing, add it
      }

      // ✅ Update `user_uploaded_courses` for the instructor
      await UserModel.updateUserById(instructorId, { user_uploaded_courses: updatedUploadedCourses });

      return updatedCourse;

  } catch (error) {
      console.error("Error updating course:", error);
      throw new Error("Error updating course: " + error.message);
  }
},

  async deleteCourseById(course_id) {
    const params = { TableName: TABLE_NAME, Key: { course_id } };
    await dynamoDB.send(new DeleteCommand(params));
    return true;
  },
};