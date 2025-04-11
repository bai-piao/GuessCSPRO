import React, { useEffect, useState } from 'react';
import './App.css';
import { API_BASE_URL } from './config';
import SinglePlayer from './components/SinglePlayer';
import MultiPlayer from './components/MultiPlayer';
import RegionGuide from './components/RegionGuide';

// 添加解密函数
const decryptData = async (encryptedData) => {
    const response = await fetch(`${API_BASE_URL}/api/decrypt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encryptedData }),
    });
    const data = await response.json();
    return data;
};

function App() {
    const [mode, setMode] = useState('menu');
    const [isRegionGuideOpen, setIsRegionGuideOpen] = useState(false);

    return (
        <div className="game-container">
            <div className="game-header">
                <h1 className="game-title">
                    弗一把
                    <span className="subtitle">Ultimate</span>
                </h1>
                {mode === 'menu' && (
                    <button 
                        className="guide-button"
                        onClick={() => setIsRegionGuideOpen(true)}
                    >
                        查看地区说明
                    </button>
                )}
            </div>
            
            {mode === 'menu' && (
                <div className="menu-container">
                    <div className="menu-buttons">
                        <button onClick={() => setMode('single')}>单人模式</button>
                        <button className="disabled" disabled title="正在开发中">
                            多人对战
                            <span className="dev-badge">开发中</span>
                        </button>
                    </div>
                    <footer className="game-footer">
                        <p>Made by Luminosity</p>
                        <p>Special Thanks: Ronnie Yang</p>
                    </footer>
                </div>
            )}
            
            {mode === 'single' && <SinglePlayer />}
            <RegionGuide 
                isOpen={isRegionGuideOpen}
                onClose={() => setIsRegionGuideOpen(false)}
            />
        </div>
    );
}

export default App;
