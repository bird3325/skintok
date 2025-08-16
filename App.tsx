
import React, { useState, useCallback } from 'react';
import LandingPage from './pages/LandingPage';
import UploadPage from './pages/UploadPage';
import AnalysisPage from './pages/AnalysisPage';
import ResultPage from './pages/ResultPage';
import RecommendationPage from './pages/RecommendationPage';
import { type AnalysisResult } from './types';
import { Page } from './types';

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
    const [userImage, setUserImage] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

    const handleStart = useCallback(() => {
        setCurrentPage(Page.UPLOAD);
    }, []);

    const handleImageReady = useCallback((image: string) => {
        setUserImage(image);
        setCurrentPage(Page.ANALYZING);
    }, []);

    const handleAnalysisComplete = useCallback((result: AnalysisResult) => {
        setAnalysisResult(result);
        setCurrentPage(Page.RESULT);
    }, []);

    const handleViewRecommendations = useCallback(() => {
        setCurrentPage(Page.RECOMMENDATIONS);
    }, []);

    const handleBackToResult = useCallback(() => {
        setCurrentPage(Page.RESULT);
    }, []);

    const handleRestart = useCallback(() => {
        setUserImage(null);
        setAnalysisResult(null);
        setCurrentPage(Page.LANDING);
    }, []);
    
    const handleBackToUpload = useCallback(() => {
        setCurrentPage(Page.UPLOAD);
    }, []);


    const renderPage = () => {
        switch (currentPage) {
            case Page.LANDING:
                return <LandingPage onStart={handleStart} />;
            case Page.UPLOAD:
                return <UploadPage onImageReady={handleImageReady} onBack={handleRestart} />;
            case Page.ANALYZING:
                return userImage ? <AnalysisPage userImage={userImage} onAnalysisComplete={handleAnalysisComplete} /> : <LandingPage onStart={handleStart} />;
            case Page.RESULT:
                return userImage && analysisResult ? <ResultPage userImage={userImage} result={analysisResult} onViewRecommendations={handleViewRecommendations} onRestart={handleRestart} /> : <LandingPage onStart={handleStart} />;
            case Page.RECOMMENDATIONS:
                return analysisResult ? <RecommendationPage result={analysisResult} onBack={handleBackToResult} /> : <LandingPage onStart={handleStart} />;
            default:
                return <LandingPage onStart={handleStart} />;
        }
    };

    return (
        <div className="bg-brand-background min-h-screen text-charcoal">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
                {renderPage()}
            </div>
        </div>
    );
};

export default App;
