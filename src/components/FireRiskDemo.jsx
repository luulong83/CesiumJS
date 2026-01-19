import { useState } from 'react';
import * as Cesium from 'cesium';
import { FIRE_SENSOR_DATA } from '../data/mockData';

/**
 * FireRiskDemo Component
 * Demonstrates Forest Fire Early Warning System:
 * - IoT sensor visualization
 * - Fire Risk Index (FRI) calculation
 * - Color-coded alert markers
 * - Wind direction arrows
 */
function FireRiskDemo({ viewer }) {
    const [sensorsLoaded, setSensorsLoaded] = useState(false);
    const [sensorStats, setSensorStats] = useState([]);

    // ============================================
    // FIRE RISK INDEX (FRI) CALCULATION
    // ============================================
    const calculateFRI = (sensor) => {
        // Normalize each factor to [0, 1] range
        const tempScore = Math.min(sensor.temperature / 50, 1);      // Max 50°C
        const humidityScore = 1 - (sensor.humidity / 100);           // Low humidity = high risk
        const soilScore = 1 - (sensor.soilMoisture / 100);           // Low moisture = high risk
        const windScore = Math.min(sensor.windSpeed / 30, 1);        // Max 30 km/h
        const smokeScore = sensor.smoke;                              // Already 0-1
        const coScore = Math.min(sensor.co / 1, 1);                  // Max 1 ppm

        // Weighted average (total = 1.0)
        const fri = (
            tempScore * 0.25 +
            humidityScore * 0.20 +
            soilScore * 0.15 +
            windScore * 0.15 +
            smokeScore * 0.15 +
            coScore * 0.10
        );

        return Math.min(fri, 1);
    };

    // Get alert level from FRI
    const getAlertLevel = (fri) => {
        if (fri >= 0.8) return { level: 'EXTREME', color: Cesium.Color.RED, label: '🔴 CỰC KỲ NGUY HIỂM', action: 'SƠ TÁN' };
        if (fri >= 0.6) return { level: 'HIGH', color: Cesium.Color.ORANGE, label: '🟠 NGUY HIỂM CAO', action: 'CẢNH BÁO' };
        if (fri >= 0.3) return { level: 'MEDIUM', color: Cesium.Color.YELLOW, label: '🟡 TRUNG BÌNH', action: 'THEO DÕI' };
        return { level: 'LOW', color: Cesium.Color.GREEN, label: '🟢 THẤP', action: 'AN TOÀN' };
    };

    // ============================================
    // LOAD FIRE SENSORS
    // ============================================
    const loadFireSensors = () => {
        if (!viewer) return;

        // Clear previous entities
        viewer.entities.removeAll();

        const stats = [];

        FIRE_SENSOR_DATA.forEach((sensor, index) => {
            const fri = calculateFRI(sensor);
            const alert = getAlertLevel(fri);

            stats.push({
                ...sensor,
                fri: fri,
                alert: alert
            });

            // 1. Add SENSOR MARKER with color based on risk
            viewer.entities.add({
                id: `fire-sensor-${sensor.sensorId}`,
                name: sensor.name,
                position: Cesium.Cartesian3.fromDegrees(
                    sensor.longitude,
                    sensor.latitude,
                    50 // Height above ground
                ),
                point: {
                    pixelSize: 20,
                    color: alert.color,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 3,
                    heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
                },
                label: {
                    text: `${sensor.name}\n🔥 FRI: ${(fri * 100).toFixed(0)}%\n${alert.label}`,
                    font: 'bold 12px sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: alert.color,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -25),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    showBackground: true,
                    backgroundColor: Cesium.Color.BLACK.withAlpha(0.7)
                },
                description: `
                    <h3>${sensor.name}</h3>
                    <p><b>🌡️ Nhiệt độ:</b> ${sensor.temperature}°C</p>
                    <p><b>💧 Độ ẩm:</b> ${sensor.humidity}%</p>
                    <p><b>🌱 Độ ẩm đất:</b> ${sensor.soilMoisture}%</p>
                    <p><b>💨 Gió:</b> ${sensor.windSpeed} km/h</p>
                    <p><b>💨 Hướng:</b> ${sensor.windDirection}°</p>
                    <p><b>🔥 Khói:</b> ${sensor.smoke}</p>
                    <p><b>⚠️ CO:</b> ${sensor.co} ppm</p>
                    <hr>
                    <p style="color: ${alert.level === 'EXTREME' ? 'red' : alert.level === 'HIGH' ? 'orange' : 'green'}">
                        <b>FRI: ${(fri * 100).toFixed(1)}%</b> - ${alert.level}
                    </p>
                `
            });

            // 2. Add WIND DIRECTION ARROW
            const windLength = 0.005 + (sensor.windSpeed / 30) * 0.01; // Arrow length based on wind speed
            const windRadians = Cesium.Math.toRadians(sensor.windDirection);
            const endLon = sensor.longitude + Math.sin(windRadians) * windLength;
            const endLat = sensor.latitude + Math.cos(windRadians) * windLength;

            viewer.entities.add({
                id: `wind-arrow-${sensor.sensorId}`,
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                        sensor.longitude, sensor.latitude, 30,
                        endLon, endLat, 30
                    ]),
                    width: 6,
                    material: new Cesium.PolylineArrowMaterialProperty(
                        Cesium.Color.CYAN.withAlpha(0.8)
                    )
                }
            });

            // 3. Add RISK ZONE (circle) for HIGH/EXTREME sensors
            if (fri >= 0.6) {
                const radiusMeters = 500 + (fri * 500); // 500-1000m based on risk
                viewer.entities.add({
                    id: `risk-zone-${sensor.sensorId}`,
                    position: Cesium.Cartesian3.fromDegrees(sensor.longitude, sensor.latitude),
                    ellipse: {
                        semiMajorAxis: radiusMeters,
                        semiMinorAxis: radiusMeters,
                        material: alert.color.withAlpha(0.2),
                        outline: true,
                        outlineColor: alert.color,
                        outlineWidth: 2,
                        height: 5,
                        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
                    }
                });
            }
        });

        setSensorStats(stats);
        setSensorsLoaded(true);

        // Fly to sensor area (Đà Lạt)
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(108.45, 11.94, 15000),
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-45),
                roll: 0
            },
            duration: 2
        });
    };

    // Count sensors by alert level
    const countByLevel = (level) => sensorStats.filter(s => s.alert.level === level).length;

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
            maxWidth: '350px',
            fontFamily: 'sans-serif'
        }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#FF5722' }}>
                🔥 Cảnh Báo Cháy Rừng
            </h3>

            {/* Load Sensors Button */}
            <button
                onClick={loadFireSensors}
                style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: sensorsLoaded ? '#4CAF50' : '#FF5722',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    marginBottom: '15px'
                }}
            >
                {sensorsLoaded ? '✅ Đã tải 5 trạm quan trắc' : '📡 Tải dữ liệu cảm biến'}
            </button>

            {/* Sensor Statistics */}
            {sensorsLoaded && (
                <div>
                    {/* Alert Summary */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '8px',
                        marginBottom: '15px'
                    }}>
                        <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'rgba(244, 67, 54, 0.3)', borderRadius: '6px' }}>
                            <div style={{ fontSize: '20px' }}>{countByLevel('EXTREME')}</div>
                            <div style={{ fontSize: '10px' }}>CỰC CAO</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'rgba(255, 152, 0, 0.3)', borderRadius: '6px' }}>
                            <div style={{ fontSize: '20px' }}>{countByLevel('HIGH')}</div>
                            <div style={{ fontSize: '10px' }}>CAO</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'rgba(255, 235, 59, 0.3)', borderRadius: '6px' }}>
                            <div style={{ fontSize: '20px' }}>{countByLevel('MEDIUM')}</div>
                            <div style={{ fontSize: '10px' }}>TB</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'rgba(76, 175, 80, 0.3)', borderRadius: '6px' }}>
                            <div style={{ fontSize: '20px' }}>{countByLevel('LOW')}</div>
                            <div style={{ fontSize: '10px' }}>THẤP</div>
                        </div>
                    </div>

                    {/* Sensor List */}
                    <div style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        fontSize: '11px'
                    }}>
                        {sensorStats.map((sensor, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '8px',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                marginBottom: '4px',
                                borderLeft: `4px solid ${sensor.alert.level === 'EXTREME' ? '#F44336' :
                                    sensor.alert.level === 'HIGH' ? '#FF9800' :
                                        sensor.alert.level === 'MEDIUM' ? '#FFEB3B' : '#4CAF50'}`
                            }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{sensor.name}</div>
                                    <div>🌡️ {sensor.temperature}°C | 💧 {sensor.humidity}%</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        fontWeight: 'bold',
                                        color: sensor.alert.level === 'EXTREME' ? '#F44336' :
                                            sensor.alert.level === 'HIGH' ? '#FF9800' : '#4CAF50'
                                    }}>
                                        {(sensor.fri * 100).toFixed(0)}%
                                    </div>
                                    <div>{sensor.alert.level}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div style={{
                        marginTop: '15px',
                        padding: '10px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        fontSize: '10px'
                    }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>📊 Chú thích:</div>
                        <div>🔴 EXTREME (≥80%): Sơ tán ngay</div>
                        <div>🟠 HIGH (60-80%): Cảnh báo cao</div>
                        <div>🟡 MEDIUM (30-60%): Theo dõi</div>
                        <div>🟢 LOW (&lt;30%): An toàn</div>
                    </div>
                </div>
            )}

            <div style={{
                marginTop: '15px',
                fontSize: '10px',
                color: '#aaa',
                textAlign: 'center'
            }}>
                💡 FRI = f(Temp, Humidity, Soil, Wind, Smoke, CO)
            </div>
        </div>
    );
}

export default FireRiskDemo;
