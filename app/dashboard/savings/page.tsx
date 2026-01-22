'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wallet, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight, Plus, PiggyBank, Target } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

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

interface SavingsData {
  amount: number
  currentBalance: number
  totalDeposits: number
  totalWithdrawals: number
}

interface Goal {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
  createdAt: string
}

const goalSchema = z.object({
  name: z.string().min(2, 'Goal name is required'),
  targetAmount: z.string().min(1, 'Target amount is required').refine((val) => parseFloat(val) > 0, {
    message: 'Target amount must be greater than 0',
  }),
})

const allocateSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine((val) => parseFloat(val) > 0, {
    message: 'Amount must be greater than 0',
  }),
})

type GoalForm = z.infer<typeof goalSchema>
type AllocateForm = z.infer<typeof allocateSchema>

export default function SavingsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [savings, setSavings] = useState<SavingsData | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false)
  const [showAllocateGoalModal, setShowAllocateGoalModal] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)

  const goalForm = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
  })

  const allocateForm = useForm<AllocateForm>({
    resolver: zodResolver(allocateSchema),
  })

  useEffect(() => {
    fetchDashboardData()
    fetchSavings()
    fetchGoals()
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

  const fetchSavings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/savings', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setSavings({
          amount: data.amount,
          currentBalance: data.currentBalance,
          totalDeposits: data.totalDeposits,
          totalWithdrawals: data.totalWithdrawals,
        })
      }
    } catch (error) {
      console.error('Error fetching savings:', error)
    }
  }

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/goals', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setGoals(data)
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
    }
  }

  const handleCreateGoal = async (data: GoalForm) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        goalForm.reset()
        setShowCreateGoalModal(false)
        fetchGoals()
      } else {
        const result = await response.json()
        alert(result.error || 'Goal creation failed')
      }
    } catch (error) {
      alert('An error occurred')
    }
  }

  const handleAllocateGoal = async (data: AllocateForm) => {
    if (!selectedGoal) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/goals/${selectedGoal.id}/allocate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        allocateForm.reset()
        setShowAllocateGoalModal(false)
        setSelectedGoal(null)
        fetchGoals()
        fetchSavings()
      } else {
        const result = await response.json()
        alert(result.error || 'Allocation failed')
      }
    } catch (error) {
      alert('An error occurred')
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Savings</h1>

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

      {/* Savings Goals */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Savings Goals</h2>
            <p className="text-sm text-gray-500">
              Distribute your savings into specific goals.
            </p>
          </div>
          <button
            onClick={() => setShowCreateGoalModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} />
            Create Goal
          </button>
        </div>

        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const progress = goal.targetAmount > 0
                ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)
                : 0
              const remaining = Math.max(0, goal.targetAmount - goal.savedAmount)
              return (
                <div
                  key={goal.id}
                  className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <PiggyBank className="text-blue-600" size={20} />
                      <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedGoal(goal)
                        setShowAllocateGoalModal(true)
                      }}
                      className="text-sm px-3 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      Allocate
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Saved {formatCurrency(goal.savedAmount)} of {formatCurrency(goal.targetAmount)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Remaining: {formatCurrency(remaining)}</span>
                    <span>Created: {formatDate(goal.createdAt)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Target className="mx-auto mb-2 text-gray-400" size={28} />
            <p>No goals yet. Create your first goal to start allocating savings.</p>
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      {showCreateGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Goal</h2>
            <form onSubmit={goalForm.handleSubmit(handleCreateGoal)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Name
                </label>
                <input
                  {...goalForm.register('name')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="e.g. School fees"
                />
                {goalForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {goalForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Amount
                </label>
                <input
                  {...goalForm.register('targetAmount')}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="0.00"
                />
                {goalForm.formState.errors.targetAmount && (
                  <p className="mt-1 text-sm text-red-600">
                    {goalForm.formState.errors.targetAmount.message}
                  </p>
                )}
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateGoalModal(false)
                    goalForm.reset()
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Goal Modal */}
      {showAllocateGoalModal && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Allocate to Goal</h2>
            <p className="text-sm text-gray-600 mb-4">
              {selectedGoal.name} • Remaining {formatCurrency(Math.max(0, selectedGoal.targetAmount - selectedGoal.savedAmount))}
            </p>
            <form onSubmit={allocateForm.handleSubmit(handleAllocateGoal)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  {...allocateForm.register('amount')}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="0.00"
                />
                {allocateForm.formState.errors.amount && (
                  <p className="mt-1 text-sm text-red-600">
                    {allocateForm.formState.errors.amount.message}
                  </p>
                )}
                {savings && (
                  <p className="mt-1 text-xs text-gray-500">
                    Available in savings: {formatCurrency(Number(savings.amount))}
                  </p>
                )}
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAllocateGoalModal(false)
                    setSelectedGoal(null)
                    allocateForm.reset()
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Allocate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
