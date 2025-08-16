
import React from 'react';
import { type AnalysisResult, type Product } from '../types';
import { BackIcon, CartIcon } from '../components/icons';

interface RecommendationPageProps {
    result: AnalysisResult;
    onBack: () => void;
}

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const randomImageId = Math.floor(Math.random() * 200);
    return (
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-light-gray flex space-x-4">
            <img src={`https://picsum.photos/id/${randomImageId}/100/100`} alt={product.name} className="w-24 h-24 rounded-lg object-cover" />
            <div className="flex flex-col justify-between flex-grow">
                <div>
                    <h4 className="font-bold text-charcoal">{product.name}</h4>
                    <p className="text-sm text-dark-gray">{product.shade}</p>
                    <div className="flex items-center text-sm mt-1">
                        <span className="text-neutral-gold">⭐</span>
                        <span className="font-bold ml-1">{product.rating}</span>
                        <span className="text-dark-gray ml-1">({product.reviewCount.toLocaleString()} 리뷰)</span>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <p className="font-bold text-lg">{product.price.toLocaleString()}원</p>
                    <button className="bg-brand-rose text-white text-sm font-bold py-1 px-3 rounded-full hover:bg-dark-rose transition-colors">
                        구매하기
                    </button>
                </div>
            </div>
        </div>
    );
};

const RecommendationPage: React.FC<RecommendationPageProps> = ({ result, onBack }) => {
    
    const groupProductsByCategory = (products: Product[]) => {
        return products.reduce((acc, product) => {
            const category = product.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(product);
            return acc;
        }, {} as Record<string, Product[]>);
    };

    const groupedProducts = groupProductsByCategory(result.recommendedProducts);

    const categoryEmoji: Record<string, string> = {
        'Foundation': '📍',
        'Cushion': '📍',
        'Lipstick': '💋',
        'Blusher': '😊',
        'Eyeshadow': '👁️'
    };

    return (
        <div className="flex flex-col h-full bg-brand-background">
            <header className="flex justify-between items-center p-4 bg-white shadow-sm sticky top-0 z-10">
                <button onClick={onBack}><BackIcon className="w-6 h-6 text-charcoal" /></button>
                <h1 className="text-xl font-bold text-charcoal">맞춤 제품 추천</h1>
                <CartIcon className="w-6 h-6 text-charcoal" />
            </header>

            <main className="flex-grow p-6 overflow-y-auto">
                <p className="text-center text-lg mb-6">
                    <span className="font-bold text-brand-rose">{result.personalColor}</span> 톤을 위한 완벽한 제품들이에요!
                </p>

                <div className="space-y-6">
                    {Object.entries(groupedProducts).map(([category, products]) => (
                        <div key={category}>
                            <h3 className="text-xl font-bold mb-3">{categoryEmoji[category] || '🛍️'} {category}</h3>
                            <div className="space-y-4">
                                {products.map((product, index) => (
                                    <ProductCard key={`${category}-${index}`} product={product} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default RecommendationPage;
