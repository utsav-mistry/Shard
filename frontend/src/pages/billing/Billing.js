import React, { useState } from 'react';
import api from '../../utils/axiosConfig';
import { DollarSign, CreditCard, Zap } from 'lucide-react';
import { useTokens } from '../../context/TokenContext';

const Billing = () => {
  const { tokens, setTokens, loading, fetchTokenBalance } = useTokens();
  const [error, setError] = useState(null);

  const handlePurchase = async (amount) => {
    // This is a dummy function, no real payment is processed.
    alert(`This is a dummy purchase. In a real app, you would be redirected to a payment processor to purchase ${amount} tokens.`);
    try {
        const response = await api.post('/api/billing/add-tokens', { amount });
        if(response.data.success) {
            // Use the setTokens from context to update globally
            setTokens(response.data.data.newBalance);
        }
    } catch (error) {
        console.error('Failed to add tokens', error);
        setError('Failed to update token balance after dummy purchase.');
    }
  };

  const tokenPackages = [
    { amount: 500, price: 2300, icon: <Zap className="w-8 h-8 text-yellow-400" /> },
    { amount: 1200, price: 16000, icon: <Zap className="w-8 h-8 text-yellow-500" /> },
    { amount: 3000, price: 23000, icon: <Zap className="w-8 h-8 text-orange-500" /> },
  ];

  return (
    <div className="relative min-h-screen bg-white dark:bg-black text-black dark:text-white p-8">
        {/* Grid background */}
        <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-0"
            style={{
                backgroundImage: `
                    repeating-linear-gradient(to right, rgba(0,0,0,0.16) 0 1px, transparent 1px 32px),
                    repeating-linear-gradient(to bottom, rgba(0,0,0,0.16) 0 1px, transparent 1px 32px)
                `,
            }}
        />
        <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-0 hidden dark:block"
            style={{
                backgroundImage: `
                    repeating-linear-gradient(to right, rgba(255,255,255,0.16) 0 1px, transparent 1px 32px),
                    repeating-linear-gradient(to bottom, rgba(255,255,255,0.16) 0 1px, transparent 1px 32px)
                `,
            }}
        />

        <main className="relative z-10 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Billing & Tokens</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Manage your token balance for AI services.</p>

            <div className="bg-white dark:bg-black border-2 border-black dark:border-white p-6 mb-8">
                <h2 className="text-2xl font-bold mb-4">Your Balance</h2>
                {loading ? (
                    <div className="animate-pulse h-8 w-24 bg-gray-200 dark:bg-gray-700"></div>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                    <div className="flex items-center space-x-2">
                        <Zap className="w-8 h-8 text-yellow-500" />
                        <span className="text-4xl font-mono font-bold">{tokens}</span>
                        <span className="text-lg text-gray-500 dark:text-gray-400">Tokens</span>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-black border-2 border-black dark:border-white p-6">
                <h2 className="text-2xl font-bold mb-2">Buy More Tokens</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This is a dummy billing page. No real payment will be processed.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tokenPackages.map((pkg) => (
                        <div key={pkg.amount} className="border-2 border-black dark:border-white p-6 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex flex-col items-center text-center">
                            {pkg.icon}
                            <p className="text-3xl font-bold my-2">{pkg.amount}</p>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">Tokens</p>
                            <button 
                                onClick={() => handlePurchase(pkg.amount)}
                                className="w-full mt-auto p-3 bg-black text-white dark:bg-white dark:text-black font-bold border-2 border-black dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                            >
                                Buy for ₹{pkg.price}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    </div>
  );
};

export default Billing;
