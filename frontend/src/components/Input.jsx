import React, { forwardRef } from 'react'

export const Input = forwardRef(function Input({ className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      {...props}
      className={`flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 ${className}`}
    />
  )
})
