'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, CreditCard, User } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Loan {
  id: string
  userId: string
  user: {
    id: string
    email: string
    name: string
  }
  amount: number
  interestRate: number
  duration: number
  status: string
  remainingAmount: number
  totalRepaid: number
  totalExpected: number
  approvedAt: string | null
  dueDate: string | null
  createdAt: string
}

export default function AdminLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL') // ALL, PENDING, APPROVED, ACTIVE, REJECTED

  useEffect(() => {
    fetchLoans()
  }, [])

  const fetchLoans = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/loans', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setLoans(data)
      } else if (response.status === 403) {
        alert('Access denied. Admin privileges required.')
      }
    } catch (error) {
      console.error('Error fetching loans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (loanId: string) => {
    if (!confirm('Are you sure you want to approve this loan?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/loans/${loanId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        fetchLoans()
        alert('Loan approved successfully!')
      } else {
        const result = await response.json()
        alert(result.error || 'Failed to approve loan')
      }
    } catch (error) {
      alert('An error occurred')
    }
  }

  const handleReject = async (loanId: string) => {
    if (!confirm('Are you sure you want to reject this loan?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/loans/${loanId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        fetchLoans()
        alert('Loan rejected successfully!')
      } else {
        const result = await response.json()
        alert(result.error || 'Failed to reject loan')
      }
    } catch (error) {
      alert('An error occurred')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const filteredLoans = filter === 'ALL' 
    ? loans 
    : loans.filter(loan => loan.status === filter)

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  const pendingLoans = loans.filter(loan => loan.status === 'PENDING')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan Management</h1>
          <p className="text-gray-600">Approve, reject, and manage all loan requests</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex space-x-2 border-b">
        {[
          { value: 'ALL', label: 'All Loans' },
          { value: 'PENDING', label: `Pending (${pendingLoans.length})` },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'ACTIVE', label: 'Active' },
          { value: 'REJECTED', label: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === tab.value
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loans List */}
      {filteredLoans.length > 0 ? (
        <div className="space-y-4">
          {filteredLoans.map((loan) => (
            <div key={loan.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {formatCurrency(loan.amount)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Requested by {loan.user.name} ({loan.user.email})
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500">Principal</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(loan.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Interest Rate</p>
                      <p className="font-semibold text-gray-900">{loan.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Expected</p>
                      <p className="font-semibold text-blue-600">
                        {formatCurrency(loan.totalExpected)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Repaid</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(loan.totalRepaid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Remaining</p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(loan.remainingAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Duration: {loan.duration} months</p>
                  </div>

                  <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                    <span>Requested: {formatDate(loan.createdAt)}</span>
                    {loan.approvedAt && (
                      <span>Approved: {formatDate(loan.approvedAt)}</span>
                    )}
                    {loan.dueDate && (
                      <span>Due: {formatDate(loan.dueDate)}</span>
                    )}
                  </div>
                </div>

                <div className="ml-6 flex flex-col items-end space-y-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loan.status)}`}>
                    {loan.status}
                  </span>

                  {loan.status === 'PENDING' && (
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handleApprove(loan.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center space-x-1"
                      >
                        <CheckCircle size={16} />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(loan.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center space-x-1"
                      >
                        <XCircle size={16} />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Clock className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Loans Found</h3>
          <p className="text-gray-600">No loans match the selected filter</p>
        </div>
      )}
    </div>
  )
}
