# DataLogix - Mini Data Processing Platform (Frontend)

A professional, modular, and production-grade data processing platform interface that allows users to locally upload, transform, and query datasets with ease.

## 🚀 Overview

The DataLogix frontend is a fast, responsive Single Page Application built using React. It acts as the interactive interface for a scalable data ingestion and querying architecture.

---

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js**: v20 or later.
- **Backend API**: The backend should be running simultaneously. (Default assumption is `http://localhost:5000/api`)

### Installation & Execution

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Configuration**:
    Create a `.env` file in the root directory and specify your backend API URL if different from the default:
    ```env
    VITE_API_BASE_URL=http://localhost:5000/api
    ```

3.  **Start Development Server**:
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:3000`.

4.  **Build for Production**:
    ```bash
    npm run build
    ```

---

## 🏗️ Approach and Design Decisions

1.  **Vite + React Ecosystem**: Vite was chosen as the build tool to provide an extremely fast development server and optimized production builds. React 18 is used to handle dynamic DOM updates effectively.
2.  **Minimalist Dependency Footprint**: To keep the bundle size small and rendering fast, a custom CSS variables design system was implemented instead of a heavy UI framework (like Bootstrap or MUI). All styles are located in `src/index.css`.
3.  **Dynamic Query Builder**: A modular form approach was utilized so the user can compose infinite numbers of filters, groupings, and aggregations dynamically. The state maps to the schema required by the backend API (`POST /query`).
4.  **Graceful Error Handling**: Using Axios interceptors (`src/services/api.js`), API errors are formatted and returned cleanly to the UI, triggering dismissible error banners in the main dashboard without breaking application flow.
5.  **Component Architecture**: The app primarily runs using a monolithic `App.jsx` structure combined with well-abstracted CSS and API services. This was to allow the prototype to be quickly shipped while leaving room to extract tabs into specific route components using `react-router` in future iterations.
6.  **Object Serialization in Tables**: By default, unstructured fields (like JSON objects parsed from CSV metadata columns) are detected using a `typeof value === 'object' && value !== null` check, safely converting them using `JSON.stringify` to prevent generic `[object Object]` rendering.

---

## 🧠 Assumptions Made

1.  **API Schema**: It is assumed that the backend expects `multipart/form-data` with a `file` field for ingestion, and a specific JSON schema for queries (`{ filters: [...], groupings: [...], aggregations: [...] }`).
2.  **Pagination Limit**: Due to browser memory limits with massive datasets, the frontend "Overview" table explicitly slices the first 10 rows for display (`currentDataset.records.slice(0, 10)`). A paginated backend API implementation is assumed to be required for viewing larger slices securely.
3.  **Environment**: It is assumed the user will run the system strictly using an ES Module compatible Node environment (Node ^20 or ^22).
4.  **Stateless Frontend Formats**: The frontend does not persist active queries or upload sessions entirely to localStorage. If a page refresh occurs, it fetches the current available datasets from the backend cleanly.
5.  **Port Mapping**: Vite configuration specifically binds to `port 3000` to prevent collisions with the backend, assuming standard `5000` or `8000` backend usage mapping.

---
