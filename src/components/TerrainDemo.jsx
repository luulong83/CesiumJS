import { useState } from 'react';
import * as Cesium from 'cesium';

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
    // 3. FLOOD SIMULATION (Mô phỏng ngập lụt)
    // ============================================
    const simulateFlood = (level) => {
        if (!viewer) return;

        setFloodLevel(level);

        // Remove existing flood entity
        const floodEntity = viewer.entities.getById('flood-water');
        if (floodEntity) {
            viewer.entities.remove(floodEntity);
        }

        if (level > 0) {
            // Add water polygon at flood level
            const center = viewer.camera.positionCartographic;
            const lon = Cesium.Math.toDegrees(center.longitude);
            const lat = Cesium.Math.toDegrees(center.latitude);

            // Create a large rectangle for water
            viewer.entities.add({
                id: 'flood-water',
                rectangle: {
                    coordinates: Cesium.Rectangle.fromDegrees(
                        lon - 0.05, lat - 0.05,
                        lon + 0.05, lat + 0.05
                    ),
                    height: level, // Water level in meters
                    material: Cesium.Color.BLUE.withAlpha(0.5),
                    outline: true,
                    outlineColor: Cesium.Color.BLUE
                }
            });
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
                    🌊 3. Mô Phỏng Ngập Lụt
                </h4>
                <div style={{ marginBottom: '8px' }}>
                    <input
                        type="range"
                        min="0"
                        max="50"
                        value={floodLevel}
                        onChange={(e) => simulateFlood(Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                    <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        Mực nước: {floodLevel}m
                    </div>
                </div>
                <button
                    onClick={() => simulateFlood(0)}
                    style={{
                        width: '100%',
                        padding: '6px',
                        backgroundColor: '#F44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    Xóa nước
                </button>
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
