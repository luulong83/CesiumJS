export const PLANTING_AREA_DATA = { "type": "FeatureCollection", "features": [{ "type": "Feature", "properties": { "ProducerName": "Nhà máy cao su VNPT Green", "Area": 2, "ProductionPlace": "3cae1517-42ad-44a4-a", "ProducerCountry": "VN" }, "geometry": { "type": "Polygon", "coordinates": [[[106.69765401631595, 11.863362048467723], [106.69808149337769, 11.863410937575154], [106.69819951057433, 11.863700006548024], [106.69815391302109, 11.86403829232357], [106.69959258288145, 11.864231551419252], [106.69959258288145, 11.863337439853284], [106.69852908700705, 11.863193069270551], [106.6983564198017, 11.863050667302698], [106.69765636324881, 11.86301719954833]]] } }, { "type": "Feature", "properties": { "ProducerName": "Nhà máy cao su VNPT Green", "Area": 3, "ProductionPlace": "cd44093d-b263-4679-a", "ProducerCountry": "VN" }, "geometry": { "type": "Polygon", "coordinates": [[[106.69787362217903, 11.865051178455808], [106.69798728078604, 11.865578127123115], [106.69825550168753, 11.865629312618099], [106.69828299432993, 11.866034202669427], [106.69878724962473, 11.865994173047694], [106.69878724962473, 11.865994173047694], [106.69907592236996, 11.866158885060113], [106.69911917299034, 11.866521448003834], [106.69935319572687, 11.866543431442835], [106.69906452298163, 11.864904183876314], [106.6985532268882, 11.864902215198384], [106.6984486207366, 11.865060037501586]]] } }] };

export const ANALYSIS_ROUTE_DATA = {
    "type": "FeatureCollection", // Wrapped in FeatureCollection for easier Cesium loading
    "features": [
        {
            "type": "Feature",
            "properties": {
                "Name": "Tuyến phân tích thoát nước"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [106.69765, 11.86336],
                    [106.69820, 11.86370],
                    [106.69959, 11.86423]
                ]
            }
        }
    ]
};

export const PRODUCTION_DATA = [
    {
        "ProducerName": "Nhà máy cao su VNPT Green",
        "Year": 2023,
        "YieldTon": 120,
        "WaterUsage": 3500
    },
    {
        "ProducerName": "Nhà máy cao su VNPT Green",
        "Year": 2024,
        "YieldTon": 138,
        "WaterUsage": 3300
    }
];

export const CROP_CALENDAR_DATA = {
    "ProducerName": "Nhà máy cao su VNPT Green",
    "CropCalendar": [
        {
            "Stage": "Trồng",
            "Start": "2024-02-01",
            "End": "2024-02-20"
        },
        {
            "Stage": "Chăm sóc",
            "Start": "2024-03-01",
            "End": "2024-10-30"
        },
        {
            "Stage": "Thu hoạch",
            "Start": "2024-11-01",
            "End": "2024-12-15"
        }
    ]
};

// Terrain Profile Data - Mặt cắt địa hình tuyến tưới
export const TERRAIN_PROFILE_DATA = {
    "profileId": "PROFILE_002",
    "name": "Mặt cắt địa hình tuyến tưới",
    "location": "Tây Nguyên",
    "points": [
        {
            "distance": 0,
            "longitude": 108.4583,
            "latitude": 11.9404,
            "elevation": 412
        },
        {
            "distance": 100,
            "longitude": 108.4595,
            "latitude": 11.9412,
            "elevation": 425
        },
        {
            "distance": 200,
            "longitude": 108.4608,
            "latitude": 11.9420,
            "elevation": 430
        },
        {
            "distance": 300,
            "longitude": 108.4621,
            "latitude": 11.9428,
            "elevation": 418
        },
        {
            "distance": 400,
            "longitude": 108.4635,
            "latitude": 11.9436,
            "elevation": 405
        }
    ]
};

// Flood Simulation Data - Ngập vườn cây ăn trái ven sông
export const FLOOD_SIMULATION_DATA = {
    "floodId": "FLOOD_002",
    "name": "Ngập vườn cây ăn trái ven sông",
    "floodArea": {
        "type": "Polygon",
        "coordinates": [
            [
                [105.7561, 10.0325],
                [105.7584, 10.0329],
                [105.7590, 10.0311],
                [105.7568, 10.0305],
                [105.7561, 10.0325]
            ]
        ]
    },
    "baseElevation": 1.8,
    "timeSeries": [
        { "time": "2026-09-01T06:00", "waterLevel": 2.1 },
        { "time": "2026-09-01T12:00", "waterLevel": 2.7 },
        { "time": "2026-09-01T18:00", "waterLevel": 3.3 }
    ]
};

// Drainage Analysis Result - Kết quả phân tích thoát nước
export const DRAINAGE_ANALYSIS_DATA = {
    "analysisId": "ANALYSIS_001",
    "name": "Phân tích thoát nước vùng trồng",
    "lowestPoint": {
        "longitude": 106.6998,
        "latitude": 11.8640,
        "elevation": 1.92
    },
    "waterPoolingZones": [
        {
            "id": "POOL_001",
            "start": 106.6989,
            "end": 106.6994,
            "latitude": 11.8638,
            "avgElevation": 2.05
        }
    ],
    "flowDirection": "NorthWest → SouthEast",
    "flowArrow": {
        "start": { "longitude": 106.6975, "latitude": 11.8650 },
        "end": { "longitude": 106.7010, "latitude": 11.8625 }
    },
    "riskLevel": "High"
};

// Fire Sensor Data - Dữ liệu cảm biến cháy rừng
export const FIRE_SENSOR_DATA = [
    {
        sensorId: "FR_001",
        name: "Trạm Đà Lạt Bắc",
        longitude: 108.4520,
        latitude: 11.9450,
        temperature: 38.5,
        humidity: 25,
        soilMoisture: 15,
        windSpeed: 12,
        windDirection: 45,  // NE
        smoke: 0.8,
        co: 0.35,
        timestamp: "2026-01-19T14:30:00"
    },
    {
        sensorId: "FR_002",
        name: "Trạm Đà Lạt Nam",
        longitude: 108.4650,
        latitude: 11.9320,
        temperature: 35.2,
        humidity: 35,
        soilMoisture: 22,
        windSpeed: 8,
        windDirection: 90,  // E
        smoke: 0.3,
        co: 0.15,
        timestamp: "2026-01-19T14:30:00"
    },
    {
        sensorId: "FR_003",
        name: "Trạm Lạc Dương",
        longitude: 108.4200,
        latitude: 11.9600,
        temperature: 42.1,
        humidity: 18,
        soilMoisture: 10,
        windSpeed: 18,
        windDirection: 225, // SW
        smoke: 0.95,
        co: 0.6,
        timestamp: "2026-01-19T14:30:00"
    },
    {
        sensorId: "FR_004",
        name: "Trạm Đơn Dương",
        longitude: 108.5100,
        latitude: 11.8800,
        temperature: 32.0,
        humidity: 45,
        soilMoisture: 35,
        windSpeed: 5,
        windDirection: 180, // S
        smoke: 0.1,
        co: 0.05,
        timestamp: "2026-01-19T14:30:00"
    },
    {
        sensorId: "FR_005",
        name: "Trạm Đức Trọng",
        longitude: 108.3800,
        latitude: 11.9100,
        temperature: 36.8,
        humidity: 30,
        soilMoisture: 20,
        windSpeed: 10,
        windDirection: 315, // NW
        smoke: 0.5,
        co: 0.25,
        timestamp: "2026-01-19T14:30:00"
    }
];
