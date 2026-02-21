# Basudebpur High School Management System

A full-stack, bilingual (English/Bangla), real-time school management system with AI-powered translation and a premium 3D design.

## 🏗️ Tech Stack

- **Frontend**: React (TypeScript, Tailwind CSS, Vite, Framer Motion)
- **Backend**: Node.js + Express (TypeScript)
- **Database**: PostgreSQL (Raw SQL Infrastructure, Partitioned)
- **Real-time**: Socket.IO
- **AI**: Google Gemini Pro API

## 🚀 Quick Start (Automated)

The easiest way to set up the entire system is using the automated scripts provided in the root directory:

1. **Automatic Setup**: Open PowerShell as Administrator and run:

   ```powershell
   .\setup_automated.ps1
   ```

   *This will install all dependencies and prepare the workspace environment.*

2. **One-Click Launch**: After setup, simply run:

   ```batch
   launch_system.bat
   ```

   *This starts both the backend and frontend servers in separate windows.*

## 🛠️ Manual Setup Instructions

### Pre-requisites

1. PostgreSQL installed and running.
2. Node.js (v18+) installed.

### 1. Database Setup

1. Create a database named `basudebpur` in PostgreSQL.
2. Execute the schema found in `database.sql` to initialize tables and seed data.
3. Update the database connection variables in root `.env`.

### 2. Backend Configuration

1. Navigate to `backend/`: `cd backend`
2. Install dependencies: `npm install`
4. Start server: `npm run dev`

### 3. Frontend Configuration

1. Navigate to `frontend/`: `cd frontend`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

## 🧪 Testing & Credentials

1. Open `http://localhost:5173`.
2. **Headmaster Portal**: Login at `/login` with:
   - **Email**: `headmaster@basudevpur.edu.bd`
   - **Password**: `headmaster123`
3. Access the **Data Hub** from the sidebar to manage all school data.

## 🌐 Deployment

### Frontend (Netlify)

1. **Prepare**: Ensure `frontend/netlify.toml` exists (it handles SPA routing).
2. **Connect**: Link your GitHub repository to [Netlify](https://app.netlify.com/).
3. **Settings**:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### Backend

#### Option 1: Run Locally (Localhost)

1. **Navigate**: `cd backend`
2. **Install**: `npm install`
3. **Database**: Ensure your `.env` has working PostgreSQL credentials.
4. **Start**: `npm run dev`. Your backend will be at `http://localhost:5000`.

#### Option 2: Free Hosting (Render.com)

1. **Repository**: Push the entire project to GitHub.
2. **Create Web Service**: In Render, select your repository.
3. **Settings**:
   - **Root Directory**: `backend` (CRITICAL)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. **Environment Variables**: Add `DATABASE_URL` and `PORT=5000` (or your preferred port).

### Database Options

- **Neon DB (Recommended)**: Best for cloud deployment. Add `?sslmode=require` to your connection string.
- **Server PC**: Use your public IP and ensure port `5432` is open in your router/firewall.
- **Localhost**: Only for local development; will not work once the backend is deployed to the cloud.

## 🔧 Troubleshooting

### Cannot find module 'pm2' (TypeScript Error)
If you see the error `Cannot find module 'pm2' or its corresponding type declarations` when compiling or checking types:
1. Ensure you are logged into npm (check `npm whoami` or if your token has expired).
2. Install the types manually: `npm install -D @types/pm2` (or `npm.cmd install -D @types/pm2` on Windows).
3. **Temporary Fix Included:** We have included a fallback definition file `pm2-env.d.ts` in the root of the project to temporarily resolve this issue if your npm install fails due to authentication or registry errors. Once you successfully install `@types/pm2`, you can delete this file.

---

## 👨‍💻 Developer

This system was proudly built by **MD. Rakibul Hasan**.

☕ **Support My Work**: If you found this project helpful, consider leaving a tip via **Bkash: +880 1774-471120**.

For inquiries, custom solutions, or professional collaborations:

- 📞 **Phone**: [+880 1774-471120](tel:+8801774471120)
- ✉️ **Email**: [rbkhan00009@gmail.com](mailto:rbkhan00009@gmail.com)

**High School Management System Built for Basudebpur High School .**
