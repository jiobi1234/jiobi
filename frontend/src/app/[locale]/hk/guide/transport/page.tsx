'use client';

import { useRouter } from 'next/navigation';
import HKLayout from '../../../../../components/hk/HKLayout';
import HKBackButton from '../../../../../components/hk/common/HKBackButton';
import '../../../../../styles/hk/transport-guide.css';

export default function TransportGuidePage() {
  const router = useRouter();

  return (
    <HKLayout>
      <div className="hk-transport-guide-container">
        <div className="hk-transport-guide-header">
          <HKBackButton />
          <h1 className="hk-transport-guide-title">한국 여행 필수 교통 및 결제 가이드</h1>
        </div>

        <div className="hk-transport-guide-content">
          <div className="hk-transport-guide-section">
            <h2 className="hk-transport-guide-section-title">
              <span className="hk-transport-guide-section-number">1</span>
              교통 카드: T-money (티머니)
            </h2>
            <div className="hk-transport-guide-section-content">
              <h4>구매 및 충전</h4>
              <p>T-money 카드를 지하철역이나 편의점에서 쉽게 구매할 수 있습니다. 충전은 편의점 직원에게 부탁하거나 지하철역 내 충전 기계를 이용하면 됩니다.</p>
              
              <h4>사용법</h4>
              <p>버스나 지하철을 탈 때 카드를 단말기에 대면 요금이 자동으로 계산됩니다.</p>
              
              <h4>환불</h4>
              <p>여행 후 남은 잔액은 편의점이나 지하철역에서 환불받을 수 있으며, 카드 보증금 500원도 지하철역에서 환불받을 수 있습니다.</p>
            </div>
          </div>

          <div className="hk-transport-guide-section">
            <h2 className="hk-transport-guide-section-title">
              <span className="hk-transport-guide-section-number">2</span>
              대중교통 이용 팁
            </h2>
            <div className="hk-transport-guide-section-content">
              <div className="hk-transport-guide-price-info">
                <h4>버스 요금</h4>
                <ul>
                  <li><strong>카드 사용 시:</strong> 1,500원 (성인 기준)</li>
                  <li><strong>현금 사용 시:</strong> 1,500원 (성인 기준)</li>
                </ul>
              </div>
              
              <div className="hk-transport-guide-warning-box">
                <h4>주의사항</h4>
                <p>현금 결제 시 거스름돈이 나오지 않으니, 정확한 금액을 준비해야 합니다.</p>
              </div>

              <div className="hk-transport-guide-price-info">
                <h4>지하철 요금</h4>
                <ul>
                  <li><strong>카드 사용 시:</strong> 기본 요금 1,400원 (성인 기준)</li>
                </ul>
              </div>
              
              <div className="hk-transport-guide-highlight-box">
                <h4>현금 결제 안내</h4>
                <p>현금으로 지하철을 이용하려면 역 내의 '일회용 교통카드' 자판기를 이용해야 합니다.</p>
              </div>
            </div>
          </div>

          <div className="hk-transport-guide-section">
            <h2 className="hk-transport-guide-section-title">
              <span className="hk-transport-guide-section-number">3</span>
              택시 이용 팁
            </h2>
            <div className="hk-transport-guide-section-content">
              <div className="hk-transport-guide-price-info">
                <h4>기본 요금</h4>
                <p>보통 4,800원부터 시작하며, 요금은 이동 거리에 따라 올라갑니다.</p>
              </div>
              
              <h4>택시 잡기</h4>
              <div className="hk-transport-guide-tip-box">
                <h4>앱으로 부르기 (추천)</h4>
                <p>'카카오 T'와 같은 앱을 통해 택시를 부르는 것이 가장 편리하고 정확합니다. 앱으로 목적지를 설정하면 예상 요금을 미리 확인할 수 있습니다.</p>
              </div>
              
              <div className="hk-transport-guide-highlight-box">
                <h4>길거리에서 잡기</h4>
                <p>길거리에서 빈 택시를 잡을 수도 있습니다. 택시 지붕에 '빈차' 표시등이 켜져 있는지 확인해야 합니다.</p>
              </div>
            </div>
          </div>

          <div className="hk-transport-guide-section">
            <h2 className="hk-transport-guide-section-title">
              <span className="hk-transport-guide-section-number">4</span>
              기타 결제 팁
            </h2>
            <div className="hk-transport-guide-section-content">
              <div className="hk-transport-guide-tip-box">
                <h4>카드 사용</h4>
                <p>한국은 신용카드 사용이 매우 일반적입니다. 작은 가게, 식당, 카페, 심지어 노점상에서도 카드를 받는 경우가 많습니다.</p>
              </div>
              
              <div className="hk-transport-guide-highlight-box">
                <h4>팁 문화</h4>
                <p>한국은 팁 문화가 없습니다. 식당이나 카페에서 팁을 따로 지불할 필요가 없습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HKLayout>
  );
}

