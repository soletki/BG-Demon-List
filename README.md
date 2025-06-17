# Bulgarian Demonlist

A full-stack web application for managing players, their records, and levels in a demonlist-style ranking system. Built with React (frontend), Node.js/Express (backend), and Firebase (Firestore + Auth via ID tokens).

## 📚 Features

### 🔒 Authentication
- Email/password and social login support (Google)
- Firebase Auth with token-based backend verification
- Custom user-player linking logic

### 🧍 Player Management
- Create player profile with username
- Link authenticated user to player via Firestore
- Fetch and rank players by points

### 🎮 Record & Level System
- Manage level list and positions
- Store and update user-submitted records
- Automatic ranking based on record data

## 🚀 Tech Stack

| Layer       | Tech                          |
|-------------|-------------------------------|
| Frontend    | React, React Router, CSS      |
| Backend     | Node.js, Express              |
| Database    | Firebase Firestore            |
| Auth        | Firebase Authentication       |
| Hosting     | Vercel, Render                |
