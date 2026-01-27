# Smart Q – Hospital Queue Management System

Smart Q is a modern, production-ready hospital queue management system designed to digitize patient flow, reduce waiting times, and improve operational efficiency for clinics and multi-department hospitals.

---

## 🔍 Problem Statement

In many hospitals and clinics, patient flow management is still manual and inefficient, leading to:

- Long and unpredictable waiting times
- Paper-based or physical token systems that are hard to track
- No real-time visibility into queue status
- Poor handling of emergency and senior-citizen priorities
- Lack of centralized control for admins and doctors

These issues negatively impact patient experience and hospital efficiency.

---

## 💡 Solution Overview

**Smart Q** solves these problems by providing a complete digital queue management platform:

- Digital token generation (remote or front desk)
- Priority-based queue handling (`EMERGENCY`, `SENIOR`, `NORMAL`)
- Department-wise queues
- Real-time queue updates
- Doctor-specific workflows
- Admin dashboards and analytics
- Patient profiles, visit history, and QR verification

This results in faster patient flow, better transparency, and improved hospital operations.

---

## 🚀 Key Features

- Secure authentication (JWT-based)
- Department-specific token creation
- Priority-aware queue ordering
- Doctor call / skip / complete workflow
- Real-time queue updates (Socket.IO)
- Admin management for departments and doctors
- Patient visit history and QR codes
- OTP-based verification & password recovery
- TV display APIs for waiting areas

> ❌ Redis is **not** used in this project.

---

## 🌐 Live URLs

- **Frontend:** https://hospitaqueuemanagement.vercel.app  
- **Backend:** https://hospitalqueuemanagement.onrender.com  

---

## 🧱 Tech Stack

### Frontend
- React (Vite)
- React Router DOM
- Tailwind CSS
- Socket.IO Client
- Recharts (analytics)
- Framer Motion (animations)
- JWT Decode
- QR Scanner

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- JWT Authentication
- Socket.IO (real-time)
- Bcrypt (password hashing)
- Nodemailer (emails)
- Node-Cron (scheduled jobs)
- QR Code generation
- Razorpay (optional payments)
- Express Rate Limit & Mongo Sanitize (security)

---

## 📡 Backend API Routes

### 🔐 Auth (`/api/auth`)

| Method | Endpoint | Description | Role |
|------|---------|------------|------|
| POST | /signup | Patient signup | Public |
| POST | /doctor-signup | Doctor signup | Public |
| POST | /login | Login and get JWT | Public |
| POST | /refresh | Refresh access token | Public |
| POST | /logout | Logout session | Authenticated |

---

### 👤 Users (`/api/users`)

| Method | Endpoint | Description | Role |
|------|---------|------------|------|
| PATCH | /change-password | Change password | Admin, Doctor, Patient |
| PATCH | /change-phone | Change phone number | Admin, Doctor, Patient |
| POST | /forgot-password | Start reset flow | Public |
| POST | /reset-password | Reset password | Public |

---

### 🏥 Admin (`/api/admin`)

| Method | Endpoint | Description |
|------|---------|-------------|
| POST | /department | Create department |
| PATCH | /:departmentId | Update department settings |
| PATCH | /departments/:departmentId/status | Enable/disable department |
| POST | /doctor | Create doctor |
| PATCH | /verify-doctor | Verify doctor |
| GET | /doctor/not-verified | Unverified doctors |
| GET | /doctors | List doctors |
| PATCH | /doctor/on-leave | Mark doctor on leave |
| PATCH | /doctor/return-from-leave | Doctor available |
| PATCH | /doctor/activate | Activate doctor |
| PATCH | /doctor/inactive | Deactivate doctor |
| GET | /dashboard/summary | Admin dashboard stats |
| POST | /verify-patient-qr | Verify patient QR |
| GET | /lookup | Find user by phone/email |

---

### 🏬 Departments (`/api/departments`)

| Method | Endpoint | Description |
|------|---------|-------------|
| GET | / | Get all departments |

---

### 👨‍⚕️ Doctor Profile (`/api/doctorProfile`)

| Method | Endpoint | Description | Role |
|------|---------|-------------|------|
| GET | /me | Get own profile | Doctor |
| POST | /me | Update own profile | Doctor |
| GET | /doctors | Public doctors list | Patient |
| GET | /:userId | Get doctor profile | Admin, Patient |
| POST | /:userId | Update doctor profile | Admin |

---

### 🎫 Tokens / Queue (`/api/tokens`)

| Method | Endpoint | Description | Role |
|------|---------|-------------|------|
| POST | / | Create token | Patient, Admin |
| POST | /doctor/call-next | Call next token | Doctor |
| POST | /doctor/complete | Complete token | Doctor |
| POST | /doctor/skip | Skip token | Doctor |
| PATCH | /:id/cancel | Cancel token | Patient, Admin |
| GET | /my | Current token | Patient |
| GET | /my/upcoming | Upcoming tokens | Patient |
| GET | /preview | Preview token number | Patient, Admin |
| GET | /history | Token history | Patient |
| GET | /dashboard/queue-summary | Queue summary | Doctor, Admin |

---

### 🩺 Visits (`/api/visits`)

| Method | Endpoint | Description | Role |
|------|---------|-------------|------|
| POST | / | Create visit | Doctor |
| GET | /patient/:patientId | Patient visits | Doctor, Admin |
| GET | /me | My visits | Patient |

---

### 📩 OTP (`/api/otp`)

| Method | Endpoint | Description |
|------|---------|-------------|
| POST | /send | Send OTP |
| POST | /verify | Verify OTP |

---

### 💬 Messages (`/api/messages`)

| Method | Endpoint | Description |
|------|---------|-------------|
| POST | /send | Send message (admin) |
| POST | /department-announcement | Dept announcement |
| GET | / | Get messages |
| POST | /read | Mark read |

---

### 📊 Analytics (`/api/analytics`) – Admin Only

| Method | Endpoint | Description |
|------|---------|-------------|
| GET | /daily-patient-count | Daily patients |
| GET | /department-load | Department load |
| GET | /doctor-workload | Doctor workload |
| GET | /waiting-time/today | Avg wait time |
| GET | /consultation-time | Consultation time |
| GET | /department-peak-hours | Peak hours |
| GET | /throughput | Throughput |
| GET | /cancel-rate | Cancel rate |
| GET | /doctor-utilization | Doctor utilization |
| GET | /live-queue | Live queue |
| GET | /patient-trend | Patient trends |

---

### 📺 TV Display (`/api/tv`)

| Method | Endpoint | Description |
|------|---------|-------------|
| GET | /department/:departmentId | Department queue |
| GET | /departments | All queues |

---

### ❤️ Health Check

| Method | Endpoint | Description |
|------|---------|-------------|
| GET | /health | Service health |

---

## 🧠 Architecture Summary

- React frontend communicates via REST APIs
- JWT-secured backend (Express)
- MongoDB stores users, tokens, visits, departments
- Socket.IO provides real-time updates
- Queue ordered by status → priority → time

---

## ⚙️ Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smartq
JWT_SECRET=your_super_secret_key_123
CLIENT_URL=https://hospitaqueuemanagement.vercel.app
NODE_ENV=development
EMAIL_HOST=smtp.example.com
EMAIL_USER=you@example.com
EMAIL_PASS=xxxx
RAZORPAY_KEY=xxxx
RAZORPAY_SECRET=xxxx