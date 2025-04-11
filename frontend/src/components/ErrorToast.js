import React from 'react';
import './ErrorToast.css';

function ErrorToast({ message, visible, onClose }) {
    if (!visible) return null;

    return (
        <div className="error-toast">
            <span className="error-message">{message}</span>
            <button className="close-button" onClick={onClose}>×</button>
        </div>
    );
}

export default ErrorToast;
