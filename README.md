# AWS S3 MCP Server

MCP Server for AWS S3 operations, providing secure access to S3 buckets through pre-signed URLs.

## Tools

1. `list_objects`
   - List objects in an S3 bucket
   - Input:
     - `prefix` (string, optional): Prefix filter for object keys
   - Returns: Array of objects with keys, sizes, and last modified dates

2. `get_object`
   - Generate a pre-signed URL for accessing an object
   - Inputs:
     - `key` (string, required): Object key to retrieve
     - `expiry` (number, optional): URL expiration time in seconds (default: 3600)
   - Returns: `object_url` containing the pre-signed URL

3. `put_object`
   - Generate a pre-signed URL for uploading an object
   - Inputs:
     - `key` (string, required): Object key to upload
     - `expiry` (number, optional): URL expiration time in seconds (default: 3600)
   - Returns: `upload_url` containing the pre-signed URL

4. `delete_object`
   - Delete an object from the bucket
   - Input:
     - `key` (string, required): Object key to delete
   - Returns: `success` boolean indicating deletion status

## Setup

### Environment Variables

The server requires the following environment variables:

- `BUCKET_NAME`: The name of your S3 bucket (required)
- `REGION`: AWS region (default: "ap-southeast-1")

AWS credentials should be configured using standard AWS credential configuration methods (environment variables, IAM roles, or AWS credentials file).

### Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aws-ow-s3-mcp": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "BUCKET_NAME",
        "-e",
        "REGION",
        "-e",
        "AWS_ACCESS_KEY_ID",
        "-e",
        "AWS_SECRET_ACCESS_KEY",
        "mcp/aws-ow-s3-mcp"
      ],
      "env": {
        "BUCKET_NAME": "<YOUR_BUCKET_NAME>",
        "REGION": "<AWS_REGION>",
        "AWS_ACCESS_KEY_ID": "<YOUR_ACCESS_KEY>",
        "AWS_SECRET_ACCESS_KEY": "<YOUR_SECRET_KEY>"
      }
    }
  }
}
```

#### NPX Command

```json
{
  "mcpServers": {
    "aws-ow-s3-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-aws-ow-s3-mcp"
      ],
      "env": {
        "BUCKET_NAME": "<YOUR_BUCKET_NAME>",
        "REGION": "<AWS_REGION>",
        "AWS_ACCESS_KEY_ID": "<YOUR_ACCESS_KEY>",
        "AWS_SECRET_ACCESS_KEY": "<YOUR_SECRET_KEY>"
      }
    }
  }
}
```

## Build

Docker build:

```bash
docker build -t mcp/aws-ow-s3-mcp-server .
```

## Development

The server is built using:

- Node.js
- TypeScript
- @modelcontextprotocol/sdk
- @aws-sdk/client-s3
- @aws-sdk/s3-request-presigner

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
