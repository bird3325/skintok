
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

    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("카메라에 접근할 수 없습니다. 브라우저 설정을 확인해주세요.");
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCapture = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if(context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageDataUrl = canvas.toDataURL('image/jpeg');
                onImageReady(imageDataUrl);
            }
        }
    }, [onImageReady]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    onImageReady(e.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileSelect = () => fileInputRef.current?.click();

    return (
        <div className="flex flex-col h-full bg-charcoal text-white">
            <header className="flex justify-between items-center p-4">
                <button onClick={onBack}><BackIcon className="w-6 h-6" /></button>
                <h1 className="text-xl font-bold">사진 촬영</h1>
                <InfoIcon className="w-6 h-6" />
            </header>

            <main className="flex-grow flex flex-col items-center justify-center p-4 relative">
                <div className="w-full aspect-[3/4] bg-black rounded-lg overflow-hidden relative">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 200 250" className="w-full h-full absolute opacity-50">
                            <defs>
                                <mask id="faceMask">
                                    <rect width="100%" height="100%" fill="white" />
                                    <ellipse cx="100" cy="110" rx="60" ry="80" fill="black" />
                                </mask>
                            </defs>
                            <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#faceMask)" />
                        </svg>
                         <p className="absolute bottom-10 text-sm text-white bg-black bg-opacity-50 px-2 py-1 rounded">💡 가이드라인에 얼굴을 맞춰주세요</p>
                    </div>
                </div>
                <canvas ref={canvasRef} className="hidden"></canvas>

                <div className="w-full text-center mt-4 space-y-2">
                    <p>조명 상태: <span className="text-green-400">⚡ 좋음</span></p>
                    <p>얼굴 위치: <span className="text-green-400">✅ 적정</span></p>
                </div>
            </main>
            
            <footer className="p-6 flex justify-around items-center">
                <div className="flex flex-col items-center space-y-1 text-sm">
                    <button onClick={triggerFileSelect} className="p-3 bg-gray-700 rounded-full"><GalleryIcon className="w-7 h-7" /></button>
                    <span>갤러리</span>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
                <button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white border-4 border-gray-400"></button>
                <div className="flex flex-col items-center space-y-1 text-sm">
                    <button className="p-3 bg-gray-700 rounded-full"><CameraSwitchIcon className="w-7 h-7" /></button>
                    <span>전/후면</span>
                </div>
            </footer>
        </div>
    );
};

export default UploadPage;
