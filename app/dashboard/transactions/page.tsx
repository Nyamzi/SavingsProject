'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, ArrowDownRight, CreditCard, Wallet } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Transaction {
  id: string
  type: string
  amount: number
  description: string | null
  createdAt: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowUpRight className="text-green-600" size={20} />
      case 'WITHDRAWAL':
        return <ArrowDownRight className="text-red-600" size={20} />
      case 'LOAN':
        return <CreditCard className="text-blue-600" size={20} />
      case 'LOAN_REPAYMENT':
        return <Wallet className="text-purple-600" size={20} />
      default:
        return <Wallet className="text-gray-600" size={20} />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return 'bg-green-100'
      case 'WITHDRAWAL':
        return 'bg-red-100'
      case 'LOAN':
        return 'bg-blue-100'
      case 'LOAN_REPAYMENT':
        return 'bg-purple-100'
      default:
        return 'bg-gray-100'
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Transactions</h1>

      <div className="bg-white rounded-xl shadow-lg p-6">
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.description || transaction.type}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      transaction.type === 'DEPOSIT' || transaction.type === 'LOAN'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {(transaction.type === 'DEPOSIT' || transaction.type === 'LOAN') ? '+' : '-'}
                    {formatCurrency(Number(transaction.amount))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{transaction.type}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
