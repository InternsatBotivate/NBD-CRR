"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import StageLayout from "../components/StageLayout"

function OnCallFollowupPage() {
  const [pendingTasks, setPendingTasks] = useState([])
  const [historyTasks, setHistoryTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [historyHeaders, setHistoryHeaders] = useState([])
  const [pendingHeaders, setPendingHeaders] = useState([])

  // Google Sheet details
  const sheetId = "1afFwVmnYe9nhSXrNxkm9nvm_fzKDuP-nqRjAku9N6og"
  const pendingSheetName = "REPORT"
  const historySheetName = "On Call Folloup and Technical Requiement"

  useEffect(() => {
    // Fetch data when component mounts
    fetchPendingTasks()
    fetchHistoryTasks()
  }, [])

  // Format Google Sheets date to YYYY-MM-DD
  const formatSheetDate = (dateValue) => {
    if (!dateValue) return ""

    // Check if it's in the Google Sheets Date() format
    if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
      const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateValue)
      if (match) {
        const year = parseInt(match[1], 10)
        const month = parseInt(match[2], 10) + 1 // Add 1 because Google Sheets months are 0-indexed
        const day = parseInt(match[3], 10)
        
        // Format as YYYY-MM-DD
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      }
    }
    
    // If it's already a formatted date string, return it
    return dateValue
  }

  const fetchPendingTasks = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch data from Google Sheet
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(pendingSheetName)}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }

      // Extract JSON data from the response
      const text = await response.text()
      const jsonStart = text.indexOf("{")
      const jsonEnd = text.lastIndexOf("}")
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)

      console.log("Fetched data structure:", {
        hasTable: !!data.table,
        rowCount: data.table?.rows?.length || 0,
        colCount: data.table?.cols?.length || 0
      })

      // Get the headers from the sheet to display in the pending table
      const headers = data.table.cols.map((col, index) => ({
        id: index,
        label: col.label || `Column ${String.fromCharCode(65 + index)}`
      }))

      // Store header information
      setPendingHeaders(headers)

      // Process data into tasks format
      const { pending } = processSheetData(data)
      setPendingTasks(pending)

      console.log(`Processed ${pending.length} pending tasks`)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setError("Failed to load tasks.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchHistoryTasks = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch data from History Sheet
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(historySheetName)}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch history data: ${response.status}`)
      }

      // Extract JSON data from the response
      const text = await response.text()
      const jsonStart = text.indexOf("{")
      const jsonEnd = text.lastIndexOf("}")
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)

      // Process the history data
      if (!data.table || !data.table.rows || !data.table.cols) {
        setHistoryTasks([])
        return
      }

      // Get only the first 9 columns (A to I)
      const headers = data.table.cols
        .slice(0, 9)
        .map((col, index) => ({
          id: index,
          label: col.label || `Column ${String.fromCharCode(65 + index)}`
        }))

      setHistoryHeaders(headers)

      // Process each row (only first 9 columns)
      const historyRows = []
      
      data.table.rows.forEach((row, rowIndex) => {
        if (!row.c) return

        const historyRow = {
          id: `history-${rowIndex}`
        }

        // Process only first 9 columns (A to I)
        for (let i = 0; i < 9 && i < row.c.length; i++) {
          const cell = row.c[i]
          
          if (cell && cell.v !== null) {
            // Check for formatted value first
            if (cell.f) {
              historyRow[`col${i}`] = cell.f.toString().trim()
            } 
            // Check if this might be a date column
            else if (headers[i].label.toLowerCase().includes('date') || 
                    headers[i].label.toLowerCase().includes('timestamp')) {
              historyRow[`col${i}`] = formatSheetDate(cell.v.toString().trim())
            }
            // Regular value
            else {
              historyRow[`col${i}`] = cell.v.toString().trim()
            }
          } else {
            historyRow[`col${i}`] = ""
          }
        }

        historyRows.push(historyRow)
      })

      setHistoryTasks(historyRows)
    } catch (error) {
      console.error("Error fetching history tasks:", error)
      setError("Failed to load history data.")
    } finally {
      setIsLoading(false)
    }
  }

  // Process the raw sheet data into the format needed for the tables
const processSheetData = (data) => {
  const pending = []
  const history = []

  if (!data.table || !data.table.rows || !data.table.cols) {
    console.log("Data is missing table structure")
    return { pending, history }
  }

  // Output all column headers to help with debugging
  console.log("Column headers:", data.table.cols.map((col, idx) => 
    `Column ${String.fromCharCode(65 + idx)}: ${col.label || 'No label'}`
  ))

  // Find the column indexes for each required field
  // First, let's map actual column positions from your spreadsheet
  const cols = {
    enquiryNo: 1,        // Column B: "Enquiry No."
    companyName: 6,      // Column H: "Company Name"
    contactPerson: 7,    // Column I: "Contact Person"
    approximateValue: 14, // Column O: "Approximate Value"
    priority: 19,        // Column W: "Priority" (from third image)
    delay: 26,           // Column AA: "Delay 1" (from third image)
    status: 28,          // Column AC: "Discussion Status" (from third image)
    columnV: 21,         // Column V: "Planned1" (from third image)
    columnW: 22,         // Column W: "Actual1" (from third image)
  }

  // Log found column indices for debugging
  console.log("Using column indices:", cols)

  // Count rows for debugging
  let totalRows = 0
  let rowsPassingVWCondition = 0

  // Process each row
  data.table.rows.forEach((row, rowIndex) => {
    totalRows++
    if (!row.c) return

    // Helper function to safely get cell values
    const getValue = (index) => {
      if (index === undefined || !row.c[index] || row.c[index].v === null) return ""
      return row.c[index].v.toString().trim()
    }

    // Check column V and W conditions
    const columnVValue = row.c[cols.columnV] ? row.c[cols.columnV].v : null
    const columnWValue = row.c[cols.columnW] ? row.c[cols.columnW].v : null

    // Debug at row level
    if (rowIndex < 8) {
      console.log(`Row ${rowIndex} - V: ${columnVValue}, W: ${columnWValue}, Enquiry: ${row.c[cols.enquiryNo]?.v || 'none'}, Company: ${row.c[cols.companyName]?.v || 'none'}`)
    }

    // Condition: Column V has a value AND Column W is null/empty/undefined
    const isValidRow = columnVValue && (columnWValue === null || columnWValue === undefined || columnWValue === "")

    // Skip rows that don't meet the condition
    if (!isValidRow) return
    
    rowsPassingVWCondition++

    // Important change: Let's directly use the row index as identifier if there's no enquiry number
    // This way we don't skip rows that might be missing an enquiry number
    const enquiryNo = getValue(cols.enquiryNo) || `Row-${rowIndex + 1}`

    // Calculate pending days from delay column or default to 0
    let days = 0
    if (cols.delay !== null && row.c[cols.delay] && row.c[cols.delay].v) {
      const delayValue = row.c[cols.delay].v
      days = typeof delayValue === "number" ? delayValue : Number.parseInt(delayValue.toString(), 10) || 0
    }

    // Get the status value or set a default
    const status = getValue(cols.status) || "Pending"

    // Format approximate value (from column O)
    let approximateValue = getValue(cols.approximateValue) || ""
    // Add rupees symbol if it's a number
    if (!isNaN(approximateValue) && approximateValue !== "") {
      approximateValue = `₹${Number(approximateValue).toLocaleString()}`
    }

    // Create task object with all available data
    const task = {
      id: `task-${rowIndex}`,
      rowData: {}, // We'll store all data from the row here
      enquiryNo: enquiryNo,
      companyName: getValue(cols.companyName) || "Unknown",
      contactPerson: getValue(cols.contactPerson) || "Unknown",
      approximateValue: approximateValue,
      priority: getValue(cols.priority) || "Low",
      days: days,
      formLink: "/forms/on-call-followup",
      status: status,
      // plannedDate: columnVValue,
    }
    
    // Store all column data for display
    for (let i = 0; i < (row.c?.length || 0); i++) {
      if (row.c[i] && row.c[i].v !== null) {
        // Special handling for date values
        if (typeof row.c[i].v === 'string' && row.c[i].v.startsWith('Date(')) {
          const dateMatch = /Date\((\d+),(\d+),(\d+)\)/.exec(row.c[i].v)
          if (dateMatch) {
            const year = parseInt(dateMatch[1], 10)
            const month = parseInt(dateMatch[2], 10) + 1
            const day = parseInt(dateMatch[3], 10)
            task.rowData[`col${i}`] = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
          } else {
            task.rowData[`col${i}`] = row.c[i].v.toString().trim()
          }
        } else {
          task.rowData[`col${i}`] = row.c[i].v.toString().trim()
        }
      } else {
        task.rowData[`col${i}`] = ""
      }
    }

    // Determine if this is a pending or history task
    const statusLower = task.status.toLowerCase()
    if (statusLower.includes("complete") || statusLower.includes("closed") || statusLower.includes("done")) {
      history.push(task)
    } else {
      pending.push(task)
    }
  })

  // Log counts for debugging
  console.log(`Total rows: ${totalRows}`)
  console.log(`Rows passing V/W condition: ${rowsPassingVWCondition}`)
  console.log(`Final pending count: ${pending.length}`)
  console.log(`Final history count: ${history.length}`)

  return { pending, history }
}

  // Component for pending tasks with refresh button
const PendingContent = () => (
  <div>
    <div className="flex justify-between items-center mb-4">
      <button onClick={fetchPendingTasks} className="px-3 py-1 bg-blue-600 text-white rounded-md" disabled={isLoading}>
        {isLoading ? "Loading..." : "Refresh"}
      </button>
    </div>

    {isLoading ? (
      <div className="flex justify-center items-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-blue-600">Loading data...</span>
      </div>
    ) : error ? (
      <div className="text-center py-4 text-red-500">{error}</div>
    ) : pendingTasks.length === 0 ? (
      <div className="text-center py-4 text-gray-500">
        No pending tasks found. Make sure you have rows where column V has a value and column W is empty.
        <div className="mt-4">
          <button 
            onClick={() => console.log("Data debug enabled")} 
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md"
          >
            Debug Data
          </button>
        </div>
      </div>
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
                Approximate Value
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
            {pendingTasks.map((task) => (
              <tr key={task.id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{task.enquiryNo}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">{task.companyName}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">{task.approximateValue}</td>
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
                      companyName: task.companyName,
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
  // Component for history tasks
  const HistoryContent = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button onClick={fetchHistoryTasks} className="px-3 py-1 bg-blue-600 text-white rounded-md" disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-blue-600">Loading data...</span>
        </div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">{error}</div>
      ) : historyTasks.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No history data found.</div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {historyHeaders.map((header) => (
                  <th key={`header-${header.id}`} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historyTasks.map((task) => (
                <tr key={task.id}>
                  {historyHeaders.map((header, index) => {
                    const columnKey = `col${index}`;
                    const value = task[columnKey];
                    
                    // Special formatting for Discussion Status column
                    if (header.label === "Discussion Status" && value) {
                      const statusColor = value.toLowerCase().includes('positive')
                        ? "bg-green-100 text-green-800"
                        : value.toLowerCase().includes('negative')
                          ? "bg-red-100 text-red-800"
                          : value.toLowerCase().includes('neutral')
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800";
                      
                      return (
                        <td key={`${task.id}-${columnKey}`} className="px-4 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${statusColor}`}>
                            {value}
                          </span>
                        </td>
                      );
                    }
                    
                    return (
                      <td key={`${task.id}-${columnKey}`} className="px-4 py-2 whitespace-nowrap text-sm">
                        {value || "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  return (
    <StageLayout
      title="On Call Followup"
      description="Follow-up calls with potential clients that require action"
      pendingContent={<PendingContent />}
      historyContent={<HistoryContent />}
      formLink="/forms/on-call-followup"
      // formLinkText="New Followup"
    />
  )
}

export default OnCallFollowupPage