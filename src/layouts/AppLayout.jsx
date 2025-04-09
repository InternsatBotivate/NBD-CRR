"use client"

import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { useAuth } from "../contexts/AuthContext"
import { Toast } from "../components/Toast"

function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !isAuthenticated && location.pathname !== "/login") {
      navigate("/login")
    }

    // Set a small delay to ensure components are properly loaded
    // This helps prevent the white screen flash on mobile
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [isAuthenticated, navigate, location.pathname, isLoading])

  // Show nothing while authentication state is loading
  if (isLoading || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto w-full md:pl-0 pl-0">
        <div className="pt-16 md:pt-0 px-4 md:px-6">
          <Outlet />
        </div>
      </main>
      <Toast />
    </div>
  )
}

export default AppLayout
