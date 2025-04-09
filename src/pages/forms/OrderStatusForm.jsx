"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { useToast } from "../../contexts/ToastContext"
import FileUploader from "../../components/FileUploader"

function OrderStatusForm() {
  const { showToast } = useToast()
  const location = useLocation()
  const params = useParams()
  const [orderStatus, setOrderStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Google Sheet details
  const sheetId = '1afFwVmnYe9nhSXrNxkm9nvm_fzKDuP-nqRjAku9N6og'
  const sheetName = 'Order Status'
  
  // Google Apps Script Web App URL
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbypHleEBGEeSUXbwp-RjM56LimSlNBSK-xsuNbQUSbOucR33GEsExfr1T-Yc6a4Rd7c/exec'

  const [formData, setFormData] = useState({
    enquiryNo: "",
    quotationNumber: "",
    orderReceivedStatus: "",

    // YES fields
    acceptanceVia: "",
    paymentMode: "",
    paymentTerms: "",
    acceptanceRemark: "",
    orderVideo: null,
    acceptanceFile: null,

    // NO fields
    orderLostReason: "",
    orderLostRemark: "",
    orderLostVideo: null,

    // HOLD fields
    holdReasonCategory: "",
    holdingDate: "",
    holdRemark: "",
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
    const { name, value, type } = e.target

    if (name === "orderReceivedStatus") {
      setOrderStatus(value)
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (name, file) => {
    setFormData((prev) => ({
      ...prev,
      [name]: file,
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

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
  
    try {
      // Generate timestamp for the first column
      const formattedTimestamp = formatDate(new Date())
  
      // Format holding date if present
      const formattedHoldingDate = formData.holdingDate ? 
        formatDate(new Date(formData.holdingDate)) : ""
  
      // Create rowData array to match your sheet's column structure
      const rowData = [
        formattedTimestamp,                      // Timestamp (column A)
        formData.enquiryNo || "",                // Enquiry No. (column B)
        formData.quotationNumber || "",          // Quotation Number (column C)
        formData.orderReceivedStatus || "",      // Is Order Received Status (column D)
        formData.orderReceivedStatus === "YES" ? formData.acceptanceVia || "" : "",     // Acceptance Via (column E)
        formData.orderReceivedStatus === "YES" ? formData.paymentMode || "" : "",       // Payment Mode (column F)
        formData.orderReceivedStatus === "YES" ? formData.paymentTerms || "" : "",      // Payment Terms (in Days) (column G)
        "",                                      // Order Video (column H) - empty for URL
        "",                                      // Acceptance File Upload (column I) - empty for URL
        formData.orderReceivedStatus === "YES" ? formData.acceptanceRemark || "" : "",   // REMARK (column J)
        "",                                      // Order Lost apology Video (column K) - empty for URL
        formData.orderReceivedStatus === "NO" ? formData.orderLostReason || "" : "",     // If No then get relevant reason Status (column L)
        formData.orderReceivedStatus === "NO" ? formData.orderLostRemark || "" : "",     // If No then get relevant reason Remark (column M)
        formData.orderReceivedStatus === "HOLD" ? formData.holdReasonCategory || "" : "", // CUSTOMER ORDER HOLD REASON CATEGORY (column N)
        formData.orderReceivedStatus === "HOLD" ? formattedHoldingDate : "",             // HOLDING DATE (column O)
        formData.orderReceivedStatus === "HOLD" ? formData.holdRemark || "" : ""         // HOLD REMARK (column P)
      ]
  
      // Build form data for submission
      const formPayload = new FormData()
      formPayload.append('sheetName', sheetName)
      formPayload.append('action', 'insert')
      formPayload.append('rowData', JSON.stringify(rowData))
  
      // Process each file separately
      let files = [];
      
      // Check for Order Video file
      if (formData.orderReceivedStatus === "YES" && formData.orderVideo) {
        files.push({
          file: formData.orderVideo,
          columnIndex: 7  // Column H (0-based index) - Order Video
        });
      }
      
      // Check for Acceptance File
      if (formData.orderReceivedStatus === "YES" && formData.acceptanceFile) {
        files.push({
          file: formData.acceptanceFile,
          columnIndex: 8  // Column I (0-based index) - Acceptance File
        });
      }
      
      // Check for Order Lost Video
      if (formData.orderReceivedStatus === "NO" && formData.orderLostVideo) {
        files.push({
          file: formData.orderLostVideo,
          columnIndex: 10  // Column K (0-based index) - Order Lost Video
        });
      }
      
      // Add file info to formPayload
      if (files.length > 0) {
        formPayload.append('hasFiles', 'true');
        formPayload.append('fileCount', files.length);
        
        // Add each file's data
        for (let i = 0; i < files.length; i++) {
          const fileData = await fileToBase64(files[i].file);
          formPayload.append(`fileName${i}`, files[i].file.name);
          formPayload.append(`fileType${i}`, files[i].file.type);
          formPayload.append(`fileData${i}`, fileData);
          formPayload.append(`fileColumnIndex${i}`, files[i].columnIndex);
        }
      } else {
        formPayload.append('hasFiles', 'false');
      }
  
      // Log form payload details for debugging
      console.log("Submitting form with files:", files.length);
      
      // Send data to Google Sheets
      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: formPayload,
        mode: 'no-cors' // Required for cross-origin requests to Google Apps Script
      })
  
      // Show success message
      showToast("Order Status Updated", `Order status for enquiry #${formData.enquiryNo} has been successfully saved.`)
  
      // Reset form after submission
      setFormData({
        enquiryNo: "",
        quotationNumber: "",
        orderReceivedStatus: "",
        acceptanceVia: "",
        paymentMode: "",
        paymentTerms: "",
        acceptanceRemark: "",
        orderVideo: null,
        acceptanceFile: null,
        orderLostReason: "",
        orderLostRemark: "",
        orderLostVideo: null,
        holdReasonCategory: "",
        holdingDate: "",
        holdRemark: "",
      })
      setOrderStatus(null)
    } catch (error) {
      console.error("Error submitting form:", error)
      showToast("Error", "There was a problem updating the order status. Please try again.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link to="/order-status" className="text-gray-600 hover:text-gray-900 mr-4 flex items-center">
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Order Status
        </Link>
        <h1 className="text-3xl font-bold">Order Status</h1>
      </div>

      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Order Status</h2>
          <p className="text-sm text-gray-500">Track order status and manage received, lost, or on-hold orders.</p>
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
                  readOnly={!!params.enquiryNo || (!!formData.enquiryNo && location.state)} // Make read-only if passed from table
                />
              </div>

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
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">Is Order Received? Status</label>
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="orderStatusYes"
                    name="orderReceivedStatus"
                    value="YES"
                    checked={formData.orderReceivedStatus === "YES"}
                    onChange={handleChange}
                    className="rounded-full border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    required
                  />
                  <label htmlFor="orderStatusYes" className="text-sm">
                    YES
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="orderStatusNo"
                    name="orderReceivedStatus"
                    value="NO"
                    checked={formData.orderReceivedStatus === "NO"}
                    onChange={handleChange}
                    className="rounded-full border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="orderStatusNo" className="text-sm">
                    NO
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="orderStatusHold"
                    name="orderReceivedStatus"
                    value="HOLD"
                    checked={formData.orderReceivedStatus === "HOLD"}
                    onChange={handleChange}
                    className="rounded-full border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="orderStatusHold" className="text-sm">
                    HOLD
                  </label>
                </div>
              </div>
            </div>

            {formData.orderReceivedStatus === "YES" && (
              <div className="space-y-6 border rounded-md p-4">
                <h3 className="text-lg font-medium">Order Received Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="acceptanceVia" className="block text-sm font-medium">
                      Acceptance Via
                    </label>
                    <select
                      id="acceptanceVia"
                      name="acceptanceVia"
                      value={formData.acceptanceVia}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required={formData.orderReceivedStatus === "YES"}
                    >
                      <option value="">Select acceptance method</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="in_person">In Person</option>
                      <option value="purchase_order">Purchase Order</option>
                      <option value="contract">Contract</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="paymentMode" className="block text-sm font-medium">
                      Payment Mode
                    </label>
                    <select
                      id="paymentMode"
                      name="paymentMode"
                      value={formData.paymentMode}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required={formData.orderReceivedStatus === "YES"}
                    >
                      <option value="">Select payment mode</option>
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="paymentTerms" className="block text-sm font-medium">
                      Payment Terms (In Days)
                    </label>
                    <input
                      id="paymentTerms"
                      name="paymentTerms"
                      type="text"
                      placeholder="30"
                      value={formData.paymentTerms}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required={formData.orderReceivedStatus === "YES"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="orderVideo" className="block text-sm font-medium">
                    Order Video (If Order Received)
                  </label>
                  <FileUploader value={formData.orderVideo} onChange={(file) => handleFileChange("orderVideo", file)} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="acceptanceFile" className="block text-sm font-medium">
                    Acceptance File Upload
                  </label>
                  <FileUploader
                    value={formData.acceptanceFile}
                    onChange={(file) => handleFileChange("acceptanceFile", file)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="acceptanceRemark" className="block text-sm font-medium">
                    REMARK
                  </label>
                  <textarea
                    id="acceptanceRemark"
                    name="acceptanceRemark"
                    placeholder="Enter remarks about the order acceptance"
                    value={formData.acceptanceRemark}
                    onChange={handleChange}
                    rows="4"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required={formData.orderReceivedStatus === "YES"}
                  ></textarea>
                </div>
              </div>
            )}

            {formData.orderReceivedStatus === "NO" && (
              <div className="space-y-6 border rounded-md p-4">
                <h3 className="text-lg font-medium">Order Lost Details</h3>

                <div className="space-y-2">
                  <label htmlFor="orderLostVideo" className="block text-sm font-medium">
                    Order Lost apology Video (If Order Lost)
                  </label>
                  <FileUploader
                    value={formData.orderLostVideo}
                    onChange={(file) => handleFileChange("orderLostVideo", file)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="orderLostReason" className="block text-sm font-medium">
                    If No then get relevant reason Status
                  </label>
                  <select
                    id="orderLostReason"
                    name="orderLostReason"
                    value={formData.orderLostReason}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required={formData.orderReceivedStatus === "NO"}
                  >
                    <option value="">Select reason</option>
                    <option value="price_high">Price Too High</option>
                    <option value="competitor">Went With Competitor</option>
                    <option value="budget_constraints">Budget Constraints</option>
                    <option value="requirements_changed">Requirements Changed</option>
                    <option value="timeline_issues">Timeline Issues</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="orderLostRemark" className="block text-sm font-medium">
                    If No then get relevant reason Remark
                  </label>
                  <textarea
                    id="orderLostRemark"
                    name="orderLostRemark"
                    placeholder="Enter detailed reason for order loss"
                    value={formData.orderLostRemark}
                    onChange={handleChange}
                    rows="4"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required={formData.orderReceivedStatus === "NO"}
                  ></textarea>
                </div>
              </div>
            )}

            {formData.orderReceivedStatus === "HOLD" && (
              <div className="space-y-6 border rounded-md p-4">
                <h3 className="text-lg font-medium">Order Hold Details</h3>

                <div className="space-y-2">
                  <label htmlFor="holdReasonCategory" className="block text-sm font-medium">
                    CUSTOMER ORDER HOLD REASON CATEGORY
                  </label>
                  <select
                    id="holdReasonCategory"
                    name="holdReasonCategory"
                    value={formData.holdReasonCategory}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required={formData.orderReceivedStatus === "HOLD"}
                  >
                    <option value="">Select hold reason</option>
                    <option value="budget_approval">Budget Approval Pending</option>
                    <option value="internal_review">Internal Review</option>
                    <option value="management_decision">Management Decision Pending</option>
                    <option value="technical_clarification">Technical Clarification Needed</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="holdingDate" className="block text-sm font-medium">
                    HOLDING DATE
                  </label>
                  <input
                    id="holdingDate"
                    name="holdingDate"
                    type="date"
                    value={formData.holdingDate}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required={formData.orderReceivedStatus === "HOLD"}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="holdRemark" className="block text-sm font-medium">
                    HOLD REMARK
                  </label>
                  <textarea
                    id="holdRemark"
                    name="holdRemark"
                    placeholder="Enter detailed reason for order hold"
                    value={formData.holdRemark}
                    onChange={handleChange}
                    rows="4"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required={formData.orderReceivedStatus === "HOLD"}
                  ></textarea>
                </div>
              </div>
            )}

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
                "Save Order Status"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default OrderStatusForm