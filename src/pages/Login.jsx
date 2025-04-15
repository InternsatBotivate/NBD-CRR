"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showToast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // Credentials state
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  })

  // Google Sheet details for Login
  const sheetId = "1afFwVmnYe9nhSXrNxkm9nvm_fzKDuP-nqRjAku9N6og"
  const dropdownSheetName = "DROPDOWN"

  // Set isReady after a small delay to prevent white screen flash
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // We pass the username but now the role determination and
      // permissions are all determined from the Google Sheet
      await login(credentials.username)
      showToast("Login Successful", `Welcome back, ${credentials.username}!`)
      navigate("/") // Always navigate to dashboard first
    } catch (error) {
      showToast("Login Failed", "Invalid credentials. Please try again.", "destructive")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading screen until ready
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">NBD CRR</h1>
          <p className="text-gray-600">Customer Relationship and Revenue Management</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-indigo-200">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg p-4">
            <h2 className="text-xl font-bold flex items-center">
              <i className="fas fa-user mr-2"></i>
              Login
            </h2>
            <p className="text-indigo-100">
              Enter your credentials to access the system
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      className="pl-10 w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                    <i className="fas fa-user absolute left-3 top-2.5 text-gray-400"></i>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      className="pl-10 w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                    <i className="fas fa-lock absolute left-3 top-2.5 text-gray-400"></i>
                    <button
                      type="button"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`fas fa-${showPassword ? "eye-slash" : "eye"}`}></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-md"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Login credentials and permissions are managed in the DROPDOWN sheet</p>
        </div>
      </div>
    </div>
  )
}

export default Login