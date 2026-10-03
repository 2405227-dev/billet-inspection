# Installation & Setup Guide

> **AI-Powered Industrial Billet Inspection Platform**

---

## 🛠️ System Requirements

- **Operating System**: Windows 10/11 / Linux (Ubuntu 22.04 LTS recommended) / macOS
- **CPU**: 4+ cores (Intel Core i5/i7/Xeon or AMD Ryzen)
- **RAM**: 8 GB minimum (16 GB recommended for 4K video frame processing)
- **Storage**: 2 GB free disk space for application + image storage
- **Node.js**: v18.0.0 or higher
- **Python**: 3.11 or higher

---

## 📦 Step-by-Step Installation

### Step 1: Clone or Navigate to Project Directory
```bash
cd "c:\Users\acer\Desktop\nit raipur"
```

### Step 2: Python Backend Environment Setup

```bash
# Using Python venv
python -m venv .venv
.venv\Scripts\activate   # On Windows
# source .venv/bin/activate # On Linux/macOS

# Install backend dependencies
pip install -r requirements.txt
```

### Step 3: Frontend Setup

```bash
cd frontend
npm install
cd ..
```

---

## 🚀 Running the Platform

### Running Backend (Terminal 1)
```bash
.venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Docs / Swagger: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### Running Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
- Industrial Command Center: `http://localhost:3000`

---

## 🐳 Docker Deployment (Optional)

```bash
docker-compose up --build
```
This boots both the FastAPI backend (port 8000) and Next.js frontend (port 3000) inside containerized environments with persistent `/storage` volume mounting.
