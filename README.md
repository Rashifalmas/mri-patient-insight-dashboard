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
The application is intended to run locally for the current project submission.
The reviewer needs:
The GitHub repository
The `.env` file provided separately
The exported Langflow flow JSON provided separately
The Supabase project is already configured in the provided `.env` file, so a new Supabase project does not need to be created.
---
1. Clone the repository
```bash
git clone <repository-url>
cd mri-patient-insight-dashboard
```
2. Install dependencies
```bash
npm install
```
3. Add the provided `.env`
Download the `.env` file from the private Google Drive submission materials and place it in the project root:
```text
mri-patient-insight-dashboard/
├── .env
├── .env.example
├── package.json
├── src/
└── ...
```
The provided `.env` contains the Supabase configuration and the Langflow configuration fields.
Example structure:
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

LANGFLOW_API_URL=http://localhost:7860
LANGFLOW_API_KEY=...
LANGFLOW_FLOW_ID=...

API_PORT=3001
```
Do not commit the `.env` file to Git.
---
Langflow Setup
The AI Insight feature requires a local Langflow instance.
1. Install and start Langflow
Start Langflow locally and make sure it is available at:
```text
http://localhost:7860
```
2. Import the provided Langflow flow
From the private Google Drive submission materials, download the exported flow JSON file.
In Langflow:
Open the Langflow interface.
Import the provided flow JSON.
Open the imported MRI analytics flow.
Verify that the Google Generative AI component is configured.
The exported flow includes the Google Gemini API key used for the project demonstration.
> The flow export is provided privately for project evaluation. Do not publish or redistribute the exported flow or its embedded credentials.
3. Create a Langflow API key
The Langflow API key belongs to the local Langflow instance, so the reviewer should create their own API key in their own Langflow environment.
After creating the key, update:
```env
LANGFLOW_API_KEY=YOUR_LOCAL_LANGFLOW_API_KEY
```
4. Get the imported Flow ID
After importing the flow, copy the Flow ID shown by the local Langflow instance and update:
```env
LANGFLOW_FLOW_ID=YOUR_IMPORTED_FLOW_ID
```
The reviewer does not need to create the flow manually. The provided JSON flow should be imported instead.
---
Running the Application Locally
The application uses three components:
Langflow
Backend API
React frontend
1. Start Langflow
Make sure Langflow is running:
```text
http://localhost:7860
```
The imported MRI analytics flow must be available.
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
`LANGFLOW_API_URL`	Local Langflow API base URL
`LANGFLOW_API_KEY`	API key created for the reviewer's local Langflow instance
`LANGFLOW_FLOW_ID`	Flow ID generated after importing the provided Langflow flow
`API_PORT`	Local backend port
---
Security Note
The `.env` file is excluded from Git using `.gitignore`.
The GitHub repository does not contain the actual `.env` file or its credentials.
For this private project evaluation, the configured `.env` file and exported Langflow flow are provided separately to the authorized reviewer.
Because the exported Langflow flow contains project credentials for demonstration purposes, the flow file should not be publicly redistributed.
After the evaluation period, the project owner may revoke or rotate the associated Google Gemini API key.
---
Deployment
The repository includes configuration prepared for Vercel deployment.
The current submission uses a local Langflow instance for demonstration.
A full public deployment would require hosting Langflow on a publicly accessible server and updating `LANGFLOW_API_URL` accordingly.
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
