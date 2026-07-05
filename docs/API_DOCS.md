# API Documentation

## Research APIs

### 1. Start Research
*   **Endpoint**: `POST /api/research`
*   **Description**: Triggers a new research job.
*   **Body**:
    ```json
    {
      "keywords": "string",
      "criteria": ["string" | object],
      "apiKeys": { "groq": "string", "tavily": "string" },
      "model": "string"
    }
    ```
*   **Response**: `{ "jobId": "string", "success": true }`

### 2. Get Research Status
*   **Endpoint**: `GET /api/research/status?jobId={jobId}`
*   **Description**: Polls the current status, progress, and logs of a job.
*   **Response**:
    ```json
    {
      "jobId": "string",
      "status": "processing" | "completed" | "failed",
      "progress": number,
      "logs": [{ "message": "string", "timestamp": number }],
      "result": object (if completed)
    }
    ```

### 3. Extended Research (Deep Dive)
*   **Endpoint**: `POST /api/research/extended`
*   **Description**: Starts a research job that includes a human-in-the-loop selection step.
*   **Body**: (Same as Start Research)

### 4. Selection Callback
*   **Endpoint**: `POST /api/research/extended/selection`
*   **Description**: Submits the user's selected links to proceed with the extended research.
*   **Body**:
    ```json
    {
      "jobId": "string",
      "selectedLinks": ["url1", "url2"]
    }
    ```

## Vector Store APIs

### 1. Trigger Embedding
*   **Endpoint**: `POST /api/vector-store`
*   **Description**: Queues a batch embedding job.
*   **Body**:
    ```json
    {
      "text": "Large text content...",
      "mixedbreadKey": "mxb_...",
      "pineconeKey": "pc_...",
      "pineconeIndex": "index-name"
    }
    ```

## System APIs

### 1. Inngest
*   **Endpoint**: `POST /api/inngest`
*   **Description**: The entry point for Inngest executors. Not for manual consumption.

### 2. Auth
*   **Endpoint**: `/api/auth/*`
*   **Description**: Handled by NextAuth.js for user session management.
