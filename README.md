# 🌿 EcoCity – Smart Waste Management Platform

A full-stack MERN smart city web application for reporting and managing garbage collection with role-based authentication, email notifications, and modern UI.

## 🎯 Features

- **Role-Based Auth** – Citizen | Partner (Waste Collector) | Admin (Municipality Head)
- **Partner Approval Workflow** – Email notification to admin → Admin approves in dashboard → Email sent to partner
- **Garbage Reporting** – Citizens upload photos + GPS location
- **Task Management** – Partners accept tasks and upload cleanup proof
- **Admin Dashboard** – Stats, user management, CSV export
- **Email Notifications** – All key events trigger beautiful HTML emails
- **3D Hero Animation** – Interactive Earth globe built with Three.js

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React-Bootstrap, React Three Fiber |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcryptjs |
| Email | Nodemailer + Gmail SMTP |
| File Uploads | Multer |

---

## 🚀 Local Development

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ecocity-waste-management.git
cd ecocity-waste-management
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env    # fill in your values
node server.js
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env    # set VITE_API_URL
npm run dev
```

### 4. Create Admin Account
```bash
cd backend
npm run create-admin
# Prints: admin@ecocity.gov / Admin@123
```

### 5. Open in Browser
- Frontend: **http://localhost:5173**
- Backend API: **http://localhost:5000/api**

---

## 📧 Gmail SMTP Setup

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Factor Authentication**
3. Go to **App Passwords** → Generate one for "Mail"
4. Set in `.env`:
   ```
   GMAIL_USER=your@gmail.com
   GMAIL_PASS=xxxx xxxx xxxx xxxx   # 16-char app password
   ADMIN_EMAIL=municipality@gov.in
   ```

---

## 🌐 Deployment (GitHub + Render/Railway)

### Backend (Render / Railway)
1. Push to GitHub
2. Create new Web Service on [render.com](https://render.com)
3. Set **Root Directory**: `backend`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. Add all `.env` values as Environment Variables

### Frontend (Vercel / Netlify)
1. Create new project on [vercel.com](https://vercel.com)
2. Set **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. Add env variable: `VITE_API_URL=https://your-backend.onrender.com/api`

---

## 👤 User Roles

| Role | Description |
|------|-------------|
| **Citizen** | Reports garbage, earns Eco Coins |
| **Partner** | Waste collector, manages cleanup tasks |
| **Admin** | Municipality Head, approves partners, manages platform |

> **Admin accounts** cannot be registered through the frontend.  
> Run `npm run create-admin` in the backend to create one.
