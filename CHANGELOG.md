## [2025-03-16] [PR#1](https://github.com/OpenWorkspace-o1/aws-ow-s3-mcp/pull/1)

### Added
- Initial AWS S3 MCP server implementation with tools for listing, getting, uploading, and deleting objects.
- Added `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` dependencies.
- Configured TypeScript with `@tsconfig/node22` for Node.js 22 compatibility.

### Updated
- Upgraded `@modelcontextprotocol/sdk` to version `1.7.0`.
- Implemented `runServer` function to start the MCP server on stdio.