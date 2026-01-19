import React from 'react';

const CropCalendar = ({ data }) => {
    if (!data) return null;

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 100,
            minWidth: '280px'
        }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#2b2d42' }}>🕒 Crop Calendar</h3>
            <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#666' }}>{data.ProducerName}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.CropCalendar.map((stage, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        backgroundColor: '#f8f9fa',
                        padding: '10px',
                        borderRadius: '6px',
                        borderLeft: `4px solid ${getStageColor(stage.Stage)}`
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', color: '#333' }}>{stage.Stage}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                {formatDate(stage.Start)} - {formatDate(stage.End)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const getStageColor = (stage) => {
    switch (stage) {
        case 'Trồng': return '#4ecdc4';
        case 'Chăm sóc': return '#ffe66d';
        case 'Thu hoạch': return '#ff6b6b';
        default: return '#ccc';
    }
};

const formatDate = (dateString) => {
    // Simple format, assuming YYYY-MM-DD
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

export default CropCalendar;
