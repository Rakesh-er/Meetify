# Meetify | Premium Video Conferencing Platform

![Meetify Status](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

**Meetify** is a premium, full-stack real-time video conferencing platform designed for seamless and secure communication. Built with scalability and performance in mind, it uses **WebRTC** for peer-to-peer video streaming and **Socket.io** for real-time signaling.  
The user interface follows a modern **Glassmorphism** design philosophy using **Material UI**, delivering a smooth and professional experience across all devices.

---

## Demo

👉 **https://meetify-video-call-platform.onrender.com/**

---

## Overview

Meetify allows users to:
- Create or join meetings instantly using a unique meeting code
- Communicate via real-time video streams
- Securely authenticate and maintain session history
- Rejoin previous meetings effortlessly

The application is divided into two main parts:
- **Frontend** – User interface and WebRTC handling
- **Backend** – Authentication, meeting management, signaling, and database operations

---

## Key Features

### Real-Time Video Conferencing
- High-quality, low-latency video calls
- Direct peer-to-peer connection using **WebRTC**

### Instant Signaling
- Real-time signaling via **Socket.io**
- Handles SDP offers, answers, and ICE candidates efficiently

### Secure Authentication
- User registration & login
- Password hashing with **Bcrypt**
- Authorization using **JWT (JSON Web Tokens)**

### Meeting History
- Automatically saves joined meeting codes
- Enables quick rejoin of previous meetings

### Premium Glassmorphism UI
- Built using **Material UI**
- Fully responsive (mobile, tablet, desktop)
- Clean, modern, and intuitive design

### Smart Rejoin Mechanism
- Detects active meetings
- Allows users to reconnect quickly after network drops

---

## System Architecture & UML

The following **UML sequence diagram** represents the interaction between the user, frontend, backend, database, socket server, and peers during authentication and meeting setup.

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend (React)
    participant Backend as Backend (Node/Express)
    participant Database as Database (MongoDB)
    participant SocketServer
    participant PeerUser

    Note over User, Frontend: Authentication Flow
    User->>Frontend: Enter Credentials
    Frontend->>Backend: POST /login
    Backend->>Database: Validate User
    Database-->>Backend: User Data
    Backend-->>Frontend: JWT Token & Success Response

    Note over User, PeerUser: Meeting Initialization Flow
    User->>Frontend: Enter Meeting Code
    Frontend->>Backend: POST /add_to_history
    Backend->>Database: Store Meeting Code
    Frontend->>SocketServer: Join Room (Meeting Code)
    SocketServer-->>PeerUser: Notify User Joined

    par WebRTC Signaling
        User->>SocketServer: Send Offer (SDP)
        SocketServer->>PeerUser: Forward Offer
        PeerUser->>SocketServer: Send Answer (SDP)
        SocketServer->>User: Forward Answer
    end

    User<-->>PeerUser: Direct P2P Video Stream (WebRTC)


## Tech Stack

### Frontend

| Technology | Description |
|-----------|-------------|
| **React.js** | Component-based library for building dynamic user interfaces |
| **Material UI (MUI)** | Responsive UI components, theming, and icons |
| **Socket.io-client** | Real-time bidirectional communication with the backend |
| **WebRTC** | Peer-to-peer video and audio streaming |
| **Context API** | Global state management for authentication and user data |
| **Framer Motion (Optional)** | Smooth animations and UI transitions |

---

### Backend

| Technology | Description |
|-----------|-------------|
| **Node.js** | JavaScript runtime environment for server-side logic |
| **Express.js** | Fast, minimal, and flexible backend web framework |
| **Socket.io** | Real-time signaling server for WebRTC connections |
| **MongoDB** | NoSQL database for storing users and meeting history |
| **Mongoose** | ODM for MongoDB schema modeling and data validation |
| **Bcrypt** | Secure password hashing and encryption |
| **JWT (JSON Web Tokens)** | Token-based authentication and authorization |