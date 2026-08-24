MRI Patient Insight Dashboard
A web-based MRI patient management and analytics dashboard developed as a final project for Hacktiv8.
The application combines patient management, data visualization, patient-volume forecasting, and AI-generated operational insights using Supabase, Langflow, and Google Gemini.
---
Project Overview
This project is designed to help an MRI department monitor patient activity and support operational planning through historical data and forecasting.
The application provides:
Patient management with CRUD operations
Dynamic dashboard statistics
MRI type and patient status visualization
Daily patient-volume historical trends
7-day and 30-day patient-volume forecasting
AI-generated operational insights
AI-generated operational recommendations
---
Main Features
1. Dashboard
The Dashboard provides an overview of MRI patient activity, including:
Total patients
Emergency patients
Waiting patients
Completed patients
Daily patient-volume trends
MRI type distribution
Patient status distribution
AI-generated insights
Operational recommendations
Dashboard data is retrieved dynamically from Supabase.
2. Patient Management
The Patient Management page supports:
Add patient
Edit patient
Delete patient
Search patients
Filter by status
Filter by priority
Filter by MRI type
Patient records are stored in Supabase PostgreSQL.
3. Patient Volume Forecasting
The Forecast page provides:
7-day forecast
30-day forecast
Historical patient-volume chart
Forecast detail table
Forecast summary
Highest and lowest predicted days
Model information
The forecasting method used in this prototype is:
Day-of-Week Mean
The model predicts future patient volume using the historical average number of patients for each weekday.
The model was evaluated using a time-based train/test split with:
MAE ≈ 2.28 patients/day
The live forecast is calculated dynamically from the latest patient records stored in Supabase.
4. AI Insights & Recommendations
The Dashboard includes an AI analysis feature powered by Langflow and Google Gemini.
The application sends a compact MRI analytics summary containing:
Latest available date
Total patients
Emergency patients
Waiting patients
Completed patients
Recent patient-volume average
Forecasted patient volume
Langflow processes the information and returns:
3 operational insights
2 operational recommendations
The AI is intended for operational analytics only and does not provide medical diagnosis or treatment recommendations.
---
Technology Stack
Frontend
React
TypeScript
Vite
Recharts
Tailwind CSS
Database
Supabase
PostgreSQL
AI / Analytics
Langflow
Google Gemini
Forecasting
Python
Day-of-Week Mean forecasting
Deployment Preparation
Vercel
Vercel Serverless Function for `/api/insights`
---
System Architecture
```text
                    ┌──────────────────────┐
                    │     React + Vite     │
                    │     Web Dashboard    │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
        ┌─────────────────┐          ┌─────────────────┐
        │    Supabase     │          │  API / Backend  │
        │   PostgreSQL    │          │   /api/insights │
        └─────────────────┘          └────────┬────────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │   Langflow   │
                                       └──────┬───────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │ Google Gemini│
                                       └──────────────┘
```
---
Project Structure
```text
mri-patient-insight-dashboard/
│
├── api/
│   └── insights.ts
│
├── public/
│
├── server/
│   ├── index.ts
│   └── tsconfig.json
│
├── src/
│   ├── components/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── types/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── vercel.json
└── README.md
```
---
Local Setup
1. Clone the repository
```bash
git clone <repository-url>
cd mri-patient-insight-dashboard
```
2. Install dependencies
```bash
npm install
```
3. Create the environment file
Create a `.env` file in the project root based on `.env.example`.
Example structure:
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

LANGFLOW_API_URL=
LANGFLOW_API_KEY=
LANGFLOW_FLOW_ID=

API_PORT=3001
```
Do not commit `.env` to Git.
---
Running the Application Locally
The application uses three components during local development:
Langflow
Backend API
React frontend
1. Start Langflow
Start the local Langflow instance and make sure it is available at:
```text
http://localhost:7860
```
The MRI analytics flow should be available in the Langflow instance.
2. Start the backend
Open a terminal in the project root:
```powershell
node --env-file=.env --import=tsx server/index.ts
```
The backend runs on:
```text
http://localhost:3001
```
3. Start the frontend
Open another terminal in the project root:
```powershell
npm run dev:client
```
Then open:
```text
http://localhost:5173
```
---
AI Flow
The current Langflow pipeline is:
```text
Chat Input
    ↓
Prompt Template
    ↓
Structured Output
    ↑
Google Generative AI
    ↓
Chat Output
```
The Structured Output contains:
```json
{
  "insights": [
    "Insight 1",
    "Insight 2",
    "Insight 3"
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ]
}
```
The website sends a compact analytics summary to Langflow and displays the resulting insights and recommendations on the Dashboard.
---
Environment Variables
Variable	Purpose
`VITE_SUPABASE_URL`	Supabase project URL
`VITE_SUPABASE_ANON_KEY`	Supabase public/anonymous key
`LANGFLOW_API_URL`	Langflow API base URL
`LANGFLOW_API_KEY`	Langflow API authentication key
`LANGFLOW_FLOW_ID`	Langflow flow identifier
`API_PORT`	Local backend port
Sensitive values are intentionally excluded from this repository.
---
Security Note
The `.env` file is excluded from Git using `.gitignore`.
API keys and private credentials should not be committed to the repository.
For demonstration purposes, the required `.env` file is provided separately to the authorized reviewer.
---
Deployment
The repository includes configuration for Vercel deployment.
The current submission uses a local Langflow instance for demonstration.
For a full public deployment, Langflow must be hosted on a publicly accessible server and `LANGFLOW_API_URL` must point to that public Langflow instance.
---
Recommended Demo Flow
```text
Dashboard
    ↓
Patient Management
    ↓
Add / Edit Patient
    ↓
Dashboard updates
    ↓
Forecast
    ↓
7-Day / 30-Day Forecast
    ↓
Generate AI Insights
    ↓
AI Insights + Recommendations
```
---
Author
Rashifalmas
MRI Patient Insight Dashboard  
Hacktiv8 Final Project
