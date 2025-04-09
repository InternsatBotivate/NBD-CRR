"use client"

import { useToast } from "../contexts/ToastContext"

export function Toast() {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-[90vw] md:max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg min-w-[250px] w-full animate-slideIn ${
            toast.variant === "destructive"
              ? "bg-red-100 border border-red-200 text-red-800"
              : "bg-white border border-gray-200"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="pr-2">
              <h3 className="font-medium text-sm md:text-base">{toast.title}</h3>
              {toast.description && <p className="text-xs md:text-sm text-gray-600">{toast.description}</p>}
            </div>
            <button onClick={() => dismissToast(toast.id)} className="text-gray-500 hover:text-gray-800 flex-shrink-0">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
