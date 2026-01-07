'use client';
import { PRICING_INFO, type SubscriptionTier } from '@/lib/subscription';

interface PricingPageProps {
  currentTier?: SubscriptionTier;
}

export default function PricingPage({ currentTier = 'free' }: PricingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f3] to-[#e8e2d0] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your TheoAgent Plan</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From personal spiritual guidance to institutional theological research, 
            TheoAgent adapts to your Catholic theological needs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Free</h3>
              <p className="text-gray-600 mt-2">Basic Catholic theology assistance</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>10 messages per day</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Standard mode only</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Short responses</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Basic Catholic teaching</span>
              </li>
            </ul>
            
            <button 
              disabled={currentTier === 'free'}
              className="w-full py-3 rounded-xl font-medium transition-colors bg-gray-100 text-gray-500 cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Plus Plan */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">Most Popular</span>
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-blue-900">Plus</h3>
              <p className="text-blue-700 mt-2">{PRICING_INFO.plus.target}</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-blue-900">${PRICING_INFO.plus.monthly}</span>
                <span className="text-blue-700">/month</span>
              </div>
            </div>
            
            <ul className="space-y-3 mb-8">
              {PRICING_INFO.plus.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-colors">
              Upgrade to Plus
            </button>
          </div>

          {/* Expert Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-purple-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-purple-900">Expert</h3>
              <p className="text-purple-700 mt-2">{PRICING_INFO.expert.target}</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-purple-900">${PRICING_INFO.expert.monthly}</span>
                <span className="text-purple-700">/month</span>
              </div>
            </div>
            
            <ul className="space-y-3 mb-8">
              {PRICING_INFO.expert.features.slice(0, 6).map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-medium transition-colors">
              Contact Sales
            </button>
          </div>
        </div>

        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto text-left space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900">What makes TheoAgent different from other AI assistants?</h3>
              <p className="text-gray-600 mt-1">TheoAgent is specifically trained in Catholic theology, with deep knowledge of Scripture, Church Fathers, papal documents, and the Catechism. It maintains Catholic orthodoxy while providing scholarly depth.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Can institutions get custom pricing?</h3>
              <p className="text-gray-600 mt-1">Yes! We offer custom institutional pricing for seminaries, universities, dioceses, and theology schools. Contact our sales team for volume discounts and custom integrations.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Is the content theologically accurate?</h3>
              <p className="text-gray-600 mt-1">TheoAgent is designed to maintain Catholic orthodoxy and cites authoritative sources like the Catechism, papal documents, and Church Fathers. However, always consult your spiritual director for personal guidance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}