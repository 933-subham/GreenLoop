# Smart Waste Management Platform 🌿

This document outlines the complete structure, files, and features of the MERN-stack based Smart Waste Management system. This platform is designed to connect citizens, waste collection partners, and municipality administrations across different cities into a single, cohesive ecosystem.

---

## 🏗️ Folder & File Structure

The project is structured as a standard monorepo containing a **Node/Express Backend** and a **React/Vite Frontend**.

```text
d:\waste management\
├── backend/                       # Node.js & Express API Server
│   ├── config/
│   │   └── db.js                  # MongoDB connection logic
│   ├── controllers/               # Business logic for all routes
│   │   ├── adminController.js     # Admin dashboard stats, user & report management
│   │   ├── authController.js      # JWT Auth for citizens, partners, admins
│   │   ├── contactController.js   # Contact form submissions handling
│   │   ├── reportController.js    # Garbage reporting, assignment, and completion logic
│   │   └── shopController.js      # Eco Shop item listing and purchasing logic
│   ├── middleware/
│   │   ├── authMiddleware.js      # Protects routes & enforces Role-Based Access Control (RBAC)
│   │   └── uploadMiddleware.js    # Multer configuration for handling image uploads
│   ├── models/                    # Mongoose Database Schemas
│   │   ├── City.js                # State, District, City hierarchy
│   │   ├── Contact.js             # Support messages
│   │   ├── Purchase.js            # Eco Shop purchase history
│   │   ├── Report.js              # Garbage reports with status, location, and photos
│   │   ├── ShopItem.js            # Available rewards in the Eco Shop
│   │   └── User.js                # Citizens, Partners, and Admins (with location scoping)
│   ├── routes/                    # API Endpoints
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── cityRoutes.js          # Endpoints for cascading location dropdowns
│   │   ├── contactRoutes.js
│   │   ├── reportRoutes.js
│   │   └── shopRoutes.js
│   ├── uploads/                   # Local storage for uploaded garbage and proof photos
│   ├── utils/                     # Seeder scripts for DB initialization
│   │   ├── createAdmin.js
│   │   ├── seedCities.js          # Seeds 15 sample cities in Odisha
│   │   └── seedShop.js            # Seeds 8 default Eco Shop items
│   ├── .env                       # Environment variables (Mongo URI, JWT Secret, Gmail, etc.)
│   ├── package.json               # Backend dependencies & npm scripts
│   └── server.js                  # Main Express application entry point
│
├── frontend/                      # React & Vite Single Page Application (SPA)
│   ├── public/                    # Static assets used in frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Footer.jsx
│   │   │   ├── Navbar.jsx         # Responsive top navigation component
│   │   │   └── Sidebar.jsx        # Dashboard side navigation with ?tab= URL sync
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Global state management for authentication
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx # 5-tab panel for municipality heads
│   │   │   ├── CitizenDashboard.jsx # 3-tab portal for reporting & shopping
│   │   │   ├── PartnerDashboard.jsx # 3-tab portal for waste collectors
│   │   │   ├── Home.jsx           # Landing page with 3D Canvas hero animation
│   │   │   ├── Login.jsx          # Multi-role secure login
│   │   │   └── Register.jsx       # Multi-step, city-scoped registration form
│   │   ├── App.jsx                # React Router DOM configuration & Protected Routes
│   │   ├── index.css              # Global custom styling (no Tailwind)
│   │   └── main.jsx               # React application mounting point
│   ├── index.html                 # Main HTML template
│   ├── package.json               # Frontend dependencies (React Router, Lucide, Bootstrap, Three.js)
│   └── vite.config.js             # Vite bundler configuration
│
├── summary.md                     # This file
├── README.md                      # General project documentation
└── SCHEMA.md                      # Database relationship schema documentation
```

---

## ⚙️ How the Website Works (Detailed Features)

The platform completely abandoned Firebase/Tailwind in favor of a robust **Custom Node.js Backend**, **MongoDB Database**, and **Vite+React + Custom CSS** frontend. The core functionality revolves around a city-scoped, three-tier user system.

### 1. Multi-City Architecture & Scoping
- **Cascading Locations:** When registering, users select their State → District → City.
- **Data Isolation:** An **Admin** (Municipality head) can only see data, reports, users, and partners within their own city.
- **Reporting Routing:** When a Citizen submits a report, it is tagged with their city. Only Partners working in that specific city can view and accept the task.

### 2. Role-Based Access & Authentication
Authentication is securely handled using **JWT Tokens** stored in HTTP-only cookies (or local storage).
The platform enforces boundaries strictly:

- **💁‍♂️ Citizens:**
  - Can register instantly and log in without approval.
  - Features: Report garbage, view report history, and access the Eco Shop.

- **🚛 Partners (Waste Collectors):**
  - Registration requires explicit approval from the city's Admin. Until approved, their account status is `pending`.
  - Features: View available city tasks, accept tasks, upload proof of cleaning, and check completed history.

- **🏛️ Admins (Municipality):**
  - Registration requires a secure secret code (`ADMIN_REGISTER_CODE` in `.env`) to prevent unauthorized access.
  - Features: Approve/reject partners, block/unblock users, assign tasks manually, view city-wide analytics, manage shop items, and export data.

### 3. The Core Ecosystem Loop (Garbage to Eco Coins)
The primary mechanic of the platform is an incentivized waste reporting loop:

1. **Submission:** A Citizen captures a photo of garbage, gets their GPS coordinates, and submits the report. Their dashboard shows it as `Submitted` (🪙 0 coins earned yet).
2. **Acceptance:** A Partner checks their "Available Tasks" tab, sees the report, and clicks "Accept". The status changes to `Assigned`.
3. **Execution:** The Partner goes to the location, cleans it, and updates the task to `Cleaning`.
4. **Completion & Validation:** The Partner clicks "Upload Proof & Complete", attaching a photo of the clean area.
5. **Reward:** The report status is marked `Completed`. The Citizen is instantly awarded **10 Eco Coins**.

### 4. Eco Shop (Gamification)
Instead of just counting points, Citizens can spend their earned Eco Coins in the **Eco Shop** via their dashboard.
- The Admin seeds items (e.g., Tree Saplings, Grocery Vouchers, Bus Passes) and sets the price.
- Citizens browse the shop; the UI prevents them from buying items if they lack coins or if the item is out of stock.
- Purchasing creates a `Purchase` record in the DB and deducts the user's live Eco Coin balance.

### 5. UI/UX & Technical Implementation
- **State Management:** A custom `AuthContext` provides global user data and an initialized Axios instance (`authAxios`) that auto-injects JWT tokens into request headers.
- **File Uploads:** Accomplished via `Multer` on the backend, storing images securely in the `backend/uploads` directory. Handled securely across all reports and proofs.
- **Dynamic 3D Hero:** The landing page utilizes `React Three Fiber` and `Three.js` for an engaging, smooth 3D interactive hero canvas.
- **Dashboard Navigation:** Dashboards are entirely single-page components. The `Sidebar` component controls the view using URL Search Parameters (`?tab=report`), allowing for seamless browser history navigation without full page reloads. Custom CSS + React-Bootstrap powers the grid grids and pristine glassmorphic aesthetic.
