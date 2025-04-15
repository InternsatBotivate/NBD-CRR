// AuthContext.js
import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const AuthContext = createContext(undefined)

function AuthProviderWithNavigate({ children }) {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [userName, setUserName] = useState(null)
  const [userPermissions, setUserPermissions] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  // Google Sheet details
  const sheetId = "1afFwVmnYe9nhSXrNxkm9nvm_fzKDuP-nqRjAku9N6og"
  const dropdownSheetName = "DROPDOWN"

  // Helper function to extract JSON data from Google Sheets response
  const extractJsonFromResponse = async (response) => {
    const text = await response.text()
    const jsonStart = text.indexOf("{")
    const jsonEnd = text.lastIndexOf("}")
    const jsonString = text.substring(jsonStart, jsonEnd + 1)
    return JSON.parse(jsonString)
  }

  // Fetch user permissions from DROPDOWN sheet
  const fetchUserPermissions = async (username) => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(dropdownSheetName)}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch user permissions: ${response.status}`)
      }

      const data = await extractJsonFromResponse(response)

      // Find the row with matching username in column T
      const userRow = data.table.rows.find(
        (row) => row.c && row.c[19] && row.c[19].v.toString().trim().toLowerCase() === username.toLowerCase()
      )

      if (!userRow) {
        throw new Error("User not found")
      }

      // Get user role from column W
      const userRole = userRow.c[22] ? userRow.c[22].v.toString().trim().toLowerCase() : null

      // Get user permissions from column V - for both users AND admins
      const permissionsString = userRow.c[21] ? userRow.c[21].v.toString().trim() : ""
      
      // Check if permission is set to "all"
      if (permissionsString.toLowerCase() === "all") {
        // Give access to all pages
        return {
          userRole,
          userPermissions: {
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
            settings: true
          }
        }
      }
      
      // Otherwise process comma-separated list
      const permissionsList = permissionsString.split(",").map((p) => p.trim())

      // Create permissions object based on the list
      const userPermissions = {}
      permissionsList.forEach((permission) => {
        userPermissions[permission] = true
      })

      return { userRole, userPermissions }
    } catch (error) {
      console.error("Error fetching user permissions:", error)
      return { userRole: null, userPermissions: {} }
    }
  }

  // Check for existing session on mount
  useEffect(() => {
    const loadAuthState = async () => {
      const storedRole = localStorage.getItem("userRole")
      const storedName = localStorage.getItem("userName")

      if (storedRole && storedName) {
        setIsAuthenticated(true)
        setUserRole(storedRole)
        setUserName(storedName)

        // Fetch user permissions based on stored username
        const { userPermissions } = await fetchUserPermissions(storedName)
        
        // Use the permissions from column V for both admin and regular users
        setUserPermissions(userPermissions)
      }

      // Mark loading as complete
      setIsLoading(false)
    }

    loadAuthState()
  }, [])

  const login = async (name, role) => {
    // Fetch user permissions based on provided username
    const { userRole, userPermissions } = await fetchUserPermissions(name)

    setIsAuthenticated(true)
    setUserRole(userRole)
    setUserName(name)
    
    // Use permissions from column V for both admin and regular users
    setUserPermissions(userPermissions)

    localStorage.setItem("userRole", userRole)
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
        isLoading,
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