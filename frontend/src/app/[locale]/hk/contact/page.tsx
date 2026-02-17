'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import HKLayout from '../../../../components/hk/HKLayout';
import { useToast } from '../../../../components/hk/common/Toast';
import HKBackButton from '../../../../components/hk/common/HKBackButton';
import '../../../../styles/hk/contact.css';

export default function ContactPage() {
  const router = useRouter();
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

  return (
    <HKLayout>
      <div className="hk-contact-container">
        <div className="hk-contact-header">
          <HKBackButton />
          <h1 className="hk-contact-title">문의하기</h1>
        </div>

        <form className="hk-contact-form" onSubmit={handleSubmit}>
          <div className="hk-contact-form-group">
            <label className="hk-contact-form-label">
              문의유형
              <span className="hk-contact-required">*</span>
            </label>
            <select 
              className="hk-contact-select" 
              name="inquiry_type" 
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value)}
              required
            >
              <option value="">문의유형을 선택해주세요</option>
              <option value="general">일반 문의</option>
              <option value="technical">기술 문의</option>
              <option value="business">사업 문의</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div className="hk-contact-form-group">
            <label className="hk-contact-form-label">
              제목
              <span className="hk-contact-required">*</span>
            </label>
            <input 
              type="text" 
              className="hk-contact-input" 
              name="subject" 
              placeholder="제목을 입력해 주세요" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required 
            />
          </div>

          <div className="hk-contact-form-group">
            <label className="hk-contact-form-label">
              내용
              <span className="hk-contact-required">*</span>
            </label>
            <textarea 
              className="hk-contact-textarea" 
              name="content" 
              placeholder="내용을 입력해 주세요" 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="hk-contact-form-group">
            <label className="hk-contact-form-label">
              파일첨부
            </label>
            <div className="hk-contact-file-input-wrapper">
              <input 
                type="file" 
                className="hk-contact-file-input" 
                id="fileInput" 
                name="attachment"
                onChange={handleFileChange}
              />
              <label htmlFor="fileInput" className="hk-contact-file-input-label">
                {selectedFile ? selectedFile.name : '파일을 선택해주세요'}
              </label>
            </div>
          </div>

          <div className="hk-contact-form-group">
            <label className="hk-contact-form-label">
              이메일
              <span className="hk-contact-required">*</span>
            </label>
            <input 
              type="email" 
              className="hk-contact-input" 
              name="email" 
              placeholder="이메일 아이디를 입력해 주세요" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="hk-contact-form-group">
            <label className="hk-contact-form-label">
              휴대 전화번호
              <span className="hk-contact-required">*</span>
            </label>
            <div className="hk-contact-phone-group">
              <select 
                className="hk-contact-select hk-contact-country-select" 
                name="country_code"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              >
                <option value="+82">한국 (+82)</option>
                <option value="+1">미국 (+1)</option>
                <option value="+81">일본 (+81)</option>
                <option value="+86">중국 (+86)</option>
              </select>
              <input 
                type="tel" 
                className="form-input phone-input" 
                name="phone" 
                placeholder="대시(-)를 제외한 숫자만 입력해주세요" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="hk-contact-privacy-section">
            <input 
              type="checkbox" 
              className="hk-contact-privacy-checkbox" 
              id="privacyAgree" 
              name="privacy_agree" 
              checked={privacyAgree}
              onChange={(e) => setPrivacyAgree(e.target.checked)}
              required 
            />
            <label htmlFor="privacyAgree" className="hk-contact-privacy-text">
              개인정보 수집 및 이용안내 
              <span className="hk-contact-privacy-link" onClick={() => setShowPrivacyModal(true)}>전문보기</span>
            </label>
          </div>

          <button type="submit" className="hk-contact-submit-button">문의하기</button>
        </form>
      </div>

      {showPrivacyModal && (
        <div className="hk-contact-privacy-modal-overlay" onClick={() => setShowPrivacyModal(false)}>
          <div className="hk-contact-privacy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hk-contact-modal-header">
              <h3 className="hk-contact-modal-title">개인정보 수집 및 이용안내</h3>
              <button className="hk-contact-modal-close" onClick={() => setShowPrivacyModal(false)}>×</button>
            </div>
            
            <div className="hk-contact-modal-content">
              <p>네이버 클라우드 플랫폼에서는 개인정보 보호법 제15조제1항제2호 (관련 법령 준수) 및 제15조제1항제4호(계약의 이행)에 따라, 다음과 같은 개인정보를 수집·이용합니다.</p>
              
              <h4>1. 개인정보 수집 및 이용목적:</h4>
              <ul>
                <li>제품소개, 파트너쉽/컨설팅/영업 요청상담 등 고객문의 처리</li>
                <li>산업안전보건법 상 고객의 폭언 등으로 인한 건강장해 예방 조치 및 제재 처리</li>
              </ul>
              
              <h4>2. 수집하는 개인정보의 항목:</h4>
              <ul>
                <li>(필수) 메일주소, 휴대폰번호</li>
              </ul>
              
              <h4>3. 개인정보의 보유 및 이용기간:</h4>
              <ul>
                <li>관련 법령에 따라 3년 보관 후 파기</li>
              </ul>
            </div>
            
            <div className="hk-contact-modal-footer">
              <p className="hk-contact-modal-footer-text">자세한 사항은 <Link href={`/${locale}/hk/privacy`} className="hk-contact-modal-footer-link">개인정보처리방침</Link>을 참고해주시기 바랍니다.</p>
              <button className="hk-contact-modal-confirm-btn" onClick={() => setShowPrivacyModal(false)}>확인</button>
            </div>
          </div>
        </div>
      )}
    </HKLayout>
  );
}

