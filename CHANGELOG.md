## [2025-03-16] [PR#3](https://github.com/OpenWorkspace-o1/aws-ow-s3-mcp/pull/3)

### Added
- Added `Dockerfile` for containerized deployment using Node.js v22.
- Added `shx` as a dev dependency for shell script execution.
- Added comprehensive `README.md` with setup and usage instructions.

### Changed
- Renamed package to `@openworkspace-o1/aws-ow-s3-mcp`.
- Updated `tsconfig.json` to change `outDir` from `build` to `dist` and added `sourceMap` support.

## [2025-03-16] [PR#1](https://github.com/OpenWorkspace-o1/aws-ow-s3-mcp/pull/1)

### Added
- Initial AWS S3 MCP server implementation with tools for listing, getting, uploading, and deleting objects.
- Added `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` dependencies.
- Configured TypeScript with `@tsconfig/node22` for Node.js 22 compatibility.

### Updated
- Upgraded `@modelcontextprotocol/sdk` to version `1.7.0`.
- Implemented `runServer` function to start the MCP server on stdio.