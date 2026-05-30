# CommandNexus Operating System 

This application is a **full-stack Node.js server**, not just a static frontend. It includes an embedded SQLite database (`data.db`) and a custom Express backend (`server.ts`).

## Why does it look "broken" or different when downloaded?

If you download this code or export it to GitHub and deploy it directly to a static hosting provider (like Vercel, Netlify, or GitHub Pages), **those platforms will only build the React frontend and completely ignore the `server.ts` backend.** 

Because the frontend relies entirely on `/api/` endpoints to fetch the database state, configuration, members, and AI logic, the app will appear broken, empty, or "fake" on those platforms. 

## How to Run It For Real

### 1. Local Development
To run the exact system you see in the AI Studio preview on your own local computer:
```bash
npm install
npm run dev
```
The system will start both the backend server and frontend preview on `http://localhost:3000`.

### 2. Live Production Hosting
To host this live, you must deploy it to a platform that supports **Node.js applications**, not static web apps.
Recommended providers:
* **Railway** (Connect GitHub repo, it will auto-detect Node.js)
* **Render** (Choose "Web Service" > connect repo)
* **DigitalOcean App Platform** or **VPS (Ubuntu)**

Your build and start commands for production hosting are:
* **Build Command**: `npm run build`
* **Start Command**: `npm run start` (or `node dist/server.cjs`)

### 3. Database Migration (Optional)
The system uses an embedded SQLite database (`data.db`). If you deploy to a containerized platform, your local database resets on every deployment unless you use a persistent volume. 

The server is heavily engineered to automatically switch to **Supabase** (PostgreSQL) if you provide credentials. Add these to your environment variables on your hosting provider:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
If these are present, the backend automatically uses Supabase for all database requests, giving you a persistent, scalable database.
