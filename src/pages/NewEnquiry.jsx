"use client"

import { useState, useEffect } from "react"
import { useToast } from "../contexts/ToastContext"

function NewEnquiryPage() {
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serialNumbers, setSerialNumbers] = useState([])
  
  // New state variables for dropdown options
  const [salesTypeOptions, setSalesTypeOptions] = useState([])
  const [enquiryStateOptions, setEnquiryStateOptions] = useState([])
  const [salesCoordinatorOptions, setSalesCoordinatorOptions] = useState([])
  const [industryTypeOptions, setIndustryTypeOptions] = useState([])
  const [enquirySourceOptions, setEnquirySourceOptions] = useState([])
  
  const [formData, setFormData] = useState({
    receivedBy: "",
    salesCoOrdinator: "",
    enquiryForState: "",
    enquiryType: "",
    companyName: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    projectName: "",
    requirementProductDate: "",
    requirementProductName: "",
    requirementProductQty: "",
    approximateValue: "",
    salesSource: "",
    salesType: "",
    industryType: "",
    enquirySource: "",
    priority: "",
    additionalNotes: "",
  })

  // Google Sheet details
  const sheetId = '1afFwVmnYe9nhSXrNxkm9nvm_fzKDuP-nqRjAku9N6og'
  const sheetName = 'REPORT'
  const dropdownSheetName = 'DROPDOWN' // New sheet for dropdown options
  
  // Google Apps Script Web App URL
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbypHleEBGEeSUXbwp-RjM56LimSlNBSK-xsuNbQUSbOucR33GEsExfr1T-Yc6a4Rd7c/exec'

  useEffect(() => {
    // Fetch existing serial numbers from Google Sheet when component mounts
    fetchSerialNumbers()
    // Fetch dropdown options
    fetchDropdownOptions()
  }, [])

  // New function to fetch dropdown options
  const fetchDropdownOptions = async () => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(dropdownSheetName)}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch dropdown data: ${response.status}`)
      }

      // Extract JSON data from the response
      const text = await response.text()
      const jsonStart = text.indexOf("{")
      const jsonEnd = text.lastIndexOf("}")
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)

      if (!data.table || !data.table.rows) {
        console.log("No dropdown data found")
        return
      }

      // Get unique values from specified columns
      const salesTypeCol = 10 // Column K (0-indexed, so J is 9, K is 10)
      const enquiryStateCol = 11 // Column L
      const salesCoordinatorCol = 12 // Column M
      const industryTypeCol = 13 // Column N
      const enquirySourceCol = 14 // Column O

      // Helper function to extract unique values from a column (skipping header row)
      const extractUniqueOptions = (columnIndex) => {
        const options = new Set()
        
        // Skip the first row (header) by starting from index 1
        data.table.rows.forEach((row, rowIndex) => {
          // Skip the first row (header row)
          if (rowIndex === 0) return
          
          if (row.c && row.c[columnIndex] && row.c[columnIndex].v) {
            options.add(row.c[columnIndex].v.toString().trim())
          }
        })
        
        return Array.from(options).sort()
      }

      // Extract options for each dropdown
      setSalesTypeOptions(extractUniqueOptions(salesTypeCol))
      setEnquiryStateOptions(extractUniqueOptions(enquiryStateCol))
      setSalesCoordinatorOptions(extractUniqueOptions(salesCoordinatorCol))
      setIndustryTypeOptions(extractUniqueOptions(industryTypeCol))
      setEnquirySourceOptions(extractUniqueOptions(enquirySourceCol))

      console.log("Dropdown options loaded successfully")
    } catch (error) {
      console.error("Error fetching dropdown options:", error)
      // If we can't fetch, we'll use default options
      setSalesTypeOptions(['new_sale', 'renewal', 'upsell', 'cross_sell', 'other'])
      setEnquiryStateOptions(['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Other'])
      setSalesCoordinatorOptions(['Default Coordinator'])
      setIndustryTypeOptions(['technology', 'manufacturing', 'healthcare', 'retail', 'finance', 'education', 'agriculture', 'automotive', 'construction', 'other'])
      setEnquirySourceOptions(['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'exhibition', 'direct_marketing', 'partner', 'other'])
    }
  }

  const fetchSerialNumbers = async () => {
    setIsLoading(true)
    try {
      // Fetch data from Google Sheet using a publicly accessible URL
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
      
      console.log("Fetching data from:", url)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }
      
      // Extract JSON data from the response (Google returns wrapped JSON)
      const text = await response.text()
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}')
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)
      
      // Extract serial numbers from column B (index 1)
      const serialNumbersFromSheet = []
      if (data.table && data.table.rows) {
        console.log(`Found ${data.table.rows.length} rows in the sheet`)
        
        data.table.rows.forEach((row, index) => {
          if (row.c && row.c[1] && row.c[1].v) {
            const serialNumber = row.c[1].v.toString().trim()
            console.log(`Row ${index + 1}: Found serial number ${serialNumber}`)
            serialNumbersFromSheet.push(serialNumber)
          } else {
            console.log(`Row ${index + 1}: No valid serial number found`)
          }
        })
      }
      
      console.log("Collected serial numbers:", serialNumbersFromSheet)
      setSerialNumbers(serialNumbersFromSheet)
    } catch (error) {
      console.error("Error fetching serial numbers:", error)
      // If we can't fetch, we'll start with SN-001
      setSerialNumbers([])
    } finally {
      setIsLoading(false)
    }
  }

  const generateNextSerialNumber = () => {
    // Log the serialNumbers for debugging
    console.log("All serial numbers in sheet:", serialNumbers)
    
    // Filter out any non-string or empty values
    const validNumbers = serialNumbers.filter(num => 
      typeof num === 'string' && num.trim() !== ''
    )
    
    console.log("Valid serial numbers:", validNumbers)
    
    if (validNumbers.length === 0) {
      // No existing numbers, start with SN-001
      console.log("No valid serial numbers found, starting with SN-001")
      return 'SN-001'
    }
    
    // Extract the numeric part and find the highest number
    let highestNumber = 0
    let prefix = 'SN-'
    let highestSerialFound = ''
    
    for (const serialNum of validNumbers) {
      // Extract prefix and number part (e.g., "SN-004" → "SN-" and "004")
      const match = /^([A-Za-z\-]+)(\d+)$/.exec(serialNum)
      if (match) {
        const existingPrefix = match[1]  // e.g., "SN-"
        const numberPart = parseInt(match[2], 10)
        
        console.log(`Checking serial: ${serialNum}, number part: ${numberPart}`)
        
        // Update if this is the highest number we've seen
        if (numberPart > highestNumber) {
          highestNumber = numberPart
          prefix = existingPrefix
          highestSerialFound = serialNum
        }
      }
    }
    
    console.log(`Highest serial number found: ${highestSerialFound} (number part: ${highestNumber})`)
    
    // Generate the next serial number
    const nextNumber = highestNumber + 1
    console.log(`Next number will be: ${nextNumber}`)
    
    // Get the number of digits in the highest serial number (for padding)
    const digits = validNumbers
      .filter(sn => /^[A-Za-z\-]+\d+$/.test(sn))
      .map(sn => {
        const match = /^[A-Za-z\-]+(\d+)$/.exec(sn)
        return match ? match[1].length : 0
      })
      .reduce((max, len) => Math.max(max, len), 3) // Default to 3 digits
    
    // Format with correct padding (e.g., 001, 010, 100)
    const nextNumberFormatted = nextNumber.toString().padStart(digits, '0')
    
    // Return the new serial number
    const result = `${prefix}${nextNumberFormatted}`
    console.log(`Generated next serial number: ${result}`)
    return result
  }

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
      
      // Generate the next serial number
      const nextSerialNumber = generateNextSerialNumber()
      
      // Format data for Google Sheets
      // This array order should match your sheet columns
      const rowData = [
        formattedTimestamp, // Timestamp
        nextSerialNumber,   // Serial Number (SN-001, SN-002, etc.)
        formData.receivedBy,
        formData.salesCoOrdinator,
        formData.enquiryForState,
        formData.enquiryType,
        formData.companyName,
        formData.contactPerson,
        formData.contactPhone,
        formData.contactEmail,
        formData.projectName,
        formData.requirementProductDate,
        formData.requirementProductName,
        formData.requirementProductQty,
        formData.approximateValue,
        formData.salesSource,
        formData.salesType,
        formData.industryType,
        formData.enquirySource,
        formData.priority,
        formData.additionalNotes,
      ]

      // Build form data for submission
      const formPayload = new FormData()
      formPayload.append('sheetName', sheetName)
      formPayload.append('action', 'insert')
      formPayload.append('rowData', JSON.stringify(rowData))

      // Send data to Google Sheets with detailed error handling
      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: formPayload,
        mode: 'no-cors' // Required for cross-origin requests to Google Apps Script
      })

      // Log the response for debugging
      console.log('Submission response:', response)

      // Update our local cache of serial numbers
      setSerialNumbers(prev => [...prev, nextSerialNumber])

      // Show success message
      showToast("Enquiry Created", `New enquiry #${nextSerialNumber} has been successfully saved to the system.`)

      // Reset form after submission
      setFormData({
        receivedBy: "",
        salesCoOrdinator: "",
        enquiryForState: "",
        enquiryType: "",
        companyName: "",
        contactPerson: "",
        contactPhone: "",
        contactEmail: "",
        projectName: "",
        requirementProductDate: "",
        requirementProductName: "",
        requirementProductQty: "",
        approximateValue: "",
        salesSource: "",
        salesType: "",
        industryType: "",
        enquirySource: "",
        priority: "",
        additionalNotes: "",
      })
    } catch (error) {
      console.error("Error submitting form:", error)
      showToast("Error", "There was a problem creating the enquiry. Please try again.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Dynamic dropdown component
  const DropdownField = ({ id, name, label, options, value, onChange, required = false }) => (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required={required}
      >
        <option value="">Select {label}</option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">New Enquiry</h1>

      <div className="bg-white rounded-lg shadow-lg border max-w-4xl mx-auto">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Enquiry Details</h2>
          <p className="text-sm text-gray-500">Enter the details of the new enquiry to add it to the system.</p>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-indigo-600">Loading...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Enquiry Received By */}
                <div className="space-y-2">
                  <label htmlFor="receivedBy" className="block text-sm font-medium">
                    Enquiry Received By
                  </label>
                  <input
                    id="receivedBy"
                    name="receivedBy"
                    type="text"
                    placeholder="Agent Name"
                    value={formData.receivedBy}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                {/* Sales Co-Ordinator Name (Dynamic Dropdown) */}
                <DropdownField
                  id="salesCoOrdinator"
                  name="salesCoOrdinator"
                  label="Sales Co-Ordinator Name"
                  options={salesCoordinatorOptions}
                  value={formData.salesCoOrdinator}
                  onChange={handleChange}
                  required={true}
                />

                {/* Enquiry For State (Dynamic Dropdown) */}
                <DropdownField
                  id="enquiryForState"
                  name="enquiryForState"
                  label="Enquiry For State"
                  options={enquiryStateOptions}
                  value={formData.enquiryForState}
                  onChange={handleChange}
                  required={true}
                />

                {/* Enquiry Type (Dropdown) */}
                <div className="space-y-2">
                  <label htmlFor="enquiryType" className="block text-sm font-medium">
                    Enquiry Type
                  </label>
                  <select
                    id="enquiryType"
                    name="enquiryType"
                    value={formData.enquiryType}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Enquiry Type</option>
                    <option value="new_business">New Business</option>
                    <option value="existing_customer">Existing Customer</option>
                    <option value="follow_up">Follow Up</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Company Name */}
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
                  />
                </div>

                {/* Contact Person */}
                <div className="space-y-2">
                  <label htmlFor="contactPerson" className="block text-sm font-medium">
                    Contact Person
                  </label>
                  <input
                    id="contactPerson"
                    name="contactPerson"
                    type="text"
                    placeholder="John Doe"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                {/* Contact Phone */}
                <div className="space-y-2">
                  <label htmlFor="contactPhone" className="block text-sm font-medium">
                    Contact Phone
                  </label>
                  <input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                {/* Contact Email */}
                <div className="space-y-2">
                  <label htmlFor="contactEmail" className="block text-sm font-medium">
                    Contact Email
                  </label>
                  <input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                {/* Project Name */}
                <div className="space-y-2">
                  <label htmlFor="projectName" className="block text-sm font-medium">
                    Project Name
                  </label>
                  <input
                    id="projectName"
                    name="projectName"
                    type="text"
                    placeholder="Project Name"
                    value={formData.projectName}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                {/* Requirement Product Date */}
                <div className="space-y-2">
                  <label htmlFor="requirementProductDate" className="block text-sm font-medium">
                    Requirement Product Date
                  </label>
                  <input
                    id="requirementProductDate"
                    name="requirementProductDate"
                    type="date"
                    value={formData.requirementProductDate}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                {/* Requirement Product Name */}
                <div className="space-y-2">
                  <label htmlFor="requirementProductName" className="block text-sm font-medium">
                    Requirement Product Name
                  </label>
                  <input
                    id="requirementProductName"
                    name="requirementProductName"
                    type="text"
                    placeholder="Product Name"
                    value={formData.requirementProductName}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                {/* Requirement Product Qty */}
                <div className="space-y-2">
                  <label htmlFor="requirementProductQty" className="block text-sm font-medium">
                    Requirement Product Qty
                  </label>
                  <input
                    id="requirementProductQty"
                    name="requirementProductQty"
                    type="number"
                    placeholder="Quantity"
                    value={formData.requirementProductQty}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                {/* Approximate Value */}
                <div className="space-y-2">
                  <label htmlFor="approximateValue" className="block text-sm font-medium">
                    Approximate Value
                  </label>
                  <input
                    id="approximateValue"
                    name="approximateValue"
                    type="number"
                    placeholder="Approximate Value"
                    value={formData.approximateValue}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                {/* Sales Source (Dropdown) */}
                <div className="space-y-2">
                  <label htmlFor="salesSource" className="block text-sm font-medium">
                    Select Sales Source
                  </label>
                  <select
                    id="salesSource"
                    name="salesSource"
                    value={formData.salesSource}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Sales Source</option>
                    <option value="direct">Direct</option>
                    <option value="channel">Channel</option>
                    <option value="partner">Partner</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Sales Type (Dynamic Dropdown) */}
                <DropdownField
                  id="salesType"
                  name="salesType"
                  label="Sales Type"
                  options={salesTypeOptions}
                  value={formData.salesType}
                  onChange={handleChange}
                  required={true}
                />

                {/* Industry Type (Dynamic Dropdown) */}
                <DropdownField
                  id="industryType"
                  name="industryType"
                  label="Industry Type"
                  options={industryTypeOptions}
                  value={formData.industryType}
                  onChange={handleChange}
                  required={true}
                />

                {/* Enquiry Source (Dynamic Dropdown) */}
                <DropdownField
                  id="enquirySource"
                  name="enquirySource"
                  label="Enquiry Source"
                  options={enquirySourceOptions}
                  value={formData.enquirySource}
                  onChange={handleChange}
                  required={true}
                />

                {/* Priority (Dropdown) */}
                <div className="space-y-2">
                  <label htmlFor="priority" className="block text-sm font-medium">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <label htmlFor="additionalNotes" className="block text-sm font-medium">
                  Additional Notes
                </label>
                <textarea
                  id="additionalNotes"
                  name="additionalNotes"
                  placeholder="Add any additional notes or technical requirements"
                  value={formData.additionalNotes}
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
                  "Create Enquiry"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default NewEnquiryPage