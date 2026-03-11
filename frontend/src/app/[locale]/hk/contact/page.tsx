'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import HKLayout from '../../../../components/hk/HKLayout';
import { useToast } from '../../../../components/hk/common/Toast';
import HKBackButton from '../../../../components/hk/common/HKBackButton';

export default function ContactPage() {
  const locale = useLocale();
  const { showToast } = useToast();
  const [inquiryType, setInquiryType] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+82');
  const [phone, setPhone] = useState('');
  const [privacyAgree, setPrivacyAgree] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyAgree) {
      showToast('error', '개인정보 수집 및 이용에 동의해주세요.');
      return;
    }
    showToast('success', '문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.');
  };

  const inputClass = 'w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl text-base bg-white focus:outline-none focus:border-sky-500';
  const labelClass = 'text-base font-semibold text-slate-800 flex items-center gap-1';

  return (
    <HKLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-10 bg-white min-h-[calc(100vh-120px)]">
        <div className="flex items-center gap-4 mb-10 pb-5 border-b-2 border-slate-200">
          <HKBackButton />
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 m-0">문의하기</h1>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              문의유형
              <span className="text-red-500 text-lg">*</span>
            </label>
            <select
              name="inquiry_type"
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value)}
              required
              className={`${inputClass} cursor-pointer appearance-none bg-no-repeat bg-[length:16px] bg-[right_12px_center] pr-10`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              }}
            >
              <option value="">문의유형을 선택해주세요</option>
              <option value="general">일반 문의</option>
              <option value="technical">기술 문의</option>
              <option value="business">사업 문의</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              제목
              <span className="text-red-500 text-lg">*</span>
            </label>
            <input
              type="text"
              name="subject"
              placeholder="제목을 입력해 주세요"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              내용
              <span className="text-red-500 text-lg">*</span>
            </label>
            <textarea
              name="content"
              placeholder="내용을 입력해 주세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className={`${inputClass} min-h-[120px] resize-y`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>파일첨부</label>
            <div className="relative inline-block w-full">
              <input
                type="file"
                id="fileInput"
                name="attachment"
                onChange={handleFileChange}
                className="absolute -left-[9999px] opacity-0"
              />
              <label
                htmlFor="fileInput"
                className="block w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl bg-white text-center text-slate-500 cursor-pointer hover:border-sky-500 transition"
              >
                {selectedFile ? selectedFile.name : '파일을 선택해주세요'}
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              이메일
              <span className="text-red-500 text-lg">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="이메일 아이디를 입력해 주세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              휴대 전화번호
              <span className="text-red-500 text-lg">*</span>
            </label>
            <div className="flex gap-2.5 items-center">
              <select
                name="country_code"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className={`${inputClass} flex-[0_0_120px] cursor-pointer appearance-none bg-no-repeat bg-[length:16px] bg-[right_12px_center] pr-10`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                }}
              >
                <option value="+82">한국 (+82)</option>
                <option value="+1">미국 (+1)</option>
                <option value="+81">일본 (+81)</option>
                <option value="+86">중국 (+86)</option>
              </select>
              <input
                type="tel"
                name="phone"
                placeholder="대시(-)를 제외한 숫자만 입력해주세요"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className={`${inputClass} flex-1`}
              />
            </div>
          </div>

          <div className="flex items-start gap-2.5 mt-5">
            <input
              type="checkbox"
              id="privacyAgree"
              name="privacy_agree"
              checked={privacyAgree}
              onChange={(e) => setPrivacyAgree(e.target.checked)}
              required
              className="mt-1 w-4 h-4 accent-sky-500"
            />
            <label htmlFor="privacyAgree" className="text-sm text-slate-800 leading-relaxed flex-1">
              개인정보 수집 및 이용안내{' '}
              <span
                className="text-sky-600 cursor-pointer hover:underline"
                onClick={() => setShowPrivacyModal(true)}
              >
                전문보기
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-sky-600 text-white border-0 rounded-xl text-lg font-semibold cursor-pointer hover:bg-sky-700 transition mt-5"
          >
            문의하기
          </button>
        </form>
      </div>

      {showPrivacyModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={() => setShowPrivacyModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-[500px] w-[90%] max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 m-0">개인정보 수집 및 이용안내</h3>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-slate-100 border-0 flex items-center justify-center text-lg text-slate-500 cursor-pointer hover:bg-slate-200"
                onClick={() => setShowPrivacyModal(false)}
              >
                ×
              </button>
            </div>

            <div className="text-sm text-slate-700 leading-relaxed space-y-4">
              <p>네이버 클라우드 플랫폼에서는 개인정보 보호법 제15조제1항제2호 (관련 법령 준수) 및 제15조제1항제4호(계약의 이행)에 따라, 다음과 같은 개인정보를 수집·이용합니다.</p>
              <h4 className="font-semibold text-slate-800">1. 개인정보 수집 및 이용목적:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>제품소개, 파트너쉽/컨설팅/영업 요청상담 등 고객문의 처리</li>
                <li>산업안전보건법 상 고객의 폭언 등으로 인한 건강장해 예방 조치 및 제재 처리</li>
              </ul>
              <h4 className="font-semibold text-slate-800">2. 수집하는 개인정보의 항목:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>(필수) 메일주소, 휴대폰번호</li>
              </ul>
              <h4 className="font-semibold text-slate-800">3. 개인정보의 보유 및 이용기간:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>관련 법령에 따라 3년 보관 후 파기</li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-4">
                자세한 사항은{' '}
                <Link href={`/${locale}/hk/privacy`} className="text-sky-600 hover:underline">
                  개인정보처리방침
                </Link>
                을 참고해주시기 바랍니다.
              </p>
              <button
                type="button"
                className="w-full py-2.5 bg-sky-600 text-white border-0 rounded-xl font-medium cursor-pointer hover:bg-sky-700"
                onClick={() => setShowPrivacyModal(false)}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </HKLayout>
  );
}
