'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import '../../../../styles/util/myip.css';

declare global {
  interface Window {
    L: any;
  }
}

export default function MyIPPage() {
  const [ipAddress, setIpAddress] = useState('');
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    // Leaflet CSS와 JS 로드
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
    script.onload = () => {
      setMapInitialized(true);
    };
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  const findMyIP = async () => {
    try {
      // ipify를 사용하여 사용자의 IP 주소를 가져옴
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      const userIp = data.ip;
      setIpAddress(userIp);

      // ipinfo.io를 사용하여 위치 정보를 가져옴
      const geoResponse = await fetch(`https://ipinfo.io/${userIp}/geo`);
      const geoData = await geoResponse.json();
      
      if (geoData.loc && mapInitialized && window.L) {
        const loc = geoData.loc.split(',');
        const lat = parseFloat(loc[0]);
        const lon = parseFloat(loc[1]);
        
        // 기존 지도 제거
        const mapElement = document.getElementById('map');
        if (mapElement) {
          mapElement.innerHTML = '';
        }
        
        // Leaflet.js를 사용하여 지도에 위치를 표시
        const map = window.L.map('map').setView([lat, lon], 13);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        window.L.marker([lat, lon]).addTo(map)
          .bindPopup('여기가 당신의 위치입니다!')
          .openPopup();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('IP 주소를 가져오는 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="row">
          <div className="col text-center">
            <button 
              id="findMyIpBtn" 
              className="btn btn-primary btn-lg"
              onClick={findMyIP}
            >
              내 IP 주소 찾기
            </button>
            {ipAddress && (
              <div id="myIp" className="mt-3">
                내 IP 주소는: {ipAddress}
              </div>
            )}
          </div>
        </div>
        <div className="row mt-3">
          <div className="col">
            {/* 지도를 표시할 div */}
            <div id="map" style={{ width: '100%', height: '600px' }}></div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

