SmartQ: An Intelligent Hospital Queue Management System Using Priority Scheduling and Real-Time Updates


hospital-queue-frontend/
│
├── index.html
├── package.json
├── vite.config.js
│
└── src/
    │
    ├── main.jsx                # React entry point
    ├── App.jsx                 # App-level routing
    ├── index.css               # Tailwind entry (@import "tailwindcss")
    │
    ├── api/                    # Backend API calls (axios only)
    │   ├── axios.js
    │   ├── auth.api.js
    │   ├── token.api.js
    │   ├── department.api.js
    │   ├── visit.api.js
    │   └── admin.api.js
    │
    ├── routes/                 # Route protection & role guards
    │   ├── ProtectedRoute.jsx
    │   └── RoleRoute.jsx
    │
    ├── layouts/                # Page shells (role-based)
    │   ├── PublicLayout.jsx
    │   ├── PatientLayout.jsx
    │   ├── DoctorLayout.jsx
    │   └── AdminLayout.jsx
    │
    ├── pages/                  # Route-level screens
    │   │
    │   ├── auth/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── DoctorSignup.jsx
    │   │   └── OtpVerify.jsx
    │   │
    │   ├── patient/
    │   │   ├── Dashboard.jsx
    │   │   ├── MyTokens.jsx
    │   │   └── VisitHistory.jsx
    │   │
    │   ├── doctor/
    │   │   ├── Dashboard.jsx
    │   │   └── Queue.jsx
    │   │
    │   ├── admin/
    │   │   ├── Dashboard.jsx
    │   │   ├── Departments.jsx
    │   │   ├── Doctors.jsx
    │   │   ├── Analytics.jsx
    │   │   └── VerifyDoctors.jsx
    │   │
    │   └── tv/
    │       ├── AllDepartments.jsx
    │       └── DepartmentView.jsx
    │
    ├── components/             # Reusable UI components
    │   ├── ui/
    │   │   ├── Button.jsx
    │   │   ├── Input.jsx
    │   │   ├── Card.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Table.jsx
    │   │   └── Badge.jsx
    │   │
    │   ├── Navbar.jsx
    │   ├── Sidebar.jsx
    │   ├── Loader.jsx
    │   └── ErrorBoundary.jsx
    │
    ├── context/                # Global state
    │   ├── AuthContext.jsx
    │   └── SocketContext.jsx
    │
    ├── hooks/                  # Custom hooks
    │   ├── useAuth.js
    │   ├── useRole.js
    │   └── useSocket.js
    │
    ├── utils/                  # Helpers
    │   ├── constants.js
    │   ├── formatDate.js
    │   └── tokenUtils.js
    │
    └── assets/                 # Images, icons (optional)
