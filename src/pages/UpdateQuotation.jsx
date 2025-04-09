"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import StageLayout from "../components/StageLayout"

function UpdateQuotationPage() {
  const [pendingTasks, setPendingTasks] = useState([])
  const [historyTasks, setHistoryTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [historyHeaders, setHistoryHeaders] = useState([])

  // Google Sheet details
  const sheetId = "1afFwVmnYe9nhSXrNxkm9nvm_fzKDuP-nqRjAku9N6og"
  const pendingSheetName = "REPORT"
  const historySheetName = "Quotation Update"

  useEffect(() => {
    // Fetch data when component mounts
    fetchPendingTasks()
    fetchHistoryTasks()
  }, [])

  // Convert index to Excel-style column letters (A, B, ..., Z, AA, AB, ..., AZ, etc.)
  const getColumnLetters = (index) => {
    let columnName = '';
    let remaining = index;
    
    while (remaining >= 0) {
      columnName = String.fromCharCode(65 + (remaining % 26)) + columnName;
      remaining = Math.floor(remaining / 26) - 1;
    }
    return columnName;
  }

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

  const fetchHistoryTasks = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch data from Quotation Update Sheet
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
          label: col.label || `Column ${getColumnLetters(index)}`
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
      `Column ${getColumnLetters(idx)}: ${col.label || 'No label'}`
    ))

    // Find the column indexes for each required field
    const cols = {
      enquiryNo: null,       // Column B
      quotationNumber: null, // Column AZ
      companyName: null,     // Column G
      contactPerson: null,   // Column H
      priority: null,        // Column T
      columnN: null,         // Column N data for Pending column
      delay: null,
      status: null,
      columnV: 29,           // Column V for filtering
      columnW: 30,           // Column W for filtering
    }

    data.table.cols.forEach((col, index) => {
      const label = col.label?.toLowerCase() || ""
      // Get the column letter (A=0, B=1, etc.) using the new function
      const colLetter = getColumnLetters(index)

      // Map specific columns by their Excel-style column letters
      if (colLetter === "B") {
        cols.enquiryNo = index
      } else if (colLetter === "AG") {
        cols.quotationNumber = index
      } else if (colLetter === "G") {
        cols.companyName = index
      } else if (colLetter === "H") {
        cols.contactPerson = index
      } else if (colLetter === "T") {
        cols.priority = index
      } else if (colLetter === "AF") {
        cols.columnN = index
      } else if (label.includes("delay")) {
        cols.delay = index
      } else if (label.includes("status")) {
        cols.status = index
      }
    })

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
        if (index === undefined || index === null || !row.c[index] || row.c[index].v === null) return ""
        return row.c[index].v.toString().trim()
      }

      // Check column V and W conditions
      const columnVValue = cols.columnV !== null && row.c[cols.columnV] ? row.c[cols.columnV].v : null
      const columnWValue = cols.columnW !== null && row.c[cols.columnW] ? row.c[cols.columnW].v : null

      // Debug at row level
      if (rowIndex < 5) {
        console.log(`Row ${rowIndex} - V: ${columnVValue}, W: ${columnWValue}, Enquiry: ${row.c[cols.enquiryNo]?.v || 'none'}`)
      }

      // Condition: Column V has a value AND Column W is null/empty/undefined
      const isValidRow = columnVValue && (columnWValue === null || columnWValue === undefined || columnWValue === "")

      // Skip rows that don't meet the condition
      if (!isValidRow) return
      
      rowsPassingVWCondition++

      // Get the enquiry number
      const enquiryNo = getValue(cols.enquiryNo)
      if (!enquiryNo) return

      // Calculate pending days
      let days = 0
      if (cols.delay !== null && row.c[cols.delay] && row.c[cols.delay].v) {
        const delayValue = row.c[cols.delay].v
        days = typeof delayValue === "number" ? delayValue : Number.parseInt(delayValue.toString(), 10) || 0
      }

      // Create task object with quotation-specific fields
      const task = {
        id: `task-${rowIndex}`,
        enquiryNo: getValue(cols.enquiryNo),
        quotationNumber: getValue(cols.quotationNumber),
        companyName: getValue(cols.companyName),
        contactPerson: getValue(cols.contactPerson),
        priority: getValue(cols.priority) || "Low",
        days: days,
        columnN: getValue(cols.columnN), // Get Column N data for pending column
        formLink: "/forms/update-quotation",
        status: getValue(cols.status),
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

  // Modify the fetchPendingTasks function to include debug logging
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
                  Quotation Number
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
                  Pending
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
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{task.quotationNumber}</td>
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
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{task.columnN}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <Link
                      to={`${task.formLink}/${task.enquiryNo}`}
                      state={{
                        enquiryNo: task.enquiryNo,
                        companyName: task.companyName,
                        quotationNumber: task.quotationNumber,
                        contactPerson: task.contactPerson,
                        priority: task.priority,
                        columnN: task.columnN
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
                    
                    // Special formatting for status columns
                    if (value && (value.toLowerCase().includes('complete') || 
                                  value.toLowerCase().includes('in progress') ||
                                  value.toLowerCase().includes('pending') ||
                                  value.toLowerCase().includes('positive') ||
                                  value.toLowerCase().includes('negative') ||
                                  value.toLowerCase().includes('neutral'))) {
                      
                      let statusColor = "bg-gray-100 text-gray-800";
                      
                      if (value.toLowerCase().includes('complete') || value.toLowerCase().includes('positive')) {
                        statusColor = "bg-green-100 text-green-800";
                      } else if (value.toLowerCase().includes('in progress')) {
                        statusColor = "bg-blue-100 text-blue-800";
                      } else if (value.toLowerCase().includes('pending')) {
                        statusColor = "bg-yellow-100 text-yellow-800";
                      } else if (value.toLowerCase().includes('negative')) {
                        statusColor = "bg-red-100 text-red-800";
                      } else if (value.toLowerCase().includes('neutral')) {
                        statusColor = "bg-orange-100 text-orange-800";
                      }
                      
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
      title="Update Quotation"
      description="Quotation updates and tracking"
      pendingContent={<PendingContent />}
      historyContent={<HistoryContent />}
      formLink="/forms/update-quotation"
      formLinkText="Update Quotation"
    />
  )
}

export default UpdateQuotationPage