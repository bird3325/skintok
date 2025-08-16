
export enum Page {
    LANDING,
    UPLOAD,
    ANALYZING,
    RESULT,
    RECOMMENDATIONS
}

export interface Product {
    category: 'Foundation' | 'Cushion' | 'Lipstick' | 'Blusher' | 'Eyeshadow';
    name: string;
    shade: string;
    price: number;
    rating: number;
    reviewCount: number;
}

export interface AnalysisResult {
    personalColor: string; // e.g., "Spring Warm Light"
    personalColorDescription: string;
    score: number;
    recommendedProducts: Product[];
}
