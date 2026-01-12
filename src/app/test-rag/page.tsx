'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';

interface TestResult {
  query: string;
  implementation: string;
  response: string;
  responseTime: number;
  timestamp: string;
}

interface ComparisonResult {
  performance: {
    langchain: { avgTime: number; successRate: number };
    llamaindex: { avgTime: number; successRate: number };
  };
  summary: {
    winner: string;
    langchainAvgTime: number;
    llamaindexAvgTime: number;
  };
}

export default function RAGTestingInterface() {
  const [user, setUser] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [implementation, setImplementation] = useState<'LangChain' | 'LlamaIndex'>('LangChain');
  const [mode, setMode] = useState<'standard' | 'advanced'>('standard');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => setUser(session?.user || null)
    );
    return () => subscription.unsubscribe();
  }, []);

  const sampleQueries = [
    'What is the Catholic teaching on the Trinity?',
    'How should Catholics approach prayer?',
    'What is the significance of the Eucharist?',
    'Can you explain Catholic teaching on salvation?',
    'What does the Church teach about Mary?',
    '¿Qué enseña la Iglesia sobre la oración?' // Spanish example
  ];

  const testSingleQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/catholic-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          implementation,
          mode,
          language
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          query: data.query,
          implementation: data.implementation,
          response: data.response,
          responseTime: data.responseTime,
          timestamp: data.timestamp
        });
      } else {
        setError(data.message || 'Test failed');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const runComparison = async () => {
    setComparing(true);
    setError(null);
    setComparisonResult(null);

    try {
      const response = await fetch('/api/compare-rag?test=full');
      const data = await response.json();

      if (data.success) {
        setComparisonResult(data.report);
      } else {
        setError(data.message || 'Comparison failed');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Comparison error:', err);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-blue-600 hover:text-blue-800 mr-4">
                ← Back to Home
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">RAG Testing Interface</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <span className="text-sm text-gray-600">Signed in as {user.email}</span>
              ) : (
                <Link href="/auth-test" className="text-sm text-blue-600 hover:text-blue-800">
                  Sign In
                </Link>
              )}
              <Link 
                href="/catholic-chat" 
                className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md hover:bg-blue-50"
              >
                Chat Interface
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Catholic RAG System Testing
          </h2>
          <p className="text-gray-600">
            Test and compare different RAG implementations for Catholic theological queries
          </p>
        </div>

        {/* Single Query Testing */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a9 9 0 117.072 0l-.548.547A3.374 3.374 0 0014.846 21H9.154a3.374 3.374 0 00-2.548-1.053l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Single Query Test</h3>
              <p className="text-gray-600 text-sm">Test individual queries with specific configurations</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Implementation</label>
              <select
                value={implementation}
                onChange={(e) => setImplementation(e.target.value as 'LangChain' | 'LlamaIndex')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="LangChain">🔗 LangChain</option>
                <option value="LlamaIndex">🦙 LlamaIndex</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'standard' | 'advanced')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="standard">📄 Standard</option>
                <option value="advanced">⚡ Advanced</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="en">🇺🇸 English</option>
                <option value="es">🇪🇸 Español</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Query</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your Catholic theology question here..."
              className="w-full p-4 border border-gray-300 rounded-lg h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Sample Questions</label>
            <div className="grid md:grid-cols-2 gap-3">
              {sampleQueries.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(sample)}
                  className="text-left p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors text-sm"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={testSingleQuery}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Testing...
              </span>
            ) : (
              '🚀 Test Query'
            )}
          </button>
        </div>

        {/* Results Display */}
        {result && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Test Result</h3>
                <p className="text-gray-600 text-sm">Query completed successfully</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-blue-800">Implementation</div>
                <div className="text-lg font-bold text-blue-900">{result.implementation}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-green-800">Response Time</div>
                <div className="text-lg font-bold text-green-900">{result.responseTime}ms</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-purple-800">Timestamp</div>
                <div className="text-lg font-bold text-purple-900">{new Date(result.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="font-semibold text-gray-900 mb-3">Query:</div>
              <div className="text-gray-700 bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">{result.query}</div>
            </div>
            
            <div>
              <div className="font-semibold text-gray-900 mb-3">Response:</div>
              <div className="text-gray-700 bg-gray-50 p-4 rounded-lg border-l-4 border-green-500 whitespace-pre-wrap">{result.response}</div>
            </div>
          </div>
        )}

        {/* Full Comparison */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Full RAG Comparison</h3>
              <p className="text-gray-600 text-sm">Compare both implementations with multiple queries</p>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
            This will test both implementations with multiple queries to compare performance and quality.
          </p>
          
          <button
            onClick={runComparison}
            disabled={comparing}
            className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {comparing ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Running Comparison...
              </span>
            ) : (
              '📈 Run Full Comparison'
            )}
          </button>
        </div>

        {/* Comparison Results */}
        {comparisonResult && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Comparison Results</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold">🔗</span>
                  </div>
                  <h4 className="font-bold text-blue-900 text-lg">LangChain</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Avg Response Time:</span>
                    <span className="font-mono font-bold text-blue-900">{comparisonResult.performance.langchain.avgTime.toFixed(2)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Success Rate:</span>
                    <span className="font-mono font-bold text-blue-900">{comparisonResult.performance.langchain.successRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-bold">🦙</span>
                  </div>
                  <h4 className="font-bold text-purple-900 text-lg">LlamaIndex</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-purple-700">Avg Response Time:</span>
                    <span className="font-mono font-bold text-purple-900">{comparisonResult.performance.llamaindex.avgTime.toFixed(2)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Success Rate:</span>
                    <span className="font-mono font-bold text-purple-900">{comparisonResult.performance.llamaindex.successRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <div>
                  <div className="font-bold text-yellow-800 text-lg">Winner: {comparisonResult.summary.winner}</div>
                  <div className="text-yellow-700 text-sm">Based on average response time and success rate comparison</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-red-800">Error Occurred</div>
                <div className="text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8">
          <div className="flex items-start mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg mb-3">Testing Guidelines</h3>
              <div className="space-y-3 text-blue-800">
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
                  <span>Test different Catholic theology questions to evaluate knowledge coverage</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
                  <span>Compare response times and accuracy between LangChain and LlamaIndex implementations</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
                  <span>Test both English and Spanish queries for multilingual support</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
                  <span>Use Advanced mode for more detailed theological responses (subscription required)</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
                  <span>The full comparison automatically tests multiple queries for comprehensive analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}