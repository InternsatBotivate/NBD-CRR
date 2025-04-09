"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import {
  pendingEnquiries,
  pendingQuotations,
  pendingValidations,
  pendingScreenshots,
  pendingFollowups,
  pendingOrders,
} from "../data/mockData"

function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pendingTasks, setPendingTasks] = useState([]) // Add state for pendingTasks
  const [dashboardStats, setDashboardStats] = useState({
    totalEnquiries: 0,
    totalQuotations: 0,
    totalOrders: 0,
    totalRevenue: 0,
    conversionRate: 0,
    pendingTasks: 0,
    stageBreakdown: {
      onCallFollowup: 0,
      updateQuotation: 0,
      quotationValidation: 0,
      screenshotUpdate: 0,
      followupSteps: 0,
      orderStatus: 0,
    },
    orderStatusBreakdown: {
      received: 0,
      lost: 0,
      hold: 0,
    },
    orderStatusReasons: {
      lostReasons: [],
      holdReasons: []
    }
  })

  // Google Sheet details
  const sheetId = "1afFwVmnYe9nhSXrNxkm9nvm_fzKDuP-nqRjAku9N6og"
  const reportSheetName = "REPORT"
  const orderStatusSheetName = "Order Status"

  // Use pendingTasks state instead of allPendingTasks variable
  const allPendingTasks = pendingTasks.length > 0 ? pendingTasks : [
    ...pendingEnquiries,
    ...pendingQuotations,
    ...pendingValidations,
    ...pendingScreenshots,
    ...pendingFollowups,
    ...pendingOrders,
  ].sort((a, b) => a.days - b.days)

  const stageChartRef = useRef(null)
  const conversionChartRef = useRef(null)
  const orderStatusChartRef = useRef(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    // Clear all chart containers first
    if (stageChartRef.current) stageChartRef.current.innerHTML = ""
    if (orderStatusChartRef.current) orderStatusChartRef.current.innerHTML = ""
    if (conversionChartRef.current) conversionChartRef.current.innerHTML = ""

    // Then only render the charts for the active tab
    if (activeTab === "overview") {
      if (stageChartRef.current) renderStageChart()
      if (orderStatusChartRef.current) renderOrderStatusChart()
    } else if (activeTab === "analytics") {
      if (conversionChartRef.current) renderConversionChart()
    }
  }, [activeTab, dashboardStats])

  // Helper function to extract JSON data from Google Sheets response
  const extractJsonFromResponse = async (response) => {
    const text = await response.text()
    const jsonStart = text.indexOf("{")
    const jsonEnd = text.lastIndexOf("}")
    const jsonString = text.substring(jsonStart, jsonEnd + 1)
    return JSON.parse(jsonString)
  }

  // Convert index to Excel-style column letters (A, B, ..., Z, AA, AB, ..., AZ, etc.)
  const getColumnLetters = (index) => {
    let columnName = ""
    let remaining = index

    while (remaining >= 0) {
      columnName = String.fromCharCode(65 + (remaining % 26)) + columnName
      remaining = Math.floor(remaining / 26) - 1
    }
    return columnName
  }

  // Fetch stage breakdown data from REPORT sheet
  const fetchStageBreakdown = async () => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(reportSheetName)}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch REPORT data: ${response.status}`)
      }

      const data = await extractJsonFromResponse(response)

      // Initialize stage counts
      const stageBreakdown = {
        onCallFollowup: 0,
        updateQuotation: 0,
        quotationValidation: 0,
        screenshotUpdate: 0,
        followupSteps: 0,
        orderStatus: 0,
      }

      // Find the column indexes for each stage's planned and actual columns
      const cols = {
        // On Call Followup (V/W)
        onCallPlanned: 21, // Column V
        onCallActual: 22, // Column W

        // Update Quotation (AD/AE)
        updateQuotationPlanned: 29, // Column AD
        updateQuotationActual: 30, // Column AE

        // Quotation Validation (AL/AM)
        quotationValidationPlanned: 37, // Column AL
        quotationValidationActual: 38, // Column AM

        // Screenshot Update (AT/AU)
        screenshotPlanned: 45, // Column AT
        screenshotActual: 46, // Column AU

        // Followup Steps (BB/BC)
        followupPlanned: 53, // Column BB
        followupActual: 54, // Column BC

        // Order Status (BJ/BK)
        orderStatusPlanned: 61, // Column BJ
        orderStatusActual: 62, // Column BK
      }

      // Process each row to count pending tasks by stage
      if (data.table && data.table.rows) {
        data.table.rows.forEach((row) => {
          if (!row.c) return

          // Helper function to check if a task is pending (planned date exists but actual date is empty)
          const isPending = (plannedIdx, actualIdx) => {
            const plannedValue = row.c[plannedIdx] ? row.c[plannedIdx].v : null
            const actualValue = row.c[actualIdx] ? row.c[actualIdx].v : null
            return plannedValue && (!actualValue || actualValue === "")
          }

          // Count pending tasks for each stage
          if (isPending(cols.onCallPlanned, cols.onCallActual)) {
            stageBreakdown.onCallFollowup++
          }

          if (isPending(cols.updateQuotationPlanned, cols.updateQuotationActual)) {
            stageBreakdown.updateQuotation++
          }

          if (isPending(cols.quotationValidationPlanned, cols.quotationValidationActual)) {
            stageBreakdown.quotationValidation++
          }

          if (isPending(cols.screenshotPlanned, cols.screenshotActual)) {
            stageBreakdown.screenshotUpdate++
          }

          if (isPending(cols.followupPlanned, cols.followupActual)) {
            stageBreakdown.followupSteps++
          }

          if (isPending(cols.orderStatusPlanned, cols.orderStatusActual)) {
            stageBreakdown.orderStatus++
          }
        })
      }

      console.log("Stage breakdown:", stageBreakdown)
      return stageBreakdown
    } catch (error) {
      console.error("Error fetching stage breakdown:", error)
      return {
        onCallFollowup: 0,
        updateQuotation: 0,
        quotationValidation: 0,
        screenshotUpdate: 0,
        followupSteps: 0,
        orderStatus: 0,
      }
    }
  }

  // Fetch total orders from Order Status sheet based on Column D values
  const fetchTotalOrders = async () => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(orderStatusSheetName)}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch Order Status data: ${response.status}`)
      }

      const data = await extractJsonFromResponse(response)

      // Count all non-empty values in column D (index 3)
      let count = 0
      if (data.table && data.table.rows) {
        // Skip header row
        for (let i = 1; i < data.table.rows.length; i++) {
          const row = data.table.rows[i];
          
          // Check if column D has any value (yes, no, or hold)
          if (row.c && row.c[3] && row.c[3].v) {
            count++;
          }
        }
      }

      console.log(`Total orders found: ${count}`)
      return count
    } catch (error) {
      console.error("Error fetching total orders:", error)
      return 0
    }
  }

  // Fetch order status breakdown from Order Status sheet using Column D values
  const fetchOrderStatusBreakdown = async () => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(orderStatusSheetName)}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch Order Status data: ${response.status}`)
      }

      const data = await extractJsonFromResponse(response)

      // Initialize order status counts
      const orderStatusBreakdown = {
        received: 0,
        lost: 0,
        hold: 0,
      }

      // Explicitly look for Column D (index 3) which has order status values
      const statusColumnIndex = 3; // Column D is index 3 (0-based)
      
      console.log("Counting order statuses in Column D");
      
      // Process each row to count the status values
      if (data.table && data.table.rows) {
        // Skip header row, start from index 1
        for (let i = 1; i < data.table.rows.length; i++) {
          const row = data.table.rows[i];
          
          if (!row.c || !row.c[statusColumnIndex] || !row.c[statusColumnIndex].v) continue;
          
          const status = row.c[statusColumnIndex].v.toString().trim().toLowerCase();
          
          // Log for debugging
          if (i < 5) {
            console.log(`Row ${i} status: ${status}`);
          }
          
          // Count based on the status values in Column D
          if (status === "yes") {
            orderStatusBreakdown.received++;
          } else if (status === "no") {
            orderStatusBreakdown.lost++;
          } else if (status === "hold") {
            orderStatusBreakdown.hold++;
          }
        }
      }

      console.log("Order status breakdown:", orderStatusBreakdown);
      return orderStatusBreakdown;
    } catch (error) {
      console.error("Error fetching order status breakdown:", error);
      return {
        received: 0,
        lost: 0,
        hold: 0,
      };
    }
  }

  // Fetch order status reasons from Order Status sheet
  const fetchOrderStatusReasons = async () => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(orderStatusSheetName)}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch Order Status data: ${response.status}`)
      }

      const data = await extractJsonFromResponse(response)

      // Initialize reason objects
      const lostReasons = {}
      const holdReasons = {}

      // Column indexes
      const statusColumnIndex = 3;     // Column D - Order Status
      const lostReasonColumnIndex = 11; // Column L - Order Lost Reason
      const holdReasonColumnIndex = 13; // Column N - Order Hold Reason
      
      console.log("Analyzing order status reasons");
      
      // Process each row to count reason occurrences
      if (data.table && data.table.rows) {
        // Skip header row, start from index 1
        for (let i = 1; i < data.table.rows.length; i++) {
          const row = data.table.rows[i];
          
          if (!row.c || !row.c[statusColumnIndex]) continue;
          
          // Only process rows with a status
          if (row.c[statusColumnIndex].v) {
            const status = row.c[statusColumnIndex].v.toString().trim().toLowerCase();
            
            // For lost orders, count lost reasons
            if (status === "no" && row.c[lostReasonColumnIndex] && row.c[lostReasonColumnIndex].v) {
              const reason = row.c[lostReasonColumnIndex].v.toString().trim();
              lostReasons[reason] = (lostReasons[reason] || 0) + 1;
            }
            
            // For hold orders, count hold reasons
            if (status === "hold" && row.c[holdReasonColumnIndex] && row.c[holdReasonColumnIndex].v) {
              const reason = row.c[holdReasonColumnIndex].v.toString().trim();
              holdReasons[reason] = (holdReasons[reason] || 0) + 1;
            }
          }
        }
      }

      // Convert to arrays of {reason, count, percentage} objects
      const lostReasonsArray = Object.entries(lostReasons).map(([reason, count]) => {
        const totalLost = Object.values(lostReasons).reduce((sum, c) => sum + c, 0);
        return {
          reason,
          count,
          percentage: totalLost > 0 ? Math.round((count / totalLost) * 100) : 0
        };
      }).sort((a, b) => b.count - a.count);

      const holdReasonsArray = Object.entries(holdReasons).map(([reason, count]) => {
        const totalHold = Object.values(holdReasons).reduce((sum, c) => sum + c, 0);
        return {
          reason,
          count,
          percentage: totalHold > 0 ? Math.round((count / totalHold) * 100) : 0
        };
      }).sort((a, b) => b.count - a.count);

      console.log("Lost reasons:", lostReasonsArray);
      console.log("Hold reasons:", holdReasonsArray);
      
      return {
        lostReasons: lostReasonsArray,
        holdReasons: holdReasonsArray
      };
    } catch (error) {
      console.error("Error fetching order status reasons:", error);
      return {
        lostReasons: [],
        holdReasons: []
      };
    }
  }

  // Fetch total enquiries from REPORT sheet (column B count)
  const fetchTotalEnquiries = async () => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(reportSheetName)}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch REPORT data: ${response.status}`)
      }

      const data = await extractJsonFromResponse(response)

      // Count valid entries in column B (index 1)
      let count = 0
      if (data.table && data.table.rows) {
        count = data.table.rows.filter((row) => row.c && row.c[1] && row.c[1].v).length
      }

      console.log(`Total enquiries found: ${count}`)
      return count
    } catch (error) {
      console.error("Error fetching total enquiries:", error)
      return 0
    }
  }

  // Fetch total quotations from Make Quotation sheet (column B count)
  const fetchTotalQuotations = async () => {
    try {
      const makeQuotationSheetName = "Make Quotation"
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(makeQuotationSheetName)}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch Make Quotation data: ${response.status}`)
      }

      const data = await extractJsonFromResponse(response)

      // Count valid entries in column B (index 1)
      let count = 0
      if (data.table && data.table.rows) {
        count = data.table.rows.filter((row) => row.c && row.c[1] && row.c[1].v).length
      }

      console.log(`Total quotations found: ${count}`)
      return count
    } catch (error) {
      console.error("Error fetching total quotations:", error)
      return 0
    }
  }

  // Fetch total revenue from REPORT sheet (sum of column O - Approximate Value)
  const fetchTotalRevenue = async () => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(reportSheetName)}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch REPORT data for revenue: ${response.status}`)
      }

      const data = await extractJsonFromResponse(response)

      // Sum values in column O (index 14)
      let totalRevenue = 0
      if (data.table && data.table.rows) {
        data.table.rows.forEach((row) => {
          if (row.c && row.c[14] && row.c[14].v) {
            // Parse the value as a number and add to total
            const value = Number.parseFloat(row.c[14].v.toString().replace(/[^0-9.-]+/g, ""))
            if (!isNaN(value)) {
              totalRevenue += value
            }
          }
        })
      }

      console.log(`Total revenue calculated: ${totalRevenue}`)
      return totalRevenue
    } catch (error) {
      console.error("Error fetching total revenue:", error)
      return 0
    }
  }

  // Fetch all pending tasks from all stages
  const fetchAllPendingTasks = async () => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(reportSheetName)}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch REPORT data: ${response.status}`)
      }

      const data = await extractJsonFromResponse(response)

      // Find all columns that represent planned/actual date pairs
      const stagePairs = [
        { name: "On Call Followup", plannedCol: 21, actualCol: 22, formLink: "/forms/on-call-followup" },
        { name: "Update Quotation", plannedCol: 29, actualCol: 30, formLink: "/forms/update-quotation" },
        { name: "Quotation Validation", plannedCol: 37, actualCol: 38, formLink: "/forms/quotation-validation" },
        { name: "Screenshot Update", plannedCol: 45, actualCol: 46, formLink: "/forms/screenshot-update" },
        { name: "Followup Steps", plannedCol: 53, actualCol: 54, formLink: "/forms/followup-steps" },
        { name: "Order Status", plannedCol: 61, actualCol: 62, formLink: "/forms/order-status" },
      ]

      // Columns for task data
      const cols = {
        enquiryNo: 1, // Column B
        companyName: 6, // Column G
        contactPerson: 7, // Column H
        priority: 19, // Column T
        delay: 26, // Column AA
      }

      const pendingTasks = []

      // Process each row to find pending tasks
      if (data.table && data.table.rows) {
        data.table.rows.forEach((row, rowIndex) => {
          if (!row.c) return

          // Helper function to safely get cell values
          const getValue = (index) => {
            if (!row.c[index] || row.c[index].v === null) return ""
            return row.c[index].v.toString().trim()
          }

          // Check each stage pair for pending tasks
          stagePairs.forEach((stage) => {
            const plannedValue = row.c[stage.plannedCol] ? row.c[stage.plannedCol].v : null
            const actualValue = row.c[stage.actualCol] ? row.c[stage.actualCol].v : null

            // If planned date exists but actual date is empty, it's a pending task
            if (plannedValue && (!actualValue || actualValue === "")) {
              // Calculate days pending
              let days = 0
              if (row.c[cols.delay] && row.c[cols.delay].v) {
                const delayValue = row.c[cols.delay].v
                days = typeof delayValue === "number" ? delayValue : Number.parseInt(delayValue.toString(), 10) || 0
              }

              // Create task object
              const task = {
                id: `task-${rowIndex}-${stage.name}`,
                enquiryNo: getValue(cols.enquiryNo),
                companyName: getValue(cols.companyName),
                contactPerson: getValue(cols.contactPerson),
                priority: getValue(cols.priority) || "Low",
                days: days,
                formLink: stage.formLink,
                stage: stage.name,
              }

              pendingTasks.push(task)
            }
          })
        })
      }

      // Sort by days (highest first)
      pendingTasks.sort((a, b) => b.days - a.days)

      console.log(`Found ${pendingTasks.length} pending tasks across all stages`)
      return pendingTasks
    } catch (error) {
      console.error("Error fetching pending tasks:", error)
      return []
    }
  }

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch real data from Google Sheets
      const [
        totalEnquiries,
        totalQuotations,
        totalRevenue,
        totalOrders,
        stageBreakdown,
        orderStatusBreakdown,
        fetchedPendingTasks, // Rename to avoid conflicts
        orderStatusReasons,  // New data for reasons
      ] = await Promise.all([
        fetchTotalEnquiries(),
        fetchTotalQuotations(),
        fetchTotalRevenue(),
        fetchTotalOrders(),
        fetchStageBreakdown(),
        fetchOrderStatusBreakdown(),
        fetchAllPendingTasks(),
        fetchOrderStatusReasons(),  // Call our new function
      ])

      // Update pendingTasks state with the fetched tasks
      setPendingTasks(fetchedPendingTasks);

      const conversionRate = totalEnquiries > 0 ? Math.round((totalOrders / totalEnquiries) * 100) : 0

      setDashboardStats({
        totalEnquiries,
        totalQuotations,
        totalOrders,
        totalRevenue,
        conversionRate,
        pendingTasks: fetchedPendingTasks.length,
        stageBreakdown,
        orderStatusBreakdown,
        orderStatusReasons,  // Add reasons to dashboard stats
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError("Failed to load dashboard data.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderStageChart = () => {
    const chartContainer = stageChartRef.current
    if (!chartContainer) return

    // Clear previous chart if any
    chartContainer.innerHTML = ""

    // Create a simple canvas-based chart
    const canvas = document.createElement("canvas")
    canvas.width = chartContainer.clientWidth
    canvas.height = chartContainer.clientHeight
    chartContainer.appendChild(canvas)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Chart dimensions
    const padding = 40
    const width = canvas.width - padding * 2
    const height = canvas.height - padding * 2
    const barWidth = (width / 6) * 0.6
    const barSpacing = (width / 6) * 0.4

    // Data from stage breakdown
    const data = [
      dashboardStats.stageBreakdown.onCallFollowup,
      dashboardStats.stageBreakdown.updateQuotation,
      dashboardStats.stageBreakdown.quotationValidation,
      dashboardStats.stageBreakdown.screenshotUpdate,
      dashboardStats.stageBreakdown.followupSteps,
      dashboardStats.stageBreakdown.orderStatus,
    ]

    const maxValue = Math.max(...data, 1) * 1.1 // Add 10% padding at the top, minimum 1

    // Draw axes
    ctx.beginPath()
    ctx.strokeStyle = "#ccc"
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height + padding)
    ctx.lineTo(width + padding, height + padding)
    ctx.stroke()

    // Draw bars
    const colors = [
      "#4f46e5", // indigo-600
      "#8b5cf6", // violet-500
      "#ec4899", // pink-500
      "#06b6d4", // cyan-500
      "#10b981", // emerald-500
      "#f59e0b", // amber-500
    ]

    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * height
      const x = padding + index * (barWidth + barSpacing)
      const y = height + padding - barHeight

      // Create gradient
      const gradient = ctx.createLinearGradient(x, y, x, height + padding)
      gradient.addColorStop(0, colors[index])
      gradient.addColorStop(1, colors[index] + "80") // Add transparency

      ctx.fillStyle = gradient
      ctx.fillRect(x, y, barWidth, barHeight)

      // Add value on top of bar
      ctx.fillStyle = "#666"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText(value.toString(), x + barWidth / 2, y - 5)
    })

    // Draw stage labels
    const stages = ["On Call", "Quotation", "Validation", "Screenshot", "Followup", "Order"]
    ctx.fillStyle = "#666"
    ctx.font = "10px Arial"
    ctx.textAlign = "center"

    stages.forEach((stage, index) => {
      const x = padding + index * (barWidth + barSpacing) + barWidth / 2
      ctx.fillText(stage, x, height + padding + 15)
    })

    // Draw value labels on y-axis
    ctx.textAlign = "right"
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((maxValue / 5) * i)
      const y = height + padding - (height / 5) * i
      ctx.fillText(value.toString(), padding - 5, y + 3)
    }
  }

  const renderOrderStatusChart = () => {
    const chartContainer = orderStatusChartRef.current
    if (!chartContainer) return

    // Clear previous chart if any
    chartContainer.innerHTML = ""

    // Create a simple canvas-based chart
    const canvas = document.createElement("canvas")
    canvas.width = chartContainer.clientWidth
    canvas.height = chartContainer.clientHeight
    chartContainer.appendChild(canvas)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Chart dimensions
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 40

    // Data from order status breakdown
    const data = [
      dashboardStats.orderStatusBreakdown.received,
      dashboardStats.orderStatusBreakdown.lost,
      dashboardStats.orderStatusBreakdown.hold,
    ]

    const total = data.reduce((sum, value) => sum + value, 0)

    // If no data, show a message
    if (total === 0) {
      ctx.fillStyle = "#666"
      ctx.font = "14px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("No order status data available", centerX, centerY)
      return
    }

    // Colors for each status
    const colors = [
      "#10b981", // emerald-500 for received
      "#ef4444", // red-500 for lost
      "#f59e0b", // amber-500 for hold
    ]

    // Draw pie chart
    let startAngle = 0
    data.forEach((value, index) => {
      const sliceAngle = (2 * Math.PI * value) / total

      ctx.beginPath()
      ctx.fillStyle = colors[index]
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      ctx.closePath()
      ctx.fill()

      // Draw label
      const midAngle = startAngle + sliceAngle / 2
      const labelRadius = radius * 0.7
      const labelX = centerX + labelRadius * Math.cos(midAngle)
      const labelY = centerY + labelRadius * Math.sin(midAngle)

      ctx.fillStyle = "#fff"
      ctx.font = "bold 14px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(value.toString(), labelX, labelY)

      startAngle += sliceAngle
    })

    // Draw legend
    const labels = ["Received", "Lost", "On Hold"]
    const legendY = canvas.height - 30
    const legendSpacing = canvas.width / 4

    labels.forEach((label, index) => {
      const legendX = (index + 1) * legendSpacing

      // Draw color box
      ctx.fillStyle = colors[index]
      ctx.fillRect(legendX - 40, legendY, 15, 15)

      // Draw label
      ctx.fillStyle = "#666"
      ctx.font = "12px Arial"
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"
      ctx.fillText(label, legendX - 20, legendY + 7)
    })
  }

  const renderConversionChart = () => {
    const chartContainer = conversionChartRef.current
    if (!chartContainer) return

    // Clear previous chart if any
    chartContainer.innerHTML = ""

    // Create a simple canvas-based chart
    const canvas = document.createElement("canvas")
    canvas.width = chartContainer.clientWidth
    canvas.height = chartContainer.clientHeight
    chartContainer.appendChild(canvas)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Chart dimensions
    const padding = 40
    const width = canvas.width - padding * 2
    const height = canvas.height - padding * 2
    const centerX = canvas.width / 2 // Declare centerX here

    // Data for funnel chart
    const data = [dashboardStats.totalEnquiries, dashboardStats.totalQuotations, dashboardStats.totalOrders]

    const maxValue = Math.max(...data)
    
    // If no data, show a message
    if (maxValue === 0) {
      ctx.fillStyle = "#666"
      ctx.font = "14px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("No conversion data available", centerX, height / 2 + padding)
      return
    }
    
    const maxWidth = width * 0.8

    // Draw funnel chart
    const funnelHeight = height / 3
    const stages = ["Enquiries", "Quotations", "Orders"]
    const colors = [
      "#4f46e5", // indigo-600
      "#8b5cf6", // violet-500
      "#10b981", // emerald-500
    ]

    data.forEach((value, index) => {
      const barWidth = (value / maxValue) * maxWidth
      const x = (canvas.width - barWidth) / 2
      const y = padding + index * funnelHeight + 10

      // Create gradient
      const gradient = ctx.createLinearGradient(x, y, x + barWidth, y)
      gradient.addColorStop(0, colors[index])
      gradient.addColorStop(1, colors[index] + "80") // Add transparency

      // Draw bar
      ctx.fillStyle = gradient
      ctx.fillRect(x, y, barWidth, funnelHeight - 20)

      // Draw label
      ctx.fillStyle = "#333"
      ctx.font = "bold 14px Arial"
      ctx.textAlign = "left"
      ctx.fillText(stages[index], x, y - 5)

      // Draw value
      ctx.fillStyle = "#666"
      ctx.font = "12px Arial"
      ctx.textAlign = "right"
      ctx.fillText(value.toString(), x + barWidth + 5, y + funnelHeight / 2)

      // Draw percentage (except for first stage)
      if (index > 0) {
        const percentage = Math.round((value / data[index - 1]) * 100)
        ctx.fillStyle = "#10b981" // emerald-500
        ctx.font = "12px Arial"
        ctx.textAlign = "left"
        ctx.fillText(`${percentage}%`, x + barWidth + 30, y + funnelHeight / 2)
      }
    })
  }


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard
        </h2>
        <button
  onClick={fetchDashboardData}
  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
  disabled={isLoading}
>
  {isLoading ? (
    <>
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
      Refreshing...
    </>
  ) : (
    <>
      <i className="fas fa-sync-alt mr-2"></i>
      Refresh Data
    </>
  )}
</button>
      </div>

      <div className="space-y-4">
        <div className="bg-white shadow-sm rounded-md">
          <div className="flex">
            <button
              className={`px-4 py-2 font-medium rounded-tl-md transition-all ${
                activeTab === "overview"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("overview")
                // Force clear analytics charts
                if (conversionChartRef.current) conversionChartRef.current.innerHTML = ""
              }}
            >
              Overview
            </button>
            <button
              className={`px-4 py-2 font-medium rounded-tr-md transition-all ${
                activeTab === "analytics"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("analytics")
                // Force clear overview charts
                if (stageChartRef.current) stageChartRef.current.innerHTML = ""
                if (orderStatusChartRef.current) orderStatusChartRef.current.innerHTML = ""
              }}
            >
              Analytics
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-indigo-600">Loading dashboard data...</span>
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : activeTab === "overview" ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white rounded-lg border-l-4 border-l-indigo-500 shadow-md hover:shadow-lg transition-shadow p-4">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium">Total Enquiries</div>
                  <div className="h-8 w-8 rounded-full bg-indigo-100 p-1.5 text-indigo-600">
                    <i className="fas fa-file-alt"></i>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{dashboardStats.totalEnquiries}</div>
                  <p className="text-xs text-gray-500">All enquiries in the system</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow p-4">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium">Total Quotations</div>
                  <div className="h-8 w-8 rounded-full bg-purple-100 p-1.5 text-purple-600">
                    <i className="fas fa-file-invoice-dollar"></i>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{dashboardStats.totalQuotations}</div>
                  <p className="text-xs text-gray-500">Quotations created and sent</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow p-4">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium">Conversion Rate</div>
                  <div className="h-8 w-8 rounded-full bg-blue-100 p-1.5 text-blue-600">
                    <i className="fas fa-chart-line"></i>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{dashboardStats.conversionRate}%</div>
                  <p className="text-xs text-gray-500">Enquiries to orders conversion</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border-l-4 border-l-pink-500 shadow-md hover:shadow-lg transition-shadow p-4">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium">Pending Tasks</div>
                  <div className="h-8 w-8 rounded-full bg-pink-100 p-1.5 text-pink-600">
                    <i className="fas fa-tasks"></i>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{dashboardStats.pendingTasks}</div>
                  <p className="text-xs text-gray-500">Tasks requiring attention</p>
                </div>
              </div>

              {/* Add this card after the Pending Tasks card */}
              <div className="bg-white rounded-lg border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow p-4">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium">Total Revenue</div>
                  <div className="h-8 w-8 rounded-full bg-green-100 p-1.5 text-green-600">
                    <i className="fas fa-dollar-sign"></i>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">₹{dashboardStats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-gray-500">Revenue from all orders</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <div className="col-span-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg p-4">
                  <div className="font-bold text-lg">Pending Tasks by Stage</div>
                  <div className="text-indigo-100 text-sm">Distribution of tasks across different stages</div>
                </div>
                <div className="p-4 pl-2">
                  <div className="h-[300px] w-full" ref={stageChartRef}></div>
                </div>
              </div>

              <div className="col-span-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg p-4">
                  <div className="font-bold text-lg">Order Status</div>
                  <div className="text-blue-100 text-sm">Distribution of order statuses</div>
                </div>
                <div className="p-4">
                  <div className="h-[300px] w-full" ref={orderStatusChartRef}></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg p-4">
                <div className="font-bold text-lg">Pending Tasks</div>
                <div className="text-indigo-100 text-sm">Tasks requiring immediate attention</div>
              </div>
              <div className="p-4">
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
                          Stage
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Days
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingTasks.slice(0, 5).map((task) => (
                        <tr key={task.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{task.enquiryNo}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{task.companyName}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{task.stage}</td>
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
                {pendingTasks.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link to="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      View all {pendingTasks.length} pending tasks
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white rounded-lg border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow p-4">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium">Total Orders</div>
                  <div className="h-8 w-8 rounded-full bg-green-100 p-1.5 text-green-600">
                    <i className="fas fa-shopping-cart"></i>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{dashboardStats.totalOrders}</div>
                  <p className="text-xs text-gray-500">Orders received</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border-l-4 border-l-yellow-500 shadow-md hover:shadow-lg transition-shadow p-4">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium">Orders Received</div>
                  <div className="h-8 w-8 rounded-full bg-yellow-100 p-1.5 text-yellow-600">
                    <i className="fas fa-check-circle"></i>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{dashboardStats.orderStatusBreakdown.received}</div>
                  <p className="text-xs text-gray-500">Successfully converted</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow p-4">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium">Orders Lost</div>
                  <div className="h-8 w-8 rounded-full bg-red-100 p-1.5 text-red-600">
                    <i className="fas fa-times-circle"></i>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{dashboardStats.orderStatusBreakdown.lost}</div>
                  <p className="text-xs text-gray-500">Opportunities lost</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border-l-4 border-l-cyan-500 shadow-md hover:shadow-lg transition-shadow p-4">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium">Orders On Hold</div>
                  <div className="h-8 w-8 rounded-full bg-cyan-100 p-1.5 text-cyan-600">
                    <i className="fas fa-pause-circle"></i>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{dashboardStats.orderStatusBreakdown.hold}</div>
                  <p className="text-xs text-gray-500">Pending customer decision</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-t-lg p-4">
                <div className="font-bold text-lg">Conversion Funnel</div>
                <div className="text-green-100 text-sm">Enquiry to order conversion metrics</div>
              </div>
              <div className="p-4">
                <div className="h-[300px] w-full" ref={conversionChartRef}></div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg p-4">
                  <div className="font-bold text-lg">Stage Efficiency</div>
                  <div className="text-indigo-100 text-sm">Average time spent in each stage</div>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">On Call Followup</span>
                        <span className="text-sm text-gray-500">Avg. 2.5 days</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: "65%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Update Quotation</span>
                        <span className="text-sm text-gray-500">Avg. 1.8 days</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: "85%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Quotation Validation</span>
                        <span className="text-sm text-gray-500">Avg. 3.2 days</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "45%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Followup Steps</span>
                        <span className="text-sm text-gray-500">Avg. 4.1 days</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: "35%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg p-4">
                  <div className="font-bold text-lg">Order Status Reasons</div>
                  <div className="text-orange-100 text-sm">Common reasons for order outcomes</div>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Orders Lost Reasons</h3>
                      {dashboardStats.orderStatusReasons.lostReasons.length > 0 ? (
                        <ul className="space-y-2">
                          {dashboardStats.orderStatusReasons.lostReasons.slice(0, 5).map((item, index) => (
                            <li key={`lost-${index}`} className="flex justify-between">
                              <span className="text-sm">{item.reason}</span>
                              <span className="text-sm font-medium">{item.percentage}%</span>
                            </li>
                          ))}
                          {dashboardStats.orderStatusReasons.lostReasons.length === 0 && (
                            <li className="text-sm text-gray-500">No data available</li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No lost order reasons found</p>
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Orders On Hold Reasons</h3>
                      {dashboardStats.orderStatusReasons.holdReasons.length > 0 ? (
                        <ul className="space-y-2">
                          {dashboardStats.orderStatusReasons.holdReasons.slice(0, 5).map((item, index) => (
                            <li key={`hold-${index}`} className="flex justify-between">
                              <span className="text-sm">{item.reason}</span>
                              <span className="text-sm font-medium">{item.percentage}%</span>
                            </li>
                          ))}
                          {dashboardStats.orderStatusReasons.holdReasons.length === 0 && (
                            <li className="text-sm text-gray-500">No data available</li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No hold order reasons found</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DashboardPage