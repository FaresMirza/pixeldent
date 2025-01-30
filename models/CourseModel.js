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



  async deleteCourseById(course_id) {
    const params = { TableName: TABLE_NAME, Key: { course_id } };
    await dynamoDB.send(new DeleteCommand(params));
    return true;
  },
};