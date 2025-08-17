// pages/ResultPage.tsx
import React, { useMemo, useState, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { type AnalysisResult } from '../types';
import { BackIcon, SaveIcon, ShareIcon, ChevronRightIcon } from '../components/icons';

interface ResultPageProps {
  userImage: string;
  result: AnalysisResult;
  onViewRecommendations: () => void;
  onRestart: () => void;
}

// 안전한 컬러 검증
const getValidCssColor = (color?: string): string | null => {
  if (!color) return null;
  const c = color.trim();
  if (/^#([0-9a-fA-F]{3}){1,2}([0-9a-fA-F]{2})?$/.test(c)) return c;
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*(0|0?\.\d+|1))?\s*\)$/.test(c)) return c;
  return null;
};

const ResultPage: React.FC<ResultPageProps> = ({ userImage, result, onViewRecommendations, onRestart }) => {
  const [showSkinModal, setShowSkinModal] = useState(false);
  const [showMakeupModal, setShowMakeupModal] = useState(false);

  // 캡처할 메인 영역(헤더 제외)과 제외할 상세 카드 ref
  const captureRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const getPersonalColorParts = (color: string) => {
    const parts = color.split(' ');
    if (parts.length > 1) {
      return { main: parts.slice(0, -1).join(' '), sub: parts.slice(-1)[0] };
    }
    return { main: color, sub: '' };
  };

  const colorParts = useMemo(() => getPersonalColorParts(result.personalColor), [result.personalColor]);

  const aiColor = useMemo(() => {
    const c = result.colorHex || result.primaryColor;
    return getValidCssColor(c) || '#DB2777';
  }, [result.colorHex, result.primaryColor]);

  const gradientStyle = useMemo(() => {
    const base = aiColor || '#DB2777';
    return { backgroundImage: `linear-gradient(to right, ${base}, #f472b6, #93c5fd)` } as React.CSSProperties;
  }, [aiColor]);

  // 결과 화면(메인 영역)을 이미지로 캡처하되, 상세 분석 결과 카드는 제외
  const handleDownload = useCallback(async () => {
    try {
      const node = captureRef.current;
      if (!node) return;

      // 모달이 열려 있으면 닫고 캡처(원하면 유지 가능)
      const prevSkin = showSkinModal;
      const prevMakeup = showMakeupModal;
      if (prevSkin) setShowSkinModal(false);
      if (prevMakeup) setShowMakeupModal(false);

      // 상세 분석 카드 숨김
      const detailEl = detailRef.current;
      const prevVisibility = detailEl?.style.visibility;
      if (detailEl) detailEl.style.visibility = 'hidden';

      // 다음 프레임까지 대기하여 UI 업데이트 반영 후 캡처
      await new Promise(requestAnimationFrame);

      const canvas = await html2canvas(node, {
        backgroundColor: '#ffffff',
        scale: window.devicePixelRatio < 2 ? 2 : window.devicePixelRatio,
        useCORS: true,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: node.scrollHeight
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `skintok_result_${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();

      // 상세 분석 카드 복원
      if (detailEl) detailEl.style.visibility = prevVisibility || '';

      // 모달 상태 복원
      if (prevSkin) setShowSkinModal(true);
      if (prevMakeup) setShowMakeupModal(true);
    } catch {
      // 조용히 실패
    }
  }, [showSkinModal, showMakeupModal]);

  return (
    <div className="flex flex-col h-full bg-brand-background">
      <header className="flex justify-between items-center p-4 bg-white shadow-sm">
        <button onClick={onRestart}><BackIcon className="w-6 h-6 text-charcoal" /></button>
        <h1 className="text-xl font-bold text-charcoal">분석 결과</h1>
        <div className="flex space-x-4">
          <button onClick={handleDownload} aria-label="download"><SaveIcon className="w-6 h-6 text-charcoal" /></button>
          <button aria-label="share"><ShareIcon className="w-6 h-6 text-charcoal" /></button>
        </div>
      </header>

      {/* 캡처 대상: 메인 콘텐츠 전체(상세 카드 제외는 visibility로 처리) */}
      <main ref={captureRef} className="flex-grow p-6 overflow-y-auto bg-brand-background">
        <p className="text-2xl font-bold text-center mb-4">🎉 분석 완료! 당신의 뷰티 프로필</p>

        <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg mb-6 bg-black">
          <img src={userImage} alt="User result" className="w-full h-full object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
            <span className="text-2xl font-bold">⭐ 종합 점수: {result.score}/100</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-light-gray mb-6">
          <h3 className="text-lg font-bold text-brand-rose mb-2">🌸 당신의 퍼스널 컬러</h3>

          <div className="flex items-center gap-3 mb-2">
            <p className="text-3xl font-bold text-charcoal">
              {colorParts.main} <span className="text-dark-rose">{colorParts.sub}</span>
            </p>
            <span
              className="inline-block w-6 h-6 rounded-full border border-light-gray"
              style={{ backgroundColor: aiColor || undefined }}
              title={aiColor || undefined}
            />
          </div>

          <div className="my-4 h-10 rounded-lg" style={gradientStyle} />
          <p className="text-dark-gray text-sm whitespace-pre-line">
            {result.personalColorDescription}
          </p>
        </div>

        {/* 상세 분석 결과 카드 (캡처에서 제외: visibility로 숨김 처리) */}
        <div ref={detailRef} className="bg-white p-4 rounded-2xl shadow-lg border border-light-gray">
          <h3 className="text-lg font-bold text-charcoal mb-2">📊 상세 분석 결과</h3>
          <ul className="divide-y divide-light-gray">
            <li className="py-3 flex justify-between items-center">
              <span>피부톤 분석</span>
              <button
                onClick={() => setShowSkinModal(true)}
                className="text-dark-gray text-sm flex items-center"
              >
                자세히 보기 <ChevronRightIcon className="w-4 h-4" />
              </button>
            </li>

            <li className="py-3 flex justify-between items-center">
              <span>메이크업 상태</span>
              <button
                onClick={() => setShowMakeupModal(true)}
                className="text-dark-gray text-sm flex items-center"
              >
                자세히 보기 <ChevronRightIcon className="w-4 h-4" />
              </button>
            </li>

            {/* 맞춤 추천 숨김 (요청사항) */}
            {/* <li className="py-3 flex justify-between items-center">
              <span>맞춤 추천</span>
              <button
                onClick={onViewRecommendations}
                className="text-dark-gray text-sm flex items-center font-bold text-brand-rose"
              >
                자세히 보기 <ChevronRightIcon className="w-4 h-4" />
              </button>
            </li> */}
          </ul>
        </div>
      </main>

      {/* 피부톤 분석 모달 */}
      {showSkinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSkinModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-xl p-5 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-bold text-charcoal">피부톤 분석</h4>
              <button className="text-dark-gray" onClick={() => setShowSkinModal(false)}>닫기</button>
            </div>
            <div className="text-sm text-dark-gray whitespace-pre-line">
              {result.skinAnalysis || '피부톤 분석 결과를 불러올 수 없습니다.'}
            </div>
          </div>
        </div>
      )}

      {/* 메이크업 상태 모달 */}
      {showMakeupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMakeupModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-xl p-5 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-bold text-charcoal">메이크업 상태</h4>
              <button className="text-dark-gray" onClick={() => setShowMakeupModal(false)}>닫기</button>
            </div>
            <div className="text-sm text-dark-gray whitespace-pre-line">
              {result.makeupAnalysis || '메이크업 상태 분석 결과를 불러올 수 없습니다.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultPage;
