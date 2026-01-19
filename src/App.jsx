import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import './App.css';

function App() {
  const cesiumContainer = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!cesiumContainer.current) return;

    // Set the Cesium Ion Access Token
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3NTYzYzg1NC02ZmEzLTQ0OGEtYWM4NC1mZTA1YjY0OTY0ZjciLCJpZCI6Mzc0NTg5LCJpYXQiOjE3Njg4MTYzNjV9.PwCPZBcrC_5YsAsem9-6ptRZiNfFig1d4q41MIRBoiw';

    const initializeViewer = async () => {
      try {
        // Create terrain provider
        const terrainProvider = await Cesium.createWorldTerrainAsync();

        // Check if component is still mounted
        if (viewerRef.current) return;

        // Initialize the Cesium Viewer
        const viewer = new Cesium.Viewer(cesiumContainer.current, {
          terrainProvider: terrainProvider,
          animation: false,
          timeline: false,
        });

        viewerRef.current = viewer;

        // GeoJSON Data
        const geoJsonData = {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "properties": {
                "ProducerName": "Nhà máy cao su VNPT Green",
                "Area": 2,
                "ProductionPlace": "3cae1517-42ad-44a4-a",
                "ProducerCountry": "VN"
              },
              "geometry": {
                "type": "Polygon",
                "coordinates": [[[106.69765401631595, 11.863362048467723], [106.69808149337769, 11.863410937575154], [106.69819951057433, 11.863700006548024], [106.69815391302109, 11.86403829232357], [106.69959258288145, 11.864231551419252], [106.69959258288145, 11.863337439853284], [106.69852908700705, 11.863193069270551], [106.6983564198017, 11.863050667302698], [106.69765636324881, 11.86301719954833]]]
              }
            },
            {
              "type": "Feature",
              "properties": {
                "ProducerName": "Nhà máy cao su VNPT Green",
                "Area": 3,
                "ProductionPlace": "cd44093d-b263-4679-a",
                "ProducerCountry": "VN"
              },
              "geometry": {
                "type": "Polygon",
                "coordinates": [[[106.69787362217903, 11.865051178455808], [106.69798728078604, 11.865578127123115], [106.69825550168753, 11.865629312618099], [106.69828299432993, 11.866034202669427], [106.69878724962473, 11.865994173047694], [106.69878724962473, 11.865994173047694], [106.69907592236996, 11.866158885060113], [106.69911917299034, 11.866521448003834], [106.69935319572687, 11.866543431442835], [106.69906452298163, 11.864904183876314], [106.6985532268882, 11.864902215198384], [106.6984486207366, 11.865060037501586]]]
              }
            }
          ]
        };

        // Load GeoJSON
        const dataSource = await Cesium.GeoJsonDataSource.load(geoJsonData, {
          clampToGround: true,
          stroke: Cesium.Color.BLACK,
          fill: Cesium.Color.fromCssColorString('#D4E157').withAlpha(0.6), // Light Green
          strokeWidth: 2
        });

        viewer.dataSources.add(dataSource);

        // Fly to the data
        viewer.zoomTo(dataSource);

      } catch (error) {
        console.error("Error initializing Cesium:", error);
      }
    };

    initializeViewer();

    // Cleanup on component unmount
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  const toggleSceneMode = () => {
    if (!viewerRef.current) return;

    const scene = viewerRef.current.scene;
    if (scene.mode === Cesium.SceneMode.SCENE3D) {
      scene.morphTo2D();
    } else {
      scene.morphTo3D();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={cesiumContainer} className="cesium-viewer" />
      <div className="control-panel">
        <button onClick={toggleSceneMode}>
          Toggle 2D/3D
        </button>
      </div>
    </div>
  );
}

export default App;
