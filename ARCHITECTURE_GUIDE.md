# Architecture Guide

## 1. Project Overview
This project is a **React 19** application built with **Vite**, integrating **CesiumJS** for 3D geospatial visualization.

### Tech Stack
-   **Core Framework**: React 19.2.0
-   **Build Tool**: Vite 7.2.4
-   **GIS Engine**: CesiumJS 1.137.0
-   **Asset Management**: `vite-plugin-cesium` (handles copying Cesium assets to public/dist)
-   **Language**: JavaScript (ES Modules)

## 2. Directory Structure
```
/
├── public/             # Static assets
├── src/
│   ├── assets/         # Project assets (images, icons)
│   ├── components/     # React components (Currently empty, intended for UI/Feature components)
│   ├── App.jsx         # Main application component & Layout
│   ├── main.jsx        # Entry point, React Root rendering
│   └── *.css           # Global and Component styles
├── vite.config.js      # Vite configuration (Cesium plugin setup)
└── package.json        # Dependencies and scripts
```

## 3. Architecture & Design Patterns

### 3.1. React-Cesium Integration Strategy
The project currently uses a **"Ref-based Imperative Integration"** pattern, which is the standard and recommended approach for complex Cesium apps in React (as opposed to using wrapper libraries like `resium` which can limit flexibility).

**Key Characteristics:**
-   **Viewer Lifecycle**: The Cesium `Viewer` is initialized inside a `useEffect` hook in `App.jsx`.
-   **DOM Access**: A `useRef` (`cesiumContainer`) is used to attach the Viewer to the DOM.
-   **Instance Management**: A `useRef` (`viewerRef`) stores the `Viewer` instance to persist it across renders without triggering re-renders of the React component.
-   **Cleanup**: The `useEffect` cleanup function ensures `viewer.destroy()` is called to prevent WebGL context leaks.

### 3.2. State Management
-   **Local State**: React `useState` (not currently used heavily in `App.jsx` but expected) for UI state (e.g., toggles, menus).
-   **Cesium State**: The Cesium `Viewer` and `Scene` maintain their own internal state (camera position, primitives, entities). We synchronize React state with Cesium state imperatively (e.g., `toggleSceneMode` function).

### 3.3. Data Flow
-   **Data Loading**: GeoJSON data is loaded asynchronously using `Cesium.GeoJsonDataSource.load`.
-   **Visualization**: Data sources are added to `viewer.dataSources` collection.
-   **Styling**: Cesium entities are styled programmatically (Color, Alpha, ClampToGround) during the loading phase.

## 4. Component Guidelines (Future)
As the application grows, follow these guidelines:

1.  **Cesium-Dependent Components**: Pass the `viewer` instance as a prop to child components that need to interact with the map (or use a React Context to provide the viewer).
    *   *Example*: `<TerrainTool viewer={viewerRef.current} />`
2.  **UI Overlays**: Build standard React UI components overlaying the map using absolute positioning (z-index > 0).
3.  **Encapsulation**: Wrap distinct Cesium functionalities (e.g., specialized layers, tools) into custom hooks (e.g., `useTerrainProfile(viewer)`).

## 5. Security & Configuration
-   **Cesium Ion Token**: Currently hardcoded in `App.jsx`. **Recommendation**: Move to `.env` file (`VITE_CESIUM_ION_TOKEN`) for security.
