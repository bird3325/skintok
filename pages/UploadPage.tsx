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
    const [imageQuality, setImageQuality] = useState<'excellent' | 'good' | 'poor' | 'measuring'>('measuring');

    const startCamera = useCallback(async () => {
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode,
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    frameRate: { ideal: 30 }
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

    // 개선된 조명 상태 감지
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
                let brightnessVariance = 0;
                const pixelCount = imageData.data.length / 4;
                const luminanceValues: number[] = [];
                
                // 첫 번째 패스: 평균 휘도 계산
                for (let i = 0; i < imageData.data.length; i += 4) {
                    const r = imageData.data[i];
                    const g = imageData.data[i + 1];
                    const b = imageData.data[i + 2];
                    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                    luminanceValues.push(luminance);
                    totalLuminance += luminance;
                }
                
                const avgLuminance = totalLuminance / pixelCount;
                
                // 두 번째 패스: 분산 계산 (조명 균일성)
                luminanceValues.forEach(luminance => {
                    brightnessVariance += Math.pow(luminance - avgLuminance, 2);
                });
                brightnessVariance /= pixelCount;
                
                // 조명 품질 판단 (평균 밝기 + 균일성)
                const isWellLit = avgLuminance > 70 && avgLuminance < 220;
                const isUniform = brightnessVariance < 2000;
                
                setLightingStatus(isWellLit && isUniform ? '좋음' : '나쁨');
            } catch (error) {
                console.error('Error analyzing lighting:', error);
                setLightingStatus('측정중');
            }
        };

        const intervalId = setInterval(checkLighting, 1500);
        return () => clearInterval(intervalId);
    }, [cameraError]);

    // 개선된 얼굴 위치 및 이미지 품질 감지
    useEffect(() => {
        const checkFacePositionAndQuality = () => {
            if (!videoRef.current || cameraError) return;
            const video = videoRef.current;
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                setFacePositionStatus('부적정');
                setImageQuality('poor');
                return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            try {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // 중앙 영역 (얼굴 예상 위치) 분석
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const regionSize = Math.min(canvas.width, canvas.height) * 0.35;
                
                const imageData = ctx.getImageData(
                    Math.max(0, centerX - regionSize / 2),
                    Math.max(0, centerY - regionSize / 2),
                    Math.min(regionSize, canvas.width),
                    Math.min(regionSize, canvas.height)
                );
                
                let totalLuminance = 0;
                let skinTonePixels = 0;
                let sharpnessScore = 0;
                const pixelCount = imageData.data.length / 4;
                
                // 이미지 품질 분석을 위한 변수들
                let edgeCount = 0;
                let contrastSum = 0;
                
                for (let i = 0; i < imageData.data.length; i += 4) {
                    const r = imageData.data[i];
                    const g = imageData.data[i + 1];
                    const b = imageData.data[i + 2];
                    
                    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                    totalLuminance += luminance;
                    
                    // 개선된 피부톤 감지 (더 넓은 범위)
                    const isFleshTone = (
                        r > 80 && g > 50 && b > 30 &&
                        r > g && r > b &&
                        Math.abs(r - g) > 10 &&
                        (r + g + b) > 200 &&
                        (r + g + b) < 650
                    );
                    
                    if (isFleshTone) {
                        skinTonePixels++;
                    }
                    
                    // 간단한 선명도 측정 (인접 픽셀과의 차이)
                    if (i > 8 && i < imageData.data.length - 8) {
                        const prevR = imageData.data[i - 4];
                        const nextR = imageData.data[i + 4];
                        const edgeStrength = Math.abs(r - prevR) + Math.abs(r - nextR);
                        sharpnessScore += edgeStrength;
                        
                        if (edgeStrength > 20) {
                            edgeCount++;
                        }
                    }
                }
                
                const avgLuminance = totalLuminance / pixelCount;
                const skinToneRatio = skinTonePixels / pixelCount;
                const avgSharpness = sharpnessScore / pixelCount;
                const edgeRatio = edgeCount / pixelCount;
                
                // 얼굴 위치 판단 (개선된 기준)
                const hasFace = skinToneRatio > 0.08 && avgLuminance > 40 && avgLuminance < 240;
                const isWellPositioned = hasFace && skinToneRatio < 0.6; // 너무 많은 피부톤도 좋지 않음
                
                setFacePositionStatus(isWellPositioned ? '적정' : '부적정');
                
                // 이미지 품질 판단
                const hasGoodSharpness = avgSharpness > 15;
                const hasGoodDetail = edgeRatio > 0.1;
                const hasGoodLighting = avgLuminance > 60 && avgLuminance < 200;
                
                if (hasGoodSharpness && hasGoodDetail && hasGoodLighting && isWellPositioned) {
                    setImageQuality('excellent');
                } else if (hasGoodLighting && isWellPositioned) {
                    setImageQuality('good');
                } else {
                    setImageQuality('poor');
                }
                
            } catch (error) {
                console.error('Error analyzing face position and quality:', error);
                setFacePositionStatus('측정중');
                setImageQuality('measuring');
            }
        };

        const intervalId = setInterval(checkFacePositionAndQuality, 2000);
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

            // 고품질 캡처를 위한 설정
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const context = canvas.getContext('2d');
            if (context) {
                // 이미지 품질 향상을 위한 설정
                context.imageSmoothingEnabled = false;
                
                if (facingMode === 'user') {
                    context.scale(-1, 1);
                    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
                } else {
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                }
                
                // 고품질 JPEG로 출력 (Gemini 분석에 최적화)
                const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                onImageReady(imageDataUrl);
            }
        }
    }, [onImageReady, facingMode]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // 파일 크기 체크 (Gemini 최적화: 10MB 제한)
            if (file.size > 10 * 1024 * 1024) {
                alert("파일 크기가 너무 큽니다. 10MB 이하의 이미지를 선택해주세요.");
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert("이미지 파일만 선택할 수 있습니다.");
                return;
            }

            // 지원되는 이미지 형식 확인
            const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!supportedFormats.includes(file.type)) {
                alert("지원되는 형식: JPEG, PNG, WebP");
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    // 이미지 품질 최적화
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;

                        // 적절한 크기로 리사이즈 (Gemini 최적화)
                        const maxSize = 2048;
                        let { width, height } = img;
                        
                        if (width > height && width > maxSize) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        } else if (height > maxSize) {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }

                        canvas.width = width;
                        canvas.height = height;
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                        onImageReady(optimizedDataUrl);
                    };
                    img.src = e.target.result as string;
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
        setImageQuality('measuring');
        setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case '좋음':
            case '적정':
            case 'excellent':
                return 'text-green-400';
            case '나쁨':
            case '부적정':
            case 'poor':
                return 'text-red-400';
            case 'good':
                return 'text-yellow-400';
            default:
                return 'text-gray-400';
        }
    };

    const getStatusIcon = (type: 'lighting' | 'position' | 'quality', status: string) => {
        if (status === '측정중' || status === 'measuring') return '⏳';
        
        if (type === 'lighting') {
            return status === '좋음' ? '⚡' : '💡';
        } else if (type === 'position') {
            return status === '적정' ? '✅' : '❌';
        } else { // quality
            switch (status) {
                case 'excellent': return '🌟';
                case 'good': return '👍';
                case 'poor': return '⚠️';
                default: return '⏳';
            }
        }
    };

    const getQualityText = (quality: string) => {
        switch (quality) {
            case 'excellent': return '최고';
            case 'good': return '양호';
            case 'poor': return '개선필요';
            default: return '측정중';
        }
    };

    const canCapture = lightingStatus === '좋음' && facePositionStatus === '적정' && imageQuality !== 'poor';

    return (
        <div className="flex flex-col h-screen bg-charcoal text-white overflow-hidden">
            {/* 헤더 */}
            <header className="flex justify-between items-center p-3 min-h-[56px]">
                <button onClick={onBack}>
                    <BackIcon className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-bold">사진 촬영</h1>
                <InfoIcon className="w-5 h-5" />
            </header>

            {/* 메인 콘텐츠 */}
            <main className="flex-1 flex flex-col items-center justify-center p-2 min-h-0">
                {/* 카메라 뷰 */}
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
                        <svg viewBox="0 0 200 250" className="w-full h-full absolute opacity-30">
                            <defs>
                                <mask id="faceMask">
                                    <rect width="100%" height="100%" fill="white" />
                                    <ellipse cx="100" cy="110" rx="65" ry="85" fill="black" />
                                </mask>
                            </defs>
                            <rect width="100%" height="100%" fill="rgba(0,0,0,0.4)" mask="url(#faceMask)" />
                        </svg>
                        <p className="absolute bottom-4 text-xs text-white bg-black bg-opacity-70 px-3 py-1 rounded-full max-w-[220px] text-center font-medium">
                            💡 얼굴을 가이드라인에 맞춰주세요
                        </p>
                        
                        {/* 품질 상태 오버레이 */}
                        {canCapture && (
                            <div className="absolute top-4 right-4 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                                ✓ 촬영준비완료
                            </div>
                        )}
                    </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {/* 상태 표시 */}
                <div className="w-full text-center mt-3 space-y-1 text-xs max-w-xs mx-auto">
                    <div className="flex justify-between items-center">
                        <span>조명:</span>
                        <span className={getStatusColor(lightingStatus)}>
                            {getStatusIcon('lighting', lightingStatus)} {lightingStatus}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>얼굴 위치:</span>
                        <span className={getStatusColor(facePositionStatus)}>
                            {getStatusIcon('position', facePositionStatus)} {facePositionStatus}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>이미지 품질:</span>
                        <span className={getStatusColor(imageQuality)}>
                            {getStatusIcon('quality', imageQuality)} {getQualityText(imageQuality)}
                        </span>
                    </div>
                </div>
            </main>

            {/* 푸터 */}
            <footer className="p-3 min-h-[80px]">
                <div className="flex justify-between items-center max-w-xs mx-auto">
                    <div className="flex flex-col items-center space-y-1 text-xs">
                        <button onClick={triggerFileSelect} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
                            <GalleryIcon className="w-5 h-5" />
                        </button>
                        <span>갤러리</span>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/jpeg,image/jpg,image/png,image/webp" 
                            className="hidden" 
                        />
                    </div>

                    {/* 촬영 버튼 */}
                    <button 
                        onClick={handleCapture} 
                        className={`w-16 h-16 rounded-full border-4 transition-colors ${
                            canCapture 
                                ? 'bg-green-400 border-green-300 hover:bg-green-300' 
                                : 'bg-white border-gray-400 hover:border-gray-300'
                        }`}
                        disabled={cameraError}
                        title={canCapture ? "촬영하기" : "조건을 만족해주세요"}
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
