'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, ArrowDownRight, CreditCard, Wallet, Filter, Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import jsPDF from 'jspdf'

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
  const [filterType, setFilterType] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

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
      case 'GOAL_ALLOCATION':
        return <ArrowDownRight className="text-orange-600" size={20} />
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
      case 'GOAL_ALLOCATION':
        return 'bg-orange-100'
      default:
        return 'bg-gray-100'
    }
  }

  const filteredTransactions = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase()
    return transactions
      .filter((t) => filterType === 'ALL' || t.type === filterType)
      .filter((t) => {
        if (!searchLower) return true
        const text = `${t.description || ''} ${t.type}`.toLowerCase()
        return text.includes(searchLower)
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [transactions, filterType, searchTerm])

  const groupedByDate = useMemo(() => {
    return filteredTransactions.reduce<Record<string, Transaction[]>>((acc, t) => {
      const dateKey = new Date(t.createdAt).toLocaleDateString()
      acc[dateKey] = acc[dateKey] || []
      acc[dateKey].push(t)
      return acc
    }, {})
  }, [filteredTransactions])

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.type === 'DEPOSIT' || t.type === 'LOAN') acc.in += Number(t.amount)
        if (t.type === 'WITHDRAWAL' || t.type === 'LOAN_REPAYMENT' || t.type === 'GOAL_ALLOCATION') {
          acc.out += Number(t.amount)
        }
        acc.count += 1
        return acc
      },
      { in: 0, out: 0, count: 0 }
    )
  }, [transactions])

  const downloadTransactionsPdf = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 12
    let y = 14

    // Header
    doc.setFillColor(22, 163, 74)
    doc.roundedRect(margin, y - 6, 12, 12, 2, 2, 'F')
    doc.setFillColor(220, 38, 38)
    doc.circle(margin + 8.5, y - 0.5, 3.5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text('WS', margin + 2, y + 1)

    doc.setTextColor(15, 23, 42)
    doc.setFontSize(14)
    doc.text('Watermelon Savings', margin + 18, y + 2)
    y += 10

    doc.setFontSize(12)
    doc.text('Transactions Report', margin, y)
    y += 6
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y)
    y += 8

    const columns = [
      { label: 'Date', width: 26 },
      { label: 'Type', width: 28 },
      { label: 'Description', width: 70 },
      { label: 'Amount', width: 26 },
      { label: 'Direction', width: 22 },
    ]

    doc.setFillColor(241, 245, 249)
    doc.rect(margin, y - 4, pageWidth - margin * 2, 8, 'F')
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(9)

    let x = margin
    columns.forEach((col) => {
      doc.text(col.label, x + 1, y + 1)
      x += col.width
    })
    y += 8

    const addRow = (values: string[], zebra: boolean) => {
      if (y > 285) {
        doc.addPage()
        y = 14
      }
      if (zebra) {
        doc.setFillColor(248, 250, 252)
        doc.rect(margin, y - 4, pageWidth - margin * 2, 7, 'F')
      }
      doc.setTextColor(51, 65, 85)
      doc.setFontSize(8.5)
      let colX = margin
      values.forEach((val, index) => {
        doc.text(val, colX + 1, y + 1)
        colX += columns[index].width
      })
      y += 7
    }

    if (filteredTransactions.length === 0) {
      addRow(['-', '-', 'No transactions to display', '-', '-'], false)
    } else {
      filteredTransactions.forEach((t, index) => {
        const direction = t.type === 'DEPOSIT' || t.type === 'LOAN' ? 'IN' : 'OUT'
        addRow(
          [
            new Date(t.createdAt).toLocaleDateString(),
            t.type,
            (t.description || t.type).slice(0, 36),
            formatCurrency(Number(t.amount)),
            direction,
          ],
          index % 2 === 1
        )
      })
    }

    doc.save('Transactions_Report.pdf')
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Transactions</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Total In</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.in)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Total Out</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.out)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900">{totals.count}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex flex-col md:flex-row gap-4 md:items-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Filter size={18} />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
        >
          <option value="ALL">All Types</option>
          <option value="DEPOSIT">Deposits</option>
          <option value="WITHDRAWAL">Withdrawals</option>
          <option value="LOAN">Loans</option>
          <option value="LOAN_REPAYMENT">Loan Repayments</option>
          <option value="GOAL_ALLOCATION">Goal Allocations</option>
        </select>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search description or type..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 w-full md:max-w-sm"
        />
        <button
          onClick={downloadTransactionsPdf}
          className="inline-flex items-center gap-2 text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 md:ml-auto"
        >
          <Download size={16} />
          Download PDF
        </button>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {filteredTransactions.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedByDate).map(([date, items]) => (
              <div key={date}>
                <div className="text-sm text-gray-500 font-semibold mb-3">{date}</div>
                <div className="space-y-3">
                  {items.map((transaction) => (
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
                          <p className="text-xs text-gray-500">
                            {formatDate(transaction.createdAt)} • {transaction.type}
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No transactions match your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
