# CytoML Demo – Frontend

The CytoML Demo is a single-page React + Vite application that provides the interface for cytology image analysis. Users can upload microscopy images, view YOLO v26 detection results with annotated bounding boxes, browse a sample gallery, and learn about the project.

Live at: https://cytoml-demo.vercel.app | https://cytoml-demo.onrender.com

---

## Key Features

* **Image Upload & Analysis:** Sends images to the Django backend and renders the annotated result alongside detection metrics.
* **Detection Metrics Display:** Shows total cell count, inference time, and confidence statistics (avg, min, max) for each analysis.
* **Sample Gallery:** Displays pre-run analysis examples so users can explore the model's output without uploading their own images.
* **Responsive Design:** Built with Tailwind CSS for a clean experience across desktop and mobile.

---

## Technologies Used

* [React 19](https://react.dev/) - UI framework
* [Vite 8](https://vitejs.dev/) - build tool and dev server with HMR
* [Tailwind CSS 4](https://tailwindcss.com/) - utility-first styling
* [React Router v7](https://reactrouter.com/) - client-side routing
* [Axios](https://axios-http.com/) - HTTP client for API calls

---

## Installation and Setup

### 1. Prerequisites

* **Node.js 18 or higher:** [Download Node.js](https://nodejs.org/)
* A running backend instance — see the [root README](../README.md) for setup instructions.

### 2. Navigate to the Frontend Directory

```bash
cd frontend
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

```bash
cp .example.env .env
```

Open `.env` and set the backend URL:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Base URL of the Django backend | `http://localhost:8080` |

### 5. Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Project Structure

```
frontend/
├── public/                   # Static assets
└── src/
    ├── components/
    │   ├── Header.jsx         # Top navigation bar
    │   ├── Hero.jsx           # Landing hero section
    │   ├── UploadSection.jsx  # Image upload + detection results
    │   ├── GallerySection.jsx # Sample results gallery
    │   ├── AboutSection.jsx   # Project description
    │   └── Footer.jsx         # Page footer
    ├── services/
    │   └── api.js             # Axios API client
    ├── App.jsx                # Root component and layout
    └── main.jsx               # Application entry point
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR at `localhost:5173` |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Deployment

Build the production bundle with:

```bash
npm run build
```

The `dist/` folder can be deployed to any static host (Vercel, Render, Netlify, etc.). Before building, set the `VITE_API_URL` environment variable on your hosting platform to point to the production backend.
