'use client';

import { useState } from 'react';

interface ConversationManagerProps {
  userId: string;
}

interface ConversationStats {
  messageCount: number;
  subscriptionTier: string;
}

export default function ConversationManager({ userId }: ConversationManagerProps) {
  const [stats, setStats] = useState<ConversationStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_stats', userId })
      });
      
      const data: { success: boolean; data?: ConversationStats } = await response.json();
      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear your conversation history? This cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_history', userId })
      });
      
      const data: { success: boolean } = await response.json();
      if (data.success) {
        alert('Conversation history cleared successfully!');
        setStats(null); // Reset stats
      } else {
        alert('Failed to clear conversation history');
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
      alert('Error clearing conversation history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🧠 LangChain Conversation Manager</h3>
        <div className="flex gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'View Stats'}
          </button>
          <button
            onClick={clearHistory}
            disabled={loading}
            className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
          >
            Clear History
          </button>
        </div>
      </div>
      
      {stats && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-2xl font-bold text-blue-600">{stats.messageCount}</div>
            <div className="text-sm text-gray-600">Messages in History</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 capitalize">{stats.subscriptionTier}</div>
            <div className="text-sm text-gray-600">Subscription Tier</div>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Enhanced with vector similarity search</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Conversation context maintained across messages</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Intelligent Catholic document retrieval</span>
        </div>
      </div>
    </div>
  );
}
