"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showToast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("user") // Track active tab state

  // Admin login form state
  const [adminCredentials, setAdminCredentials] = useState({
    username: "",
    password: "",
  })

  // User login form state
  const [userCredentials, setUserCredentials] = useState({
    username: "",
    password: "",
  })

  const handleAdminLogin = (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call for admin login
    setTimeout(() => {
      setIsLoading(false)

      // Mock validation - in a real app, this would be a server-side check
      if (adminCredentials.username === "admin" && adminCredentials.password === "admin123") {
        // Set admin session/cookie
        login("admin", adminCredentials.username)

        showToast("Login Successful", "Welcome back, Administrator!")

        navigate("/")
      } else {
        showToast("Login Failed", "Invalid admin credentials. Please try again.", "destructive")
      }
    }, 1000)
  }

  const handleUserLogin = (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call for user login
    setTimeout(() => {
      setIsLoading(false)

      // Mock validation - in a real app, this would be a server-side check
      if (userCredentials.username && userCredentials.password === "user123") {
        // Set user session/cookie
        login("user", userCredentials.username)

        showToast("Login Successful", `Welcome back, ${userCredentials.username}!`)

        navigate("/")
      } else {
        showToast("Login Failed", "Invalid user credentials. Please try again.", "destructive")
      }
    }, 1000)
  }

  // Switch to user tab
  const switchToUserTab = () => {
    setActiveTab("user")
  }

  // Switch to admin tab
  const switchToAdminTab = () => {
    setActiveTab("admin")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">NBD CRR</h1>
          <p className="text-gray-600">Customer Relationship and Revenue Management</p>
        </div>

        <div className="mb-4">
          <div className="flex border-b border-gray-200">
            <button
              className={`w-1/2 py-2 px-4 text-center border-b-2 ${
                activeTab === "user" ? "border-indigo-500 text-indigo-500" : "border-transparent"
              } font-medium transition-colors duration-300`}
              onClick={switchToUserTab}
            >
              User Login
            </button>
            <button
              className={`w-1/2 py-2 px-4 text-center border-b-2 ${
                activeTab === "admin" ? "border-indigo-500 text-indigo-500" : "border-transparent"
              } font-medium transition-colors duration-300`}
              onClick={switchToAdminTab}
            >
              Admin Login
            </button>
          </div>
        </div>

        <div className={activeTab === "user" ? "block" : "hidden"}>
          <div className="bg-white rounded-lg shadow-lg border border-indigo-200">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg p-4">
              <h2 className="text-xl font-bold flex items-center">
                <i className="fas fa-user mr-2"></i>
                User Login
              </h2>
              <p className="text-indigo-100">Login to access your assigned modules</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleUserLogin}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="user-username" className="block text-sm font-medium">
                      Username
                    </label>
                    <div className="relative">
                      <input
                        id="user-username"
                        type="text"
                        placeholder="Enter your username"
                        value={userCredentials.username}
                        onChange={(e) => setUserCredentials({ ...userCredentials, username: e.target.value })}
                        className="pl-10 w-full p-2 border border-gray-300 rounded-md"
                        required
                      />
                      <i className="fas fa-user absolute left-3 top-2.5 text-gray-400"></i>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="user-password" className="block text-sm font-medium">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="user-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={userCredentials.password}
                        onChange={(e) => setUserCredentials({ ...userCredentials, password: e.target.value })}
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
        </div>

        <div className={activeTab === "admin" ? "block" : "hidden"}>
          <div className="bg-white rounded-lg shadow-lg border border-indigo-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg p-4">
              <h2 className="text-xl font-bold flex items-center">
                <i className="fas fa-lock mr-2"></i>
                Administrator Login
              </h2>
              <p className="text-blue-100">Login to access system administration</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleAdminLogin}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="admin-username" className="block text-sm font-medium">
                      Admin Username
                    </label>
                    <div className="relative">
                      <input
                        id="admin-username"
                        type="text"
                        placeholder="Enter admin username"
                        value={adminCredentials.username}
                        onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
                        className="pl-10 w-full p-2 border border-gray-300 rounded-md"
                        required
                      />
                      <i className="fas fa-user absolute left-3 top-2.5 text-gray-400"></i>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="admin-password" className="block text-sm font-medium">
                      Admin Password
                    </label>
                    <div className="relative">
                      <input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter admin password"
                        value={adminCredentials.password}
                        onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
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
                    className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Demo Credentials:</p>
          <p>Admin: admin / admin123</p>
          <p>User: user1 / user123</p>
        </div>
      </div>
    </div>
  )
}

export default Login