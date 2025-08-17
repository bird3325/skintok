
import React, { useEffect, useState } from 'react';
import { generateBeautyProfile } from '../services/geminiService';
import { type AnalysisResult } from '../types';

interface AnalysisPageProps {
    userImage: string;
    onAnalysisComplete: (result: AnalysisResult) => void;
}

const loadingMessages = [
    "AI가 피부톤을 정밀 분석 중입니다...",
    "메이크업 상태를 꼼꼼히 체크하고 있어요.",
    "가장 잘 어울리는 컬러를 찾고 있습니다.",
    "잠시만 기다려주세요, 거의 다 됐어요!",
];

const AnalysisPage: React.FC<AnalysisPageProps> = ({ userImage, onAnalysisComplete }) => {
    const [message, setMessage] = useState(loadingMessages[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessage(prev => {
                const currentIndex = loadingMessages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                return loadingMessages[nextIndex];
            });
        }, 2500);

        const performAnalysis = async () => {
            try {
                const result = await generateBeautyProfile(userImage);
                onAnalysisComplete(result);
            } catch (error) {
                console.error("Analysis failed:", error);
                alert("분석에 실패했습니다. 다시 시도해주세요.");
            }
        };

        // Simulate a minimum loading time for better UX
        setTimeout(performAnalysis, 8000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onAnalysisComplete]);

    return (
        <div className="flex flex-col h-full items-center justify-center text-center bg-white p-6">
            <h2 className="text-3xl font-bold text-brand-rose mb-8">분석 중...</h2>
            <div className="relative w-48 h-48">
                <img src={userImage} alt="User for analysis" className="w-full h-full rounded-full object-cover shadow-lg" />
                <div className="absolute inset-0 border-4 border-brand-rose rounded-full animate-spin"></div>
            </div>
            <p className="text-dark-gray mt-8 animate-pulse">{message}</p>
        </div>
    );
};

export default AnalysisPage;
