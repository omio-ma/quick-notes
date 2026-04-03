# 📑 Project Blueprint: QuickNotes PWA 2026

**Version:** 1.0.0  
**Stack:** React 19, TypeScript, Vite 8 (Rolldown), Dexie.js (IndexedDB)  
**Hosting:** GitHub Pages

---

## 1. Project Purpose

The goal is to build a high-performance, **Offline-First** note-taking application that feels and acts like a native mobile app.

- **Persistence:** Notes are saved to the device's internal storage via IndexedDB, surviving browser restarts and cache clears.
- **Data Efficiency:** Once installed, the app only uses mobile data to check for updates, running primarily "on-device."
- **Native Feel:** Uses a "Standalone" display mode to hide the browser address bar and navigation buttons.

---

## 2. Technical Architecture

### A. Data Layer (On-Device Storage)

We use **Dexie.js** as the abstraction layer for IndexedDB.

- **Database Name:** `QuickNotesDB`
- **Schema:** `{ notes: '++id, title, updatedAt' }`
- **Reactivity:** Use the `useLiveQuery` hook from Dexie so the UI updates automatically when the database changes.

### B. Bundler & Build Tool (Vite 8)

Using **Vite 8** with the **Rolldown** engine.

- **PWA Plugin:** `vite-plugin-pwa` to automate Service Worker generation.
- **Installation Note:** Use the `--legacy-peer-deps` flag to bypass temporary version conflicts between Vite 8 and the PWA plugin.

### C. UI Strategy (React 19)

- **State Management:** Local component state for form inputs; Dexie for global data storage.
- **View Management:** A simple state-based "Router" to toggle between the **Note List** and the **Note Editor**.

---

## 3. Step-by-Step Execution Plan

### Phase 1: Initialization & Dependencies

1.  Initialize the project:
    ```bash
    npm create vite@latest clientapp -- --template react-ts
    cd clientapp
    ```
2.  Install core packages:
    ```bash
    npm install dexie
    npm install -D vite-plugin-pwa --legacy-peer-deps
    ```

### Phase 2: Database Definition (`src/db.ts`)

1.  Define the `Note` interface with `id`, `title`, `content`, and `updatedAt`.
2.  Export the `db` instance to be used across components.

### Phase 3: UI Development

1.  **Main App (`App.tsx`):** Create a state variable `activeView` (`'list'` or `'edit'`).
2.  **Note List:** Fetch data using `useLiveQuery`. Add a "Floating Action Button" (FAB) at the bottom right to create a new note.
3.  **Note Editor:** A full-screen view with a "Back" button (to discard) and a "Save" button (to commit to IndexedDB).

### Phase 4: PWA Configuration (`vite.config.ts`)

1.  Add the `VitePWA` plugin.
2.  **Manifest Settings:**
    - `name`: "QuickNotes"
    - `display`: "standalone"
    - `theme_color`: Pick a brand color for the mobile status bar.
3.  **Assets:** Ensure two PNG icons (192px and 512px) are in the `/public` folder.

### Phase 5: Deployment to GitHub Pages

1.  Set `base: '/clientapp/'` in `vite.config.ts`.
2.  Create a GitHub Action in `.github/workflows/deploy.yml` to build the project and push the `dist` folder to the `gh-pages` branch.

---

## 4. Instructions for AI Agents (The "Prompt")

> "I am building a Note-taking PWA using **React 19**, **Vite 8**, and **Dexie.js**. Please follow the architecture in this plan. Use **TypeScript** strictly. When setting up the `vite-plugin-pwa`, ensure `registerType` is set to `'autoUpdate'`. For the UI, ensure we use mobile-friendly CSS (e.g., preventing text selection on buttons and using a fixed-position header). I will be deploying this to **GitHub Pages**, so ensure all paths are relative to the repository name."

---

## 5. File Structure Reference

```text
clientapp/
├── public/
│   ├── pwa-192.png
│   └── pwa-512.png
├── src/
│   ├── db.ts          <-- Database Configuration
│   ├── App.tsx         <-- View Routing Logic
│   ├── components/
│   │   ├── List.tsx    <-- Note List View
│   │   └── Editor.tsx  <-- Note Edit View
│   └── main.tsx
├── vite.config.ts      <-- PWA & Base Path Config
└── package.json
```
