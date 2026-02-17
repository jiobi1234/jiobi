'use client';

import { useRouter } from 'next/navigation';
import HKLayout from '../../../../../components/hk/HKLayout';
import HKBackButton from '../../../../../components/hk/common/HKBackButton';
import '../../../../../styles/hk/payment-guide.css';

export default function PaymentGuidePage() {
  const router = useRouter();

  return (
    <HKLayout>
      <div className="hk-payment-guide-container">
        <div className="hk-payment-guide-header">
          <HKBackButton />
          <h1 className="hk-payment-guide-title">한국 결제 문화 설명</h1>
        </div>

        <div className="hk-payment-guide-content">
          <div className="hk-payment-guide-section">
            <h2 className="hk-payment-guide-section-title">
              <span className="hk-payment-guide-section-number">1</span>
              카드 사용이 가장 편리해요
            </h2>
            <div className="hk-payment-guide-section-content">
              <p>한국은 신용카드와 체크카드 사용이 보편화되어 있어, 현금을 거의 사용하지 않는 나라 중 하나입니다. 대형 쇼핑몰이나 백화점은 물론, 작은 식당이나 동네 슈퍼, 심지어 노점상에서도 대부분 카드 결제가 가능해요.</p>
              
              <div className="hk-payment-guide-highlight-text">
                <strong>현금을 많이 들고 다닐 필요는 없지만, 혹시 모를 상황을 위해 소액의 현금(1~2만원) 정도를 소지하면 좋아요.</strong>
              </div>
            </div>
          </div>

          <div className="hk-payment-guide-section">
            <h2 className="hk-payment-guide-section-title">
              <span className="hk-payment-guide-section-number">2</span>
              모바일 결제 서비스
            </h2>
            <div className="hk-payment-guide-section-content">
              <p>한국에서는 스마트폰을 이용한 간편 결제가 매우 활성화되어 있습니다.</p>
              
              <div className="hk-payment-guide-service-box">
                <h4>주요 모바일 결제 서비스</h4>
                <p><span className="hk-payment-guide-service-name">삼성페이(Samsung Pay)</span>나 <span className="hk-payment-guide-service-name">애플페이(Apple Pay)</span> 같은 서비스를 이용하면 실물 카드 없이 휴대폰으로 편리하게 결제할 수 있어요.</p>
              </div>
              
              <div className="hk-payment-guide-tip-box">
                <h4>사용 팁</h4>
                <p>대부분의 상점에서 모바일 결제를 지원하지만, 일부 오래된 가게는 지원하지 않을 수도 있습니다.</p>
              </div>
            </div>
          </div>

          <div className="hk-payment-guide-section">
            <h2 className="hk-payment-guide-section-title">
              <span className="hk-payment-guide-section-number">3</span>
              영수증과 서명
            </h2>
            <div className="hk-payment-guide-section-content">
              <p>카드로 결제하면 대부분 종이 영수증이 발행됩니다.</p>
              
              <div className="hk-payment-guide-warning-box">
                <h4>서명이 필요한 경우</h4>
                <p>결제 금액이 <span className="hk-payment-guide-bold-text">5만 원(약 40달러)</span> 이상일 경우, 영수증에 서명을 해야 하는 경우가 많아요.</p>
              </div>
              
              <div className="hk-payment-guide-highlight-text">
                <strong>결제 후에는 영수증을 꼭 확인해서 결제 금액이 맞는지 확인하세요.</strong>
              </div>
            </div>
          </div>

          <div className="hk-payment-guide-section">
            <h2 className="hk-payment-guide-section-title">
              <span className="hk-payment-guide-section-number">4</span>
              팁 문화는 없어요
            </h2>
            <div className="hk-payment-guide-section-content">
              <div className="hk-payment-guide-info-box">
                <h4>팁 문화 없음</h4>
                <p>한국에는 <span className="hk-payment-guide-bold-text">팁(Tip)</span>을 주는 문화가 없습니다. 식당, 카페, 택시, 미용실 등 어떤 곳에서도 서비스에 대한 추가 비용을 지불할 필요가 없어요.</p>
              </div>
              
              <div className="hk-payment-guide-highlight-text">
                <strong>계산서에 나온 금액만 정확하게 내면 됩니다.</strong>
              </div>
            </div>
          </div>

          <div className="hk-payment-guide-section">
            <h2 className="hk-payment-guide-section-title">
              <span className="hk-payment-guide-section-number">5</span>
              무인 결제기 (키오스크)
            </h2>
            <div className="hk-payment-guide-section-content">
              <p>최근 많은 식당, 카페, 영화관 등에서 <span className="hk-payment-guide-service-name">키오스크(Kiosk)</span>라고 불리는 무인 결제기를 사용하고 있어요.</p>
              
              <div className="hk-payment-guide-service-box">
                <h4>키오스크 사용법</h4>
                <p>메뉴 선택부터 결제까지 직접 해야 하며, 대부분의 키오스크는 한국어 외에 영어, 중국어, 일본어 등을 지원합니다.</p>
              </div>
              
              <div className="hk-payment-guide-tip-box">
                <h4>도움이 필요할 때</h4>
                <p>만약 키오스크 사용이 어렵다면, 당황하지 말고 직원에게 도움을 요청하세요.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HKLayout>
  );
}

