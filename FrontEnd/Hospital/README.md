# Smart Q – Hospital Queue Management System

**Prepared by Thanoj**

Smart Q is a modern, production-ready hospital queue management system that digitizes patient flow, reduces waiting times, and improves operational efficiency for clinics and multi-department hospitals.

---

## 🔍 Problem Statement

Hospitals and clinics often rely on manual token systems and lack real-time visibility, which causes unpredictable waits, overcrowding, poor prioritization of emergencies/seniors, and inefficient coordination between staff.

---

## 💡 Solution Overview

Smart Q digitizes token issuance, enforces priority-based ordering (`EMERGENCY` > `SENIOR` > `NORMAL`), separates department queues, provides real-time updates (Socket.IO), and includes Admin & Doctor dashboards to manage patient flow and get analytics.

---

## 🚀 Key Features

- Secure auth (JWT)
- Department-specific token creation
- Priority-aware queue ordering
- Doctor workflows: call / skip / complete
- Real-time updates via Socket.IO
- Admin controls (departments, doctors, analytics)
- Patient profiles, visit history, QR verification
- OTP phone verification & password recovery
- TV/display endpoints for waiting areas

> ❌ Redis is not used in this project.

---

## 🌐 Live URLs

- **Frontend:** https://hospitaqueuemanagement.vercel.app  
- **Backend:** https://hospitalqueuemanagement.onrender.com

---

## 🧱 Tech Stack (high level)

**Frontend:** React (Vite), react-router-dom, tailwindcss, socket.io-client, recharts, framer-motion, jwt-decode, qr-scanner  
**Backend:** Node.js, Express, MongoDB (Mongoose), JWT, Socket.IO, bcrypt, nodemailer, node-cron, qrcode, razorpay, express-rate-limit, mongo-sanitize

---

## 📡 All API Routes (single consolidated table)

| Module | Method | Endpoint | Description | Access Role |
|--------|--------|----------|-------------|-------------|
| AUTH | POST | `/api/auth/signup` | Register a patient (create user) | Public |
| AUTH | POST | `/api/auth/doctor-signup` | Register a doctor | Public |
| AUTH | POST | `/api/auth/login` | Login and return JWT & refresh token | Public |
| AUTH | POST | `/api/auth/refresh` | Refresh access token | Public |
| AUTH | POST | `/api/auth/logout` | Logout / revoke refresh token | Authenticated |
| USERS | PATCH | `/api/users/change-password` | Change logged-in user's password | ADMIN / DOCTOR / PATIENT |
| USERS | PATCH | `/api/users/change-phone` | Update phone number (with verification) | ADMIN / DOCTOR / PATIENT |
| USERS | POST | `/api/users/forgot-password` | Start forgot-password flow (rate-limited) | Public |
| USERS | POST | `/api/users/reset-password` | Reset password via token/OTP | Public |
| ADMIN | POST | `/api/admin/department` | Create a new department | ADMIN |
| ADMIN | PATCH | `/api/admin/:departmentId` | Update department settings (slot duration, etc.) | ADMIN |
| ADMIN | PATCH | `/api/admin/departments/:doctorId` | Assign / update doctor departments | ADMIN |
| ADMIN | PATCH | `/api/admin/departments/:departmentId/status` | Enable / disable a department | ADMIN |
| ADMIN | GET | `/api/admin/departments/status` | Get status summary for departments | ADMIN |
| ADMIN | POST | `/api/admin/doctor` | Create a doctor (admin-driven) | ADMIN |
| ADMIN | PATCH | `/api/admin/verify-doctor` | Verify a doctor's credentials | ADMIN |
| ADMIN | GET | `/api/admin/doctor/not-verified` | List unverified doctors | ADMIN |
| ADMIN | GET | `/api/admin/doctor/:doctorId` | Get doctor details by ID | ADMIN |
| ADMIN | GET | `/api/admin/doctors` | Get list of doctors (admin view) | ADMIN |
| ADMIN | PATCH | `/api/admin/doctor/on-leave` | Mark doctor on leave | ADMIN / DOCTOR |
| ADMIN | PATCH | `/api/admin/doctor/return-from-leave` | Mark doctor available | ADMIN / DOCTOR |
| ADMIN | PATCH | `/api/admin/doctor/activate` | Activate doctor account | ADMIN |
| ADMIN | PATCH | `/api/admin/doctor/inactive` | Mark doctor inactive | ADMIN |
| ADMIN | POST | `/api/admin/create-admin` | Create another admin user | ADMIN |
| ADMIN | GET | `/api/admin/dashboard/summary` | Admin dashboard KPIs (counts, wait times) | ADMIN |
| ADMIN | POST | `/api/admin/verify-patient-qr` | Verify patient via QR (front desk) | ADMIN |
| ADMIN | GET | `/api/admin/lookup` | Lookup user by phone or email | ADMIN |
| DEPARTMENTS | GET | `/api/departments` | Get all departments (meta + settings) | ADMIN / DOCTOR / PATIENT |
| DOCTOR PROFILE | GET | `/api/doctorProfile/me` | Doctor: get own profile | DOCTOR |
| DOCTOR PROFILE | POST | `/api/doctorProfile/me` | Doctor: create / update own profile | DOCTOR |
| DOCTOR PROFILE | GET | `/api/doctorProfile/doctors` | Patient: get public doctors list | PATIENT |
| DOCTOR PROFILE | POST | `/api/doctorProfile/:userId` | Admin: create / update doctor's profile | ADMIN |
| DOCTOR PROFILE | GET | `/api/doctorProfile/:userId` | Get doctor profile by user ID | ADMIN / PATIENT |
| TOKENS / QUEUE | POST | `/api/tokens` | Generate a token for a department | PATIENT / ADMIN |
| TOKENS / QUEUE | POST | `/api/tokens/doctor/call-next` | Doctor: call next token | DOCTOR |
| TOKENS / QUEUE | POST | `/api/tokens/doctor/complete` | Doctor: complete current token | DOCTOR |
| TOKENS / QUEUE | POST | `/api/tokens/doctor/skip` | Doctor: skip current token | DOCTOR |
| TOKENS / QUEUE | PATCH | `/api/tokens/:id/cancel` | Cancel a token | PATIENT / ADMIN |
| TOKENS / QUEUE | GET | `/api/tokens/my` | Get active token for patient | PATIENT |
| TOKENS / QUEUE | GET | `/api/tokens/my/upcoming` | Get upcoming tokens | PATIENT |
| TOKENS / QUEUE | GET | `/api/tokens/preview` | Preview next token number | ADMIN / PATIENT |
| TOKENS / QUEUE | GET | `/api/tokens/history` | Get token history | PATIENT |
| TOKENS / QUEUE | GET | `/api/tokens/dashboard/queue-summary` | Queue summary for dashboard | DOCTOR / ADMIN |
| VISITS | POST | `/api/visits` | Doctor creates visit record | DOCTOR |
| VISITS | GET | `/api/visits/patient/:patientId` | Get patient visit history | DOCTOR / ADMIN |
| VISITS | GET | `/api/visits/me` | Patient visit history | PATIENT |
| OTP | POST | `/api/otp/send` | Send OTP (rate-limited) | Public |
| OTP | POST | `/api/otp/verify` | Verify OTP | Public |
| MESSAGES | POST | `/api/messages/send` | Admin sends message | ADMIN |
| MESSAGES | POST | `/api/messages/department-announcement` | Admin department announcement | ADMIN |
| MESSAGES | GET | `/api/messages` | Get user messages | ADMIN / DOCTOR / PATIENT |
| MESSAGES | POST | `/api/messages/read` | Mark messages as read | ADMIN / DOCTOR / PATIENT |
| ANALYTICS | GET | `/api/analytics/daily-patient-count` | Daily patient count | ADMIN |
| ANALYTICS | GET | `/api/analytics/department-load` | Department load | ADMIN |
| ANALYTICS | GET | `/api/analytics/doctor-workload` | Doctor workload | ADMIN |
| ANALYTICS | GET | `/api/analytics/waiting-time/today` | Avg waiting time today | ADMIN |
| ANALYTICS | GET | `/api/analytics/consultation-time` | Consultation time stats | ADMIN |
| ANALYTICS | GET | `/api/analytics/department-peak-hours` | Department peak hours | ADMIN |
| ANALYTICS | GET | `/api/analytics/throughput` | Throughput metrics | ADMIN |
| ANALYTICS | GET | `/api/analytics/cancel-rate` | Cancellation rate | ADMIN |
| ANALYTICS | GET | `/api/analytics/doctor-utilization` | Doctor utilization | ADMIN |
| ANALYTICS | GET | `/api/analytics/live-queue` | Live queue snapshot | ADMIN |
| ANALYTICS | GET | `/api/analytics/patient-trend` | Patient trend analytics | ADMIN |
| TV / DISPLAY | GET | `/api/tv/department/:departmentId` | Department queue display | Public |
| TV / DISPLAY | GET | `/api/tv/departments` | All departments display | Public |
| SESSIONS | GET | `/api/sessions/my-sessions` | List active sessions | PATIENT |
| SESSIONS | POST | `/api/sessions/logout/:sessionId` | Logout specific session | PATIENT |
| SESSIONS | POST | `/api/sessions/logout-all` | Logout all sessions | PATIENT |
| PATIENT PROFILE | GET | `/api/patient-profile/me` | Get patient profile | PATIENT |
| PATIENT PROFILE | POST | `/api/patient-profile/me` | Update patient profile | PATIENT |
| PATIENT PROFILE | GET | `/api/patient-profile/my-qr` | Get patient QR code | PATIENT |
| PATIENT PROFILE | GET | `/api/patient-profile/:patientId` | Get patient profile | ADMIN / DOCTOR |
| HEALTH | GET | `/health` | Health check (`{ status: "OK" }`) | Public |

---

## 🧠 Architecture Summary

- **Frontend** (React) calls the REST API and subscribes to Socket.IO events for real-time updates.  
- **Backend** (Express) manages auth (JWT), queue logic, rate limiting, OTPs, tokens, visits, analytics and emits socket events on state changes.  
- **DB** (MongoDB) stores Users, Departments, Tokens, Visits, Sessions, Messages.  
- **Queue ordering:** Backend sorts WAITING tokens by priority (EMERGENCY > SENIOR > NORMAL) then timestamp.

---

## ⚙️ Recommended Environment Variables (example)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smartq
JWT_SECRET=your_super_secret_key_123
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=https://hospitaqueuemanagement.vercel.app
FRONTEND_URL=https://hospitaqueuemanagement.vercel.app
NODE_ENV=development
BREVO_API_KEY=your_brevo_api_key
MAIL_FROM=you@example.com
MAIL_FROM_NAME=SmartQ
EMAIL_HOST=smtp.example.com
EMAIL_USER=smtp_user
EMAIL_PASS=smtp_pass
RAZORPAY_KEY=xxxx
RAZORPAY_SECRET=xxxx
PATIENT_QR_SECRET=qr_secret
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=30d
ENABLE_INTERNAL_CRON=true