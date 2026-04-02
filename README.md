# DataLogix - Mini Data Processing Platform (Frontend)

A professional, modular, and production-grade data processing platform interface that lets users locally upload, seamlessly transform, strictly filter, and paginatedly query dynamic datasets with ease.

## 🚀 Overview

The DataLogix frontend is a fast, responsive Single Page Application built utilizing React. It acts as the interactive interface for a scalable data ingestion and querying architecture.

---

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js**: v20 or later.
- **Backend API**: The backend should be running simultaneously with the Server-Side Pagination schema successfully integrated. (Default mapping assumes `http://localhost:5000/api`)

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
    The application will natively compile and intelligently hot-reload on `http://localhost:3000`.

4.  **Build for Production**:
    ```bash
    npm run build
    ```

---

## 🏗️ Approach and Design Decisions

1.  **Vite + React Ecosystem**: Vite was chosen as the build tool over standard frameworks to provide a dangerously fast development cycle and incredibly lightweight production builds.
2.  **Server-Side Pagination (SSR)**: The application maps directly to the API's pagination endpoints. Data views no longer manually `.slice` 10 elements in memory; they map dynamically to backend responses. Independent page-tracking variables (`queryPage` and `previewPage`) gracefully handle async page switching on massive datasets to dodge browser crashes.
3.  **Dynamic Live Filtering**: Constructed a pure recursive deep-search algorithm natively attached directly above the Preview dataset table. The filter intelligently stringifies massive deeply nested data trees and array outputs (from `.json` blobs) to guarantee perfect substring hits matching on arbitrary types natively on the frontend without blowing up DB transactions unnecessarily.
4.  **Bulletproof Flexbox Responsiveness**: Applied strict layout constraints using CSS (`min-width: 0` inside parent containers and advanced CSS modern breakage lines `word-break: break-all`) so that unbroken serialization strings or gigantic arbitrary IDs fetched from unstructured CSV/JSON uploads elegantly wrap within structured UI cards as opposed to randomly destroying lateral viewport boundaries!
5.  **Modal Interrupt Overlays**: Hard errors on inputs (e.g. invalid uploaded document extensions, missing filter selections) trigger massive darkened Modal overlays requesting the user interact manually with the disruption, completely replacing silent inline errors. 

---

## 🧠 Assumptions Made

1.  **API Schema for Pagination**: It is fundamentally assumed that your backend routes exactly execute utilizing `?page=1&limit=10&search=` payload parameters and subsequently fire back JSON containing the distinct `pagination: { totalRecords, totalPages }` key mappings.
2.  **Global Record Displays**: It is assumed that rendering the un-paginated DB scale inside UI Headers or the unconfigured Query Results tab is optimal to mirror dataset scopes safely without querying 5,000 blank rows into arbitrary memory states prior to user interaction.
3.  **Environment**: It is assumed the user will run the system strictly utilizing an ES Module compatible Node environment matching Node `^20` or higher to compile natively.
4.  **Stateless Frontend Formats**: The frontend purposefully drops complex search states and active query builders dynamically upon completely pivoting dataset targets inside the left hand Sidebar Navigation element.
5.  **Port Mapping**: Vite configuration specifically binds to `port 3000` to prevent network collisions violently intercepting standard `5000` or `8000` backend server deployment environments structurally assumed across similar Node pipelines.
