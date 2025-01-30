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

  async addCourseToUser(user_id, course) {
    try {
        const user = await this.getUserById(user_id);
        if (!user) throw new Error("User not found");

        // Ensure `user_uploaded_courses` exists as an array
        const updatedCourses = [...user.user_uploaded_courses, course];

        await this.updateUserById(user_id, { user_uploaded_courses: updatedCourses });
    } catch (error) {
        throw new Error("Error adding course to user: " + error.message);
    }
},

  async getUserById(user_id) {
    const params = {
      TableName: TABLE_NAME,
      Key: { user_id },
    };
  
    const result = await dynamoDB.send(new GetCommand(params));
     
    return result.Item;
  },
async getCoursesByInstructor(admin_id) {
    try {
        const params = {
            TableName: TABLE_NAME,
            IndexName: "admin_id-index", // Use the correct index name
            KeyConditionExpression: "course_instructor = :admin_id",
            ExpressionAttributeValues: {
                ":admin_id": admin_id,
            },
        };

        const result = await dynamoDB.send(new QueryCommand(params));
        return result.Items || [];
    } catch (error) {
        console.error("Error fetching courses by instructor:", error);
        throw new Error("Error fetching courses by instructor");
    }
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
      ReturnValues: "ALL_NEW", // Return updated item
    };
  
    const result = await dynamoDB.send(new UpdateCommand(params));
    return result.Attributes; // Return updated attributes
  },

  async deleteUserById(user_id) {
    const params = {
      TableName: TABLE_NAME,
      Key: { user_id },
    };

    await dynamoDB.send(new DeleteCommand(params));
  },
};