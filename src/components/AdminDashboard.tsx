'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { authAnalytics } from '@/lib/auth-analytics';

interface AdminStats {
  totalUsers: number;
  totalConversations: number;
  averageResponseTime: number;
  topQueries: Array<{ query: string; count: number }>;
  subscriptionDistribution: Record<string, number>;
}

interface DocumentStats {
  catechism: number;
  papal: number;
  scripture: number;
  custom: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [authStats, setAuthStats] = useState<any>(null);
  const [docStats] = useState<DocumentStats>({
    catechism: 2865, // Approximate CCC entries
    papal: 150,      // Papal documents
    scripture: 400,  // Scripture passages
    custom: 50       // Custom teachings
  });
  const [loading, setLoading] = useState(true);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [datasetLoading, setDatasetLoading] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Playground State
  const [testQuery, setTestQuery] = useState('');
  const [testModel, setTestModel] = useState('qwen');
  const [testResponse, setTestResponse] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    fetchAdminStats();
    setAuthStats(authAnalytics.getAnalyticsSummary());
  }, []);

  const runIngestion = async () => {
    setIngestLoading(true);
    setPipelineStatus({ type: 'info', message: 'Running Airbyte simulation (Vatican News RSS)...' });
    try {
      const res = await fetch('/api/admin/ingest', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPipelineStatus({ type: 'success', message: data.message });
      } else {
        setPipelineStatus({ type: 'error', message: 'Ingestion failed: ' + data.message });
      }
    } catch (e) {
      setPipelineStatus({ type: 'error', message: 'Ingestion error' });
    } finally {
      setIngestLoading(false);
    }
  };

  const runDatasetPrep = async () => {
    setDatasetLoading(true);
    setPipelineStatus({ type: 'info', message: 'Preparing Snowflake/Fine-Tuning dataset...' });
    try {
      const res = await fetch('/api/admin/prepare-dataset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPipelineStatus({ type: 'success', message: data.message });
      } else {
        setPipelineStatus({ type: 'error', message: 'Dataset preparation failed: ' + data.message });
      }
    } catch (e) {
      setPipelineStatus({ type: 'error', message: 'Dataset error' });
    } finally {
      setDatasetLoading(false);
    }
  };

  const runModelTest = async () => {
    if (!testQuery.trim()) return;
    
    setTestLoading(true);
    setTestResponse('');
    
    try {
      const response = await fetch('/api/admin/test-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: testQuery }],
          mode: 'standard',
          userId: 'admin-test-user', // Special ID for admin testing
          language: 'es', // Default to Spanish for testing
          model: testModel
        }),
      });

      if (!response.ok) throw new Error(response.statusText);

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let accumulatedResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;
        setTestResponse(prev => prev + chunk);
      }
    } catch (e) {
      setTestResponse('Error generating response: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setTestLoading(false);
    }
  };


  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use more resilient queries with fallbacks
      let users: { subscription_tier?: string; usage_count_today?: number }[] = [];
      let conversations: { mode_used?: string; processing_time_ms?: number; created_at?: string }[] = [];
      
      // Try to fetch users with error handling
      try {
        const { data: userData, error: usersError } = await supabase
          .from('profiles')
          .select('subscription_tier, usage_count_today')
          .limit(1000);
        
        if (!usersError && userData) {
          users = userData;
        }
      } catch {
        console.warn('Profiles table not accessible, using fallback data');
      }
      
      // Try to fetch conversations with error handling  
      try {
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('mode_used, processing_time_ms, created_at')
          .limit(1000);
          
        if (!convError && convData) {
          conversations = convData;
        }
      } catch {
        console.warn('Conversations table not accessible, using fallback data');
      }
      
      // Calculate statistics with fallbacks
      const totalUsers = users?.length || 0;
      const totalConversations = conversations?.length || 0;
      const avgResponseTime = totalConversations > 0 
        ? Math.round(conversations.reduce((acc, conv) => 
            acc + (conv.processing_time_ms || 0), 0) / totalConversations)
        : 0;
      
      // Subscription distribution with safe access
      const subscriptionDistribution = users?.reduce((acc, user) => {
        const tier = user.subscription_tier || 'free';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || { free: 0, premium: 0 };
      
      setStats({
        totalUsers,
        totalConversations,
        averageResponseTime: avgResponseTime,
        topQueries: [
          { query: 'Catholic teaching on...', count: 45 },
          { query: 'What does the Bible say about...', count: 38 },
          { query: 'Catechism explanation of...', count: 32 },
          { query: 'Pope Francis on...', count: 28 },
          { query: 'Saints and their teachings...', count: 22 }
        ], // Mock data - would need query analysis in production
        subscriptionDistribution
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statistics';
      console.warn('Admin stats fetch error:', errorMessage);
      setError(errorMessage);
      
      // Set fallback stats
      setStats({
        totalUsers: 0,
        totalConversations: 0,
        averageResponseTime: 0,
        topQueries: [],
        subscriptionDistribution: { free: 0, premium: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAllConversations = async () => {
    if (!confirm('Are you sure you want to clear all conversation histories? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/admin/clear-conversations', {
        method: 'POST',
      });
      
      if (response.ok) {
        alert('All conversation histories cleared successfully');
        fetchAdminStats(); // Refresh stats
      } else {
        throw new Error('Failed to clear conversations');
      }
    } catch (error) {
      alert('Error clearing conversations: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-300">Loading admin dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center">
        <div className="text-xl text-red-600 dark:text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">santaPalabra Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Enhanced with LangChain RAG System</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats?.totalUsers || 0}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Total Conversations</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.totalConversations || 0}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Avg Response Time</h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats?.averageResponseTime || 0}ms</p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Document Chunks</h3>
            <p className="text-3xl font-bold text-orange-600">
              {Object.values(docStats).reduce((a, b) => a + b, 0)}
            </p>
          </div>
          {/* Auth Analytics */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Auth Analytics</h3>
            {authStats && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-sm text-gray-500">Total Events</p>
                    <p className="text-xl font-bold">{authStats.totalEvents}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-sm text-gray-500">Signups</p>
                    <p className="text-xl font-bold text-green-600">{authStats.signups}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-sm text-gray-500">Logins</p>
                    <p className="text-xl font-bold text-blue-600">{authStats.signins}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-sm text-gray-500">Failures</p>
                    <p className="text-xl font-bold text-red-600">{authStats.failedSignins}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Recent Events</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {authStats.recentEvents.map((event: any, i: number) => (
                      <div key={i} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded flex justify-between">
                        <span>{event.event_type}</span>
                        <span className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Subscription Distribution */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Subscription Distribution</h3>
            <div className="space-y-3">
              {Object.entries(stats?.subscriptionDistribution || {}).map(([tier, count]) => (
                <div key={tier} className="flex justify-between items-center">
                  <span className="capitalize text-gray-700 dark:text-gray-300">{tier}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                        style={{ width: `${(count / (stats?.totalUsers || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document Distribution */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Knowledge Base Distribution</h3>
            <div className="space-y-3">
              {Object.entries(docStats).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="capitalize text-gray-700 dark:text-gray-300">{type}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-600 dark:bg-green-400 h-2 rounded-full"
                        style={{ width: `${(count / Object.values(docStats).reduce((a, b) => a + b, 0)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Queries */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Popular Query Patterns</h3>
          <div className="space-y-2">
            {stats?.topQueries.map((query, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-700 dark:text-gray-300">{query.query}</span>
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-sm">{query.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Admin Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => fetchAdminStats()}
              className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Refresh Statistics
            </button>
            
            <button
              onClick={clearAllConversations}
              className="bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
            >
              Clear All Conversations
            </button>
            
            <button
              onClick={() => alert('Document management feature coming soon!')}
              className="bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
            >
              Manage Documents
            </button>
          </div>
        </div>

        {/* Data Pipeline & Ingestion (Airbyte/Snowflake) */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 mt-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Data Pipeline Automation</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Step 1: Ingest Data</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Fetch latest Vatican News RSS</p>
                <button
                  onClick={runIngestion}
                  disabled={ingestLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
                >
                  {ingestLoading ? 'Running Airbyte Sync...' : 'Run Airbyte Sync (RSS)'}
                </button>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Step 2: Process Data</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Convert to Snowflake/JSONL format</p>
                <button
                  onClick={runDatasetPrep}
                  disabled={datasetLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
                >
                  {datasetLoading ? 'Processing...' : 'Prepare Snowflake Dataset'}
                </button>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Step 3: Upload</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Push CSV to Snowflake DB</p>
                <button
                  onClick={async () => {
                    if(!confirm('Ensure you have configured Snowflake credentials in .env.local. Proceed?')) return;
                    setPipelineStatus({ type: 'info', message: 'Uploading to Snowflake...' });
                    try {
                      const res = await fetch('/api/admin/upload-snowflake', { method: 'POST' });
                      const data = await res.json();
                      if (data.success) {
                        setPipelineStatus({ type: 'success', message: data.message });
                      } else {
                        setPipelineStatus({ type: 'error', message: 'Upload failed: ' + data.message });
                      }
                    } catch (e) {
                      setPipelineStatus({ type: 'error', message: 'Upload error' });
                    }
                  }}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Upload to Snowflake ❄️
                </button>
              </div>
            </div>

            {pipelineStatus && (
              <div className={`p-4 rounded border ${
                pipelineStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                pipelineStatus.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <p className="font-mono text-sm whitespace-pre-wrap">{pipelineStatus.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Model Playground */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 mt-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">LLM Model Playground</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Query (Spanish)</label>
                <textarea
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="E.g., ¿Qué enseña la Iglesia sobre la gracia?"
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 h-24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Model</label>
                <select
                  value={testModel}
                  onChange={(e) => setTestModel(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="qwen">Qwen 2.5 (Free)</option>
                  <option value="gemma">Gemma 2 (Free)</option>
                  <option value="anthropic">Claude 3 (Paid)</option>
                  <option value="llama">Llama 3 (Groq)</option>
                </select>
                <button
                  onClick={runModelTest}
                  disabled={testLoading || !testQuery}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
                >
                  {testLoading ? 'Generating...' : 'Test Generation'}
                </button>
              </div>
            </div>
            
            {testResponse && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Response ({testModel}):</h4>
                <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                  {testResponse}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LangChain Status */}
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">🧠 LangChain RAG System Status</h3>
          <div className="text-blue-800 dark:text-blue-100">
            <p>✅ Enhanced conversation memory enabled</p>
            <p>✅ Vector search with semantic similarity</p>
            <p>✅ Multilingual support (EN/ES)</p>
            <p>✅ Advanced model routing by subscription tier</p>
            <p>✅ Context-aware theological responses</p>
          </div>
        </div>
      </div>
    </div>
  );
}
