// services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { type AnalysisResult, type Product } from '../types';

// 퍼스널 컬러 후보
const personalColorTypes = [
  "Spring Warm Light", "Spring Warm Bright",
  "Summer Cool Light", "Summer Cool Mute", 
  "Autumn Warm Mute", "Autumn Warm Deep",
  "Winter Cool Bright", "Winter Cool Deep"
];

const getRandomPersonalColor = (): string => {
  const randomIndex = Math.floor(Math.random() * personalColorTypes.length);
  return personalColorTypes[randomIndex];
};

const validateImage = (imageDataUrl: string): boolean => {
  try {
    if (!imageDataUrl || !imageDataUrl.includes('data:image/')) return false;
    const base64Data = imageDataUrl.split(',')[1];
    if (!base64Data || base64Data.length < 100) return false;
    // 크기 4MB 제한
    const sizeInBytes = (base64Data.length * 3) / 4;
    if (sizeInBytes > 4 * 1024 * 1024) return false;
    return true;
  } catch {
    return false;
  }
};

// 안전한 MIME 타입 추출
const extractMimeType = (dataUrl: string): string => {
  try {
    const headerPart = dataUrl.split(',')[0];
    const mimeMatch = headerPart.match(/data:([^;,]+)/);
    if (mimeMatch && mimeMatch[1]) {
      const mimeType = mimeMatch[1];
      const supported = ['image/jpeg', 'image/png', 'image/webp'];
      if (supported.includes(mimeType)) return mimeType;
    }
    return 'image/jpeg';
  } catch {
    return 'image/jpeg';
  }
};

// 응답에서 JSON 추출
const extractJsonFromResponse = (text: string): string => {
  try {
    // 1) `````` 패턴
    let m = text.match(/``````/i);
    if (m && m[1]) return m[1].trim();
    // 2) `````` 패턴
    m = text.match(/``````/);
    if (m && m[1]) return m[1].trim();
    // 3) json\n { ... } 패턴
    m = text.match(/json\s*\n\s*(\{[\s\S]*\})/i);
    if (m && m[1]) return m[1].trim();
    // 4) 단순 { ... }
    m = text.match(/(\{[\s\S]*\})/);
    if (m && m[1]) return m[1].trim();
    return text.trim();
  } catch {
    return text.trim();
  }
};

// 폴백 데이터
function getDefaultProducts(): Product[] {
  return [
    { category: 'Foundation', name: '에스티로더 더블웨어', shade: '2N1 데저트 베이지', price: 52000, rating: 4.8, reviewCount: 3241 },
    { category: 'Lipstick', name: '맥 립스틱', shade: '코랄 블리스', price: 31000, rating: 4.6, reviewCount: 1890 },
    { category: 'Blusher', name: '클리오 프리즘 블러셔', shade: '피치 코랄', price: 18000, rating: 4.5, reviewCount: 2156 },
    { category: 'Eyeshadow', name: '투쿨포스쿨 아이섀도우', shade: '웜 브라운', price: 25000, rating: 4.4, reviewCount: 1567 },
    { category: 'Cushion', name: '헤라 블랙쿠션', shade: '23 베이지', price: 45000, rating: 4.7, reviewCount: 2890 }
  ];
}

function getFallbackData(): AnalysisResult {
  return {
    personalColor: "Spring Warm Light",
    personalColorDescription: "따뜻하고 밝은 봄 타입으로, 생기 있고 화사한 컬러들이 당신의 아름다움을 더욱 돋보이게 해줍니다.",
    score: 87,
    recommendedProducts: getDefaultProducts(),
    // 선택 필드 폴백은 비움
    skinAnalysis: "따뜻한 언더톤 기반의 밝은 피부로 화사한 컬러가 잘 어울립니다.",
    makeupAnalysis: "자연스러운 베이스에 코랄 톤 립/블러셔가 잘 어울립니다.",
    colorHex: "#FFC0CB"
  };
}

export const generateBeautyProfile = async (imageDataUrl?: string): Promise<AnalysisResult> => {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || '').toString().trim();
  if (!apiKey || apiKey === 'undefined' || apiKey.length < 20) {
    return getFallbackData();
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // 안정 모델 (원하면 "gemini-2.5-flash" 로 교체)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    });

    // 공통 프롬프트(엄격 JSON 요구)
    const strictJsonPrompt = `
당신은 전문 뷰티 컨설턴트입니다. ${imageDataUrl ? '이 얼굴 사진을 분석하여' : ''} 퍼스널 컬러, 피부톤 분석, 메이크업 상태를 진단하고 제품을 추천해주세요.

다음 JSON 형식으로만 정확히 답변하세요(다른 텍스트 금지):
{
  "personalColor": "Spring Warm Light | Spring Warm Bright | Summer Cool Light | Summer Cool Mute | Autumn Warm Mute | Autumn Warm Deep | Winter Cool Bright | Winter Cool Deep 중 하나",
  "personalColorDescription": "해당 퍼스널 컬러에 대한 한국어 설명(2-3문장)",
  "skinAnalysis": "피부톤, 언더톤, 명도/채도 등에 대한 한국어 분석(2-4문장)",
  "makeupAnalysis": "현재 메이크업 상태 및 개선 팁에 대한 한국어 분석(2-4문장)",
  "colorHex": "#RRGGBB 형식의 대표 색상(예: #FFC0CB)",
  "score": 85에서 95 사이 정수,
  "recommendedProducts": [
    {
      "category": "Foundation | Cushion | Lipstick | Blusher | Eyeshadow | Concealer | Highlighter",
      "name": "제품명",
      "shade": "색상명",
      "price": 15000-80000 사이 정수",
      "rating": 4.0-5.0 사이 숫자",
      "reviewCount": 500-10000 사이 정수
    }
  ]
}
5-7개의 제품을 추천하세요. 반드시 위 JSON만 응답하세요.
`.trim();

    const parts: any[] = [{ text: strictJsonPrompt }];

    if (imageDataUrl && validateImage(imageDataUrl)) {
      const base64Data = imageDataUrl.split(',')[1];
      const mimeType = extractMimeType(imageDataUrl);
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType
        }
      });
    } else {
      // 이미지가 없으면 랜덤 컬러를 고정 삽입하여 일관성 확보(선택)
      // 필요 없다면 제거 가능
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    // JSON 파싱
    let parsed: any;
    try {
      const jsonText = extractJsonFromResponse(text);
      parsed = JSON.parse(jsonText);
    } catch {
      // 파싱 실패 시 폴백
      return getFallbackData();
    }

    const finalResult: AnalysisResult = {
      personalColor: parsed?.personalColor || getRandomPersonalColor(),
      personalColorDescription: parsed?.personalColorDescription || "당신에게 잘 어울리는 컬러 타입입니다.",
      skinAnalysis: parsed?.skinAnalysis,
      makeupAnalysis: parsed?.makeupAnalysis,
      colorHex: parsed?.colorHex,
      primaryColor: parsed?.primaryColor,
      score: parsed?.score || (85 + Math.floor(Math.random() * 11)),
      recommendedProducts: Array.isArray(parsed?.recommendedProducts) ? parsed.recommendedProducts : []
    };

    if (finalResult.recommendedProducts.length < 3) {
      finalResult.recommendedProducts.push(...getDefaultProducts().slice(0, 5));
    }

    return finalResult;
  } catch {
    return getFallbackData();
  }
};
