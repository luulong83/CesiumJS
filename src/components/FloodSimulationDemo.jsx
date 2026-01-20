import { useState, useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { FLOOD_SIMULATION_DATA } from '../data/mockData';

/**
 * FloodSimulationDemo Component
 * 
 * Tính năng nâng cao cho mô phỏng ngập lụt:
 * - Hiển thị vùng ngập 3D với độ sâu
 * - Animation theo thời gian
 * - Đánh dấu độ sâu tại các điểm
 * - Thống kê thiệt hại
 */
function FloodSimulationDemo({ viewer }) {
    const [loaded, setLoaded] = useState(false);
    const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [waterLevel, setWaterLevel] = useState(FLOOD_SIMULATION_DATA.baseElevation);
    const animationRef = useRef(null);

    const floodData = FLOOD_SIMULATION_DATA;
    const baseElevation = floodData.baseElevation;

    // ============================================
    // Tính toán thống kê
    // ============================================
    const calculateStats = (level) => {
        const depth = Math.max(0, level - baseElevation);
        const areaHa = 0.8; // Ước tính diện tích vùng ngập
        const volumeM3 = depth * areaHa * 10000; // Volume = depth * area

        let riskLevel = 'AN TOÀN';
        let riskColor = '#4CAF50';
        if (depth > 1.5) {
            riskLevel = 'CỰC KỲ NGUY HIỂM';
            riskColor = '#F44336';
        } else if (depth > 1.0) {
            riskLevel = 'NGUY HIỂM';
            riskColor = '#FF9800';
        } else if (depth > 0.5) {
            riskLevel = 'CẢNH BÁO';
            riskColor = '#FFEB3B';
        } else if (depth > 0) {
            riskLevel = 'THEO DÕI';
            riskColor = '#2196F3';
        }

        return { depth, volumeM3, riskLevel, riskColor, areaHa };
    };

    // ============================================
    // Load vùng ngập ban đầu
    // ============================================
    const loadFloodArea = () => {
        if (!viewer) return;

        viewer.entities.removeAll();

        const coords = floodData.floodArea.coordinates[0];
        const flatCoords = coords.flatMap(c => [c[0], c[1]]);

        // 1. Vùng đất nền (màu nâu)
        viewer.entities.add({
            id: 'ground-area',
            polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
                material: Cesium.Color.SADDLEBROWN.withAlpha(0.6),
                height: 0,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                outline: true,
                outlineColor: Cesium.Color.BROWN,
                outlineWidth: 2
            }
        });

        // 2. Label vùng
        const centerLon = coords.reduce((s, c) => s + c[0], 0) / coords.length;
        const centerLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;

        viewer.entities.add({
            id: 'area-label',
            position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, baseElevation + 5),
            label: {
                text: `🌳 ${floodData.name}\n📍 Độ cao nền: ${baseElevation}m`,
                font: 'bold 14px sans-serif',
                fillColor: Cesium.Color.WHITE,
                backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
                showBackground: true,
                backgroundPadding: new Cesium.Cartesian2(10, 6),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });

        // 3. Khởi tạo mực nước
        updateWaterLevel(floodData.timeSeries[0].waterLevel);
        setLoaded(true);

        // Fly to area
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(105.7575, 10.0317, 500),
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-50),
                roll: 0
            },
            duration: 2
        });
    };

    // ============================================
    // Cập nhật mực nước 3D
    // ============================================
    const updateWaterLevel = (level) => {
        if (!viewer) return;

        setWaterLevel(level);

        const coords = floodData.floodArea.coordinates[0];
        const flatCoords = coords.flatMap(c => [c[0], c[1]]);
        const centerLon = coords.reduce((s, c) => s + c[0], 0) / coords.length;
        const centerLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;

        // Xóa entity nước cũ
        const oldWater = viewer.entities.getById('water-volume');
        if (oldWater) viewer.entities.remove(oldWater);

        const oldDepthLabel = viewer.entities.getById('depth-label');
        if (oldDepthLabel) viewer.entities.remove(oldDepthLabel);

        const depth = level - baseElevation;

        if (depth > 0) {
            // Vẽ nước 3D với extrudedHeight
            viewer.entities.add({
                id: 'water-volume',
                polygon: {
                    hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
                    height: baseElevation,
                    extrudedHeight: level,
                    material: Cesium.Color.fromCssColorString('#1E88E5').withAlpha(0.6),
                    outline: true,
                    outlineColor: Cesium.Color.CYAN,
                    outlineWidth: 2,
                    closeTop: true,
                    closeBottom: true
                }
            });

            // Label độ sâu
            const stats = calculateStats(level);
            viewer.entities.add({
                id: 'depth-label',
                position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, level + 3),
                label: {
                    text: `🌊 Mực nước: ${level.toFixed(2)}m\n📏 Độ sâu ngập: ${depth.toFixed(2)}m\n⚠️ ${stats.riskLevel}`,
                    font: 'bold 13px sans-serif',
                    fillColor: Cesium.Color.fromCssColorString(stats.riskColor),
                    backgroundColor: Cesium.Color.BLACK.withAlpha(0.8),
                    showBackground: true,
                    backgroundPadding: new Cesium.Cartesian2(10, 6),
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });

            // Thêm depth markers tại các góc
            addDepthMarkers(level);
        }
    };

    // ============================================
    // Markers độ sâu tại các góc
    // ============================================
    const addDepthMarkers = (level) => {
        // Xóa markers cũ
        for (let i = 0; i < 4; i++) {
            const old = viewer.entities.getById(`depth-marker-${i}`);
            if (old) viewer.entities.remove(old);
        }

        const coords = floodData.floodArea.coordinates[0];
        const depth = level - baseElevation;

        // Chỉ hiển thị 4 góc
        [0, 1, 2, 3].forEach(i => {
            const c = coords[i];
            viewer.entities.add({
                id: `depth-marker-${i}`,
                position: Cesium.Cartesian3.fromDegrees(c[0], c[1], level),
                point: {
                    pixelSize: 8,
                    color: Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.NONE
                },
                label: {
                    text: `${depth.toFixed(1)}m`,
                    font: '10px sans-serif',
                    fillColor: Cesium.Color.YELLOW,
                    pixelOffset: new Cesium.Cartesian2(15, 0),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
        });
    };

    // ============================================
    // Animation theo thời gian
    // ============================================
    const startAnimation = () => {
        if (isAnimating) {
            stopAnimation();
            return;
        }

        setIsAnimating(true);
        let idx = 0;

        animationRef.current = setInterval(() => {
            const ts = floodData.timeSeries[idx];
            setCurrentTimeIndex(idx);
            updateWaterLevel(ts.waterLevel);

            idx++;
            if (idx >= floodData.timeSeries.length) {
                idx = 0; // Loop
            }
        }, 2000);
    };

    const stopAnimation = () => {
        if (animationRef.current) {
            clearInterval(animationRef.current);
            animationRef.current = null;
        }
        setIsAnimating(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => stopAnimation();
    }, []);

    const stats = calculateStats(waterLevel);

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            backgroundColor: 'rgba(20, 40, 60, 0.95)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            maxWidth: '320px',
            fontFamily: 'sans-serif'
        }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#29B6F6' }}>
                🌊 Mô Phỏng Ngập Lụt 3D
            </h3>

            {/* Load Button */}
            <button
                onClick={loadFloodArea}
                style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: loaded ? '#4CAF50' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    marginBottom: '10px'
                }}
            >
                {loaded ? '✅ Đã tải vùng ngập' : '📥 Tải vùng ngập'}
            </button>

            {loaded && (
                <>
                    {/* Animation Control */}
                    <button
                        onClick={startAnimation}
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: isAnimating ? '#F44336' : '#FF9800',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            marginBottom: '10px'
                        }}
                    >
                        {isAnimating ? '⏹️ Dừng Animation' : '▶️ Chạy mô phỏng theo thời gian'}
                    </button>

                    {/* Time Series Display */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-around',
                        marginBottom: '10px',
                        padding: '8px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '6px'
                    }}>
                        {floodData.timeSeries.map((ts, i) => (
                            <div
                                key={i}
                                onClick={() => {
                                    setCurrentTimeIndex(i);
                                    updateWaterLevel(ts.waterLevel);
                                }}
                                style={{
                                    cursor: 'pointer',
                                    padding: '6px 10px',
                                    borderRadius: '4px',
                                    backgroundColor: i === currentTimeIndex ? '#2196F3' : 'transparent',
                                    textAlign: 'center',
                                    fontSize: '11px'
                                }}
                            >
                                <div>{ts.time.split('T')[1]}</div>
                                <div style={{ fontWeight: 'bold' }}>{ts.waterLevel}m</div>
                            </div>
                        ))}
                    </div>

                    {/* Water Level Slider */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '12px' }}>Điều chỉnh mực nước:</label>
                        <input
                            type="range"
                            min={baseElevation}
                            max="4"
                            step="0.05"
                            value={waterLevel}
                            onChange={(e) => updateWaterLevel(parseFloat(e.target.value))}
                            style={{ width: '100%', marginTop: '5px' }}
                        />
                    </div>

                    {/* Statistics Panel */}
                    <div style={{
                        padding: '12px',
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        fontSize: '12px'
                    }}>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            color: stats.riskColor
                        }}>
                            ⚠️ {stats.riskLevel}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                                <div style={{ color: '#aaa' }}>Mực nước</div>
                                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{waterLevel.toFixed(2)}m</div>
                            </div>
                            <div>
                                <div style={{ color: '#aaa' }}>Độ sâu ngập</div>
                                <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#29B6F6' }}>
                                    {stats.depth.toFixed(2)}m
                                </div>
                            </div>
                            <div>
                                <div style={{ color: '#aaa' }}>Diện tích</div>
                                <div style={{ fontWeight: 'bold' }}>{stats.areaHa} ha</div>
                            </div>
                            <div>
                                <div style={{ color: '#aaa' }}>Thể tích nước</div>
                                <div style={{ fontWeight: 'bold' }}>{stats.volumeM3.toFixed(0)} m³</div>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div style={{
                        marginTop: '10px',
                        padding: '8px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        fontSize: '10px'
                    }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📊 Mức độ cảnh báo:</div>
                        <div>🔴 Cực kỳ nguy hiểm: &gt;1.5m</div>
                        <div>🟠 Nguy hiểm: 1.0-1.5m</div>
                        <div>🟡 Cảnh báo: 0.5-1.0m</div>
                        <div>🔵 Theo dõi: 0-0.5m</div>
                    </div>
                </>
            )}
        </div>
    );
}

export default FloodSimulationDemo;
