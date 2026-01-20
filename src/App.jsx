import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import './App.css';

import ControlPanel from './components/ControlPanel';
import ProductionDashboard from './components/ProductionDashboard';
import CropCalendar from './components/CropCalendar';
import TerrainDemo from './components/TerrainDemo';
import FireRiskDemo from './components/FireRiskDemo';
import PolygonLabelExample from './components/PolygonLabelExample';
import FloodSimulationDemo from './components/FloodSimulationDemo';

import {
  PLANTING_AREA_DATA,
  ANALYSIS_ROUTE_DATA,
  PRODUCTION_DATA,
  CROP_CALENDAR_DATA
} from './data/mockData';

function App() {
  const cesiumContainer = useRef(null);
  const viewerRef = useRef(null);
  const [activeMode, setActiveMode] = useState(null); // 'polygon', 'polyline', 'production', 'calendar'

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!cesiumContainer.current) return;

    // Set the Cesium Ion Access Token
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3NTYzYzg1NC02ZmEzLTQ0OGEtYWM4NC1mZTA1YjY0OTY0ZjciLCJpZCI6Mzc0NTg5LCJpYXQiOjE3Njg4MTYzNjV9.PwCPZBcrC_5YsAsem9-6ptRZiNfFig1d4q41MIRBoiw';

    const initializeViewer = async () => {
      try {
        const terrainProvider = await Cesium.createWorldTerrainAsync();

        if (viewerRef.current) return;

        const viewer = new Cesium.Viewer(cesiumContainer.current, {
          terrainProvider: terrainProvider,
          animation: false,
          timeline: false,
          baseLayerPicker: true,
          infoBox: false, // HELPFUL: Disable default InfoBox popup
          selectionIndicator: false, // HELPFUL: Disable green selection box
        });

        viewerRef.current = viewer;

        // Enable terrain lighting for realistic shadows
        viewer.scene.globe.enableLighting = true;

        // Slight vertical exaggeration to make terrain more visible
        viewer.scene.verticalExaggeration = 1.5;

        // Enable depth test so entities sit properly on terrain
        viewer.scene.globe.depthTestAgainstTerrain = true;

        // Fly to initial location (Vietnam)
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(106.699, 11.864, 2000),
          orientation: {
            heading: Cesium.Math.toRadians(0.0),
            pitch: Cesium.Math.toRadians(-45.0),
          }
        });

      } catch (error) {
        console.error("Error initializing Cesium:", error);
      }
    };

    initializeViewer();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Handle Mode Switching and Data Visualization
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const updateVisualization = async () => {
      // Clear previous data sources/entities
      viewer.dataSources.removeAll();
      viewer.entities.removeAll();

      try {
        if (activeMode === 'polygon') {
          const dataSource = await Cesium.GeoJsonDataSource.load(PLANTING_AREA_DATA, {
            clampToGround: true,
            stroke: Cesium.Color.BLACK,
            fill: Cesium.Color.fromCssColorString('#4CAF50').withAlpha(0.6),
            strokeWidth: 2
          });

          // Add labels to polygons
          const entities = dataSource.entities.values;
          for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.polygon) {
              // Get properties
              const props = entity.properties;
              const producerName = props.ProducerName?.getValue();
              const area = props.Area?.getValue() || props.AreaHa?.getValue();
              const cropType = props.CropType?.getValue();

              // Format label text - Include Area to distinguish zones
              let labelText = `${producerName || 'N/A'}\n(Lô: ${area} ha)`;

              // Calculate polygon center for label position
              const positions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions;
              let centerX = 0, centerY = 0, centerZ = 0;
              for (let j = 0; j < positions.length; j++) {
                centerX += positions[j].x;
                centerY += positions[j].y;
                centerZ += positions[j].z;
              }
              const centerPosition = new Cesium.Cartesian3(
                centerX / positions.length,
                centerY / positions.length,
                centerZ / positions.length
              );

              // Set position for label
              entity.position = centerPosition;

              entity.label = new Cesium.LabelGraphics({
                text: labelText,
                font: 'bold 20px sans-serif', // Bolder and larger
                fillColor: Cesium.Color.RED,   // Red Interior
                outlineColor: Cesium.Color.WHITE, // White Outline
                outlineWidth: 4,               // Thick outline
                showBackground: false,         // Remove background box as per image
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -10),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 50000.0),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              });
            }
          }

          viewer.dataSources.add(dataSource);
          viewer.zoomTo(dataSource);
        }
        else if (activeMode === 'polyline') {
          const dataSource = await Cesium.GeoJsonDataSource.load(ANALYSIS_ROUTE_DATA, {
            clampToGround: true,
          });
          // Customize styling for polylines manually if GeoJsonDataSource simple styling isn't enough
          // But simple styling is often easier:
          const entities = dataSource.entities.values;
          for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.polyline) {
              entity.polyline.material = new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.ORANGE,
                dashLength: 16.0
              });
              entity.polyline.width = 4;
              entity.polyline.clampToGround = true;

              // Add Label
              const name = entity.properties.Name?.getValue();
              if (name) {
                entity.label = new Cesium.LabelGraphics({
                  text: name,
                  font: '14px sans-serif',
                  fillColor: Cesium.Color.YELLOW,
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 2,
                  showBackground: true,
                  backgroundColor: new Cesium.Color(0.1, 0.1, 0.1, 0.7),
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                  pixelOffset: new Cesium.Cartesian2(0, -10),
                  heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY
                });
              }
            }
          }
          viewer.dataSources.add(dataSource);
          viewer.zoomTo(dataSource);
        }
        else if (activeMode === 'production') {
          // Load Polygon to attach label to
          const dataSource = await Cesium.GeoJsonDataSource.load(PLANTING_AREA_DATA, {
            clampToGround: true,
            stroke: Cesium.Color.BLACK,
            fill: Cesium.Color.fromCssColorString('#4CAF50').withAlpha(0.2), // Lighter fill to focus on text
            strokeWidth: 2
          });

          const entities = dataSource.entities.values;
          for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.polygon) {
              const producerName = entity.properties.ProducerName?.getValue();

              // Calculate polygon center for label position
              const positions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions;
              let centerX = 0, centerY = 0, centerZ = 0;
              for (let j = 0; j < positions.length; j++) {
                centerX += positions[j].x;
                centerY += positions[j].y;
                centerZ += positions[j].z;
              }
              entity.position = new Cesium.Cartesian3(
                centerX / positions.length,
                centerY / positions.length,
                centerZ / positions.length
              );

              // Create Production Table String
              let labelText = `📊 SẢN XUẤT: ${producerName}\n====================\n`;
              const stats = PRODUCTION_DATA.filter(p => p.ProducerName === producerName);

              if (stats.length > 0) {
                stats.forEach(s => {
                  labelText += `Năm ${s.Year}: ${s.YieldTon} tấn | ${s.WaterUsage} m³ nước\n`;
                });
              } else {
                labelText += "Không có dữ liệu sản xuất";
              }

              entity.label = new Cesium.LabelGraphics({
                text: labelText,
                font: '16px monospace', // Monospace for alignment
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 3,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.0, 0.0, 0.2, 0.8),
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -20),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              });
            }
          }
          viewer.dataSources.add(dataSource);
          viewer.zoomTo(dataSource);
        }
        else if (activeMode === 'calendar') {
          // Load Polygon to attach label to
          const dataSource = await Cesium.GeoJsonDataSource.load(PLANTING_AREA_DATA, {
            clampToGround: true,
            stroke: Cesium.Color.BLACK,
            fill: Cesium.Color.fromCssColorString('#FF9800').withAlpha(0.2),
            strokeWidth: 2
          });

          const entities = dataSource.entities.values;
          for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.polygon) {
              const producerName = entity.properties.ProducerName?.getValue();

              // Calculate polygon center for label position
              const positions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions;
              let centerX = 0, centerY = 0, centerZ = 0;
              for (let j = 0; j < positions.length; j++) {
                centerX += positions[j].x;
                centerY += positions[j].y;
                centerZ += positions[j].z;
              }
              entity.position = new Cesium.Cartesian3(
                centerX / positions.length,
                centerY / positions.length,
                centerZ / positions.length
              );

              // Create Calendar Table String
              let labelText = `🕒 MÙA VỤ: ${producerName}\n====================\n`;
              const calendarData = CROP_CALENDAR_DATA.ProducerName === producerName ? CROP_CALENDAR_DATA.CropCalendar : [];

              // In a real app we would search the array properly, here mock data is simple object
              // Assuming CROP_CALENDAR_DATA matches

              if (calendarData && calendarData.length > 0) {
                calendarData.forEach(stage => {
                  labelText += `• ${stage.Stage}: ${stage.Start} -> ${stage.End}\n`;
                });
              }

              entity.label = new Cesium.LabelGraphics({
                text: labelText,
                font: '16px monospace',
                fillColor: Cesium.Color.YELLOW,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 3,
                showBackground: true,
                backgroundColor: new Cesium.Color(0.2, 0.1, 0.0, 0.8),
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -20),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              });
            }
          }
          viewer.dataSources.add(dataSource);
          viewer.zoomTo(dataSource);
        }
        else {
          // Fallback
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(106.699, 11.864, 2000),
            duration: 1.5
          });
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    updateVisualization();

  }, [activeMode]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={cesiumContainer} className="cesium-viewer" />

      {/* Control Panel */}
      <ControlPanel onModeChange={setActiveMode} activeMode={activeMode} />

      {/* Overlays - Removed in favor of 3D Map Labels
      {activeMode === 'production' && <ProductionDashboard data={PRODUCTION_DATA} />}
      {activeMode === 'calendar' && <CropCalendar data={CROP_CALENDAR_DATA} />}
      */}

      {/* Terrain Demo Panel */}
      {activeMode === 'terrain' && <TerrainDemo viewer={viewerRef.current} />}

      {/* Fire Risk Demo Panel */}
      {activeMode === 'fire' && <FireRiskDemo viewer={viewerRef.current} />}

      {/* Polygon Label Example Panel */}
      {activeMode === 'example' && <PolygonLabelExample viewer={viewerRef.current} />}

      {/* Flood Simulation Demo Panel */}
      {activeMode === 'flood' && <FloodSimulationDemo viewer={viewerRef.current} />}

    </div>
  );
}

export default App;
