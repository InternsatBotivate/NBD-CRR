"use client"

import { Link, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"

function Sidebar() {
  const location = useLocation()
  const { userRole, userName, userPermissions, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setIsOpen(!mobile)
    }

    // Initial check
    checkMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Don't render sidebar on login page
  if (location.pathname === "/login") {
    return null
  }

  const routes = [
    {
      title: "Dashboard",
      icon: "chart-pie",
      href: "/",
      active: location.pathname === "/",
      permission: "dashboard",
    },
    {
      title: "New Enquiry",
      icon: "plus-circle",
      href: "/new-enquiry",
      active: location.pathname === "/new-enquiry",
      permission: "newEnquiry",
    },
    {
      title: "On Call Followup",
      icon: "phone",
      href: "/on-call-followup",
      active: location.pathname === "/on-call-followup",
      permission: "onCallFollowup",
    },
    {
      title: "Make Quotation",
      icon: "file-invoice-dollar",
      href: "/make-quotation",
      active: location.pathname === "/make-quotation",
      permission: "makeQuotation",
    },
    {
      title: "Update Quotation",
      icon: "file-invoice",
      href: "/update-quotation",
      active: location.pathname === "/update-quotation",
      permission: "updateQuotation",
    },
    {
      title: "Quotation Validation",
      icon: "check-square",
      href: "/quotation-validation",
      active: location.pathname === "/quotation-validation",
      permission: "quotationValidation",
    },
    {
      title: "Screenshot Update",
      icon: "image",
      href: "/screenshot-update",
      active: location.pathname === "/screenshot-update",
      permission: "screenshotUpdate",
    },
    {
      title: "Followup Steps",
      icon: "calendar",
      href: "/followup-steps",
      active: location.pathname === "/followup-steps",
      permission: "followupSteps",
    },
    {
      title: "Order Status",
      icon: "shopping-cart",
      href: "/order-status",
      active: location.pathname === "/order-status",
      permission: "orderStatus",
    },
  ]

  // Filter routes based on user permissions
  const filteredRoutes = routes.filter((route) => userRole === "admin" || userPermissions[route.permission])

  // Add user management route for admin only
  if (userRole === "admin") {
    filteredRoutes.push({
      title: "User Management",
      icon: "user-group",
      href: "/user-management",
      active: location.pathname === "/user-management",
      permission: "userManagement",
    })
  }

  // Close sidebar when clicking a link on mobile
  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setIsOpen(false)}></div>
      )}

      {/* Mobile toggle button - always visible on mobile */}
      {isMobile && (
        <button
          className="fixed top-4 left-4 z-30 bg-white text-gray-700 p-2.5 rounded-md shadow-md flex items-center justify-center w-10 h-10 border border-gray-200"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          <i className={`fas fa-${isOpen ? "times" : "bars"} text-lg`}></i>
        </button>
      )}

      <div
        className={`bg-white border-r shadow-sm min-h-screen flex flex-col transition-all duration-300 fixed md:static z-20
          ${isOpen ? "w-64 translate-x-0" : "w-0 md:w-16 -translate-x-full md:translate-x-0"}`}
      >
        <div className="border-b p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-2 text-xl font-bold">
            <i className="fas fa-home"></i>
            {isOpen && <span>NBD CRR</span>}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {isOpen && userName && (
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                  {userName?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{userName}</p>
                  <p className="text-xs text-gray-500 capitalize">{userRole} Account</p>
                </div>
              </div>
            </div>
          )}

          <nav className="p-2">
            <ul className="space-y-1">
              {filteredRoutes.map((route) => (
                <li key={route.href}>
                  <Link
                    to={route.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                      route.active
                        ? "text-white bg-gradient-to-r from-indigo-600 to-purple-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={handleLinkClick}
                  >
                    <i className={`fas fa-${route.icon} w-5 h-5`}></i>
                    {isOpen && <span>{route.title}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-t p-4">
          <div className="space-y-4">
            <button
              className="w-full flex items-center justify-start px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              onClick={logout}
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              {isOpen && <span>Logout</span>}
            </button>
            {isOpen && <div className="text-xs text-gray-500">NBD CRR v1.0.0</div>}
          </div>
        </div>

        {!isMobile && (
          <button
            className="absolute right-0 top-20 bg-white border border-gray-200 rounded-r-md p-1 shadow-sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            <i className={`fas fa-chevron-${isOpen ? "left" : "right"} text-gray-500`}></i>
          </button>
        )}
      </div>
    </>
  )
}

export default Sidebar
