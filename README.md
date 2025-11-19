### Project Overview

This backend application is built with NestJS for handling the ingestion of the large JSON files from AWS S3 Buckets and transforming the data into a unified schema, and provide a flexible, cached query API.

The core architecture leverages Bull (Redis) and Node.js Streams to ensure scalability, minimal memory usage during the processing of high-volume data.

### Architecture and Technologies

The app follows a modular and decoupled architecture, primarily focusing on separating the API layer from the heavy background processing.

### Technologies

- NestJS
- TypeScript
- Bull Queue (With Redis)
- MongoDB
- Redis (Cache Manager)
- Streams & JsonStream
- Axios

### Key Points

- Streams (no memory overflow) and Batching/bulkUpsert (I/O operations)
- Bull/Redis separates the client response time from the background processing time.
- Bull job with retry logic.
- QueryParserService allows the API to offer complex, customizable query filtering without exposing raw MongoDB syntax.

### Run Steps 

- Under "postman" folder, postman environment and postman collection file can be imported in Postman for testing purpose.
- in Postman, adjust s3 Bucket URLs in environment variables before submitting a request.
- adjust the environment for the collection successfully in Postman.

- Run command "docker-compose up -d"
- Run command "npm install"
- Run command "npm run start:dev"

- Bull Dashboard can be reachable from "http://localhost:3000/bull-board" as it's defined in src/main.ts file

### Future Improvements (Areas for Development)

- Monitoring & Tracing
- Structured Logging
- AWS SDK, Rights and Roles
- Validations
- QueryParserService Improvements
