import React from 'react'

const base = 'inline-flex items-center justify-center rounded-lg text-sm px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-400 disabled:opacity-60 disabled:cursor-not-allowed dark:focus:ring-offset-slate-900'

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'bg-slate-700 text-white hover:bg-slate-800',
  outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800'
}

export function Button({ variant = 'primary', className = '', ...props }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}
