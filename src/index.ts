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
  return { tools: [ToolName.ListObjects, ToolName.GetObject, ToolName.PutObject, ToolName.DeleteObject] };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, params } = request.params;
  const bucketName = process.env.BUCKET_NAME;
  if (!bucketName) {
    throw new McpError(ErrorCode.InvalidRequest, "Bucket name is not set.");
  }
// https://github.com/modelcontextprotocol/servers/blob/main/src/google-maps/index.ts
  try {
    switch (name) {
      case ToolName.ListObjects:
        const listCommand = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: params.arguments?.prefix as string,
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
        if (!params?.key) throw new McpError(ErrorCode.InvalidParams, "Missing object key");
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: params.key,
        });
        const url = await getSignedUrl(s3, getCommand, { expiresIn: params?.expiry || 3600 });
        return { result: { object_url: url } };

      case ToolName.PutObject:
        if (!params?.key) throw new McpError(ErrorCode.InvalidParams, "Missing object key");
        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: params.key,
        });
        const putUrl = await getSignedUrl(s3, putCommand, { expiresIn: params?.expiry || 3600 });
        return { result: { upload_url: putUrl } };

      case ToolName.DeleteObject:
        if (!params?.key) throw new McpError(ErrorCode.InvalidParams, "Missing object key");
        await s3.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: params.key,
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
