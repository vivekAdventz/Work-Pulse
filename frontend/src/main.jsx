import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { msalInstance } from './msalConfig';

msalInstance.initialize().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  );
});
