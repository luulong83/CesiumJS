import { useState } from 'react';
import * as Cesium from 'cesium';

/**
 * PolygonLabelExample Component
 * 
 * Ví dụ đơn giản hiển thị Polygon với Labels từ GeoJSON data
 * - Load GeoJSON polygons
 * - Tính trung tâm polygon
 * - Hiển thị label với background
 */

// Dữ liệu GeoJSON mẫu
const GEOJSON_DATA = {
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
                "coordinates": [[
                    [106.69765401631595, 11.863362048467723],
                    [106.69808149337769, 11.863410937575154],
                    [106.69819951057433, 11.863700006548024],
                    [106.69815391302109, 11.86403829232357],
                    [106.69959258288145, 11.864231551419252],
                    [106.69959258288145, 11.863337439853284],
                    [106.69852908700705, 11.863193069270551],
                    [106.6983564198017, 11.863050667302698],
                    [106.69765636324881, 11.86301719954833]
                ]]
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
                "coordinates": [[
                    [106.69787362217903, 11.865051178455808],
                    [106.69798728078604, 11.865578127123115],
                    [106.69825550168753, 11.865629312618099],
                    [106.69828299432993, 11.866034202669427],
                    [106.69878724962473, 11.865994173047694],
                    [106.69878724962473, 11.865994173047694],
                    [106.69907592236996, 11.866158885060113],
                    [106.69911917299034, 11.866521448003834],
                    [106.69935319572687, 11.866543431442835],
                    [106.69906452298163, 11.864904183876314],
                    [106.6985532268882, 11.864902215198384],
                    [106.6984486207366, 11.865060037501586]
                ]]
            }
        }
    ]
};

// Màu sắc cho từng polygon
const POLYGON_COLORS = [
    Cesium.Color.fromCssColorString('#4CAF50').withAlpha(0.5), // Green
    Cesium.Color.fromCssColorString('#2196F3').withAlpha(0.5), // Blue
];

function PolygonLabelExample({ viewer }) {
    const [loaded, setLoaded] = useState(false);

    // ============================================
    // Tính trung tâm polygon
    // ============================================
    const calculatePolygonCenter = (coordinates) => {
        const coords = coordinates[0]; // First ring
        let sumLon = 0, sumLat = 0;
        coords.forEach(coord => {
            sumLon += coord[0];
            sumLat += coord[1];
        });
        return {
            lon: sumLon / coords.length,
            lat: sumLat / coords.length
        };
    };

    // ============================================
    // Load Polygons với Labels
    // ============================================
    const loadPolygonsWithLabels = () => {
        if (!viewer) return;

        // Clear entities
        viewer.entities.removeAll();

        GEOJSON_DATA.features.forEach((feature, index) => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates[0];
            const center = calculatePolygonCenter(feature.geometry.coordinates);

            // Flatten coordinates cho Cesium
            const flatCoords = coords.flatMap(c => [c[0], c[1]]);

            // 1. Thêm POLYGON
            viewer.entities.add({
                id: `polygon-${index}`,
                polygon: {
                    hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
                    material: POLYGON_COLORS[index % POLYGON_COLORS.length],
                    outline: true,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    height: 0,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
            });

            // 2. Thêm LABEL tại trung tâm
            viewer.entities.add({
                id: `label-${index}`,
                position: Cesium.Cartesian3.fromDegrees(center.lon, center.lat, 10),
                label: {
                    text: `${props.ProducerName}\n📏 ${props.Area} ha`,
                    font: 'bold 12px sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
                    showBackground: true,
                    backgroundPadding: new Cesium.Cartesian2(8, 4),
                    verticalOrigin: Cesium.VerticalOrigin.CENTER,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
            });
        });

        setLoaded(true);

        // Fly to area
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(106.698, 11.865, 800),
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-60),
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
            maxWidth: '300px',
            fontFamily: 'sans-serif'
        }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#4CAF50' }}>
                🗺️ Polygon + Label Example
            </h3>

            <button
                onClick={loadPolygonsWithLabels}
                style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: loaded ? '#4CAF50' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    marginBottom: '15px'
                }}
            >
                {loaded ? '✅ Đã tải polygons' : '📥 Tải GeoJSON Polygons'}
            </button>

            {loaded && (
                <div style={{
                    padding: '10px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    fontSize: '12px'
                }}>
                    <div style={{ marginBottom: '8px' }}>
                        <b>📊 Thống kê:</b>
                    </div>
                    {GEOJSON_DATA.features.map((f, i) => (
                        <div key={i} style={{
                            padding: '6px',
                            marginBottom: '4px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            borderLeft: `3px solid ${i === 0 ? '#4CAF50' : '#2196F3'}`
                        }}>
                            <div>{f.properties.ProducerName}</div>
                            <div style={{ fontSize: '10px', color: '#aaa' }}>
                                Diện tích: {f.properties.Area} ha
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{
                marginTop: '15px',
                fontSize: '10px',
                color: '#aaa',
                textAlign: 'center'
            }}>
                💡 Ví dụ hiển thị GeoJSON polygons với labels
            </div>
        </div>
    );
}

export default PolygonLabelExample;
