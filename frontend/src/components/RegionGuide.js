import React from 'react';
import './RegionGuide.css';

const RegionGuide = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="region-guide-overlay">
            <div className="region-guide-content">
                <h2>地区对应说明</h2>
                <div className="region-list">
                    <h3>欧洲 (Europe)</h3>
                    <p>法国、德国、瑞典、丹麦、波兰、西班牙、意大利、芬兰、挪威、拉脱维亚、爱沙尼亚、波黑、黑山、塞尔维亚、保加利亚、捷克、瑞士、荷兰、斯洛伐克、立陶宛、罗马尼亚、英国、乌克兰、比利时、匈牙利、葡萄牙、科索沃</p>
                    
                    <h3>亚洲 (Asia)</h3>
                    <p>中国、蒙古、印度尼西亚、马来西亚、土耳其、印度、以色列、约旦、乌兹别克斯坦</p>
                    
                    <h3>大洋洲 (Oceania)</h3>
                    <p>澳大利亚、新西兰</p>
                    
                    <h3>北美洲 (North America)</h3>
                    <p>美国、加拿大</p>
                    
                    <h3>南美洲 (South America)</h3>
                    <p>巴西、乌拉圭、阿根廷、智利、危地马拉</p>

                    <h3>非洲 (Africa)</h3>
                    <p>南非</p>

                    <h3>独联体 (CIS)</h3>
                    <p>俄罗斯、哈萨克斯坦、白俄罗斯</p>
                </div>
                <button className="close-button" onClick={onClose}>关闭</button>
            </div>
        </div>
    );
};

export default RegionGuide;
