# 🏠 Community & Neighbourhood Complaint Portal

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A high-fidelity, full-stack community management application designed to streamline complaint resolution in residential societies. This portal provides a transparent, efficient, and role-based ecosystem for residents, staff, and administrators.

---

## 📑 Table of Contents
- [✨ Key Features](#-key-features)
- [🛠 Tech Stack](#-tech-stack)
- [📦 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [🔑 Environment Configuration](#-environment-configuration)
- [🛠 API Reference](#-api-reference)
- [🤝 Contributing](#-contributing)

---

## ✨ Key Features

### 👤 Role-Based Portals
The system implements a sophisticated **Role-Based Access Control (RBAC)** system with dedicated views for:
- **Residents**: Seamlessly file complaints, attach photos, track real-time status updates, and provide feedback/ratings after resolution.
- **Admin/Committee**: Full oversight of society operations, staff assignment, priority management, and statistical dashboards.
- **Maintenance Staff**: Dedicated task lists, status update controls (In Progress, Resolved), and internal communication tools.
- **Security**: Focused view for monitoring safety-related incidents and visitor/flat correlations.

### 📋 Sophisticated Complaint Lifecycle
- **Full Transparency**: Every action is logged in a `ComplaintUpdate` history.
- **Custom Categorization**: Organizes issues into Plumbing, Electrical, Security, and more.
- **Priority Matrix**: Dynamic prioritization (Critical, High, Medium, Low) ensuring urgent tasks are handled first.

### 💌 Engagement & Onboarding
- **Invitation System**: Secure invitation system for onboarding new residents and staff via email tokens.
- **Real-time Notifications**: (Email-based) status update notifications via Nodemailer integration.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, React Router 6 |
| **Backend** | Node.js (v18+), Express.js |
| **ORM** | Prisma |
| **Database** | MySQL |
| **Auth** | JSON Web Tokens (JWT) & Bcrypt password hashing |
| **Utilities** | Nodemailer (Email), UUID, PostCSS |

---

## 📦 Project Structure

```bash
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # UI Components (Shadcn-style)
│   │   ├── pages/          # Full page views
│   │   └── context/        # Global state management
├── server/                 # Backend (Express)
│   ├── prisma/             # Database Schema & Migrations
│   ├── routes/             # API Endpoints
│   ├── middleware/         # Auth & Validation
│   └── utils/              # Helper functions (Email, etc.)
└── package.json            # Project-wide metadata
```

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/krishnendude2005/Complaint_Portal_Neighbourhood-Community-WebApp_IOHE.git
cd Complaint_Portal_Neighbourhood-Community-WebApp_IOHE

# Install Server dependencies
cd server && npm install

# Install Client dependencies
cd ../client && npm install
```

### 2. Database Setup (Prisma + MySQL)
Ensure you have a **MySQL** instance running and update your `.env` connection string.

```bash
cd ../server
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 3. Start Development
**Terminal 1 (Backend):**
```bash
cd server && npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client && npm run dev
```

---

## 🔑 Environment Configuration

Create a `.env` file in the `/server` directory:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME"
JWT_SECRET="your-secure-secret-key"
PORT=3002
SMTP_USER="name@gmail.com"
SMTP_PASS="xxxx-xxxx-xxxx-xxxx"
FRONTEND_URL="http://localhost:5173"
```
*Note: Refer to `server/.env.example` for details.*

---

## 🔐 Demo Accounts
*All accounts use password: `password123`*

| Email | Role |
|---|---|
| `admin@example.com` | Administrator |
| `resident@example.com` | Resident |
| `staff@example.com` | Maintenance Staff |

---

## 🤝 Contributing
Contributions are welcome! Please follow these steps:
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

---
<p align="center">Made with ❤️ for Community Betterment</p>
