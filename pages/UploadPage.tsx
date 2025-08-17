import React, { useRef, useState, useCallback, useEffect } from 'react';
import { BackIcon, InfoIcon, CameraSwitchIcon, GalleryIcon } from '../components/icons';

interface UploadPageProps {
    onImageReady: (imageDataUrl: string) => void;
    onBack: () => void;
}

const UploadPage: React.FC<UploadPageProps> = ({ onImageReady, onBack }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [cameraError, setCameraError] = useState(false);
    const [lightingStatus, setLightingStatus] = useState<'좋음' | '나쁨' | '측정중'>('측정중');
    const [facePositionStatus, setFacePositionStatus] = useState<'적정' | '부적정' | '측정중'>('측정중');

    const startCamera = useCallback(async () => {
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode,
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                } 
            });
            setStream(mediaStream);
            setCameraError(false);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setCameraError(true);
            alert("카메라에 접근할 수 없습니다. 브라우저 설정을 확인해주세요.");
        }
    }, [facingMode, stream]);

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode]);

    // 조명 상태 감지
    useEffect(() => {
        const checkLighting = () => {
            if (!videoRef.current || cameraError) return;
            const video = videoRef.current;
            if (video.videoWidth === 0 || video.videoHeight === 0) return;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            try {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let totalLuminance = 0;
                const pixelCount = imageData.data.length / 4;
                for (let i = 0; i < imageData.data.length; i += 4) {
                    const r = imageData.data[i];
                    const g = imageData.data[i + 1];
                    const b = imageData.data[i + 2];
                    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                    totalLuminance += luminance;
                }
                const avgLuminance = totalLuminance / pixelCount;
                setLightingStatus(avgLuminance > 80 ? '좋음' : '나쁨');
            } catch (error) {
                console.error('Error analyzing lighting:', error);
                setLightingStatus('측정중');
            }
        };
        const intervalId = setInterval(checkLighting, 1500);
        return () => clearInterval(intervalId);
    }, [cameraError]);

    // 얼굴 위치 감지
    useEffect(() => {
        const checkFacePosition = () => {
            if (!videoRef.current || cameraError) return;
            const video = videoRef.current;
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                setFacePositionStatus('부적정');
                return;
            }
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            try {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const regionSize = Math.min(canvas.width, canvas.height) * 0.3;
                const imageData = ctx.getImageData(centerX - regionSize / 2, centerY - regionSize / 2, regionSize, regionSize);
                let totalLuminance = 0;
                let skinTonePixels = 0;
                const pixelCount = imageData.data.length / 4;
                for (let i = 0; i < imageData.data.length; i += 4) {
                    const r = imageData.data[i];
                    const g = imageData.data[i + 1];
                    const b = imageData.data[i + 2];
                    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                    totalLuminance += luminance;
                    if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
                        skinTonePixels++;
                    }
                }
                const avgLuminance = totalLuminance / pixelCount;
                const skinToneRatio = skinTonePixels / pixelCount;
                setFacePositionStatus(skinToneRatio > 0.1 && avgLuminance > 50 && avgLuminance < 200 ? '적정' : '부적정');
            } catch (error) {
                console.error('Error analyzing face position:', error);
                setFacePositionStatus('측정중');
            }
        };
        const intervalId = setInterval(checkFacePosition, 2000);
        return () => clearInterval(intervalId);
    }, [cameraError]);

    const handleCapture = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                alert("카메라가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
                return;
            }
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                if (facingMode === 'user') {
                    context.scale(-1, 1);
                    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
                } else {
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                }
                const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                onImageReady(imageDataUrl);
            }
        }
    }, [onImageReady, facingMode]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("파일 크기가 너무 큽니다. 5MB 이하의 이미지를 선택해주세요.");
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert("이미지 파일만 선택할 수 있습니다.");
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    onImageReady(e.target.result as string);
                }
            };
            reader.onerror = () => {
                alert("파일을 읽는 중 오류가 발생했습니다.");
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileSelect = () => fileInputRef.current?.click();

    const toggleCamera = () => {
        setLightingStatus('측정중');
        setFacePositionStatus('측정중');
        setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case '좋음':
            case '적정':
                return 'text-green-400';
            case '나쁨':
            case '부적정':
                return 'text-red-400';
            default:
                return 'text-yellow-400';
        }
    };

    const getStatusIcon = (type: 'lighting' | 'position', status: string) => {
        if (status === '측정중') return '⏳';
        if (type === 'lighting') {
            return status === '좋음' ? '⚡' : '💡';
        } else {
            return status === '적정' ? '✅' : '❌';
        }
    };

    return (
        <div className="flex flex-col h-screen bg-charcoal text-white overflow-hidden">
            {/* 헤더 - 최소 높이로 설정 */}
            <header className="flex justify-between items-center p-3 min-h-[56px]">
                <button onClick={onBack}>
                    <BackIcon className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-bold">사진 촬영</h1>
                <InfoIcon className="w-5 h-5" />
            </header>

            {/* 메인 콘텐츠 - 가변 높이로 설정 */}
            <main className="flex-1 flex flex-col items-center justify-center p-2 min-h-0">
                {/* 카메라 뷰 - 모바일 최적화 */}
                <div className="w-full max-w-xs aspect-[4/5] bg-black rounded-lg overflow-hidden relative mx-auto">
                    {!cameraError ? (
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover" 
                            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-xs p-2">
                            <p className="text-white text-center">
                                카메라를 사용할 수 없습니다.<br />
                                갤러리에서 사진을 선택해주세요.
                            </p>
                        </div>
                    )}

                    {/* 얼굴 가이드라인 오버레이 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 200 250" className="w-full h-full absolute opacity-40">
                            <defs>
                                <mask id="faceMask">
                                    <rect width="100%" height="100%" fill="white" />
                                    <ellipse cx="100" cy="110" rx="60" ry="80" fill="black" />
                                </mask>
                            </defs>
                            <rect width="100%" height="100%" fill="rgba(0,0,0,0.4)" mask="url(#faceMask)" />
                        </svg>
                        <p className="absolute bottom-4 text-xs text-white bg-black bg-opacity-60 px-2 py-1 rounded max-w-[200px] text-center">
                            💡 가이드라인에 얼굴을 맞춰주세요
                        </p>
                    </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {/* 상태 표시 - 간소화 */}
                <div className="w-full text-center mt-3 space-y-1 text-xs max-w-xs mx-auto">
                    <div className="flex justify-between">
                        <span>조명:</span>
                        <span className={getStatusColor(lightingStatus)}>
                            {getStatusIcon('lighting', lightingStatus)} {lightingStatus}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>얼굴:</span>
                        <span className={getStatusColor(facePositionStatus)}>
                            {getStatusIcon('position', facePositionStatus)} {facePositionStatus}
                        </span>
                    </div>
                </div>
            </main>

            {/* 푸터 - 최소 높이로 설정 */}
            <footer className="p-3 min-h-[80px]">
                <div className="flex justify-between items-center max-w-xs mx-auto">
                    <div className="flex flex-col items-center space-y-1 text-xs">
                        <button onClick={triggerFileSelect} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
                            <GalleryIcon className="w-5 h-5" />
                        </button>
                        <span>갤러리</span>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>

                    {/* 촬영 버튼 */}
                    <button 
                        onClick={handleCapture} 
                        className="w-16 h-16 rounded-full bg-white border-4 border-gray-400 hover:border-gray-300 transition-colors" 
                        disabled={cameraError} 
                    />

                    <div className="flex flex-col items-center space-y-1 text-xs">
                        <button onClick={toggleCamera} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors" disabled={cameraError}>
                            <CameraSwitchIcon className="w-5 h-5" />
                        </button>
                        <span>전/후면</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default UploadPage;
