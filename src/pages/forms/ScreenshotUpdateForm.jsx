"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { useToast } from "../../contexts/ToastContext"
import FileUploader from "../../components/FileUploader"

function ScreenshotUpdateForm() {
  const { showToast } = useToast()
  const location = useLocation()
  const params = useParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Google Sheet details
  const sheetId = '1afFwVmnYe9nhSXrNxkm9nvm_fzKDuP-nqRjAku9N6og'
  const sheetName = 'Screenshot Update'
  
  // Google Apps Script Web App URL - use the same script URL as your other form
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbypHleEBGEeSUXbwp-RjM56LimSlNBSK-xsuNbQUSbOucR33GEsExfr1T-Yc6a4Rd7c/exec'

  const [formData, setFormData] = useState({
    enquiryNo: "",
    // companyName: "",
    quotationNumber: "",
    screenshot: null,
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
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (file) => {
    setFormData((prev) => ({
      ...prev,
      screenshot: file,
    }))
  }

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
    
    if (!formData.screenshot) {
      showToast("Error", "Please upload a screenshot image.", "error")
      return
    }
    
    setIsSubmitting(true)

    try {
      // Generate timestamp for the first column
      const formattedTimestamp = formatDate(new Date())
      
      // Create an array to match the sheet's exact column order
      const rowData = [
        formattedTimestamp,            // Timestamp
        formData.enquiryNo,            // Enquiry No
        formData.quotationNumber,      // Quotation Number
        // formData.companyName || "",    // Company Name
        // File URL will be added by the server script
      ]

      // Build form data for submission
      const formPayload = new FormData()
      formPayload.append('sheetName', sheetName)
      formPayload.append('action', 'insert')
      formPayload.append('rowData', JSON.stringify(rowData))

      // Handle file if present
      if (formData.screenshot) {
        // Convert file to base64
        const base64File = await fileToBase64(formData.screenshot)
        
        // Add file data to form payload
        formPayload.append('hasFile', 'true')
        formPayload.append('fileName', formData.screenshot.name)
        formPayload.append('fileType', formData.screenshot.type)
        formPayload.append('fileData', base64File)
      } else {
        formPayload.append('hasFile', 'false')
      }

      // Send data to Google Sheets using the same approach as UpdateQuotationForm
      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: formPayload,
        mode: 'no-cors' // Required for cross-origin requests to Google Apps Script
      })

      // Show success message
      showToast("Screenshot Updated", `Screenshot for enquiry #${formData.enquiryNo} has been successfully uploaded.`)

      // Reset form after submission
      setFormData({
        enquiryNo: "",
        // companyName: "",
        quotationNumber: "",
        screenshot: null,
      })
    } catch (error) {
      console.error("Error submitting form:", error)
      showToast("Error", "There was a problem uploading the screenshot. Please try again.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link to="/screenshot-update" className="text-gray-600 hover:text-gray-900 mr-4 flex items-center">
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Screenshot Update
        </Link>
        <h1 className="text-3xl font-bold">Screenshot Update</h1>
      </div>

      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Screenshot Update</h2>
          <p className="text-sm text-gray-500">Upload chat screenshots for documentation.</p>
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
                  readOnly={!!params.enquiryNo} // Make read-only if passed as URL parameter
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
                  placeholder="ABC Company"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div> */}
            </div>

            <div className="space-y-2">
              <label htmlFor="screenshot" className="block text-sm font-medium">
                Chat Screenshot
              </label>
              <FileUploader 
                value={formData.screenshot} 
                onChange={handleFileChange} 
                accept="image/*"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload a screenshot of the chat conversation (PNG, JPG, etc.)
              </p>
            </div>

            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Uploading...
                </>
              ) : (
                "Upload Screenshot"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ScreenshotUpdateForm