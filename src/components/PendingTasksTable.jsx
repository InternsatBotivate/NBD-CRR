"use client"
import { Link } from "react-router-dom"

function PendingTasksTable({ tasks, isLoading, error, onRefresh }) {
  return (
    <div>
      {onRefresh && (
        <div className="flex justify-between items-center mb-4">
          <button onClick={onRefresh} className="px-3 py-1 bg-blue-600 text-white rounded-md" disabled={isLoading}>
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-blue-600">Loading data...</span>
        </div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No pending tasks found.</div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enquiry No.
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Person
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending Days
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{task.enquiryNo}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{task.companyName}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{task.contactPerson}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        task.priority.toLowerCase() === "high"
                          ? "bg-red-100 text-red-800"
                          : task.priority.toLowerCase() === "medium"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{task.days}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <Link
                      to={`${task.formLink}/${task.enquiryNo}`}
                      state={{ 
                        enquiryNo: task.enquiryNo, 
                        companyName: task.companyName 
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Process
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default PendingTasksTable
