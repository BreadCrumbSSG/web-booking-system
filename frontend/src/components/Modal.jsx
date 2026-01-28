import React from 'react'
import { Button } from './Button.jsx'

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 sm:mx-0 bg-white rounded-xl shadow-xl dark:bg-slate-900 overflow-hidden ring-1 ring-slate-900/5">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 dark:bg-slate-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{title}</h3>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{children}</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/40 px-4 py-3 flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
