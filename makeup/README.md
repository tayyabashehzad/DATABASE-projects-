# Makeup Scheduler App

A **web and mobile-friendly scheduling assistant** for Iqra University faculty to manage and book makeup classes efficiently.

---

## Features

- **Book & Undo Makeup Classes**: Easily reserve or cancel makeup sessions.
- **Free Slot Suggestions**: Intelligent recommendations based on student availability.
- **Course Management**: View and select courses with details like day, time, and LR (lecture room).
- **Interactive Chatbot**: Ask questions and get instant scheduling advice.
- **Notifications & Alerts**: Get status updates for booked sessions.

---

## Tech Stack

- **Backend**: FastAPI, Supabase
- **Frontend**: React Native (Expo)
- **Authentication & Security**: SMTP email verification, token-based login
- **State Management**: Redux
- **AI Chatbot**: LangChain NVIDIA AI Endpoints

---

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd <repo-folder>
```

2. Install backend dependencies:
```bash
pip install -r requirements.txt
```

3. Run the FastAPI server:
```bash
uvicorn main:app --reload
```

4. Install frontend dependencies (Expo):
```bash
npm install
expo start
```

---

## Usage

1. Login/Register as a faculty member.
2. Select a course and view available makeup slots.
3. Use the chatbot for quick scheduling advice.
4. Book or undo makeup sessions with a single click.