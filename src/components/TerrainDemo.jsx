import { useState } from 'react';
import * as Cesium from 'cesium';
import { TERRAIN_PROFILE_DATA, FLOOD_SIMULATION_DATA, DRAINAGE_ANALYSIS_DATA } from '../data/mockData';

/**
 * TerrainDemo Component
 * Demonstrates Cesium World Terrain capabilities:
 * - Elevation sampling
 * - Terrain profile
 * - Flood simulation
 */
function TerrainDemo({ viewer }) {
    const [elevation, setElevation] = useState(null);
    const [profileData, setProfileData] = useState([]);
    const [floodLevel, setFloodLevel] = useState(0);
    const [isDrawingProfile, setIsDrawingProfile] = useState(false);
    const [profilePoints, setProfilePoints] = useState([]);
    const [presetProfileLoaded, setPresetProfileLoaded] = useState(false);

    // ============================================
    // LOAD PRESET PROFILE (Mặt cắt địa hình tuyến tưới)
    // ============================================
    const loadPresetProfile = () => {
        if (!viewer) return;

        // Clear previous entities
        viewer.entities.removeAll();

        const points = TERRAIN_PROFILE_DATA.points;
        const positions = [];

        // Add markers and build position array
        points.forEach((point, index) => {
            const position = Cesium.Cartesian3.fromDegrees(
                point.longitude,
                point.latitude,
                point.elevation
            );
            positions.push(position);

            // Add point marker with elevation label
            viewer.entities.add({
                position: position,
                point: {
                    pixelSize: 12,
                    color: index === 0 ? Cesium.Color.GREEN :
                        index === points.length - 1 ? Cesium.Color.RED :
                            Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.NONE
                },
                label: {
                    text: `📍 ${point.distance}m\n↑${point.elevation}m`,
                    font: 'bold 12px sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -15),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
        });

        // Draw 3D polyline connecting all points
        viewer.entities.add({
            polyline: {
                positions: positions,
                width: 6,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.3,
                    color: Cesium.Color.CYAN
                }),
                // Use actual elevations, not clamped
                clampToGround: false
            }
        });

        // Also draw a ground-clamped shadow line
        viewer.entities.add({
            polyline: {
                positions: Cesium.Cartesian3.fromDegreesArray(
                    points.flatMap(p => [p.longitude, p.latitude])
                ),
                width: 3,
                material: Cesium.Color.ORANGE.withAlpha(0.5),
                clampToGround: true
            }
        });

        // Set profile data for display
        setProfileData(points.map(p => ({
            distance: p.distance,
            elevation: p.elevation
        })));

        setPresetProfileLoaded(true);

        // Fly to profile location
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(108.4608, 11.9420, 1500),
            orientation: {
                heading: Cesium.Math.toRadians(45),
                pitch: Cesium.Math.toRadians(-35),
                roll: 0
            },
            duration: 2
        });
    };

    // ============================================
    // 1. ELEVATION SAMPLING (Lấy độ cao tại 1 điểm)
    // ============================================
    const sampleElevation = async () => {
        if (!viewer) {
            console.error('Viewer not available');
            return;
        }

        try {
            // Use camera's current cartographic position (more reliable)
            const cameraPosition = viewer.camera.positionCartographic;

            // Create a copy for sampling (don't modify original)
            const samplePosition = new Cesium.Cartographic(
                cameraPosition.longitude,
                cameraPosition.latitude
            );

            const positions = [samplePosition];

            console.log('Sampling at:',
                Cesium.Math.toDegrees(samplePosition.longitude).toFixed(4),
                Cesium.Math.toDegrees(samplePosition.latitude).toFixed(4)
            );

            const updatedPositions = await Cesium.sampleTerrainMostDetailed(
                viewer.terrainProvider,
                positions
            );

            const heightMeters = updatedPositions[0].height;
            const displayHeight = heightMeters !== undefined ? heightMeters.toFixed(2) : 'N/A';
            setElevation(displayHeight);

            console.log('Sampled elevation:', displayHeight, 'm');

            // Add a marker at sampled point
            const lon = Cesium.Math.toDegrees(samplePosition.longitude);
            const lat = Cesium.Math.toDegrees(samplePosition.latitude);

            viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(lon, lat, heightMeters || 0),
                point: {
                    pixelSize: 15,
                    color: Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                },
                label: {
                    text: `📍 ${displayHeight}m\n(${lat.toFixed(4)}, ${lon.toFixed(4)})`,
                    font: 'bold 14px sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
        } catch (error) {
            console.error('Error sampling terrain:', error);
            setElevation('Lỗi - ' + error.message);
        }
    };

    // ============================================
    // 2. TERRAIN PROFILE (Mặt cắt địa hình)
    // ============================================
    const startDrawProfile = () => {
        if (!viewer) return;

        setIsDrawingProfile(true);
        setProfilePoints([]);
        setProfileData([]);

        // Clear previous profile entities
        viewer.entities.removeAll();

        const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

        handler.setInputAction(async (click) => {
            const cartesian = viewer.camera.pickEllipsoid(click.position);
            if (cartesian) {
                const cartographic = Cesium.Cartographic.fromCartesian(cartesian);

                setProfilePoints(prev => {
                    const newPoints = [...prev, cartographic];

                    // Add point marker
                    viewer.entities.add({
                        position: cartesian,
                        point: {
                            pixelSize: 10,
                            color: Cesium.Color.RED,
                            outlineColor: Cesium.Color.WHITE,
                            outlineWidth: 2,
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                        }
                    });

                    // If we have 2 points, draw profile line and calculate elevations
                    if (newPoints.length >= 2) {
                        calculateProfile(newPoints, Cesium, handler);
                    }

                    return newPoints;
                });
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // Right click to cancel
        handler.setInputAction(() => {
            handler.destroy();
            setIsDrawingProfile(false);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    };

    const calculateProfile = async (points, Cesium, handler) => {
        handler.destroy();
        setIsDrawingProfile(false);

        // Interpolate points along the line
        const numSamples = 20;
        const samplePoints = [];

        const startLon = points[0].longitude;
        const startLat = points[0].latitude;
        const endLon = points[1].longitude;
        const endLat = points[1].latitude;

        for (let i = 0; i <= numSamples; i++) {
            const fraction = i / numSamples;
            samplePoints.push(new Cesium.Cartographic(
                startLon + (endLon - startLon) * fraction,
                startLat + (endLat - startLat) * fraction
            ));
        }

        try {
            const sampledPoints = await Cesium.sampleTerrainMostDetailed(
                viewer.terrainProvider,
                samplePoints
            );

            // Calculate distances and elevations
            const profileResults = [];
            let totalDistance = 0;

            for (let i = 0; i < sampledPoints.length; i++) {
                if (i > 0) {
                    const prevPos = Cesium.Cartesian3.fromRadians(
                        sampledPoints[i - 1].longitude,
                        sampledPoints[i - 1].latitude,
                        sampledPoints[i - 1].height
                    );
                    const currPos = Cesium.Cartesian3.fromRadians(
                        sampledPoints[i].longitude,
                        sampledPoints[i].latitude,
                        sampledPoints[i].height
                    );
                    totalDistance += Cesium.Cartesian3.distance(prevPos, currPos);
                }

                profileResults.push({
                    distance: Math.round(totalDistance),
                    elevation: Math.round(sampledPoints[i].height || 0)
                });
            }

            setProfileData(profileResults);

            // Draw polyline
            const linePositions = sampledPoints.map(p =>
                Cesium.Cartesian3.fromRadians(p.longitude, p.latitude, p.height)
            );

            viewer.entities.add({
                polyline: {
                    positions: linePositions,
                    width: 4,
                    material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.2,
                        color: Cesium.Color.CYAN
                    }),
                    clampToGround: true
                }
            });

        } catch (error) {
            console.error('Error calculating profile:', error);
        }
    };

    // ============================================
    // 3. FLOOD SIMULATION (Mô phỏng ngập lụt - Polygon)
    // ============================================
    const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
    const [floodLoaded, setFloodLoaded] = useState(false);

    const loadFloodSimulation = () => {
        if (!viewer) return;

        // Clear previous entities
        viewer.entities.removeAll();

        const floodData = FLOOD_SIMULATION_DATA;
        const coords = floodData.floodArea.coordinates[0];

        // Flatten coordinates for Cesium (lon, lat, lon, lat, ...)
        const flatCoords = coords.flatMap(c => [c[0], c[1]]);

        // Add flood polygon at base elevation (dry area)
        viewer.entities.add({
            id: 'flood-base-area',
            polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
                height: floodData.baseElevation,
                material: Cesium.Color.BROWN.withAlpha(0.3),
                outline: true,
                outlineColor: Cesium.Color.BROWN,
                outlineWidth: 2
            },
            label: {
                text: `🌳 ${floodData.name}\nĐộ cao nền: ${floodData.baseElevation}m`,
                font: 'bold 14px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -10),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            },
            position: Cesium.Cartesian3.fromDegrees(
                coords.reduce((sum, c) => sum + c[0], 0) / coords.length,
                coords.reduce((sum, c) => sum + c[1], 0) / coords.length,
                floodData.baseElevation
            )
        });

        // Initialize flood at first time step
        setFloodLevel(floodData.timeSeries[0].waterLevel);
        setCurrentTimeIndex(0);
        setFloodLoaded(true);
        updateFloodWater(floodData.timeSeries[0].waterLevel, floodData, flatCoords);

        // Fly to flood area
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(105.7575, 10.0317, 500),
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-45),
                roll: 0
            },
            duration: 2
        });
    };

    const updateFloodWater = (waterLevel, floodData, flatCoords) => {
        // Remove previous water entity
        const waterEntity = viewer.entities.getById('flood-water-polygon');
        if (waterEntity) {
            viewer.entities.remove(waterEntity);
        }

        // Add water polygon at current water level
        viewer.entities.add({
            id: 'flood-water-polygon',
            polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
                height: waterLevel,
                material: Cesium.Color.BLUE.withAlpha(0.6),
                outline: true,
                outlineColor: Cesium.Color.CYAN,
                outlineWidth: 2
            }
        });

        // Update flood level info entity
        const infoEntity = viewer.entities.getById('flood-info');
        if (infoEntity) {
            viewer.entities.remove(infoEntity);
        }

        const centerLon = floodData.floodArea.coordinates[0].reduce((sum, c) => sum + c[0], 0) / 5;
        const centerLat = floodData.floodArea.coordinates[0].reduce((sum, c) => sum + c[1], 0) / 5;

        viewer.entities.add({
            id: 'flood-info',
            position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, waterLevel + 2),
            label: {
                text: `🌊 Mực nước: ${waterLevel.toFixed(1)}m\n📏 Ngập: ${(waterLevel - floodData.baseElevation).toFixed(1)}m`,
                font: 'bold 16px sans-serif',
                fillColor: Cesium.Color.CYAN,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 3,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });
    };

    const animateFloodTimeSeries = () => {
        if (!floodLoaded) return;

        const floodData = FLOOD_SIMULATION_DATA;
        const flatCoords = floodData.floodArea.coordinates[0].flatMap(c => [c[0], c[1]]);

        let idx = 0;
        const interval = setInterval(() => {
            if (idx >= floodData.timeSeries.length) {
                idx = 0; // Loop animation
            }

            const currentData = floodData.timeSeries[idx];
            setFloodLevel(currentData.waterLevel);
            setCurrentTimeIndex(idx);
            updateFloodWater(currentData.waterLevel, floodData, flatCoords);

            idx++;
        }, 2000); // Change every 2 seconds

        // Store interval ID to allow stopping
        setTimeout(() => clearInterval(interval), floodData.timeSeries.length * 2000 + 1000);
    };

    // Legacy simple flood for slider
    const simulateFlood = (level) => {
        if (!viewer) return;
        setFloodLevel(level);

        if (floodLoaded) {
            const floodData = FLOOD_SIMULATION_DATA;
            const flatCoords = floodData.floodArea.coordinates[0].flatMap(c => [c[0], c[1]]);
            updateFloodWater(level, floodData, flatCoords);
        }
    };

    // ============================================
    // 4. FLY TO MOUNTAINOUS AREA (Demo terrain)
    // ============================================
    const flyToMountain = () => {
        if (!viewer) return;

        // Fly to Da Lat (mountainous area in Vietnam)
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(108.4583, 11.9404, 5000),
            orientation: {
                heading: Cesium.Math.toRadians(30),
                pitch: Cesium.Math.toRadians(-30),
                roll: 0
            },
            duration: 2
        });
    };

    // ============================================
    // 5. DRAINAGE ANALYSIS (Phân tích thoát nước)
    // ============================================
    const [drainageLoaded, setDrainageLoaded] = useState(false);

    const loadDrainageAnalysis = () => {
        if (!viewer) return;

        // Clear previous entities
        viewer.entities.removeAll();

        const data = DRAINAGE_ANALYSIS_DATA;

        // 1. Add LOWEST POINT marker (Red - Critical)
        viewer.entities.add({
            id: 'lowest-point',
            position: Cesium.Cartesian3.fromDegrees(
                data.lowestPoint.longitude,
                data.lowestPoint.latitude,
                data.lowestPoint.elevation + 5
            ),
            point: {
                pixelSize: 20,
                color: Cesium.Color.RED,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 3,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            },
            label: {
                text: `⬇️ ĐIỂM THẤP NHẤT\n📍 ${data.lowestPoint.elevation}m`,
                font: 'bold 14px sans-serif',
                fillColor: Cesium.Color.RED,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 3,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -25),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });

        // 2. Add WATER POOLING ZONES (Polygon with 3D extrusion - Red for high risk)
        data.waterPoolingZones.forEach((zone, i) => {
            const west = zone.start;
            const east = zone.end;
            const south = zone.latitude - 0.0005;
            const north = zone.latitude + 0.0005;

            viewer.entities.add({
                id: `pooling-zone-${i}`,
                name: `Vùng đọng nước ${zone.id} (Risk: ${data.riskLevel})`,
                polygon: {
                    hierarchy: Cesium.Cartesian3.fromDegreesArray([
                        west, south,
                        east, south,
                        east, north,
                        west, north
                    ]),
                    material: Cesium.Color.RED.withAlpha(0.4),
                    height: zone.avgElevation + 0.1,
                    extrudedHeight: zone.avgElevation + 0.5,  // 3D height
                    closeTop: true,
                    closeBottom: false,
                    outline: true,
                    outlineColor: Cesium.Color.RED,
                    outlineWidth: 3
                },
                description: `Độ cao trung bình: ${zone.avgElevation}m<br>Rủi ro: ${data.riskLevel}`
            });

            // Label for pooling zone
            viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(
                    (zone.start + zone.end) / 2,
                    zone.latitude,
                    zone.avgElevation + 3
                ),
                label: {
                    text: `💧 Vùng đọng nước\n⚠️ Nguy cơ ngập cao\n↑ ${zone.avgElevation}m`,
                    font: 'bold 12px sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.RED,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
        });

        // 3. Add FLOW DIRECTION ARROW (Orange polyline with arrow)
        const arrow = data.flowArrow;
        viewer.entities.add({
            id: 'flow-arrow',
            polyline: {
                positions: Cesium.Cartesian3.fromDegreesArray([
                    arrow.start.longitude, arrow.start.latitude,
                    arrow.end.longitude, arrow.end.latitude
                ]),
                width: 8,
                material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.ORANGE),
                clampToGround: true
            }
        });

        // Flow direction label
        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(
                (arrow.start.longitude + arrow.end.longitude) / 2,
                (arrow.start.latitude + arrow.end.latitude) / 2,
                10
            ),
            label: {
                text: `🧭 Hướng chảy: ${data.flowDirection}`,
                font: 'bold 14px sans-serif',
                fillColor: Cesium.Color.ORANGE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });

        // 4. Add RISK LEVEL badge
        const riskColor = data.riskLevel === 'High' ? Cesium.Color.RED :
            data.riskLevel === 'Medium' ? Cesium.Color.ORANGE :
                Cesium.Color.GREEN;
        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(data.lowestPoint.longitude + 0.002, data.lowestPoint.latitude, 20),
            label: {
                text: `⚠️ MỨC ĐỘ RỦI RO: ${data.riskLevel === 'High' ? 'CAO' : data.riskLevel === 'Medium' ? 'TRUNG BÌNH' : 'THẤP'}`,
                font: 'bold 16px sans-serif',
                fillColor: riskColor,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 3,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });

        setDrainageLoaded(true);

        // Fly to analysis area
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(106.6992, 11.8640, 300),
            orientation: {
                heading: Cesium.Math.toRadians(45),
                pitch: Cesium.Math.toRadians(-40),
                roll: 0
            },
            duration: 2
        });
    };

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            backgroundColor: 'rgba(30, 30, 50, 0.95)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            maxWidth: '320px',
            fontFamily: 'sans-serif'
        }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#4FC3F7' }}>
                ⛰️ Demo Địa Hình (Terrain)
            </h3>

            {/* Fly to Mountain Demo */}
            <div style={{ marginBottom: '15px' }}>
                <button
                    onClick={flyToMountain}
                    style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    🏔️ Bay đến Đà Lạt (Vùng núi)
                </button>
            </div>

            {/* Elevation Sampling */}
            <div style={{
                marginBottom: '15px',
                padding: '12px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px'
            }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                    📍 1. Lấy Độ Cao (Elevation)
                </h4>
                <button
                    onClick={sampleElevation}
                    style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginBottom: '8px'
                    }}
                >
                    Lấy độ cao tại trung tâm màn hình
                </button>
                {elevation && (
                    <div style={{
                        backgroundColor: '#1B5E20',
                        padding: '8px',
                        borderRadius: '4px',
                        textAlign: 'center',
                        fontWeight: 'bold'
                    }}>
                        Độ cao: {elevation} mét
                    </div>
                )}
            </div>

            {/* Terrain Profile */}
            <div style={{
                marginBottom: '15px',
                padding: '12px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px'
            }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                    📈 2. Mặt Cắt Địa Hình (Profile)
                </h4>
                <button
                    onClick={startDrawProfile}
                    disabled={isDrawingProfile}
                    style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: isDrawingProfile ? '#757575' : '#FF9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isDrawingProfile ? 'default' : 'pointer',
                        marginBottom: '8px'
                    }}
                >
                    {isDrawingProfile ? 'Click 2 điểm trên bản đồ...' : 'Vẽ đường để xem mặt cắt'}
                </button>

                {/* NEW: Load Preset Profile Button */}
                <button
                    onClick={loadPresetProfile}
                    style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: presetProfileLoaded ? '#4CAF50' : '#9C27B0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginBottom: '8px',
                        fontSize: '12px'
                    }}
                >
                    {presetProfileLoaded ? '✅ Đã tải: Tuyến tưới Tây Nguyên' : '📥 Tải mặt cắt: Tuyến tưới (5 điểm)'}
                </button>

                {profileData.length > 0 && (
                    <div style={{
                        backgroundColor: '#E65100',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                    }}>
                        <div style={{ marginBottom: '5px' }}>
                            📊 Kết quả ({profileData.length} điểm):
                        </div>
                        <div style={{
                            maxHeight: '80px',
                            overflowY: 'auto',
                            fontSize: '11px',
                            fontFamily: 'monospace'
                        }}>
                            {profileData.map((p, i) => (
                                <div key={i}>
                                    {p.distance}m → {p.elevation}m cao
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Flood Simulation */}
            <div style={{
                padding: '12px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px'
            }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                    🌊 3. Mô Phỏng Ngập Lụt (Polygon)
                </h4>

                {/* Load Flood Polygon Button */}
                <button
                    onClick={loadFloodSimulation}
                    style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: floodLoaded ? '#4CAF50' : '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginBottom: '8px',
                        fontWeight: 'bold'
                    }}
                >
                    {floodLoaded ? '✅ Đã tải vùng ngập' : '📥 Tải vùng ngập: Vườn ven sông'}
                </button>

                {/* Animate Time Series Button */}
                {floodLoaded && (
                    <button
                        onClick={animateFloodTimeSeries}
                        style={{
                            width: '100%',
                            padding: '8px',
                            backgroundColor: '#FF5722',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginBottom: '8px'
                        }}
                    >
                        ▶️ Chạy mô phỏng theo thời gian (3 bước)
                    </button>
                )}

                {/* Water Level Slider */}
                {floodLoaded && (
                    <div style={{ marginBottom: '8px' }}>
                        <input
                            type="range"
                            min="1.8"
                            max="4"
                            step="0.1"
                            value={floodLevel}
                            onChange={(e) => simulateFlood(Number(e.target.value))}
                            style={{ width: '100%' }}
                        />
                        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                            Mực nước: {floodLevel.toFixed(1)}m | Ngập: {(floodLevel - 1.8).toFixed(1)}m
                        </div>
                    </div>
                )}

                {/* Time Series Info */}
                {floodLoaded && (
                    <div style={{
                        backgroundColor: 'rgba(0,100,200,0.3)',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '11px'
                    }}>
                        <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>📅 Dữ liệu theo thời gian:</div>
                        {FLOOD_SIMULATION_DATA.timeSeries.map((ts, i) => (
                            <div key={i} style={{
                                opacity: currentTimeIndex === i ? 1 : 0.6,
                                fontWeight: currentTimeIndex === i ? 'bold' : 'normal'
                            }}>
                                {currentTimeIndex === i ? '▶ ' : '  '}
                                {ts.time.split('T')[1]} → {ts.waterLevel}m
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 4. Drainage Analysis Section */}
            <div style={{
                marginTop: '15px',
                padding: '12px',
                backgroundColor: 'rgba(255,100,100,0.2)',
                borderRadius: '8px'
            }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                    🔍 4. Phân Tích Thoát Nước
                </h4>
                <button
                    onClick={loadDrainageAnalysis}
                    style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: drainageLoaded ? '#4CAF50' : '#E91E63',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {drainageLoaded ? '✅ Đã phân tích' : '📊 Phân tích thoát nước'}
                </button>

                {drainageLoaded && (
                    <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderRadius: '4px',
                        fontSize: '11px'
                    }}>
                        <div>📍 <b>Điểm thấp nhất:</b> {DRAINAGE_ANALYSIS_DATA.lowestPoint.elevation}m</div>
                        <div>🧭 <b>Hướng chảy:</b> {DRAINAGE_ANALYSIS_DATA.flowDirection}</div>
                        <div style={{ color: '#FF5722' }}>⚠️ <b>Rủi ro:</b> {DRAINAGE_ANALYSIS_DATA.riskLevel === 'High' ? 'CAO' : DRAINAGE_ANALYSIS_DATA.riskLevel}</div>
                    </div>
                )}
            </div>

            <div style={{
                marginTop: '15px',
                fontSize: '11px',
                color: '#aaa',
                textAlign: 'center'
            }}>
                💡 Tip: Di chuyển đến vùng núi để thấy địa hình rõ hơn
            </div>
        </div>
    );
}

export default TerrainDemo;
