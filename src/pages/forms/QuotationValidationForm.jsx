"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { useToast } from "../../contexts/ToastContext"

function QuotationValidationForm() {
  const { showToast } = useToast()
  const location = useLocation()
  const params = useParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    enquiryNo: "",
    companyName: "",
    quotationNumber: "",
    quotationSharedBy: "",
    priority: "",
    pending: "",
    quotationValidatorName: "",
    quotationSendStatus: "",
    quotationValidationRemark: "",
    sendFAQVideo: false,
    sendProductVideo: false,
    sendOfferVideo: false,
    sendProductCatalogue: false,
    sendProductImage: false,
  })

  useEffect(() => {
    // Pre-fill form from location state if passed from previous page
    const { state } = location
    if (state) {
      // Create a new form data object
      const newFormData = { ...formData };
      
      // Check which fields are available in state and match form field names
      // Only update fields that exist in both the form and the state
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
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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
      // Prepare data for submitToGoogleSheet function - with separate material columns
      const sheetData = {
        enquiryNo: formData.enquiryNo,
        companyName: formData.companyName,
        quotationNumber: formData.quotationNumber,
        quotationSharedBy: formData.quotationSharedBy,
        validatorName: formData.quotationValidatorName,
        sendStatus: formData.quotationSendStatus,
        validationRemark: formData.quotationValidationRemark,
        sendFAQVideo: formData.sendFAQVideo,
        sendProductVideo: formData.sendProductVideo,
        sendOfferVideo: formData.sendOfferVideo,
        sendProductCatalogue: formData.sendProductCatalogue,
        sendProductImage: formData.sendProductImage
      }

      // Log the data being sent (for debugging)
      console.log("Submitting data to Google Sheet:", sheetData)
      
      // Submit to Google Sheets
      const response = await submitToGoogleSheet(sheetData)
      
      if (response.success) {
        showToast("Quotation Validated", "Quotation validation has been successfully recorded.")
        
        // Reset form after submission
        setFormData({
          enquiryNo: "",
          companyName: "",
          quotationNumber: "",
          quotationSharedBy: "",
          priority: "",
          pending: "",
          quotationValidatorName: "",
          quotationSendStatus: "",
          quotationValidationRemark: "",
          sendFAQVideo: false,
          sendProductVideo: false,
          sendOfferVideo: false,
          sendProductCatalogue: false,
          sendProductImage: false,
        })
      } else {
        showToast("Error", "Failed to submit validation. Please try again.", "error")
      }
    } catch (error) {
      console.error("Form submission error:", error)
      showToast("Error", "Failed to submit validation. Please try again.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Function to submit data to Google Sheets
  const submitToGoogleSheet = async (data) => {
    // Google Apps Script deployed URL
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbypHleEBGEeSUXbwp-RjM56LimSlNBSK-xsuNbQUSbOucR33GEsExfr1T-Yc6a4Rd7c/exec'
    
    // Sheet name to insert the data
    const sheetName = 'Quotation Validation'
    
    // Format the row data based on your sheet structure with formatted date
    const rowData = [
      formatDate(new Date()),            // Timestamp in DD/MM/YYYY format
      data.enquiryNo || "",              // Enquiry number
      data.quotationNumber || "",        // Quotation number
      data.validatorName || "",          // Validator name
      data.sendStatus || "",             // Send status
      data.validationRemark || "",       // Validation remark
      data.sendFAQVideo ? "FAQ Video" : "",        // Send FAQ Video column
      data.sendProductVideo ? "Product Video" : "", // Send Product Video column
      data.sendOfferVideo ? "Offer Video" : "",     // Send Offer Video column
      data.sendProductCatalogue ? "Product Catalogue" : "", // Send Product Catalogue column
      data.sendProductImage ? "Product Image" : ""   // Send Product Image column
    ]
    
    try {
      // Using JSONP approach with Google Apps Script
      return new Promise((resolve, reject) => {
        // Create a unique callback function name
        const callbackName = 'googleScript_callback_' + Date.now()
        
        // Create the query parameters
        const params = new URLSearchParams()
        params.append('sheetName', sheetName)
        params.append('action', 'insert')
        params.append('rowData', JSON.stringify(rowData))
        params.append('hasFile', 'false')
        params.append('callback', callbackName) // Add callback parameter for JSONP
        
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
          submitViaIframe(scriptUrl, sheetName, rowData)
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
    } catch (error) {
      console.error("Error submitting to Google Sheet:", error)
      return { success: false, error }
    }
  }
  
  // Backup method using iframe for form submission
  const submitViaIframe = (scriptUrl, sheetName, rowData) => {
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
      const addField = (name, value) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = name
        input.value = value
        form.appendChild(input)
      }
      
      addField('sheetName', sheetName)
      addField('action', 'insert')
      addField('rowData', JSON.stringify(rowData))
      addField('hasFile', 'false')
      
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
        <Link to="/quotation-validation" className="text-gray-600 hover:text-gray-900 mr-4 flex items-center">
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Quotation Validation
        </Link>
        <h1 className="text-3xl font-bold">Quotation Validation</h1>
      </div>

      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Quotation Validation</h2>
          <p className="text-sm text-gray-500">Validate quotations and track additional materials sent to clients.</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="quotationValidatorName" className="block text-sm font-medium">
                  Quotation Validator Name
                </label>
                <select
                  id="quotationValidatorName"
                  name="quotationValidatorName"
                  value={formData.quotationValidatorName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select validator</option>
                  <option value="rahul">Rahul Sharma</option>
                  <option value="priya">Priya Patel</option>
                  <option value="amit">Amit Singh</option>
                  <option value="neha">Neha Gupta</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="quotationSendStatus" className="block text-sm font-medium">
                  Quotation Send Status
                </label>
                <select
                  id="quotationSendStatus"
                  name="quotationSendStatus"
                  value={formData.quotationSendStatus}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select status</option>
                  <option value="sent">Sent</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="revised">Revised</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="quotationValidationRemark" className="block text-sm font-medium">
                Quotation Validation Remark
              </label>
              <textarea
                id="quotationValidationRemark"
                name="quotationValidationRemark"
                placeholder="Enter validation remarks"
                value={formData.quotationValidationRemark}
                onChange={handleChange}
                rows="4"
                className="w-full p-2 border border-gray-300 rounded-md"
              ></textarea>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Materials Sent</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <input
                    type="checkbox"
                    id="sendFAQVideo"
                    name="sendFAQVideo"
                    checked={formData.sendFAQVideo}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                  />
                  <div className="space-y-1 leading-none">
                    <label htmlFor="sendFAQVideo" className="text-sm font-medium">
                      Send FAQ Video
                    </label>
                  </div>
                </div>

                <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <input
                    type="checkbox"
                    id="sendProductVideo"
                    name="sendProductVideo"
                    checked={formData.sendProductVideo}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                  />
                  <div className="space-y-1 leading-none">
                    <label htmlFor="sendProductVideo" className="text-sm font-medium">
                      Send Product Video
                    </label>
                  </div>
                </div>

                <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <input
                    type="checkbox"
                    id="sendOfferVideo"
                    name="sendOfferVideo"
                    checked={formData.sendOfferVideo}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                  />
                  <div className="space-y-1 leading-none">
                    <label htmlFor="sendOfferVideo" className="text-sm font-medium">
                      Send Offer Video
                    </label>
                  </div>
                </div>

                <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <input
                    type="checkbox"
                    id="sendProductCatalogue"
                    name="sendProductCatalogue"
                    checked={formData.sendProductCatalogue}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                  />
                  <div className="space-y-1 leading-none">
                    <label htmlFor="sendProductCatalogue" className="text-sm font-medium">
                      Send Product Catalogue
                    </label>
                  </div>
                </div>

                <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <input
                    type="checkbox"
                    id="sendProductImage"
                    name="sendProductImage"
                    checked={formData.sendProductImage}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                  />
                  <div className="space-y-1 leading-none">
                    <label htmlFor="sendProductImage" className="text-sm font-medium">
                      Send Product Image
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Save Validation"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default QuotationValidationForm