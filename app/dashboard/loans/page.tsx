'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CreditCard, Plus, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

const loanRequestSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine((val) => parseFloat(val) > 0, {
    message: 'Amount must be greater than 0',
  }),
  duration: z.string().min(1, 'Duration is required').refine((val) => parseInt(val) > 0, {
    message: 'Duration must be greater than 0',
  }),
  interestRate: z.string().optional(),
  description: z.string().optional(),
})

type LoanRequestForm = z.infer<typeof loanRequestSchema>

interface Loan {
  id: string
  amount: number
  interestRate: number
  duration: number
  status: string
  remainingAmount: number
  totalRepaid: number
  totalExpected: number
  createdAt: string
  approvedAt: string | null
  dueDate: string | null
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)

  const form = useForm<LoanRequestForm>({
    resolver: zodResolver(loanRequestSchema),
    defaultValues: {
      interestRate: '0',
    },
  })

  useEffect(() => {
    fetchLoans()
  }, [])

  const fetchLoans = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/loans', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setLoans(data)
      }
    } catch (error) {
      console.error('Error fetching loans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoanRequest = async (data: LoanRequestForm) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/loans/request', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          interestRate: data.interestRate || '0',
        }),
      })

      if (response.ok) {
        form.reset()
        setShowRequestModal(false)
        fetchLoans()
      } else {
        const result = await response.json()
        alert(result.error || 'Loan request failed')
      }
    } catch (error) {
      alert('An error occurred')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
        return <CheckCircle className="text-green-600" size={20} />
      case 'REJECTED':
        return <XCircle className="text-red-600" size={20} />
      default:
        return <Clock className="text-yellow-600" size={20} />
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

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Loans</h1>
        <button
          onClick={() => setShowRequestModal(true)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Request Loan</span>
        </button>
      </div>

      {loans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loans.map((loan) => (
            <div key={loan.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {formatCurrency(Number(loan.amount))}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {loan.interestRate}% interest • {loan.duration} months
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loan.status)}`}>
                  {loan.status}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Principal Amount:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(Number(loan.amount))}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2 mt-2">
                  <span className="text-gray-600">Total Expected (with interest):</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(Number(loan.totalExpected))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Repaid:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(Number(loan.totalRepaid))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(Number(loan.remainingAmount))}
                  </span>
                </div>
                {loan.dueDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-semibold text-gray-900">
                      {formatDate(loan.dueDate)}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Requested: {formatDate(loan.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <CreditCard className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Loans Yet</h3>
          <p className="text-gray-600 mb-6">Request your first loan to get started</p>
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Request Loan
          </button>
        </div>
      )}

      {/* Loan Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Request Loan</h2>
            <form onSubmit={form.handleSubmit(handleLoanRequest)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Amount
                </label>
                <input
                  {...form.register('amount')}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="0.00"
                />
                {form.formState.errors.amount && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.amount.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (months)
                </label>
                <input
                  {...form.register('duration')}
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="12"
                />
                {form.formState.errors.duration && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.duration.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Rate (%)
                </label>
                <input
                  {...form.register('interestRate')}
                  type="number"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="5.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose (Optional)
                </label>
                <textarea
                  {...form.register('description')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Describe the purpose of this loan"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false)
                    form.reset()
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-600"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
