'use client'

import { useEffect, useState } from 'react'
import { Users, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface AdminStats {
  totalMembers: number
  totalSavings: number
  totalDeposits: number
  totalLoans: number
  totalRepaid: number
  totalInterestEarned: number
  interestCollected: number
  pendingLoans: number
  activeLoans: number
  completedLoans: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else if (response.status === 403) {
        alert('Access denied. Admin privileges required.')
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your savings group and monitor performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Members</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.totalMembers || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Savings</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats ? formatCurrency(stats.totalSavings) : '$0.00'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="text-purple-600" size={24} />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Active Loans</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.activeLoans || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Pending Loans</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.pendingLoans || 0}
          </p>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Loan Revenue</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Loans Issued</span>
              <span className="text-lg font-semibold text-gray-900">
                {stats ? formatCurrency(stats.totalLoans) : '$0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Repaid</span>
              <span className="text-lg font-semibold text-green-600">
                {stats ? formatCurrency(stats.totalRepaid) : '$0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-4">
              <span className="text-gray-600">Outstanding</span>
              <span className="text-lg font-semibold text-orange-600">
                {stats ? formatCurrency(stats.totalLoans - stats.totalRepaid) : '$0.00'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Interest Earnings</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Projected Interest</span>
              <span className="text-lg font-semibold text-gray-900">
                {stats ? formatCurrency(stats.totalInterestEarned) : '$0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Interest Collected</span>
              <span className="text-lg font-semibold text-green-600">
                {stats ? formatCurrency(stats.interestCollected) : '$0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-4">
              <span className="text-gray-600">Pending Interest</span>
              <span className="text-lg font-semibold text-yellow-600">
                {stats ? formatCurrency(stats.totalInterestEarned - stats.interestCollected) : '$0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/dashboard/admin/loans"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-blue-500"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Manage Loans</h3>
              <p className="text-sm text-gray-600">
                {stats?.pendingLoans || 0} pending approval
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/admin/members"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-green-500"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">View Members</h3>
              <p className="text-sm text-gray-600">
                {stats?.totalMembers || 0} total members
              </p>
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Loan Performance</h3>
              <p className="text-sm text-gray-600">
                {stats?.completedLoans || 0} completed loans
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
