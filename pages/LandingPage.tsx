
import React from 'react';
import { MenuIcon, SettingsIcon } from '../components/icons';

interface LandingPageProps {
    onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    return (
        <div className="flex flex-col h-full p-6 bg-white">
            <header className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <MenuIcon className="w-6 h-6 text-charcoal" />
                    <h1 className="text-xl font-bold text-charcoal">My Color Studio</h1>
                </div>
                <SettingsIcon className="w-6 h-6 text-charcoal" />
            </header>

            <main className="flex-grow flex flex-col items-center justify-center text-center">
                <h2 className="text-4xl font-bold text-charcoal leading-tight">
                    <span className="text-brand-rose">AI</span>가 찾아주는
                    <br />
                    나만의 <span className="text-neutral-gold">퍼펙트 컬러</span>
                </h2>
                
                <div className="my-8">
                    <img src="https://picsum.photos/200/200?random=1" alt="Face illustration" className="w-48 h-48 rounded-full object-cover shadow-lg" />
                </div>

                <p className="text-dark-gray mb-8">
                    당신의 피부톤과 메이크업 상태를
                    <br />
                    AI가 정밀 분석해드려요
                </p>

                <button 
                    onClick={onStart}
                    className="w-full bg-brand-rose text-white font-bold py-4 px-6 rounded-full text-lg shadow-lg hover:bg-dark-rose transition-colors duration-300 flex items-center justify-center space-x-2"
                >
                    <span role="img" aria-label="camera">📸</span>
                    <span>내 얼굴 분석하기 (촬영/업로드)</span>
                </button>

                <p className="text-sm text-dark-gray mt-6">
                    <span role="img" aria-label="star">⭐</span> 이미 <span className="font-bold text-brand-rose">10만명</span>이 자신만의 컬러를 발견했어요!
                </p>
            </main>

            <footer className="mt-auto">
                <div className="w-full h-20 bg-light-gray rounded-lg flex items-center justify-center text-dark-gray">
                    광고 영역
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
