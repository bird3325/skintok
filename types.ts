
export enum Page {
    LANDING,
    UPLOAD,
    ANALYZING,
    RESULT,
    RECOMMENDATIONS
}

export type ProductCategory =
  | 'Foundation'
  | 'Cushion'
  | 'Lipstick'
  | 'Blusher'
  | 'Eyeshadow'
  | 'Concealer'
  | 'Highlighter';

export interface Product {
  category: ProductCategory;
  name: string;
  shade: string;
  price: number;
  rating: number;
  reviewCount: number;
  reason?: string;
}

export interface AnalysisResult {
  personalColor: string;
  personalColorDescription: string;
  score: number;
  recommendedProducts: Product[];
  // Gemini 확장 필드 (선택)
  skinAnalysis?: string;      // 피부톤 분석 텍스트
  makeupAnalysis?: string;    // 메이크업 상태 분석 텍스트
  colorHex?: string;          // 대표 색상 (예: "#FFC0CB")
  primaryColor?: string;      // 대체 색상 (예: "#FFD1DC" 혹은 "rgb(...)")
}
