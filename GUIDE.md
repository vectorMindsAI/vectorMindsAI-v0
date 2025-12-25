# Features & Usage Guide

## Overview
The AI Research Agent is a powerful tool designed to automate comprehensive city and topic research, fill data gaps, and store structured data.

## Features

### 1. Research
*   **Purpose**: Perform multi-step deep research on defined criteria.
*   **Usage**:
    1.  Enter **Job Keywords** (e.g., "San Francisco Tech Scene").
    2.  Define **Research Criteria** (e.g., "Top Startups", "Venture Capital Activity").
    3.  Select an **AI Model** (e.g., Groq Compound).
    4.  Click **Start Research**.
    5.  Review real-time logs and results.

### 2. Criteria Builder
*   **Purpose**: Manage reusable research criteria templates.
*   **Usage**:
    1.  Add new criteria with a **Name** and **Description**.
    2.  Define the expected **Output Schema** (JSON format).
    3.  Save for use in the Research tab.

### 3. Vector Store
*   **Purpose**: Embed and store text data for semantic search.
*   **Usage**:
    1.  Enter **Mixedbread API Key** (for embeddings).
    2.  Enter **Pinecone API Key** & **Index Name**.
    3.  Paste large text content.
    4.  Click **Embed & Store**.
    5.  The system automatically chunks and stores the data.

### 4. Settings
*   **Purpose**: Configure global API keys and model preferences.
*   **Usage**:
    *   Set **Groq API Key** (Primary LLM).
    *   Set **Tavily API Key** (Search Engine).
    *   Select default models and fallback behavior.

### 5. Analytics
*   **Purpose**: Track usage and research performance.
*   **Usage**: View charts on job completion rates, token usage, and successful criteria extractions.
