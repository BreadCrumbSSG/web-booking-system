import React from 'react'

export function Card({ className = '', children }) {
  return (
    <div className={`rounded-xl border bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700 ${className}`}>{children}</div>
  )
}

export function CardBody({ className = '', children }) {
  return <div className={`p-3 sm:p-4 ${className}`}>{children}</div>
}

export function CardTitle({ className = '', children }) {
  return <h3 className={`text-lg font-semibold mb-2 ${className}`}>{children}</h3>
}
