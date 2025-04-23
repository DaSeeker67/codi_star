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


# Client (frontend)
cd client
npm install

# Server (backend)
cd ../server
npm install
Environment Variables
Create a .env file in both client/ and server/ with these entries:

dotenv
Copy
Edit
# Pinecone vector DB
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment

# Groq inference
GROQ_API_KEY=your_groq_api_key

# PostgreSQL (server only)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=codistar
Running the App
Start the backend

bash
Copy
Edit
cd server
npm run dev
Start the frontend

bash
Copy
Edit
cd client
npm run dev
Open in browser
Visit: http://localhost:5173

Project Structure
text
Copy
Edit
codistar/
├── client/      # React + Vite frontend
│   ├── public/
│   └── src/
└── server/      # Express + LangChain + PostgreSQL
    ├── routes/
    └── services/
Contributing
Fork the repo

Create a branch: git checkout -b feature/XYZ

Commit changes: git commit -m "Add XYZ feature"

Push: git push origin feature/XYZ

Open a Pull Request

