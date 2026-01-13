'use client'

import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface DashboardStats {
  totalSavings: number
  totalLoans: number
  activeLoans: number
  recentTransactions: Array<{
    id: string
    type: string
    amount: number
    description: string
    createdAt: string
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Wallet className="text-green-600" size={24} />
            </div>
            <ArrowUpRight className="text-green-600" size={20} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Savings</h3>
          <p className="text-2xl font-bold text-gray-900">
            {stats ? formatCurrency(Number(stats.totalSavings)) : '$0.00'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="text-blue-600" size={24} />
            </div>
            <TrendingUp className="text-blue-600" size={20} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Active Loans</h3>
          <p className="text-2xl font-bold text-gray-900">
            {stats ? stats.activeLoans : 0}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-red-600" size={24} />
            </div>
            <ArrowDownRight className="text-red-600" size={20} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Loans</h3>
          <p className="text-2xl font-bold text-gray-900">
            {stats ? formatCurrency(Number(stats.totalLoans)) : '$0.00'}
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
          <Link
            href="/dashboard/transactions"
            className="text-green-600 hover:text-green-700 font-medium text-sm"
          >
            View All
          </Link>
        </div>

        {stats && stats.recentTransactions.length > 0 ? (
          <div className="space-y-4">
            {stats.recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'DEPOSIT'
                        ? 'bg-green-100'
                        : transaction.type === 'LOAN'
                        ? 'bg-blue-100'
                        : 'bg-red-100'
                    }`}
                  >
                    {transaction.type === 'DEPOSIT' ? (
                      <ArrowUpRight className="text-green-600" size={20} />
                    ) : (
                      <ArrowDownRight className="text-red-600" size={20} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.description || transaction.type}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      transaction.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'DEPOSIT' ? '+' : '-'}
                    {formatCurrency(Number(transaction.amount))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No transactions yet</p>
            <Link
              href="/dashboard/savings"
              className="text-green-600 hover:text-green-700 font-medium mt-2 inline-block"
            >
              Make your first deposit
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
