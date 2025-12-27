backend/
│
├── src/
│   ├── app.js
│   ├── server.js
│
│   ├── config/
│   │   └── database.config.js
│
│   ├── models/
│   │   ├── user.model.js
│   │   ├── department.model.js
│   │   ├── token.model.js
│   │   ├── visit.model.js
│   │   ├── otp.model.js
│   │   └── refreshToken.model.js
│
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── token.routes.js
│   │   ├── department.routes.js
│   │   ├── visit.routes.js
│   │   ├── analytics.routes.js
│   │   ├── tv.routes.js
│   │   └── otp.routes.js
│
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── token.controller.js
│   │   ├── department.controller.js
│   │   ├── visit.controller.js
│   │   ├── analytics.controller.js
│   │   ├── tv.controller.js
│   │   └── otp.controller.js
│
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── token.service.js
│   │   ├── visit.service.js
│   │   ├── analytics.service.js
│   │   └── otp.service.js
│
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── otpRateLimit.middleware.js
│
│   ├── sockets/
│   │   └── index.js
│   │
│   ├── utils/
│   │   ├── jwt.util.js
│   │
│   └── scripts/
│       └── seedAdmin.js
│
├── .env
├── .env.example
├── package.json
└── README.md



👥 User Roles & Access
1️⃣ Patient
Can sign up publicly
Phone number is mandatory
OTP verification required
Can create NORMAL tokens only
Can cancel their own tokens

2️⃣ Doctor
Cannot self-register
Pre-registered by Admin
Completes signup with phone + password
Requires admin verification
Can call next / skip / complete tokens

3️⃣ Admin
No public signup
Created using seed script or by another admin
Manages doctors, departments, and analytics

🔐 Authentication & Security
JWT Access Token + Refresh Token
Refresh tokens stored in DB
OTP verification for phone numbers
Rate limiting on OTP requests
Role-based route protection
No role escalation possible

📡 Real-Time System (Socket.io)
Used for live queue updates
Events are emitted when:
Token is called
Token is skipped
Token is completed
Token is cancelled
TVs, doctors, and patients receive updates instantly
HTTP is used for initial data; Socket.io for live changes

🎟️ Token & Queue Logic
Tokens are stored in MongoDB
Queue is derived by queries, not stored in memory
Priority order:
EMERGENCY → SENIOR → NORMAL
Advance booking allowed up to 5 days
Future tokens become active automatically on their date
Only today’s tokens participate in the queue

🧪 API ROUTES

🔐 Auth Routes – /api/auth

| Method | Route            | Description             |
| ------ | ---------------- | ----------------------- |
| POST   | `/signup`        | Patient signup          |
| POST   | `/login`         | Login (all roles)       |
| POST   | `/doctor/signup` | Doctor completes signup |
| POST   | `/refresh`       | Refresh access token    |
| POST   | `/logout`        | Logout user             |

📱 OTP Routes – /api/otp

| Method | Route     | Description       |
| ------ | --------- | ----------------- |
| POST   | `/send`   | Send OTP to phone |
| POST   | `/verify` | Verify OTP        |

🎟️ Token Routes – /api/token

| Method | Route           | Description                  |
| ------ | --------------- | ---------------------------- |
| POST   | `/`             | Create token (patient/admin) |
| PATCH  | `/next`         | Doctor calls next token      |
| PATCH  | `/:id/complete` | Complete token               |
| PATCH  | `/:id/skip`     | Skip token                   |
| PATCH  | `/:id/cancel`   | Patient cancels token        |

🏥 Department Routes – /api/department

| Method | Route | Description               |
| ------ | ----- | ------------------------- |
| POST   | `/`   | Create department (admin) |
| GET    | `/`   | Get departments           |


📄 Visit Routes – /api/visit

| Method | Route          | Description                 |
| ------ | -------------- | --------------------------- |
| POST   | `/`            | Save visit after completion |
| GET    | `/patient/:id` | Get patient visit history   |

📊 Analytics Routes – /api/analytics (Admin only)

| Method | Route              | Description                  |
| ------ | ------------------ | ---------------------------- |
| GET    | `/daily-patients`  | Daily patient count          |
| GET    | `/department-load` | Waiting count per department |
| GET    | `/doctor-workload` | Patients handled per doctor  |

📺 TV / Waiting Hall Routes – /api/tv

| Method | Route             | Description                     |
| ------ | ----------------- | ------------------------------- |
| GET    | `/department/:id` | Queue status for one department |
| GET    | `/departments`    | All departments queue status    |

🧑‍⚕️ Doctor Availability Handling

Doctor can be:
  On leave (isAvailable = false)
  Inactive (isActive = false)
Any CALLED tokens are safely re-queued
Queue never blocks

👤 Admin Seed Script
One-time admin creation

       ** node src/scripts/seedAdmin.js **
      
Runs only when executed manually
Skips if admin already exists
Never runs during server start

✅ Backend Status
✔ Authentication & Authorization
✔ OTP verification
✔ Token & queue system
✔ Advance booking
✔ Real-time updates
✔ Analytics
✔ Role-based access
✔ Cancellation & doctor handling


| Base Path        | Method | Endpoint                    | Presumed Functionality                       | Required Role(s)       |
| ---------------- | ------ | --------------------------- | -------------------------------------------- | ---------------------- |
| `/`              | GET    | `/health`                   | Check the health/status of the server        | None                   |
| `/api/auth`      | POST   | `/login`                    | User login                                   | None                   |
| `/api/auth`      | POST   | `/refresh`                  | Refresh access token                         | None                   |
| `/api/auth`      | POST   | `/logout`                   | User logout                                  | None                   |
| `/api/auth`      | POST   | `/signup`                   | General user registration                    | None                   |
| `/api/auth`      | POST   | `/doctor/signup`            | Doctor-specific registration                 | None                   |
| `/api/admin`     | GET    | `/doctors/not-verified`     | Get all unverified doctors                   | ADMIN                  |
| `/api/admin`     | GET    | `/department/status`        | get all department status                    | ADMIN                  |
| `/api/admin`     | POST   | `/department`               | Create a new department                      | ADMIN                  |
| `/api/admin`     | PATCH  | `/verify-doctor`            | Verify a doctor account                      | ADMIN                  |
| `/api/admin`     | POST   | `/doctor`                   | Create a doctor (admin-created)              | ADMIN                  |
| `/api/admin`     | POST   | `/assign-doctor`            | Assign doctor to department                  | ADMIN                  |
| `/api/admin`     | PATCH  | `/doctor/on-leave`          | Mark doctor as on leave                      | ADMIN                  |
| `/api/admin`     | PATCH  | `/doctor/inactive`          | Mark doctor as inactive                      | ADMIN                  |
| `/api/admin`     | POST   | `/create-admin`             | Create a new admin                           | ADMIN                  |
| `/api/analytics` | GET    | `/daily-patients`           | Get daily patient count                      | ADMIN                  |
| `/api/analytics` | GET    | `/department-load`          | Department workload analytics                | ADMIN                  |
| `/api/analytics` | GET    | `/doctor-workload`          | Doctor workload analytics                    | ADMIN                  |
| `/api/otp`       | POST   | `/send`                     | Send OTP (rate limited)                      | None                   |
| `/api/otp`       | POST   | `/verify`                   | Verify OTP                                   | None                   |
| `/api/tokens`    | POST   | `/`                         | Create patient token (queue)                 | PATIENT, ADMIN         |
| `/api/tokens`    | POST   | `/call-next`                | Call next patient in queue                   | DOCTOR                 |
| `/api/tokens`    | POST   | `/complete/:tokenId`        | Mark visit/token as complete                 | DOCTOR                 |
| `/api/tokens`    | POST   | `/skip/:tokenId`            | Skip a patient token                         | DOCTOR                 |
| `/api/tokens`    | PATCH  | `/:id/cancel`               | Cancel an existing token                     | ADMIN, PATIENT         |
| `/api/tv`        | GET    | `/department/:departmentId` | Queue status for one department (TV display) | None                   |
| `/api/tv`        | GET    | `/departments`              | Queue status for all departments             | None                   |
| `/api/visits`    | POST   | `/`                         | Create a patient visit record                | DOCTOR                 |
| `/api/visits`    | GET    | `/patient/:patientId`       | Get patient visit history                    | DOCTOR, ADMIN, PATIENT |
|`/api/departments`| GET    | `/`                         | Get all Departments                          | None                   |
| `/api/admin`     | GET    | `/doctors/:doctorId`           | Get doctor details by ID                  | ADMIN         |
| `/api/admin`     | GET    | `/doctors`                     | Get all doctors (with filters via query)  | ADMIN         |
| `/api/admin`     | PATCH  | `/doctors/unassign-department` | Remove doctor from a department           | ADMIN         |
| `/api/admin`     | PATCH  | `/doctors/return-from-leave`   | Mark doctor available (return from leave) | ADMIN         |
| `/api/admin`     | PATCH  | `/doctors/activate`            | Reactivate an inactive doctor             | ADMIN         |
| `/api/admin`     | PATCH  | `/departments/:departmentId/close` | Close (soft delete) a department      | ADMIN         |
| `/api/admin`     | GET    | `/dashboard/summary`           | Admin dashboard summary statistics        | ADMIN         |
