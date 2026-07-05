# Inngest Pipelines Documentation

This project uses [Inngest](https://www.inngest.com/) for reliable background processing and workflow orchestration.

## 1. Research Flow
*   **Function ID**: `research-flow`
*   **Event Trigger**: `research/start`
*   **Description**: The core research automation pipeline.
*   **Steps**:
    1.  **Initialize**: Sets up the job in the store log.
    2.  **Iterate Criteria**: Loops through each user-defined criterion.
    3.  **Enhance Prompt**: Uses LLM to generate targeted search queries based on keywords + criteria.
    4.  **Research**: Executes Tavily search with the enhanced queries.
    5.  **Review & Extract**: Uses LLM to analyze search results and extract structured data matching the schema.
    6.  **Finalize**: Aggregates results and marks the job as complete.

## 2. Extended Research Flow (Deep Dive)
*   **Function ID**: `extended-research-flow`
*   **Event Trigger**: `research/extended`
*   **Description**: A manual-intervention pipeline allowing users to select specific sources.
*   **Steps**:
    1.  **Search Candidates**: Finds potential source URLs using Tavily.
    2.  **Wait for Selection**: **PAUSES** execution and waits for user input (event: `research/extended-selection`).
    3.  **Process Selection**: Resumes after user selects specific links.
    4.  **Deep Analysis**: Extracts detailed information specifically from the selected sources.

## 3. Vector Embedding Pipeline
*   **Function ID**: `process-embeddings`
*   **Event Trigger**: `vector/start-embedding`
*   **Description**: Handles large-scale text embedding and storage.
*   **Steps**:
    1.  **Chunking**: Splits large text inputs into manageable chunks (1000 chars) using `RecursiveCharacterTextSplitter`.
    2.  **Batch Processing**: Loops through chunks in batches of 10.
    3.  **Embed**: Generates vectors using **Mixedbread** (`mxbai-embed-large-v1`).
    4.  **Upsert**: Stores vectors + metadata in **Pinecone**.
