# StatVision Project Test Instructions

This document outlines the steps to run and test the StatVision backend and frontend components. It will be updated as the project evolves.

## 1. Ensure Backend Server is Running

The backend server provides the API endpoints and serves the Swagger UI documentation. It should be running in a dedicated Termux session.

**Command to start the backend server:**
```bash
cd /data/data/com.termux/files/home/development/StatVision/backend
npm start
```

**Expected Output:** You should see `Data Source has been initialized!` and `Server is running on port 3000`.

**Access Swagger UI:**
Once the backend is running, you can access the API documentation at: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## 2. Run the React Frontend Development Server (Vite)

The React application provides a UI for Firebase login, token display, and links to the backend API. It should be run in a *second* dedicated Termux session.

**Commands to start the React development server:**
```bash
cd /data/data/com.termux/files/home/development/StatVision/frontend-test
npm run dev
```

**Expected Output:** The command will start the Vite development server. You should see output indicating the server is running, typically on `http://localhost:5173`.

## 3. Testing the React App and Backend

1.  **Open your browser** and navigate to: [http://localhost:5173](http://localhost:5173).
2.  **Login:** Use the hardcoded credentials `test@test.com` and `testTest` to log in via the React app.
3.  **Observe Token:** Upon successful login, the Firebase ID token will be displayed at the top.
4.  **Explore Swagger UI:** Click the link to `http://localhost:3000/api-docs` to view the backend API documentation.
5.  **Test Endpoints with cURL:** Use the provided cURL commands in the React app, replacing `YOUR_ID_TOKEN` with the actual token, to test the backend API endpoints from a Termux session.

---

**Note:** This file will be updated as new features are added or changes are made to the project. Always refer to the latest version for testing instructions.