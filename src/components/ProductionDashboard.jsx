import React from 'react';

const ProductionDashboard = ({ data }) => {
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
            maxWidth: '300px'
        }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#1a4731' }}>📊 Production Dashboard</h3>

            {data.map((item, index) => (
                <div key={index} style={{
                    marginBottom: '15px',
                    borderBottom: index !== data.length - 1 ? '1px solid #eee' : 'none',
                    paddingBottom: '10px'
                }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#2d6a4f' }}>{item.Year} - {item.ProducerName}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <Statistic label="Năng suất" value={`${item.YieldTon} tons`} icon="🌾" />
                        <Statistic label="Nước tưới" value={`${item.WaterUsage} m³`} icon="💧" />
                    </div>
                </div>
            ))}
        </div>
    );
};

const Statistic = ({ label, value, icon }) => (
    <div style={{ fontSize: '0.9rem' }}>
        <div style={{ color: '#666', marginBottom: '2px' }}>{icon} {label}</div>
        <div style={{ fontWeight: 'bold', color: '#333' }}>{value}</div>
    </div>
);

export default ProductionDashboard;
