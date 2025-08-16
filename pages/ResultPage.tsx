
import React from 'react';
import { type AnalysisResult } from '../types';
import { BackIcon, SaveIcon, ShareIcon, ChevronRightIcon } from '../components/icons';

interface ResultPageProps {
    userImage: string;
    result: AnalysisResult;
    onViewRecommendations: () => void;
    onRestart: () => void;
}

const ResultPage: React.FC<ResultPageProps> = ({ userImage, result, onViewRecommendations, onRestart }) => {
    
    const getPersonalColorParts = (color: string) => {
        const parts = color.split(' ');
        if (parts.length > 1) {
            return { main: parts.slice(0, -1).join(' '), sub: parts.slice(-1)[0] };
        }
        return { main: color, sub: '' };
    };

    const colorParts = getPersonalColorParts(result.personalColor);

    return (
        <div className="flex flex-col h-full bg-brand-background">
            <header className="flex justify-between items-center p-4 bg-white shadow-sm">
                <button onClick={onRestart}><BackIcon className="w-6 h-6 text-charcoal" /></button>
                <h1 className="text-xl font-bold text-charcoal">분석 결과</h1>
                <div className="flex space-x-4">
                    <button><SaveIcon className="w-6 h-6 text-charcoal" /></button>
                    <button><ShareIcon className="w-6 h-6 text-charcoal" /></button>
                </div>
            </header>

            <main className="flex-grow p-6 overflow-y-auto">
                <p className="text-2xl font-bold text-center mb-4">🎉 분석 완료! 당신의 뷰티 프로필</p>

                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg mb-6">
                    <img src={userImage} alt="User result" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                        <span className="text-2xl font-bold">⭐ 종합 점수: {result.score}/100</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-light-gray mb-6">
                    <h3 className="text-lg font-bold text-brand-rose mb-2">🌸 당신의 퍼스널 컬러</h3>
                    <p className="text-3xl font-bold text-charcoal">
                        {colorParts.main} <span className="text-dark-rose">{colorParts.sub}</span>
                    </p>
                    <div className="my-4 h-10 bg-gradient-to-r from-yellow-300 via-pink-400 to-blue-300 rounded-lg"></div>
                    <p className="text-dark-gray text-sm">{result.personalColorDescription}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-lg border border-light-gray">
                    <h3 className="text-lg font-bold text-charcoal mb-2">📊 상세 분석 결과</h3>
                    <ul className="divide-y divide-light-gray">
                        <li className="py-3 flex justify-between items-center">
                            <span>피부톤 분석</span>
                            <button className="text-dark-gray text-sm flex items-center">자세히 보기 <ChevronRightIcon className="w-4 h-4" /></button>
                        </li>
                        <li className="py-3 flex justify-between items-center">
                            <span>메이크업 상태</span>
                            <button className="text-dark-gray text-sm flex items-center">자세히 보기 <ChevronRightIcon className="w-4 h-4" /></button>
                        </li>
                        <li className="py-3 flex justify-between items-center">
                            <span>맞춤 추천</span>
                            <button onClick={onViewRecommendations} className="text-dark-gray text-sm flex items-center font-bold text-brand-rose">자세히 보기 <ChevronRightIcon className="w-4 h-4" /></button>
                        </li>
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default ResultPage;
