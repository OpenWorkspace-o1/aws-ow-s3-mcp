import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

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

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [ToolName.ListObjects, ToolName.GetObject, ToolName.PutObject, ToolName.DeleteObject] };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, params } = request.params;
  const bucketName = process.env.BUCKET_NAME;
  if (!bucketName) {
    throw new McpError(ErrorCode.InvalidRequest, "Bucket name is not set.");
  }
  if (name === ToolName.ListObjects) {
    return {
      result: {
        objects: []
      }
    };
  }
  throw new McpError(ErrorCode.MethodNotFound, "Method not found.");
});

const transport = new StdioServerTransport();
await server.connect(transport);
