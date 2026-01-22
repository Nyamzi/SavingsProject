'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

/* -------------------- SCHEMAS -------------------- */

const loanRequestSchema = z.object({
  amount: z.coerce.number().positive(),
  duration: z.coerce.number().positive(),
  interestRate: z.coerce.number().min(0).default(0),
})

const repaySchema = z.object({
  amount: z.coerce.number().positive(),
})

type LoanRequestForm = z.infer<typeof loanRequestSchema>
type RepayForm = z.infer<typeof repaySchema>

type LoanStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'COMPLETED'

interface Loan {
  id: string
  amount: number
  interestRate: number
  duration: number
  status: LoanStatus
  remainingAmount: number
  totalRepaid: number
  totalExpected: number
  createdAt: string
  approvedAt: string | null
  dueDate: string | null
}

/* -------------------- COMPONENT -------------------- */

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'REPAY' | 'HISTORY'>('REPAY')
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [repayLoan, setRepayLoan] = useState<Loan | null>(null)
  const [viewStatement, setViewStatement] = useState<Loan | null>(null)

  const requestForm = useForm<LoanRequestForm>({
    resolver: zodResolver(loanRequestSchema),
    defaultValues: { interestRate: 0 },
  })

  const repayForm = useForm<RepayForm>({
    resolver: zodResolver(repaySchema),
  })

  useEffect(() => {
    fetchLoans()
  }, [])

  /* -------------------- DATA -------------------- */

  const fetchLoans = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch('/api/loans', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('Failed to fetch loans')
      setLoans(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const repayableLoans = loans.filter(
    (l) =>
      (l.status === 'APPROVED' || l.status === 'ACTIVE') &&
      l.remainingAmount > 0
  )

  // -------------------- STATS --------------------
  const stats = useMemo(() => {
    const approvedLoans = loans.filter(
      (l) => l.status === 'APPROVED' || l.status === 'ACTIVE'
    )

    return {
      borrowed: approvedLoans.reduce((s, l) => s + l.amount, 0),
      repaid: approvedLoans.reduce((s, l) => s + l.totalRepaid, 0),
      remaining: approvedLoans.reduce((s, l) => s + l.remainingAmount, 0),
    }
  }, [loans])

  const remainingMonths = (dueDate: string | null) => {
    if (!dueDate) return null
    const now = new Date()
    const due = new Date(dueDate)
    return Math.max(
      (due.getFullYear() - now.getFullYear()) * 12 +
        (due.getMonth() - now.getMonth()),
      0
    )
  }

  const monthlyInstallment = (loan: Loan) =>
    loan.duration > 0 ? loan.totalExpected / loan.duration : 0

  const dueStatus = (loan: Loan) => {
    if (!loan.dueDate) return null
    const days =
      (new Date(loan.dueDate).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)

    if (days < 0) return 'OVERDUE'
    if (days <= 7) return 'SOON'
    return null
  }

  /* -------------------- ACTIONS -------------------- */

  const handleLoanRequest = async (data: LoanRequestForm) => {
    const token = localStorage.getItem('token')
    if (!token) return
    await fetch('/api/loans/request', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setShowRequestModal(false)
    requestForm.reset()
    fetchLoans()
  }

  // -------------------- REPAIR: FIXED --------------------
  const handleRepayment = async (data: RepayForm) => {
    if (!repayLoan) return

    const repayAmount = parseFloat(data.amount as any)
    if (repayAmount > repayLoan.remainingAmount) {
      alert('Amount exceeds remaining balance')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/loans/repay', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loanId: repayLoan.id,
          amount: repayAmount,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        alert(result.error || 'Failed to process repayment')
        return
      }

      // Update local UI immediately
      const updatedLoan = result.loan
      setLoans((prev) =>
        prev.map((l) => (l.id === updatedLoan.id ? updatedLoan : l))
      )

      setRepayLoan(null)
      repayForm.reset()
    } catch (err) {
      console.error('Repayment error:', err)
      alert('Something went wrong')
    }
  }

  const downloadStatement = (loan: Loan) => {
    const amortization = generateAmortization(loan)
    const header = ['Month', 'Payment', 'Principal', 'Interest', 'Remaining']
    const rows = amortization.map((row) => [
      row.month,
      row.payment.toFixed(2),
      row.principal.toFixed(2),
      row.interest.toFixed(2),
      row.remaining.toFixed(2),
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [header, ...rows].map((e) => e.join(',')).join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `LoanStatement_${loan.id}_${loan.createdAt.slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading loans…</div>
  }

  /* -------------------- AMORTIZATION -------------------- */
  const generateAmortization = (loan: Loan) => {
    const schedule = []
    const monthlyRate = loan.interestRate / 100 / 12
    const principal = loan.amount
    const n = loan.duration
    const monthly =
      n > 0
        ? (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n)) || principal / n
        : principal

    let remaining = principal

    for (let i = 1; i <= n; i++) {
      const interest = remaining * monthlyRate
      const principalPaid = monthly - interest
      remaining = Math.max(0, remaining - principalPaid)
      schedule.push({
        month: i,
        payment: monthly,
        principal: principalPaid,
        interest,
        remaining,
      })
    }

    return schedule
  }

  /* -------------------- UI -------------------- */
  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Loans</h1>
        <button
          onClick={() => setShowRequestModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} /> New Loan
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Stat label="Total Borrowed" value={stats.borrowed} />
        <Stat label="Total Repaid" value={stats.repaid} />
        <Stat label="Remaining Balance" value={stats.remaining} />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        <Tab active={activeTab === 'REPAY'} onClick={() => setActiveTab('REPAY')}>Repay Loans</Tab>
        <Tab active={activeTab === 'HISTORY'} onClick={() => setActiveTab('HISTORY')}>Loan History</Tab>
      </div>

      {/* REPAY TAB */}
      {activeTab === 'REPAY' && (
        <div className="space-y-5">
          {repayableLoans.length === 0 && (
            <p className="text-slate-500">No loans available for repayment</p>
          )}
          {repayableLoans.map((loan) => {
            const progress = (loan.totalRepaid / loan.totalExpected) * 100
            return (
              <div
                key={loan.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatCurrency(loan.remainingAmount)} remaining
                    </p>
                    <p className="text-sm text-slate-600">
                      Due {formatDate(loan.dueDate!)} • {remainingMonths(loan.dueDate)} months left
                    </p>
                    <p className="text-sm text-slate-600">
                      Monthly: {formatCurrency(monthlyInstallment(loan))}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setRepayLoan(loan)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Repay
                    </button>
                    <button
                      onClick={() => setViewStatement(loan)}
                      className="text-sm text-blue-600 flex items-center gap-1"
                    >
                      <FileText size={14} /> Statement
                    </button>
                  </div>
                </div>

                {dueStatus(loan) && (
                  <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-100 p-2 rounded">
                    <AlertTriangle size={16} />
                    {dueStatus(loan) === 'OVERDUE' ? 'Loan overdue' : 'Due within 7 days'}
                  </div>
                )}

                <div className="w-full bg-slate-200 h-2 rounded">
                  <div className="bg-green-600 h-2 rounded" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-6">
          {loans.map((loan) => (
            <div
              key={loan.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex justify-between mb-3">
                <div>
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrency(loan.amount)}
                  </p>
                  <p className="text-sm text-slate-600">
                    {loan.interestRate}% • {loan.duration} months
                  </p>
                </div>
                <StatusBadge status={loan.status} />
              </div>

              <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-700">
                <p><strong>Requested:</strong> {formatDate(loan.createdAt)}</p>
                {loan.approvedAt && <p><strong>Approved:</strong> {formatDate(loan.approvedAt)}</p>}
                {loan.dueDate && <p><strong>Due:</strong> {formatDate(loan.dueDate)}</p>}
                <p><strong>Total expected:</strong> {formatCurrency(loan.totalExpected)}</p>
                <p><strong>Total repaid:</strong> {formatCurrency(loan.totalRepaid)}</p>
                <p><strong>Remaining:</strong> {formatCurrency(loan.remainingAmount)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* -------------------- MODALS -------------------- */}

      {showRequestModal && (
        <Modal title="Request Loan" onClose={() => setShowRequestModal(false)}>
          <form onSubmit={requestForm.handleSubmit(handleLoanRequest)} className="space-y-4">
            <Input {...requestForm.register('amount')} placeholder="Amount" />
            <Input {...requestForm.register('duration')} placeholder="Duration (months)" />
            <Input {...requestForm.register('interestRate')} placeholder="Interest %" />
            <PrimaryButton>Submit Request</PrimaryButton>
          </form>
        </Modal>
      )}

      {repayLoan && (
        <Modal title="Repay Loan" onClose={() => setRepayLoan(null)}>
          <p className="text-sm text-slate-600 mb-2">
            Remaining balance: {formatCurrency(repayLoan.remainingAmount)}
          </p>
          <form onSubmit={repayForm.handleSubmit(handleRepayment)} className="space-y-4">
            <Input
              {...repayForm.register('amount')}
              placeholder="Amount"
              type="number"
              step="0.01"
              min="0"
              max={repayLoan.remainingAmount}
            />
            <PrimaryButton>Confirm Payment</PrimaryButton>
          </form>
        </Modal>
      )}

      {viewStatement && (
        <Modal title="Loan Statement" onClose={() => setViewStatement(null)}>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-slate-600">
              Loan: {formatCurrency(viewStatement.amount)} • Due: {formatDate(viewStatement.dueDate)}
            </p>
            <button
              onClick={() => downloadStatement(viewStatement)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              Download CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 border-b">Month</th>
                  <th className="p-2 border-b">Payment</th>
                  <th className="p-2 border-b">Principal</th>
                  <th className="p-2 border-b">Interest</th>
                  <th className="p-2 border-b">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {generateAmortization(viewStatement).map((row) => {
                  const loanStart = new Date(viewStatement.approvedAt || viewStatement.createdAt)
                  const paymentDueDate = new Date(
                    loanStart.getFullYear(),
                    loanStart.getMonth() + row.month,
                    loanStart.getDate()
                  )
                  const isOverdue = paymentDueDate < new Date()
                  return (
                    <tr
                      key={row.month}
                      className={`border-b last:border-b-0 ${isOverdue ? 'bg-red-50 text-red-700 font-semibold' : ''}`}
                    >
                      <td className="p-2 text-center">{row.month}</td>
                      <td className="p-2 text-right">{formatCurrency(row.payment)}</td>
                      <td className="p-2 text-right">{formatCurrency(row.principal)}</td>
                      <td className="p-2 text-right">{formatCurrency(row.interest)}</td>
                      <td className="p-2 text-right">{formatCurrency(row.remaining)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* -------------------- UI COMPONENTS -------------------- */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900">{formatCurrency(value)}</p>
    </div>
  )
}

function Tab({ active, children, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium ${
        active ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

function StatusBadge({ status }: { status: LoanStatus }) {
  const map: any = {
    APPROVED: 'bg-green-100 text-green-700',
    ACTIVE: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
  }
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status]}`}>{status}</span>
}

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-500">Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Input(props: any) {
  return <input {...props} className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
}

function PrimaryButton({ children }: any) {
  return <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">{children}</button>
}
