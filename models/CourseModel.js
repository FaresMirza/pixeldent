const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

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

  async updateCourseById(course_id, updatedFields) {
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

    if (updateExpressions.length === 0) return null;

    const params = {
      TableName: TABLE_NAME,
      Key: { course_id },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    };

    const result = await dynamoDB.send(new UpdateCommand(params));
    return result.Attributes || null;
  },

  async deleteCourseById(course_id) {
    const params = { TableName: TABLE_NAME, Key: { course_id } };
    await dynamoDB.send(new DeleteCommand(params));
    return true;
  },
};