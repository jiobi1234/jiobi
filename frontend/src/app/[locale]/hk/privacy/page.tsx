'use client';

import HKLayout from '../../../../components/hk/HKLayout';
import HKBackButton from '../../../../components/hk/common/HKBackButton';

export default function PrivacyPolicyPage() {
  return (
    <HKLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10 bg-white min-h-[calc(100vh-120px)]">
        <div className="flex items-center gap-4 mb-10 pb-5 border-b-2 border-slate-200">
          <HKBackButton />
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 m-0">개인정보처리방침</h1>
        </div>

        <div className="text-slate-800 leading-relaxed">
          <section className="mb-10">
            <h2 className="text-lg font-bold text-sky-600 mb-5 pb-2.5 border-b-2 border-sky-600">
              제1조 총칙 (Article 1 General Provisions)
            </h2>
            <div className="text-base leading-relaxed">
              <ul className="my-4 pl-5 list-disc space-y-2">
                <li>본 사이트는 『정보통신망이용촉진등에관한법률』 및 정보통신부가 제정한 『개인정보보호지침』을 준수합니다.</li>
                <li>개인정보보호방침을 통하여 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.</li>
                <li>개인정보보호방침은 정부의 법령 및 지침의 변경 또는 당사의 약관 및 내부 정책에 따라 변경될 수 있으며 이를 개정하는 경우 웹사이트 공지사항을 통하여 공지합니다.</li>
                <li>본 사이트는 개인정보보호방침을 홈페이지 첫 화면에 공개함으로써 이용자가 언제든지 열람할 수 있도록 하고 있습니다.</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-bold text-sky-600 mb-5 pb-2.5 border-b-2 border-sky-600">
              제2조 개인정보 수집에 대한 동의 (Article 2 Consent to Personal Information Collection)
            </h2>
            <div className="text-base leading-relaxed">
              <p>본 사이트는 이용자가 개인정보보호방침 또는 이용약관의 내용에 대해 「동의한다」 또는 「동의하지 않는다」 버튼을 클릭할 수 있는 절차를 마련하여, 「동의한다」 버튼을 클릭하면 개인정보 수집에 동의한 것으로 봅니다.</p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-bold text-sky-600 mb-5 pb-2.5 border-b-2 border-sky-600">
              제3조 개인정보의 수집 및 이용목적 (Article 3 Purpose of Personal Information Collection and Use)
            </h2>
            <div className="text-base leading-relaxed">
              <p>본 사이트는 다음과 같은 목적을 위하여 개인정보를 수집하고 있습니다.</p>
              <ul className="my-4 pl-5 list-disc space-y-2">
                <li>서비스제공을 위한 계약의 성립 : 본인식별 및 본인의사 확인 등</li>
                <li>서비스의 이행 : 상품배송 및 대금결제</li>
                <li>회원 관리 : 회원제 서비스 이용에 따른 본인확인, 개인 식별, 연령확인, 불만처리 등 민원처리</li>
                <li>기타 새로운 서비스, 신상품이나 이벤트 정보 안내</li>
              </ul>
              <div className="my-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <strong>단, 이용자의 기본적 인권 침해의 우려가 있는 민감한 개인정보(인종 및 민족, 사상 및 신조, 출신지 및 본적지, 정치적 성향 및 범죄기록, 건강상태 및 성생활 등)는 수집하지 않습니다.</strong>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-bold text-sky-600 mb-5 pb-2.5 border-b-2 border-sky-600">
              제4조 수집하는 개인정보 항목 (Article 4 Items of Personal Information Collected)
            </h2>
            <div className="text-base leading-relaxed">
              <p>본 사이트는 회원가입, 상담, 서비스 신청 등등을 위해 아래와 같은 개인정보를 수집하고 있습니다.</p>
              <ul className="my-4 pl-5 list-disc space-y-2">
                <li><strong>수집항목 :</strong> 이름, 생년월일, 로그인ID, 비밀번호, 휴대전화번호, 이메일, 접속 로그, 접속 IP 정보</li>
                <li><strong>개인정보 수집방법 :</strong> 홈페이지(회원가입)</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </HKLayout>
  );
}
