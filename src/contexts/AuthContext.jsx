"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const AuthContext = createContext(undefined)

const defaultPermissions = {
  dashboard: true,
  newEnquiry: true,
  onCallFollowup: true,
  updateQuotation: true,
  quotationValidation: true,
  screenshotUpdate: true,
  followupSteps: true,
  orderStatus: true,
  makeQuotation: true,
  analytics: true,
  settings: true,
}

function AuthProviderWithNavigate({ children }) {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [userName, setUserName] = useState(null)
  const [userPermissions, setUserPermissions] = useState(defaultPermissions)
  const [isLoading, setIsLoading] = useState(true) // Add loading state

  // Check for existing session on mount
  useEffect(() => {
    const loadAuthState = () => {
      const storedRole = localStorage.getItem("userRole")
      const storedName = localStorage.getItem("userName")

      if (storedRole && storedName) {
        setIsAuthenticated(true)
        setUserRole(storedRole)
        setUserName(storedName)

        // Set permissions based on role
        if (storedRole === "admin") {
          setUserPermissions(defaultPermissions)
        } else {
          // For users, load their specific permissions
          const userSpecificPermissions = {
            ...defaultPermissions,
            // Example: restrict some features for regular users
            settings: false,
            analytics: false,
          }
          setUserPermissions(userSpecificPermissions)
        }
      }

      // Mark loading as complete
      setIsLoading(false)
    }

    loadAuthState()
  }, [])

  const login = (role, name) => {
    setIsAuthenticated(true)
    setUserRole(role)
    setUserName(name)

    // Set permissions based on role
    if (role === "admin") {
      setUserPermissions(defaultPermissions)
    } else {
      // For users, set restricted permissions
      setUserPermissions({
        ...defaultPermissions,
        settings: false,
        analytics: false,
      })
    }

    localStorage.setItem("userRole", role)
    localStorage.setItem("userName", name)
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUserRole(null)
    setUserName(null)
    setUserPermissions({})

    localStorage.removeItem("userRole")
    localStorage.removeItem("userName")

    navigate("/login")
  }

  const updatePermissions = (permissions) => {
    setUserPermissions(permissions)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userRole,
        userName,
        userPermissions,
        isLoading, // Expose loading state
        login,
        logout,
        updatePermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Create a wrapper component that doesn't use navigate
export function AuthProvider({ children }) {
  return <AuthProviderWithNavigate>{children}</AuthProviderWithNavigate>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

