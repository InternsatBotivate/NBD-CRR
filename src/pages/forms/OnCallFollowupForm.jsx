"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useToast } from "../../contexts/ToastContext"

function OnCallFollowupForm() {
  const { showToast } = useToast()
  const location = useLocation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Google Sheet details
  const sheetId = "1afFwVmnYe9nhSXrNxkm9nvm_fzKDuP-nqRjAku9N6og"
  const sheetName = "On Call Folloup and Technical Requiement"

  // Google Apps Script Web App URL
  const scriptUrl =
    "https://script.google.com/macros/s/AKfycbypHleEBGEeSUXbwp-RjM56LimSlNBSK-xsuNbQUSbOucR33GEsExfr1T-Yc6a4Rd7c/exec"

  // Mapping of form field names to sheet column names
  const columnMapping = {
    enquiryNo: "Enquiry No.",
    companyName: "Company Name",
    reason: "Reason for Call",
    technicalRequirement: "Technical Requirement",
    discussionStatus: "Discussion Status",
    discussionRemark: "Discussion Remark",
    responsiblePerson: "Responsible Person",
    nextDate: "Next Follow up Date",
  }

  const [formData, setFormData] = useState({
    enquiryNo: "",
    companyName: "",
    reason: "",
    technicalRequirement: "",
    discussionStatus: "",
    discussionRemark: "",
    responsiblePerson: "",
    nextDate: "",
  })

  useEffect(() => {
    // Pre-fill form from location state if passed from previous page
    const { state } = location
    if (state && state.enquiryNo && state.companyName) {
      setFormData((prev) => ({
        ...prev,
        enquiryNo: state.enquiryNo,
        companyName: state.companyName,
      }))
    }
  }, [location])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Generate timestamp for the first column
      const now = new Date()
      const formattedTimestamp = now.toLocaleDateString() // Format: MM/DD/YYYY

      // Create an array to match the sheet's exact column order
      const rowData = [
        formattedTimestamp, // Assuming first column is Date
        formData.enquiryNo,
        formData.companyName,
        formData.reason,
        formData.technicalRequirement,
        formData.discussionStatus,
        formData.discussionRemark,
        formData.responsiblePerson,
        formData.nextDate,
      ]

      // Build form data for submission
      const formPayload = new FormData()
      formPayload.append("sheetName", sheetName)
      formPayload.append("action", "insert")
      formPayload.append("rowData", JSON.stringify(rowData))

      // Send data to Google Sheets
      const response = await fetch(scriptUrl, {
        method: "POST",
        body: formPayload,
        mode: "no-cors", // Required for cross-origin requests to Google Apps Script
      })

      // Show success message
      showToast("Followup Created", `Followup for enquiry #${formData.enquiryNo} has been successfully saved.`)

      // Reset form after submission
      setFormData({
        enquiryNo: "",
        companyName: "",
        reason: "",
        technicalRequirement: "",
        discussionStatus: "",
        discussionRemark: "",
        responsiblePerson: "",
        nextDate: "",
      })
    } catch (error) {
      console.error("Error submitting form:", error)
      showToast("Error", "There was a problem creating the followup. Please try again.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link to="/on-call-followup" className="text-gray-600 hover:text-gray-900 mr-4 flex items-center">
          <i className="fas fa-arrow-left mr-2"></i>
          Back to On Call Followup
        </Link>
        <h1 className="text-3xl font-bold">New On Call Followup</h1>
      </div>

      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">On Call Followup</h2>
          <p className="text-sm text-gray-500">Record details of follow-up calls with potential clients.</p>
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
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="companyName" className="block text-sm font-medium">
                  Company Name
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="Acme Inc."
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="reason" className="block text-sm font-medium">
                  Reason for Call
                </label>
                <select
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select reason</option>
                  <option value="Initial Contact">Initial Contact</option>
                  <option value="Product Inquiry">Product Inquiry</option>
                  <option value="Price Discussion">Price Discussion</option>
                  <option value="Technical Details">Technical Details</option>
                  <option value="Quotation Followup">Quotation Followup</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="discussionStatus" className="block text-sm font-medium">
                  Discussion Status
                </label>
                <select
                  id="discussionStatus"
                  name="discussionStatus"
                  value={formData.discussionStatus}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select status</option>
                  <option value="Positive">Positive</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Negative">Negative</option>
                  <option value="Needs Followup">Needs Followup</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="responsiblePerson" className="block text-sm font-medium">
                  Responsible Person
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
                  <option value="Rahul Sharma">Rahul Sharma</option>
                  <option value="Priya Patel">Priya Patel</option>
                  <option value="Amit Singh">Amit Singh</option>
                  <option value="Neha Gupta">Neha Gupta</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="nextDate" className="block text-sm font-medium">
                  Next Follow up Date
                </label>
                <input
                  id="nextDate"
                  name="nextDate"
                  type="date"
                  value={formData.nextDate}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="technicalRequirement" className="block text-sm font-medium">
                Technical Requirement
              </label>
              <textarea
                id="technicalRequirement"
                name="technicalRequirement"
                placeholder="Enter technical requirements discussed"
                value={formData.technicalRequirement}
                onChange={handleChange}
                rows="3"
                className="w-full p-2 border border-gray-300 rounded-md"
              ></textarea>
            </div>

            <div className="space-y-2">
              <label htmlFor="discussionRemark" className="block text-sm font-medium">
                Discussion Remark
              </label>
              <textarea
                id="discussionRemark"
                name="discussionRemark"
                placeholder="Enter remarks about the discussion"
                value={formData.discussionRemark}
                onChange={handleChange}
                rows="3"
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
                "Save Followup"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default OnCallFollowupForm

