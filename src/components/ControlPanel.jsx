import React from 'react';

const ControlPanel = ({ onModeChange, activeMode }) => {
    const modes = [
        { id: 'polygon', label: '🌾 Vùng Trồng', icon: '🗺️' },
        { id: 'polyline', label: '📏 Tuyến Phân Tích', icon: '📈' },
        { id: 'production', label: '📊 Sản Xuất', icon: '🏭' },
        { id: 'calendar', label: '🕒 Mùa Vụ', icon: '📅' },
        { id: 'terrain', label: '⛰️ Demo Địa Hình', icon: '🌍' },
        { id: 'fire', label: '🔥 Cảnh Báo Cháy', icon: '🚨' },
        { id: 'flood', label: '🌊 Ngập Lụt 3D', icon: '💧' },
        { id: 'example', label: '📐 Ví Dụ Polygon', icon: '🗺️' },
    ];

    return (
        <div style={{
            position: 'absolute',
            left: '20px',
            top: '20px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        }}>
            {modes.map((mode) => (
                <button
                    key={mode.id}
                    onClick={() => onModeChange(mode.id)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 16px',
                        backgroundColor: activeMode === mode.id ? '#2196F3' : 'rgba(255, 255, 255, 0.95)',
                        color: activeMode === mode.id ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '500',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s ease',
                        textAlign: 'left',
                        minWidth: '200px',
                        // [NEW] Apply specific style for Vùng Trồng button content when active or always? 
                        // Making it distinct as requested
                        ...(mode.id === 'polygon' ? {
                            color: 'red',
                            fontWeight: 'bold',
                            textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff',
                            border: '1px solid red'
                        } : {})
                    }}
                >
                    <span>{mode.icon}</span>
                    {mode.label}
                </button>
            ))}
        </div>
    );
};

export default ControlPanel;
