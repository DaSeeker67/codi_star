# CodiStar IDE
**AI-Accelerated, Lightweight Web IDE**
---
## Overview
CodiStar IDE is a browser-based development environment powered by Retrieval-Augmented Generation (RAG).  
- Instant, contextual code assistance across your entire codebase  
- Zero local setup—code directly in your browser  
- Real-time collaboration with built-in file-tree rendering  
---
## Prerequisites
- **Node.js** v14 or higher  
- A **Pinecone** account & API key  
- A **Groq** account & API key  
- A **PostgreSQL** instance (local or Docker)  
---
## Installation
1. **Clone the repository**  
   ```bash
   git clone https://github.com/your-org/codistar.git
   cd codistar
   ```

2. **Install dependencies for client**
   ```bash
   cd client
   npm install
   ```

3. **Install dependencies for server**
   ```bash
   cd ../server
   npm install
   ```

## Environment Variables
Create a `.env` file in both `client/` and `server/` with these entries:
```dotenv
# Pinecone vector DB
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
# Groq inference
GROQ_API_KEY=your_groq_api_key
# PostgreSQL (server only)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=codistar
```

## Running the App
1. **Start the backend**
   ```bash
   cd server
   nodemon server.js
   ```

2. **Start the frontend**
   ```bash
   cd client
   npm run dev
   ```

3. **Open in browser**
   Visit: http://localhost:5173

## Project Structure
```
codistar/
├── client/      # React + Vite frontend
│   ├── public/
│   └── src/
└── server/      # Express + LangChain + PostgreSQL
    ├── routes/
    └── services/
```

## Contributing
1. Fork the repo
2. Create a branch: `git checkout -b feature/XYZ`
3. Commit changes: `git commit -m "Add XYZ feature"`
4. Push: `git push origin feature/XYZ`
5. Open a Pull Request
