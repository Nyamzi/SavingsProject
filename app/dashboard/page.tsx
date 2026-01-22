'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wallet, ArrowUpRight, ArrowDownRight, Plus, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const depositSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine((val) => parseFloat(val) > 0, {
    message: 'Amount must be greater than 0',
  }),
  description: z.string().optional(),
})

const withdrawalSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine((val) => parseFloat(val) > 0, {
    message: 'Amount must be greater than 0',
  }),
  description: z.string().optional(),
})


type DepositForm = z.infer<typeof depositSchema>
type WithdrawalForm = z.infer<typeof withdrawalSchema>

interface SavingsData {
  amount: number
  currentBalance: number
  totalDeposits: number
  totalWithdrawals: number
  transactions: Array<{
    id: string
    type: string
    amount: number
    description: string
    createdAt: string
  }>
}

export default function DashboardPage() {
  const [savings, setSavings] = useState<SavingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)

  const depositForm = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
  })

  const withdrawalForm = useForm<WithdrawalForm>({
    resolver: zodResolver(withdrawalSchema),
  })

  const transferForm = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
  })

  useEffect(() => {
    fetchSavings()
  }, [])

  const fetchSavings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/savings', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setSavings(data)
      }
    } catch (error) {
      console.error('Error fetching savings:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleDeposit = async (data: DepositForm) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/savings/deposit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        depositForm.reset()
        setShowDepositModal(false)
        fetchSavings()
      } else {
        const result = await response.json()
        alert(result.error || 'Deposit failed')
      }
    } catch (error) {
      alert('An error occurred')
    }
  }

  const handleWithdrawal = async (data: WithdrawalForm) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/savings/withdraw', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        withdrawalForm.reset()
        setShowWithdrawalModal(false)
        fetchSavings()
      } else {
        const result = await response.json()
        alert(result.error || 'Withdrawal failed')
      }
    } catch (error) {
      alert('An error occurred')
    }
  }

  const handleTransfer = async (data: DepositForm) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/savings/transfer', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        transferForm.reset()
        setShowTransferModal(false)
        fetchSavings()
      } else {
        const result = await response.json()
        alert(result.error || 'Transfer failed')
      }
    } catch (error) {
      alert('An error occurred')
    }
  }


  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowDepositModal(true)}
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Deposit</span>
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors flex items-center space-x-2"
          >
            <ArrowRight size={20} />
            <span>Transfer to Savings</span>
          </button>
          <button
            onClick={() => setShowWithdrawalModal(true)}
            className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center space-x-2"
          >
            <ArrowDownRight size={20} />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* Account Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wallet className="text-blue-600" size={24} />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Current Balance</h3>
          <p className="text-3xl font-bold text-gray-900">
            {savings ? formatCurrency(Number(savings.currentBalance)) : '$0.00'}
          </p>
          <p className="text-xs text-gray-500 mt-2">Available for transactions</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Wallet className="text-green-600" size={24} />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Savings Account</h3>
          <p className="text-3xl font-bold text-gray-900">
            {savings ? formatCurrency(Number(savings.amount)) : '$0.00'}
          </p>
          <p className="text-xs text-gray-500 mt-2">Long-term savings</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="text-purple-600" size={24} />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Deposits</h3>
          <p className="text-3xl font-bold text-gray-900">
            {savings ? formatCurrency(Number(savings.totalDeposits)) : '$0.00'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <ArrowDownRight className="text-red-600" size={24} />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Withdrawals</h3>
          <p className="text-3xl font-bold text-gray-900">
            {savings ? formatCurrency(Number(savings.totalWithdrawals)) : '$0.00'}
          </p>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Make Deposit</h2>
            <form onSubmit={depositForm.handleSubmit(handleDeposit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  {...depositForm.register('amount')}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="0.00"
                />
                {depositForm.formState.errors.amount && (
                  <p className="mt-1 text-sm text-red-600">
                    {depositForm.formState.errors.amount.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  {...depositForm.register('description')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="Monthly savings"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDepositModal(false)
                    depositForm.reset()
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-600"
                >
                  Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Transfer to Savings</h2>
            <form onSubmit={transferForm.handleSubmit(handleTransfer)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (from Current Balance)
                </label>
                <input
                  {...transferForm.register('amount')}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  placeholder="0.00"
                />
                {transferForm.formState.errors.amount && (
                  <p className="mt-1 text-sm text-red-600">
                    {transferForm.formState.errors.amount.message}
                  </p>
                )}
                {savings && (
                  <p className="mt-1 text-xs text-gray-500">
                    Available: {formatCurrency(Number(savings.currentBalance))}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  {...transferForm.register('description')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  placeholder="Transfer to savings"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferModal(false)
                    transferForm.reset()
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-600"
                >
                  Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Make Withdrawal</h2>
            <form onSubmit={withdrawalForm.handleSubmit(handleWithdrawal)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  {...withdrawalForm.register('amount')}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900"
                  placeholder="0.00"
                />
                {withdrawalForm.formState.errors.amount && (
                  <p className="mt-1 text-sm text-red-600">
                    {withdrawalForm.formState.errors.amount.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  {...withdrawalForm.register('description')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900"
                  placeholder="Emergency withdrawal"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdrawalModal(false)
                    withdrawalForm.reset()
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-600"
                >
                  Withdraw
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
