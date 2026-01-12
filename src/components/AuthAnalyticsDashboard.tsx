'use client'

import { useState, useEffect } from 'react'
import { useAuthAnalytics, type AuthEventData } from '@/lib/auth-analytics'

export default function AuthAnalyticsDashboard() {
  const authAnalytics = useAuthAnalytics()
  const [summary, setSummary] = useState<any>(null)
  const [events, setEvents] = useState<AuthEventData[]>([])
  const [selectedEventType, setSelectedEventType] = useState<string>('all')

  useEffect(() => {
    const analyticsSummary = authAnalytics.getAnalyticsSummary()
    setSummary(analyticsSummary)
    setEvents(authAnalytics.getStoredEvents())
  }, [])

  const filteredEvents = selectedEventType === 'all' 
    ? events 
    : events.filter(event => event.event_type === selectedEventType)

  const handleClearEvents = () => {
    if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      authAnalytics.clearStoredEvents()
      setSummary(authAnalytics.getAnalyticsSummary())
      setEvents([])
    }
  }

  const handleExportEvents = () => {
    const dataStr = JSON.stringify(events, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `auth-analytics-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Authentication Analytics</h2>
        <div className="space-x-3">
          <button
            onClick={handleExportEvents}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Export Data
          </button>
          <button
            onClick={handleClearEvents}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Clear Data
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{summary.signups}</div>
          <div className="text-sm text-blue-800">Total Signups</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{summary.signins}</div>
          <div className="text-sm text-green-800">Successful Signins</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{summary.failedSignins}</div>
          <div className="text-sm text-red-800">Failed Signins</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{summary.socialLogins}</div>
          <div className="text-sm text-purple-800">Social Logins</div>
        </div>
      </div>

      {/* Provider Breakdown */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Login Providers</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(summary.providerBreakdown).map(([provider, count]) => (
            <div key={provider} className="bg-gray-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-gray-900">{count as number}</div>
              <div className="text-sm text-gray-600 capitalize">{provider}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Event Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Event Type:
        </label>
        <select
          value={selectedEventType}
          onChange={(e) => setSelectedEventType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Events</option>
          <option value="signup_started">Signup Started</option>
          <option value="signup_completed">Signup Completed</option>
          <option value="signin_started">Signin Started</option>
          <option value="signin_completed">Signin Completed</option>
          <option value="signin_failed">Signin Failed</option>
          <option value="social_signin_started">Social Signin Started</option>
          <option value="social_signin_completed">Social Signin Completed</option>
          <option value="password_reset_requested">Password Reset Requested</option>
          <option value="email_verification_sent">Email Verification Sent</option>
        </select>
      </div>

      {/* Recent Events Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Events ({filteredEvents.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email Domain
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEvents.slice(-20).reverse().map((event, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.event_type.includes('failed') ? 'bg-red-100 text-red-800' :
                      event.event_type.includes('completed') ? 'bg-green-100 text-green-800' :
                      event.event_type.includes('started') ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                    {event.provider || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {event.email ? event.email.split('@')[1] : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600 max-w-xs truncate">
                    {event.error_message || ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredEvents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No events found for the selected filter.
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <details className="text-sm text-gray-600">
          <summary className="cursor-pointer hover:text-gray-800 font-medium">
            Debug Information
          </summary>
          <div className="mt-2 bg-gray-50 p-3 rounded text-xs font-mono whitespace-pre-wrap overflow-x-auto">
            Total Events: {summary.totalEvents}

            Events are stored locally in browser localStorage for debugging.

            In production, these events would be sent to your analytics service

            (Google Analytics, Mixpanel, PostHog, etc.)
          </div>
        </details>
      </div>
    </div>
  )
}