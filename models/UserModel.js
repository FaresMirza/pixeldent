const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "me-south-1" });
const dynamoDB = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = "USERS";

module.exports = {
  async getUserByEmail(user_email) {
    const params = {
      TableName: TABLE_NAME,
      IndexName: "user_email-index",
      KeyConditionExpression: "user_email = :email",
      ExpressionAttributeValues: { ":email": user_email },
    };

    const result = await dynamoDB.send(new QueryCommand(params));
    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  },

  async createUser(user) {
    const params = { TableName: TABLE_NAME, Item: user };
    await dynamoDB.send(new PutCommand(params));
  },

  async getAllUsers() {
    const params = {
      TableName: TABLE_NAME
    };
    const result = await dynamoDB.send(new ScanCommand(params));
    return result.Items || [];
  },

  async getAdminById(user_id) {
    const params = {
      TableName: TABLE_NAME,
      Key: { user_id },
    };
  
    const result = await dynamoDB.send(new GetCommand(params));
    
    // Check if the user exists and if their role is either admin or super
    if (!result.Item || (result.Item.user_role !== "admin" && result.Item.user_role !== "super")) {
      return null; // Return null if the user is not found or not an admin or super
    }
    return result.Item;
  },

  async getAdminById(user_id) {
    const params = {
      TableName: TABLE_NAME,
      Key: { user_id },
    };

    const result = await dynamoDB.send(new GetCommand(params));
    if (!result.Item || result.Item.user_role !== "admin") {
      return null; // Return null if the user is not found or not an admin
    }
    return result.Item;
  },

  async updateUserById(user_id, updatedFields) {
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
  
    Object.entries(updatedFields).forEach(([key, value]) => {
      if (value !== undefined) {
        const attributeKey = `#${key}`;
        const valueKey = `:${key}`;
        updateExpressions.push(`${attributeKey} = ${valueKey}`);
        expressionAttributeNames[attributeKey] = key;
        expressionAttributeValues[valueKey] = value;
      }
    });
  
    if (updateExpressions.length === 0) {
      throw new Error("No fields to update");
    }
  
    const params = {
      TableName: TABLE_NAME,
      Key: { user_id },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    };
  
    await dynamoDB.send(new UpdateCommand(params));
  },

  async deleteUserById(user_id) {
    const params = {
      TableName: TABLE_NAME,
      Key: { user_id },
    };

    await dynamoDB.send(new DeleteCommand(params));
  },
};