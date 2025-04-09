"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { useToast } from "../../contexts/ToastContext"

function FollowupStepsForm() {
  const { showToast } = useToast()
  const location = useLocation()
  const params = useParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Google Sheet details
  const sheetId = '1afFwVmnYe9nhSXrNxkm9nvm_fzKDuP-nqRjAku9N6og'
  const sheetName = 'Followup Step'
  
  // Google Apps Script Web App URL
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbypHleEBGEeSUXbwp-RjM56LimSlNBSK-xsuNbQUSbOucR33GEsExfr1T-Yc6a4Rd7c/exec'

  const [formData, setFormData] = useState({
    enquiryNo: "",
    // companyName: "",
    quotationNumber: "",
    quotationSharedBy: "",
    quotationSendStatus: "",
    quoFUStatus: "",
    quoFURemarks: "",
    followupStage: "",
    responsiblePerson: "",
    nextFollowupPlanDate: "",
  })

  useEffect(() => {
    // Pre-fill form from location state if passed from previous page
    const { state } = location
    if (state) {
      // Create a new form data object
      const newFormData = { ...formData };
      
      // Check which fields are available in state and match form field names
      Object.keys(state).forEach(key => {
        // Check if this key exists in formData (meaning it's a field in the form)
        if (key in newFormData) {
          newFormData[key] = state[key];
        }
      });
      
      // Auto-set responsiblePerson to match quotationSharedBy if available
      if (state.quotationSharedBy) {
        let responsibleValue = "";
        
        // Convert from shared by name to value in select dropdown
        const sharedByLower = state.quotationSharedBy.toLowerCase();
        if (sharedByLower.includes("rahul")) {
          responsibleValue = "rahul";
        } else if (sharedByLower.includes("priya")) {
          responsibleValue = "priya";
        } else if (sharedByLower.includes("amit")) {
          responsibleValue = "amit";
        } else if (sharedByLower.includes("neha")) {
          responsibleValue = "neha";
        }
        
        newFormData.responsiblePerson = responsibleValue;
      }
      
      // Auto-set quoFUStatus to match quotationSendStatus if available
      if (state.quotationSendStatus) {
        let statusValue = "";
        
        // Convert from send status to value in select dropdown
        const statusLower = state.quotationSendStatus.toLowerCase();
        if (statusLower.includes("sent")) {
          statusValue = "in_progress";
        } else if (statusLower.includes("pending")) {
          statusValue = "pending";
        } else if (statusLower.includes("completed")) {
          statusValue = "completed";
        } else if (statusLower.includes("delayed") || statusLower.includes("delay")) {
          statusValue = "delayed";
        } else if (statusLower.includes("cancel") || statusLower.includes("reject")) {
          statusValue = "cancelled";
        }
        
        newFormData.quoFUStatus = statusValue;
      }
      
      // Update the form data with matched fields
      setFormData(newFormData);
    } else if (params.enquiryNo) {
      // If no state but we have a URL parameter
      setFormData((prev) => ({
        ...prev,
        enquiryNo: params.enquiryNo,
      }))
    }
  }, [location, params])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Format date in DD/MM/YYYY format
  const formatDate = (date) => {
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Generate timestamp for the first column
      const formattedTimestamp = formatDate(new Date())

      // Format the next followup date for display
      const formattedFollowupDate = formData.nextFollowupPlanDate ? 
        formatDate(new Date(formData.nextFollowupPlanDate)) : ""
      
      // Create an array to match the sheet's column order
      const rowData = [
        formattedTimestamp,                  // Timestamp
        formData.enquiryNo || "",            // Enquiry No
        // formData.companyName || "",          // Company Name
        formData.quotationNumber || "",      // Quotation Number
        // formData.quotationSharedBy || "",    // Quotation Shared By
        getPersonName(formData.responsiblePerson), // Responsible Person
        getStatusText(formData.quoFUStatus), // Quotation FU Status
        getStageText(formData.followupStage), // Followup Stage
        formattedFollowupDate,                // Next Followup Plan Date
        formData.quoFURemarks || "",         // Quotation FU Remarks
      ]

      // Build parameters for submission
      const params = new URLSearchParams()
      params.append('sheetName', sheetName)
      params.append('action', 'insert')
      params.append('rowData', JSON.stringify(rowData))
      params.append('hasFile', 'false')
      
      // Send data to Google Sheets using JSONP approach
      const response = await submitToGoogleSheet(params)
      
      if (response.success) {
        // Show success message
        showToast("Followup Steps Recorded", `Followup steps for enquiry #${formData.enquiryNo} have been successfully recorded.`)
  
        // Reset form after submission
        setFormData({
          enquiryNo: "",
          // companyName: "",
          quotationNumber: "",
          // quotationSharedBy: "",
          responsiblePerson: "",
          quotationSendStatus: "",
          quoFUStatus: "",
          followupStage: "",
          nextFollowupPlanDate: "",
          quoFURemarks: "",
        })
      } else {
        showToast("Error", "Failed to submit followup steps. Please try again.", "error")
      }
    } catch (error) {
      console.error("Form submission error:", error)
      showToast("Error", "Failed to submit followup steps. Please try again.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to get display text for status
  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "Pending";
      case "in_progress": return "In Progress";
      case "completed": return "Completed";
      case "delayed": return "Delayed";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  }

  // Helper function to get display text for stage
  const getStageText = (stage) => {
    switch (stage) {
      case "initial_contact": return "Initial Contact";
      case "needs_assessment": return "Needs Assessment";
      case "proposal_sent": return "Proposal Sent";
      case "negotiation": return "Negotiation";
      case "closing": return "Closing";
      default: return stage;
    }
  }

  // Helper function to get full name for responsible person
  const getPersonName = (person) => {
    switch (person) {
      case "rahul": return "Rahul Sharma";
      case "priya": return "Priya Patel";
      case "amit": return "Amit Singh";
      case "neha": return "Neha Gupta";
      default: return person;
    }
  }

  // Function to submit data to Google Sheets
  const submitToGoogleSheet = async (params) => {
    // Using JSONP approach with Google Apps Script
    return new Promise((resolve, reject) => {
      // Create a unique callback function name
      const callbackName = 'googleScript_callback_' + Date.now()
      
      // Add callback parameter for JSONP
      params.append('callback', callbackName)
      
      // Create the full URL with parameters
      const fullUrl = `${scriptUrl}?${params.toString()}`
      
      // Define the callback function
      window[callbackName] = function(response) {
        // Clean up the script tag
        document.head.removeChild(script)
        // Remove the callback function
        delete window[callbackName]
        
        resolve({ success: true, data: response })
      }
      
      // Create a script tag to load the URL
      const script = document.createElement('script')
      script.src = fullUrl
      script.onerror = function() {
        // Clean up
        document.head.removeChild(script)
        delete window[callbackName]
        
        // Fall back to using an iframe approach as backup
        submitViaIframe(scriptUrl, params)
          .then(result => resolve(result))
          .catch(error => reject(error))
      }
      
      // Add the script tag to the document
      document.head.appendChild(script)
      
      // Set a timeout in case the callback is never called
      setTimeout(() => {
        if (window[callbackName]) {
          delete window[callbackName]
          resolve({ 
            success: true, 
            data: { message: "Request may have succeeded - no callback received" } 
          })
        }
      }, 5000)
    })
  }
  
  // Backup method using iframe for form submission
  const submitViaIframe = (scriptUrl, params) => {
    return new Promise((resolve) => {
      // Create a hidden iframe
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      document.body.appendChild(iframe)
      
      // Create a form inside the iframe
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = scriptUrl
      
      // Add form fields
      for (const [key, value] of params.entries()) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      }
      
      // Append form to iframe and submit
      iframe.contentDocument.body.appendChild(form)
      
      // Set a callback for when iframe loads after submission
      iframe.onload = function() {
        // Remove the iframe after a delay
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
        
        resolve({ 
          success: true, 
          data: { message: "Form submitted via iframe" } 
        })
      }
      
      // Submit the form
      form.submit()
    })
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link to="/followup-steps" className="text-gray-600 hover:text-gray-900 mr-4 flex items-center">
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Followup Steps
        </Link>
        <h1 className="text-3xl font-bold">Followup Steps</h1>
      </div>

      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Followup Steps</h2>
          <p className="text-sm text-gray-500">Track followup stages and plan next steps.</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="enquiryNo" className="block text-sm font-medium">
                  Enquiry No.
                </label>
                <input
                  id="enquiryNo"
                  name="enquiryNo"
                  type="text"
                  placeholder="ENQ-001"
                  value={formData.enquiryNo}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  readOnly={!!params.enquiryNo} // Make read-only if passed via params
                />
              </div>

              {/* <div className="space-y-2">
                <label htmlFor="companyName" className="block text-sm font-medium">
                  Company Name
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="ABC Corporation"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  readOnly={!!formData.companyName && location.state} // Make read-only if auto-filled
                />
              </div> */}

              <div className="space-y-2">
                <label htmlFor="quotationNumber" className="block text-sm font-medium">
                  Quotation Number
                </label>
                <input
                  id="quotationNumber"
                  name="quotationNumber"
                  type="text"
                  placeholder="QUO-001"
                  value={formData.quotationNumber}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  readOnly={!!formData.quotationNumber && location.state} // Make read-only if auto-filled
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="quoFUStatus" className="block text-sm font-medium">
                  Quo FU-Status
                </label>
                <select
                  id="quoFUStatus"
                  name="quoFUStatus"
                  value={formData.quoFUStatus}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delayed">Delayed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="followupStage" className="block text-sm font-medium">
                  Followup Stage
                </label>
                <select
                  id="followupStage"
                  name="followupStage"
                  value={formData.followupStage}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select stage</option>
                  <option value="initial_contact">Initial Contact</option>
                  <option value="needs_assessment">Needs Assessment</option>
                  <option value="proposal_sent">Proposal Sent</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closing">Closing</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="responsiblePerson" className="block text-sm font-medium">
                  RESPONSIBLE PERSON
                </label>
                <select
                  id="responsiblePerson"
                  name="responsiblePerson"
                  value={formData.responsiblePerson}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select person</option>
                  <option value="rahul">Rahul Sharma</option>
                  <option value="priya">Priya Patel</option>
                  <option value="amit">Amit Singh</option>
                  <option value="neha">Neha Gupta</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="nextFollowupPlanDate" className="block text-sm font-medium">
                  Next Followup Plan Date
                </label>
                <input
                  id="nextFollowupPlanDate"
                  name="nextFollowupPlanDate"
                  type="date"
                  value={formData.nextFollowupPlanDate}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="quoFURemarks" className="block text-sm font-medium">
                Quo FU-Remarks
              </label>
              <textarea
                id="quoFURemarks"
                name="quoFURemarks"
                placeholder="Enter followup remarks"
                value={formData.quoFURemarks}
                onChange={handleChange}
                rows="4"
                className="w-full p-2 border border-gray-300 rounded-md"
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
                </>
              ) : (
                "Save Followup Steps"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default FollowupStepsForm