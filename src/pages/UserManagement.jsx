"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"

// Mock user data
const mockUsers = [
  {
    id: "1",
    name: "Rahul Sharma",
    username: "rahul",
    role: "user",
    permissions: {
      dashboard: true,
      newEnquiry: true,
      onCallFollowup: true,
      updateQuotation: true,
      quotationValidation: false,
      screenshotUpdate: false,
      followupSteps: true,
      orderStatus: false,
      makeQuotation: true,
      analytics: false,
      settings: false,
    },
  },
  {
    id: "2",
    name: "Priya Patel",
    username: "priya",
    role: "user",
    permissions: {
      dashboard: true,
      newEnquiry: true,
      onCallFollowup: false,
      updateQuotation: false,
      quotationValidation: true,
      screenshotUpdate: true,
      followupSteps: false,
      orderStatus: true,
      makeQuotation: false,
      analytics: false,
      settings: false,
    },
  },
]

function UserManagementPage() {
  const { userRole } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [users, setUsers] = useState(mockUsers)
  const [editingUser, setEditingUser] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    password: "",
    role: "user",
    permissions: {
      dashboard: true,
      newEnquiry: false,
      onCallFollowup: false,
      updateQuotation: false,
      quotationValidation: false,
      screenshotUpdate: false,
      followupSteps: false,
      orderStatus: false,
      makeQuotation: false,
      analytics: false,
      settings: false,
    },
  })

  // Check if user is admin
  useEffect(() => {
    if (userRole !== "admin") {
      navigate("/")
      showToast("Access Denied", "You don't have permission to access this page.", "destructive")
    }
  }, [userRole, navigate, showToast])

  const handleEditUser = (user) => {
    setEditingUser({ ...user })
  }

  const handleUpdateUser = () => {
    setUsers(users.map((user) => (user.id === editingUser.id ? editingUser : user)))
    setEditingUser(null)
    showToast("User Updated", `User ${editingUser.name} has been updated successfully.`)
  }

  const handleDeleteUser = (userId) => {
    setUsers(users.filter((user) => user.id !== userId))
    showToast("User Deleted", "User has been deleted successfully.")
  }

  const handleAddUser = () => {
    const newId = (Math.max(...users.map((u) => Number.parseInt(u.id))) + 1).toString()
    setUsers([...users, { ...newUser, id: newId }])
    setShowAddForm(false)
    setNewUser({
      name: "",
      username: "",
      password: "",
      role: "user",
      permissions: {
        dashboard: true,
        newEnquiry: false,
        onCallFollowup: false,
        updateQuotation: false,
        quotationValidation: false,
        screenshotUpdate: false,
        followupSteps: false,
        orderStatus: false,
        makeQuotation: false,
        analytics: false,
        settings: false,
      },
    })
    showToast("User Added", `User ${newUser.name} has been added successfully.`)
  }

  const handlePermissionChange = (user, permission, value) => {
    if (user === "new") {
      setNewUser({
        ...newUser,
        permissions: {
          ...newUser.permissions,
          [permission]: value,
        },
      })
    } else {
      setEditingUser({
        ...editingUser,
        permissions: {
          ...editingUser.permissions,
          [permission]: value,
        },
      })
    }
  }

  const permissionLabels = {
    dashboard: "Dashboard",
    newEnquiry: "New Enquiry",
    onCallFollowup: "On Call Followup",
    updateQuotation: "Update Quotation",
    quotationValidation: "Quotation Validation",
    screenshotUpdate: "Screenshot Update",
    followupSteps: "Followup Steps",
    orderStatus: "Order Status",
    makeQuotation: "Make Quotation",
    analytics: "Analytics",
    settings: "Settings",
  }

  if (userRole !== "admin") {
    return null
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
          onClick={() => setShowAddForm(true)}
        >
          <i className="fas fa-plus-circle mr-2"></i>
          Add User
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow border mb-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-t-lg">
            <h2 className="text-lg font-bold">Add New User</h2>
            <p className="text-indigo-100 text-sm">Create a new user account and set permissions</p>
          </div>
          <div className="p-6">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Module Permissions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`new-${key}`}
                        checked={newUser.permissions[key]}
                        onChange={(e) => handlePermissionChange("new", key, e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor={`new-${key}`} className="text-sm">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
                  onClick={handleAddUser}
                >
                  <i className="fas fa-save mr-2"></i>
                  Save User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">User Accounts</h2>
          <p className="text-sm text-gray-500">Manage user accounts and their permissions</p>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{user.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{user.username}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm capitalize">{user.role}</td>
                  <td className="px-4 py-2 text-sm">
                    {Object.entries(user.permissions)
                      .filter(([_, value]) => value)
                      .map(([key]) => permissionLabels[key])
                      .join(", ")}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        className="text-indigo-600 hover:text-indigo-900 border border-gray-300 rounded-md px-2 py-1"
                        onClick={() => handleEditUser(user)}
                      >
                        <i className="fas fa-pencil-alt"></i>
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 border border-gray-300 rounded-md px-2 py-1"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 rounded-t-lg">
              <h2 className="text-lg font-bold">Edit User: {editingUser.name}</h2>
              <p className="text-blue-100 text-sm">Update user details and permissions</p>
            </div>
            <div className="p-6">
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="edit-name" className="block text-sm font-medium">
                      Full Name
                    </label>
                    <input
                      id="edit-name"
                      type="text"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-username" className="block text-sm font-medium">
                      Username
                    </label>
                    <input
                      id="edit-username"
                      type="text"
                      value={editingUser.username}
                      onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Module Permissions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(permissionLabels).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`edit-${key}`}
                          checked={editingUser.permissions[key]}
                          onChange={(e) => handlePermissionChange(editingUser, key, e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor={`edit-${key}`} className="text-sm">
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
                    onClick={handleUpdateUser}
                  >
                    <i className="fas fa-save mr-2"></i>
                    Update User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagementPage

