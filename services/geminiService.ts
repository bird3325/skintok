
import { GoogleGenAI, Type } from "@google/genai";
import { type AnalysisResult, type Product } from '../types';

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


export const generateBeautyProfile = async (): Promise<AnalysisResult> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const colorType = getRandomPersonalColor();

    const prompt = `You are a professional and friendly beauty consultant. For the personal color type "${colorType}", provide a detailed beauty profile in JSON format. The analysis should be positive and empowering. The JSON object must conform to the provided schema. Generate realistic but fictional product names and details. Ensure prices are reasonable numbers.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        personalColor: { type: Type.STRING, description: "The full name of the personal color type." },
                        personalColorDescription: { type: Type.STRING, description: "A friendly, single-paragraph description for this color type." },
                        recommendedProducts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    category: { type: Type.STRING, enum: ['Foundation', 'Cushion', 'Lipstick', 'Blusher', 'Eyeshadow'] },
                                    name: { type: Type.STRING },
                                    shade: { type: Type.STRING },
                                    price: { type: Type.NUMBER },
                                    rating: { type: Type.NUMBER, description: "Rating out of 5, e.g., 4.8" },
                                    reviewCount: { type: Type.INTEGER, description: "Number of reviews, e.g., 3241" },
                                },
                                required: ["category", "name", "shade", "price", "rating", "reviewCount"],
                            }
                        }
                    },
                    required: ["personalColor", "personalColorDescription", "recommendedProducts"],
                },
            },
        });
        
        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText);

        const result: AnalysisResult = {
            ...parsedResult,
            score: 80 + Math.floor(Math.random() * 16), // Random score between 80-95
        };

        return result;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Fallback to mock data in case of API error
        return {
            personalColor: "Spring Warm Light",
            personalColorDescription: "You shine with warm and bright colors! Your beauty is enhanced by lovely, clear, and vibrant shades that remind of a spring blossom.",
            score: 88,
            recommendedProducts: [
                { category: 'Foundation', name: 'Estee Lauder Double Wear', shade: '2N1 Desert Beige', price: 52000, rating: 4.8, reviewCount: 3241 },
                { category: 'Lipstick', name: 'MAC Lipstick', shade: 'Coral Bliss', price: 31000, rating: 4.6, reviewCount: 1890 },
            ],
        };
    }
};
