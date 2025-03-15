import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Tool definitions
const LIST_OBJECTS_TOOL: Tool = {
  name: "list_objects",
  description: "List objects in an S3 bucket.",
  inputSchema: {
    type: "object",
    properties: {
      prefix: {
        type: "string",
        description: "Prefix filter for object keys."
      }
    }
  }
};

const GET_OBJECT_TOOL: Tool = {
  name: "get_object",
  description: "Generate a pre-signed URL for accessing an object.",
  inputSchema: {
    type: "object",
    properties: {
      key: {
        type: "string",
        description: "Object key to retrieve."
      },
      expiry: {
        type: "number",
        description: "URL expiration time in seconds (default 1 hour)."
      }
    },
    required: ["key"]
  }
};

const PUT_OBJECT_TOOL: Tool = {
  name: "put_object",
  description: "Generate a pre-signed URL for uploading an object.",
  inputSchema: {
    type: "object",
    properties: {
      key: {
        type: "string",
        description: "Object key to upload."
      },
      expiry: {
        type: "number",
        description: "URL expiration time in seconds (default 1 hour)."
      }
    },
    required: ["key"]
  }
};

const DELETE_OBJECT_TOOL: Tool = {
  name: "delete_object",
  description: "Delete an object from the bucket.",
  inputSchema: {
    type: "object",
    properties: {
      key: {
        type: "string",
        description: "Object key to delete."
      }
    },
    required: ["key"]
  }
};

const S3_TOOLS = [
  LIST_OBJECTS_TOOL,
  GET_OBJECT_TOOL,
  PUT_OBJECT_TOOL,
  DELETE_OBJECT_TOOL,
] as const;

enum ToolName {
  ListObjects = "list_objects",
  GetObject = "get_object",
  PutObject = "put_object",
  DeleteObject = "delete_object",
}

const server = new Server({
  name: "aws-ow-s3-mcp-server",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {}
  }
});

const s3 = new S3Client({
  region: process.env.REGION || "ap-southeast-1"
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: S3_TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const bucketName = process.env.BUCKET_NAME;
  if (!bucketName) {
    throw new McpError(ErrorCode.InvalidRequest, "Bucket name is not set.");
  }

  try {
    switch (request.params.name) {
      case ToolName.ListObjects:
        const { prefix } = request.params.arguments as { prefix?: string };
        const listCommand = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
        });
        const listResult = await s3.send(listCommand);
        return {
          result: {
            objects: listResult.Contents?.map(obj => ({
              key: obj.Key,
              size: obj.Size,
              last_modified: obj.LastModified?.toISOString(),
            })) || []
          }
        };

      case ToolName.GetObject:
        const { key, expiry } = request.params.arguments as { key: string; expiry?: number };
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        const url = await getSignedUrl(s3, getCommand, { expiresIn: expiry || 3600 });
        return { result: { object_url: url } };

      case ToolName.PutObject:
        const { key, expiry } = request.params.arguments as { key: string; expiry?: number };
        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        const putUrl = await getSignedUrl(s3, putCommand, { expiresIn: expiry || 3600 });
        return { result: { upload_url: putUrl } };

      case ToolName.DeleteObject:
        const { key } = request.params.arguments as { key: string };
        await s3.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        }));
        return { result: { success: true } };

      default:
        throw new McpError(ErrorCode.MethodNotFound, "Method not found.");
    }
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `S3 operation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AWS S3 MCP Server running on stdio.");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
