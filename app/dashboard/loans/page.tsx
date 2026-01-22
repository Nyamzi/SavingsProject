'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  AlertTriangle,
  FileText,
  Download,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import jsPDF from 'jspdf'

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
  const [activeTab, setActiveTab] = useState<'REPAY' | 'HISTORY'>('HISTORY')
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [repayLoan, setRepayLoan] = useState<Loan | null>(null)
  const [viewStatement, setViewStatement] = useState<Loan | null>(null)
  const [statementFrequency, setStatementFrequency] = useState<'MONTHLY' | 'WEEKLY' | 'DAILY'>('MONTHLY')
  const [repayFrequency, setRepayFrequency] = useState<'MONTHLY' | 'WEEKLY' | 'DAILY'>('MONTHLY')

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

  const repayableLoans = loans.filter((l) => {
    const remaining = Math.max(0, l.totalExpected - l.totalRepaid)
    return (l.status === 'APPROVED' || l.status === 'ACTIVE') && remaining > 0
  })

  // -------------------- STATS --------------------
  const stats = useMemo(() => {
    const borrowedLoans = loans.filter((l) =>
      l.status === 'APPROVED' || l.status === 'ACTIVE' || l.status === 'COMPLETED'
    )

    const borrowed = borrowedLoans.reduce((s, l) => s + l.amount, 0)
    const repaid = borrowedLoans.reduce((s, l) => s + l.totalRepaid, 0)
    const interestPaid = borrowedLoans.reduce((s, l) => {
      const totalExpected = l.totalExpected
      const paid = Math.min(l.totalRepaid, totalExpected)
      return s + Math.max(0, paid - l.amount)
    }, 0)
    const remaining = borrowedLoans.reduce(
      (s, l) => s + Math.max(0, l.totalExpected - l.totalRepaid),
      0
    )

    return { borrowed, repaid, interestPaid, remaining }
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

  const remainingBalance = (loan: Loan) =>
    Math.max(0, loan.totalExpected - loan.totalRepaid)

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
    const res = await fetch('/api/loans/request', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result = await res.json()
    if (!res.ok) {
      alert(result.error || 'Loan request failed')
      return
    }

    setShowRequestModal(false)
    requestForm.reset()
    fetchLoans()
  }

  // -------------------- REPAIR: FIXED --------------------
  const handleRepayment = async (data: RepayForm) => {
    if (!repayLoan) return

    const repayAmount = parseFloat(data.amount as any)
    if (repayAmount > remainingBalance(repayLoan)) {
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

  const downloadSectionPdf = (title: string, items: Loan[]) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 12
    let y = 14

    // Header with logo-like mark
    doc.setFillColor(22, 163, 74) // green
    doc.roundedRect(margin, y - 6, 12, 12, 2, 2, 'F')
    doc.setFillColor(220, 38, 38) // red
    doc.circle(margin + 8.5, y - 0.5, 3.5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text('WS', margin + 2, y + 1)

    doc.setTextColor(15, 23, 42)
    doc.setFontSize(14)
    doc.text('Watermelon Savings', margin + 18, y + 2)
    y += 10

    doc.setFontSize(12)
    doc.text(`${title} Report`, margin, y)
    y += 6

    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y)
    y += 8

    // Summary
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(10)
    doc.text(`Total loans: ${items.length}`, margin, y)
    y += 8

    // Table header
    const columns = [
      { label: 'Loan ID', width: 20 },
      { label: 'Amount', width: 26 },
      { label: 'Interest', width: 18 },
      { label: 'Duration', width: 18 },
      { label: 'Expected', width: 26 },
      { label: 'Repaid', width: 24 },
      { label: 'Remaining', width: 26 },
      { label: 'Status', width: 18 },
    ]

    const headerY = y
    doc.setFillColor(241, 245, 249)
    doc.rect(margin, headerY - 4, pageWidth - margin * 2, 8, 'F')
    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59)

    let x = margin
    columns.forEach((col) => {
      doc.text(col.label, x + 1, headerY + 1)
      x += col.width
    })

    y = headerY + 8

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

    if (items.length === 0) {
      addRow(['No loans in this category.', '', '', '', '', '', '', ''], false)
    } else {
      items.forEach((loan, index) => {
        addRow(
          [
            loan.id.slice(0, 8),
            formatCurrency(loan.amount),
            `${loan.interestRate}%`,
            `${loan.duration}m`,
            formatCurrency(loan.totalExpected),
            formatCurrency(loan.totalRepaid),
            formatCurrency(remainingBalance(loan)),
            loan.status,
          ],
          index % 2 === 1
        )
      })
    }

    doc.save(`${title.replace(/\s+/g, '_')}_Report.pdf`)
  }

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading loans…</div>
  }

  /* -------------------- AMORTIZATION -------------------- */
  const getScheduleConfig = (loan: Loan, frequency: 'MONTHLY' | 'WEEKLY' | 'DAILY') => {
    const annualRate = loan.interestRate / 100
    if (frequency === 'DAILY') {
      return { periods: loan.duration * 30, rate: annualRate / 365, label: 'day' }
    }
    if (frequency === 'WEEKLY') {
      return { periods: loan.duration * 4, rate: annualRate / 52, label: 'week' }
    }
    return { periods: loan.duration, rate: annualRate / 12, label: 'month' }
  }

  const generateAmortization = (
    loan: Loan,
    frequency: 'MONTHLY' | 'WEEKLY' | 'DAILY' = 'MONTHLY'
  ) => {
    const schedule = []
    const config = getScheduleConfig(loan, frequency)
    const periodRate = config.rate
    const principal = loan.amount
    const n = Math.max(1, config.periods)
    const payment =
      n > 0
        ? (principal * periodRate) / (1 - Math.pow(1 + periodRate, -n)) || principal / n
        : principal

    let remaining = principal

    for (let i = 1; i <= n; i++) {
      const interest = remaining * periodRate
      const principalPaid = payment - interest
      remaining = Math.max(0, remaining - principalPaid)
      schedule.push({
        month: i,
        payment: payment,
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('REPAY')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} /> Repay Loans
          </button>
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} /> New Loan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Stat label="Total Borrowed" value={stats.borrowed} />
        <Stat label="Total Repaid" value={stats.repaid} />
        <Stat label="Interest Paid" value={stats.interestPaid} />
        <Stat label="Remaining Balance" value={stats.remaining} />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-2">
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
                      {formatCurrency(remainingBalance(loan))} remaining
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
        <div className="space-y-8">
          {[
            {
              title: 'Approved Loans',
              subtitle: 'Loans that are approved or active',
              items: loans.filter((l) => l.status === 'APPROVED' || l.status === 'ACTIVE'),
            },
            {
              title: 'Completed Loans',
              subtitle: 'Loans fully repaid',
              items: loans.filter(
                (l) => l.status === 'COMPLETED' && remainingBalance(l) === 0
              ),
            },
            {
              title: 'Rejected Loans',
              subtitle: 'Loan requests that were rejected',
              items: loans.filter((l) => l.status === 'REJECTED'),
            },
          ].map((section) => (
            <div key={section.title} className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                  <p className="text-sm text-slate-500">{section.subtitle}</p>
                </div>
                <button
                  onClick={() => downloadSectionPdf(section.title, section.items)}
                  className="inline-flex items-center gap-2 text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
                >
                  <Download size={16} />
                  Download PDF
                </button>
              </div>

              {section.items.length === 0 ? (
                <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-4">
                  No loans in this category
                </div>
              ) : (
                section.items.map((loan) => (
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
                      <p><strong>Remaining:</strong> {formatCurrency(remainingBalance(loan))}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {/* -------------------- MODALS -------------------- */}

      {showRequestModal && (
        <Modal title="Request Loan" onClose={() => setShowRequestModal(false)}>
          <form onSubmit={requestForm.handleSubmit(handleLoanRequest)} className="space-y-4">
            <Input {...requestForm.register('amount')} placeholder="Amount" type="number" step="0.01" min="0" />
            <Input {...requestForm.register('duration')} placeholder="Duration (months)" type="number" min="1" />
            <Input {...requestForm.register('interestRate')} placeholder="Interest %" type="number" step="0.1" min="0" />
            <PrimaryButton>Submit Request</PrimaryButton>
          </form>
        </Modal>
      )}

      {repayLoan && (
        <Modal title="Repay Loan" onClose={() => setRepayLoan(null)}>
          <p className="text-sm text-slate-600 mb-2">
            Remaining balance: {formatCurrency(remainingBalance(repayLoan))}
          </p>
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className="text-slate-600">Repayment plan:</span>
            {(['MONTHLY', 'WEEKLY', 'DAILY'] as const).map((freq) => (
              <button
                key={freq}
                onClick={() => setRepayFrequency(freq)}
                className={`px-3 py-1 rounded-full border ${
                  repayFrequency === freq
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800'
                }`}
              >
                {freq[0] + freq.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-600 mb-3">
            You should pay{' '}
            <span className="font-semibold text-slate-900">
              {formatCurrency(generateAmortization(repayLoan, repayFrequency)[0]?.payment || 0)}
            </span>{' '}
            per {repayFrequency.toLowerCase().slice(0, -2)}.
          </p>
          <form onSubmit={repayForm.handleSubmit(handleRepayment)} className="space-y-4">
            <Input
              {...repayForm.register('amount')}
              placeholder="Amount"
              type="number"
              step="0.01"
              min="0"
              max={remainingBalance(repayLoan)}
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

          <div className="grid md:grid-cols-3 gap-3 mb-4 text-sm text-slate-700">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-500">Monthly Payment</p>
              <p className="font-semibold text-slate-900">
                {formatCurrency(generateAmortization(viewStatement, 'MONTHLY')[0]?.payment || 0)}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-500">Weekly Payment</p>
              <p className="font-semibold text-slate-900">
                {formatCurrency(generateAmortization(viewStatement, 'WEEKLY')[0]?.payment || 0)}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-500">Daily Payment</p>
              <p className="font-semibold text-slate-900">
                {formatCurrency(generateAmortization(viewStatement, 'DAILY')[0]?.payment || 0)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className="text-slate-600">Schedule:</span>
            {(['MONTHLY', 'WEEKLY', 'DAILY'] as const).map((freq) => (
              <button
                key={freq}
                onClick={() => setStatementFrequency(freq)}
                className={`px-3 py-1 rounded-full border ${
                  statementFrequency === freq
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800'
                }`}
              >
                {freq[0] + freq.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div
            className={`overflow-x-auto ${
              statementFrequency === 'DAILY' ? 'max-h-[420px] overflow-y-auto' : ''
            }`}
          >
            <table className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 border-b">Period</th>
                  <th className="p-2 border-b">Payment</th>
                  <th className="p-2 border-b">Principal</th>
                  <th className="p-2 border-b">Interest</th>
                  <th className="p-2 border-b">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {generateAmortization(viewStatement, statementFrequency).map((row) => {
                  const loanStart = new Date(viewStatement.approvedAt || viewStatement.createdAt)
                  const periodLength =
                    statementFrequency === 'DAILY'
                      ? 1
                      : statementFrequency === 'WEEKLY'
                      ? 7
                      : 30
                  const paymentDueDate =
                    statementFrequency === 'MONTHLY'
                      ? new Date(
                          loanStart.getFullYear(),
                          loanStart.getMonth() + row.month,
                          loanStart.getDate()
                        )
                      : new Date(
                          loanStart.getFullYear(),
                          loanStart.getMonth(),
                          loanStart.getDate() + row.month * periodLength
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

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => (
    <input
      {...props}
      ref={ref}
      className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  )
)
Input.displayName = 'Input'

function PrimaryButton({ children }: any) {
  return <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">{children}</button>
}
