const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "me-south-1" });
const dynamoDB = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = "BOOKS";

module.exports = {
  async createBook(book) {
    const params = { TableName: TABLE_NAME, Item: book };
    await dynamoDB.send(new PutCommand(params));
  },

  async getAllBooks() {
    const params = { TableName: TABLE_NAME };
    const result = await dynamoDB.send(new ScanCommand(params));
    return result.Items;
  },

  async getBookById(book_id) {
    const params = { TableName: TABLE_NAME, Key: { book_id } };
    const result = await dynamoDB.send(new GetCommand(params));
    return result.Item || null;
  },

  async updateBookById(book_id, updatedFields) {
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
      Key: { book_id },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    };

    const result = await dynamoDB.send(new UpdateCommand(params));
    return result.Attributes || null;
  },

  async deleteBookById(book_id) {
    const params = { TableName: TABLE_NAME, Key: { book_id } };
    await dynamoDB.send(new DeleteCommand(params));
    return true;
  },
};