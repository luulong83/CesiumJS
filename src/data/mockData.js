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
