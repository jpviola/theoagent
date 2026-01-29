'use client'

import { useEffect, useState } from 'react'
import { Donation, formatCentsToDollars, getStatusColor, getStatusText } from '@/lib/donations'

interface DonationStats {
  total_donations: number
  total_amount_cents: number
  completed_donations: number
  stripe_donations: number
  paypal_donations: number
  average_amount_cents: number
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function DonationsAdminPage() {
  const [stats, setStats] = useState<DonationStats | null>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching donations data...')

      // Obtener estadísticas
      console.log('📊 Getting stats...')
      const statsResponse = await fetch('/api/donations?type=stats')
      if (!statsResponse.ok) {
        const errorData = await statsResponse.json()
        throw new Error(errorData.error || `HTTP ${statsResponse.status}`)
      }
      const statsData = await statsResponse.json()
      console.log('✅ Stats received:', statsData.data)
      setStats(statsData.data)

      // Obtener donaciones recientes
      console.log('📋 Getting donations...')
      const donationsResponse = await fetch('/api/donations?type=admin&limit=20')
      if (!donationsResponse.ok) {
        const errorData = await donationsResponse.json()
        throw new Error(errorData.error || `HTTP ${donationsResponse.status}`)
      }
      const donationsData = await donationsResponse.json()
      console.log(`✅ Received ${donationsData.data?.length || 0} donations`)
      setDonations(donationsData.data || [])
    } catch (err: unknown) {
      console.error('❌ Error fetching data:', err)
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      if (message.includes('Database table not created yet')) {
        setError('La tabla de donaciones no existe en Supabase. Por favor, ejecuta el SQL schema.')
      }
    } finally {
      setLoading(false)
    }
  }

  const createTestDonation = async () => {
    try {
      const testData = {
        action: 'test_donation',
        payment_provider: Math.random() > 0.5 ? 'stripe' : 'paypal',
        amount_cents: Math.floor(Math.random() * 10000) + 500, // $5-$105
        donor_name: `Test Donor ${Math.floor(Math.random() * 1000)}`,
        donor_email: `test${Math.floor(Math.random() * 1000)}@example.com`,
        message: 'This is a test donation'
      }

      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })

      if (!response.ok) throw new Error('Failed to create test donation')
      
      alert('✅ Test donation created!')
      fetchData() // Refresh data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      alert(`❌ Error: ${message}`)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vatican-red mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando datos de donaciones...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">❌ Error: {error}</div>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-vatican-red text-white rounded hover:bg-opacity-90"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Panel de Donaciones</h1>
          <p className="text-gray-600 dark:text-gray-300">Administración y estadísticas de donaciones de SantaPalabra</p>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Donaciones</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_donations}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Recaudado</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCentsToDollars(stats.total_amount_cents)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Completadas</h3>
              <p className="text-2xl font-bold text-green-500 dark:text-green-300">{stats.completed_donations}</p>
            </div>
            {/* Stripe removed */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">PayPal</h3>
              <p className="text-2xl font-bold text-yellow-500 dark:text-yellow-300">{stats.paypal_donations}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Promedio</h3>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-100">{formatCentsToDollars(stats.average_amount_cents)}</p>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="mb-6 flex gap-4">
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            🔄 Actualizar
          </button>
          <button 
            onClick={createTestDonation}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            🧪 Crear Donación de Prueba
          </button>
        </div>

        {/* Tabla de donaciones */}
        <div className="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Donaciones Recientes</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Últimas {donations.length} donaciones</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Donante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Proveedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Verificado</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {donations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {new Date(donation.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {donation.donor_name || 'Anónimo'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {donation.donor_email || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCentsToDollars(donation.amount_cents)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        donation.payment_provider === 'stripe' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {donation.payment_provider.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                        style={{ backgroundColor: getStatusColor(donation.status) }}
                      >
                        {getStatusText(donation.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {donation.webhook_verified ? '✅' : '⏳'}
                    </td>
                  </tr>
                ))}
                {donations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No hay donaciones registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
