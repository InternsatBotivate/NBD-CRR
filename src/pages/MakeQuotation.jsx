"use client"

import { useState, useEffect, useRef } from "react"
import { useToast } from "../contexts/ToastContext"
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import autoTable from 'jspdf-autotable'

function MakeQuotationPage() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState("edit")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quotationLink, setQuotationLink] = useState("")
  const [pdfUrl, setPdfUrl] = useState("")
  const [isLoadingQuotationNo, setIsLoadingQuotationNo] = useState(true)
  const previewRef = useRef(null);
  const [referenceOptions, setReferenceOptions] = useState([]);
const [companyOptions, setCompanyOptions] = useState([]);
const [stateOptions, setStateOptions] = useState([]);
const [isLoadingOptions, setIsLoadingOptions] = useState(false);
const [selectedState, setSelectedState] = useState("");
const [selectedImage, setSelectedImage] = useState(null);
const [imageUrl, setImageUrl] = useState("");

  // Google Sheet details
  const QUOTATION_DRIVE_FOLDER_ID = "1lkCI3k2KL6njdbGjqlTVRWXdAGjfqLlZ"
  const sheetId = "1afFwVmnYe9nhSXrNxkm9nvm_fzKDuP-nqRjAku9N6og"
  const sheetName = "Make Quotation"

  // Google Apps Script Web App URL
  const scriptUrl =
    "https://script.google.com/macros/s/AKfycbypHleEBGEeSUXbwp-RjM56LimSlNBSK-xsuNbQUSbOucR33GEsExfr1T-Yc6a4Rd7c/exec"

  // Initialize quotation data with empty/default values
  const [quotationData, setQuotationData] = useState({
    // Quotation details - all empty
    quotationNo: "",
    date: new Date().toLocaleDateString("en-GB"),
    
    // Consignor details - all empty
    consignorState: "",
    consignorName: "",
    consignorAddress: "",
    consignorMobile: "",
    consignorPhone: "",
    consignorGSTIN: "",
    consignorStateCode: "",
    
    // Consignee details - all empty
    companyName: "", 
    consigneeName: "",
    consigneeAddress: "",
    consigneeState: "",
    consigneeContactName: "",
    consigneeContactNo: "",
    consigneeGSTIN: "",
    consigneeStateCode: "",
    
    // MSME details - empty
    msmeNumber: "",
    
    // Items - start with one empty item
    items: [
      {
        id: 1,
        code: "",
        name: "",
        gst: 18,
        qty: 1,
        units: "Nos",
        rate: 0,
        amount: 0,
      },
    ],
    
    // Totals - initialized to 0
    subtotal: 0,
    cgstRate: 9,
    sgstRate: 9,
    cgstAmount: 0,
    sgstAmount: 0,
    total: 0,
    
    // Terms - all empty
    validity: "The above quoted prices are valid up to 5 days from date of offer.",
    paymentTerms: "100% advance payment in the mode of NEFT, RTGS & DD",
    delivery: "Material is ready in our stock",
    freight: "Extra as per actual.",
    insurance: "Transit insurance for all shipment is at Buyer's risk.",
    taxes: "Extra as per actual.",
    
    // Bank details - all empty
    accountNo: "",
    bankName: "",
    bankAddress: "",
    ifscCode: "",
    email: "",
    website: "",
    pan: "",
    
    // Notes - start with empty array
    notes: [],
    
    // Other fields
    preparedBy: "",
  });

// Add this useEffect to fetch dropdown options
// Update the fetchDropdownOptions function to skip the header row (row 1)
// Update the fetchDropdownOptions function to use column O for states and include header
// Create a reference to store the full Master sheet data
const masterSheetData = useRef([]);

// Update the fetchDropdownOptions function to store the full data
useEffect(() => {
  const fetchDropdownOptions = async () => {
    setIsLoadingOptions(true);
    try {
      // Fetch data from Master sheet
      const masterSheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=Master`;
      
      const response = await fetch(masterSheetUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const text = await response.text();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      const jsonString = text.substring(jsonStart, jsonEnd + 1);
      const data = JSON.parse(jsonString);

      if (data.table && data.table.rows && data.table.cols) {
        // Store the full data for lookup later
        masterSheetData.current = data.table.rows;
        
        // Get unique reference names from column J (index 9) - skip header
        const refNames = new Set();
        // Get unique company names from column A (index 0) - skip header
        const compNames = new Set();
        // Get unique states from column O (index 14) - INCLUDE header
        const states = new Set();

        // Get the header for the state dropdown (from column O, index 14)
        if (data.table.rows[0] && data.table.rows[0].c && 
            data.table.rows[0].c[14] && data.table.rows[0].c[14].v) {
          states.add(data.table.rows[0].c[14].v.toString().trim());
        }

        // Now process the rest of the rows (starting from index 1)
        for (let i = 1; i < data.table.rows.length; i++) {
          const row = data.table.rows[i];
          // Skip header for reference names and company names
          if (row.c && row.c[9] && row.c[9].v) refNames.add(row.c[9].v.toString().trim());
          if (row.c && row.c[0] && row.c[0].v) compNames.add(row.c[0].v.toString().trim());
          // Include data rows for states from column O (index 14)
          if (row.c && row.c[14] && row.c[14].v) states.add(row.c[14].v.toString().trim());
        }

        // Sort the options alphabetically (except for state which we want to keep the header first)
        setReferenceOptions(Array.from(refNames).filter(Boolean).sort());
        setCompanyOptions(Array.from(compNames).filter(Boolean).sort());
        
        // For states, maintain the original order with header first
        const stateArray = Array.from(states).filter(Boolean);
        if (data.table.rows[0] && data.table.rows[0].c && 
            data.table.rows[0].c[14] && data.table.rows[0].c[14].v) {
          const headerValue = data.table.rows[0].c[14].v.toString().trim();
          const headerIndex = stateArray.indexOf(headerValue);
          
          if (headerIndex > 0) {
            // If header exists but is not first, move it to the beginning
            const header = stateArray.splice(headerIndex, 1)[0];
            stateArray.unshift(header);
          }
        }
        
        setStateOptions(stateArray);
      }
    } catch (error) {
      console.error("Error fetching dropdown options:", error);
      showToast("Error", "Failed to load dropdown options", "error");
    } finally {
      setIsLoadingOptions(false);
    }
  };

  fetchDropdownOptions();
}, []);

// Add this to ensure quotation number is fetched when component mounts
useEffect(() => {
  fetchLastQuotationNumber();
}, []);

// Create an enhanced handleInputChange function that auto-fills related data
// Updated handleInputChange function to handle both dropdowns
// Add a function to handle state changes specifically
// const handleStateChange = (selectedState) => {
//   console.log("Selected state:", selectedState);
  
//   // First, update the state in quotationData
//   handleInputChange("consigneeState", selectedState);
  
//   // Now, find the matching row in the Master sheet based on the selected state
//   if (masterSheetData.current && masterSheetData.current.length > 0) {
//     // Find a row where column O (index 14) matches the selected state
//     const stateRow = masterSheetData.current.find(row => 
//       row.c && row.c[14] && row.c[14].v && 
//       row.c[14].v.toString().trim() === selectedState
//     );
    
//     if (stateRow) {
//       // Get the corresponding data based on the columns in your sheet
//       // Adjust the indices based on your actual data
//       const stateCode = stateRow.c[15] && stateRow.c[15].v ? stateRow.c[15].v.toString().trim() : "";
      
//       // Update state code in the form
//       setQuotationData(prevData => ({
//         ...prevData,
//         consigneeStateCode: stateCode
//       }));
      
//       showToast("Info", `Updated state information for ${selectedState}`, "info");
//     }
//   }
// };

  const fetchLastQuotationNumber = async () => {
    setIsLoadingQuotationNo(true)
    try {
      // Fetch data from Google Sheet
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`

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

      // Get the next quotation number
      const nextQuotationNo = getNextQuotationNumber(data)

      // Update quotation data with the new quotation number
      setQuotationData((prevData) => ({
        ...prevData,
        quotationNo: nextQuotationNo,
      }))
    } catch (error) {
      console.error("Error fetching quotation number:", error)
      showToast("Error", "Failed to generate quotation number. Using default format.", "error")

      // Use default "IN-NBD-001" if there's an error
      setQuotationData((prevData) => ({
        ...prevData,
        quotationNo: "IN-NBD-001",
      }))
    } finally {
      setIsLoadingQuotationNo(false)
    }
  }

  const getNextQuotationNumber = (data) => {
    // Default start if no data or error
    let nextNumber = 1
    let prefix = "IN-NBD-"

    try {
      if (data.table && data.table.rows && data.table.cols) {
        // Find the column index for quotation number (column B)
        const quotationNoColIndex = 1 // Column B is index 1 (0-based)

        // Get all quotation numbers
        const quotationNumbers = []

        data.table.rows.forEach((row) => {
          if (row.c && row.c[quotationNoColIndex] && row.c[quotationNoColIndex].v) {
            const quotationNo = row.c[quotationNoColIndex].v.toString().trim()
            if (quotationNo) {
              quotationNumbers.push(quotationNo)
            }
          }
        })

        if (quotationNumbers.length > 0) {
          // Get the last quotation number
          const lastQuotationNo = quotationNumbers[quotationNumbers.length - 1]

          // Extract the numeric part and prefix
          const match = lastQuotationNo.match(/^([A-Za-z-]+)(\d+)$/)

          if (match) {
            prefix = match[1]
            nextNumber = Number.parseInt(match[2], 10) + 1
          }
        }
      }

      // Format the next number with leading zeros (e.g., 001, 002, etc.)
      const formattedNumber = nextNumber.toString().padStart(3, "0")
      return `${prefix}${formattedNumber}`
    } catch (error) {
      console.error("Error parsing quotation numbers:", error)
      return "IN-NBD-001" // Fallback
    }
  }

  // Format date in DD/MM/YYYY format
  const formatDate = (date) => {
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const handleInputChange = (field, value) => {
    setQuotationData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // 2. Create a function to parse bank details from column P
  const parseBankDetails = (bankDetailsText) => {
    if (!bankDetailsText) return {};
    
    // Create object to store parsed values
    const details = {
      accountNo: "",
      bankName: "",
      bankAddress: "",
      ifscCode: "",
      email: "",
      website: ""
    };
    
    // Split by newlines to get individual lines
    const lines = bankDetailsText.split('\n');
    
    // Parse each line
    lines.forEach(line => {
      if (line.startsWith('Account No.:')) {
        details.accountNo = line.replace('Account No.:', '').trim();
      } else if (line.startsWith('Bank Name:')) {
        details.bankName = line.replace('Bank Name:', '').trim();
      } else if (line.startsWith('Bank Address:')) {
        details.bankAddress = line.replace('Bank Address:', '').trim();
      } else if (line.startsWith('IFSC CODE:')) {
        details.ifscCode = line.replace('IFSC CODE:', '').trim();
      } else if (line.startsWith('Email:')) {
        details.email = line.replace('Email:', '').trim();
      } else if (line.startsWith('Website:')) {
        details.website = line.replace('Website:', '').trim();
      }
    });
    
    return details;
  };
  
  // 3. Create an enhanced handleStateChange function that auto-fills all related data
 // Updated handleStateChange function for consignor details
const handleStateChange = (selectedState, type = 'consignee') => {
  console.log(`Selected ${type} state:`, selectedState);
  
  // Determine which fields to update based on type
  const stateField = type === 'consignor' ? 'consignorState' : 'consigneeState';
  const addressField = type === 'consignor' ? 'consignorAddress' : 'consigneeAddress';
  const stateCodeField = type === 'consignor' ? 'consignorStateCode' : 'consigneeStateCode';
  const gstinField = type === 'consignor' ? 'consignorGSTIN' : 'consigneeGSTIN';
  
  // First, update the state in quotationData
  handleInputChange(stateField, selectedState);
  
  // Now, find the matching row in the Master sheet based on the selected state
  if (masterSheetData.current && masterSheetData.current.length > 0) {
    // Find a row where column O (index 14) matches the selected state
    const stateRow = masterSheetData.current.find(row => 
      row.c && row.c[14] && row.c[14].v && 
      row.c[14].v.toString().trim() === selectedState
    );
    
    if (stateRow) {
      // Get the corresponding data based on the columns in your sheet
      // State Code from column S (index 18)
      const stateCode = stateRow.c[18] && stateRow.c[18].v ? stateRow.c[18].v.toString().trim() : "";
      
      // Address from column Q (index 16)
      const address = stateRow.c[16] && stateRow.c[16].v ? stateRow.c[16].v.toString().trim() : "";
      
      // GSTIN from column T (index 19)
      const gstin = stateRow.c[19] && stateRow.c[19].v ? stateRow.c[19].v.toString().trim() : "";
      
      // Bank details from column P (index 15)
      const bankDetailsText = stateRow.c[15] && stateRow.c[15].v ? stateRow.c[15].v.toString() : "";
      const bankDetails = parseBankDetails(bankDetailsText);
      
      // Update all fields in quotationData
      setQuotationData(prevData => ({
        ...prevData,
        // State code
        [stateCodeField]: stateCode,
        
        // Address
        [addressField]: address || prevData[addressField],
        
        // GSTIN
        [gstinField]: gstin || prevData[gstinField],
        
        // Bank details - only update if type is consignor
        ...(type === 'consignor' ? {
          accountNo: bankDetails.accountNo || prevData.accountNo,
          bankName: bankDetails.bankName || prevData.bankName,
          bankAddress: bankDetails.bankAddress || prevData.bankAddress,
          ifscCode: bankDetails.ifscCode || prevData.ifscCode,
          email: bankDetails.email || prevData.email,
          website: bankDetails.website || prevData.website
        } : {})
      }));
      
      showToast("Info", `Updated all information for ${selectedState}`, "info");
    } else {
      // If no matching row is found, just update the state code field to empty
      handleInputChange(stateCodeField, "");
    }
  }
};


// Enhanced function to handle company name selection and auto-fill
const handleCompanyNameChange = (selectedCompany) => {
  // First, update the company name in quotation data
  handleInputChange("consigneeName", selectedCompany);

  // Find the matching row in the Master sheet based on the selected company
  if (masterSheetData.current && masterSheetData.current.length > 0) {
    // Find a row where column A (index 0) matches the selected company
    const companyRow = masterSheetData.current.find(row => 
      row.c && row.c[0] && row.c[0].v && 
      row.c[0].v.toString().trim() === selectedCompany
    );
    
    if (companyRow) {
      // Auto-fill details from corresponding columns
      // Address from column D (index 3)
      const address = companyRow.c[3] && companyRow.c[3].v ? 
        companyRow.c[3].v.toString().trim() : "";
      
      // State from column E (index 4)
      const state = companyRow.c[4] && companyRow.c[4].v ? 
        companyRow.c[4].v.toString().trim() : "";
      
      // Contact Name from column B (index 1)
      const contactName = companyRow.c[1] && companyRow.c[1].v ? 
        companyRow.c[1].v.toString().trim() : "";
      
      // Contact No from column C (index 2)
      const contactNo = companyRow.c[2] && companyRow.c[2].v ? 
        companyRow.c[2].v.toString().trim() : "";
      
      // GSTIN from column F (index 5)
      const gstin = companyRow.c[5] && companyRow.c[5].v ? 
        companyRow.c[5].v.toString().trim() : "";
      
      // State Code from column G (index 6)
      const stateCode = companyRow.c[6] && companyRow.c[6].v ? 
        companyRow.c[6].v.toString().trim() : "";

      // Update quotation data with the found details
      setQuotationData(prevData => ({
        ...prevData,
        consigneeName: selectedCompany,
        consigneeAddress: address || prevData.consigneeAddress,
        consigneeState: state || prevData.consigneeState,
        consigneeContactName: contactName || prevData.consigneeContactName,
        consigneeContactNo: contactNo || prevData.consigneeContactNo,
        consigneeGSTIN: gstin || prevData.consigneeGSTIN,
        consigneeStateCode: stateCode || prevData.consigneeStateCode
      }));
      
      showToast("Info", `Updated details for ${selectedCompany}`, "info");
    } else {
      // If no matching row is found, reset or keep existing data
      showToast("Info", "No matching company details found", "warning");
    }
  }
};


  // Handle item changes
  const handleItemChange = (id, field, value) => {
    setQuotationData((prev) => {
      const newItems = prev.items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }

          // Recalculate amount if quantity or rate changes
          if (field === "qty" || field === "rate") {
            updatedItem.amount = Number(updatedItem.qty) * Number(updatedItem.rate)
          }

          return updatedItem
        }
        return item
      })

      // Recalculate totals
      const subtotal = newItems.reduce((sum, item) => sum + item.amount, 0)
      const cgstAmount = subtotal * (prev.cgstRate / 100)
      const sgstAmount = subtotal * (prev.sgstRate / 100)
      const total = subtotal + cgstAmount + sgstAmount

      return {
        ...prev,
        items: newItems,
        subtotal,
        cgstAmount,
        sgstAmount,
        total,
      }
    })
  }

  // Handle note changes
  const handleNoteChange = (index, value) => {
    setQuotationData((prev) => {
      const newNotes = [...prev.notes]
      newNotes[index] = value
      return {
        ...prev,
        notes: newNotes,
      }
    })
  }

  // Add a new note
  const addNote = () => {
    setQuotationData((prev) => ({
      ...prev,
      notes: [...prev.notes, ""],
    }))
  }

  // Remove a note
  const removeNote = (index) => {
    setQuotationData((prev) => {
      const newNotes = [...prev.notes]
      newNotes.splice(index, 1)
      return {
        ...prev,
        notes: newNotes,
      }
    })
  }

  // Add a new item
  const handleAddItem = () => {
    const newId = Math.max(0, ...quotationData.items.map((item) => item.id)) + 1
    setQuotationData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: newId,
          code: "",
          name: "",
          gst: 18,
          qty: 1,
          units: "Nos",
          rate: 0,
          amount: 0,
        },
      ],
    }))
  }

  // Replace your existing generatePdf function with this direct jsPDF approach
  // This completely avoids html2canvas and the oklch color issue

 // Modify the generatePdf function to create a more comprehensive PDF
// Modify the generatePdf function to directly download the PDF
const generatePdf = async () => {
  setIsGenerating(true);

  try {
    // Create a new PDF document
    const pdf = new jsPDF("p", "mm", "a4");
    
    // Page dimensions
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 10;

    // Set font
    pdf.setFont("helvetica");
    
    // Header Section
    pdf.setFontSize(12);
    pdf.text(quotationData.consignorName, margin, 10);
    pdf.setFontSize(10);
    pdf.text(quotationData.consignorAddress, margin, 15);
    pdf.text(`Mobile: ${quotationData.consignorMobile}`, margin, 20);
    pdf.text(`Phone: ${quotationData.consignorPhone}`, margin, 25);

    // Quotation Title and Number
    pdf.setFontSize(14);
    pdf.text("QUOTATION", pageWidth / 2, 20, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(`Quo No: ${quotationData.quotationNo}`, pageWidth - margin, 20, { align: 'right' });
    pdf.text(`Date: ${quotationData.date}`, pageWidth - margin, 25, { align: 'right' });

    // Consignor and Consignee Details
    pdf.setFontSize(10);
    let currentY = 35;
    pdf.text("Consignor Details", margin, currentY);
    currentY += 5;
    pdf.text(quotationData.consignorName, margin, currentY);
    currentY += 5;
    pdf.text(quotationData.consignorAddress, margin, currentY);
    currentY += 5;
    pdf.text(`GSTIN: ${quotationData.consignorGSTIN} State Code: ${quotationData.consignorStateCode}`, margin, currentY);

    currentY += 10;
    pdf.text("Consignee Details", margin, currentY);
    currentY += 5;
    pdf.text(`Reference Name: ${quotationData.consigneeName || "Please enter company name"}`, margin, currentY);
    currentY += 5;
    pdf.text(`Contact Name: ${quotationData.consigneeContactName || "Not specified"}`, margin, currentY);
    currentY += 5;
    pdf.text(`Contact No.: ${quotationData.consigneeContactNo || "Not specified"}`, margin, currentY);
    currentY += 5;
    pdf.text(quotationData.consigneeState, margin, currentY);
    currentY += 5;
    pdf.text(`MSME Number- ${quotationData.msmeNumber}`, margin, currentY);

    // Bill To and Ship To
    currentY += 10;
    pdf.text("Bill To", margin, currentY);
    currentY += 5;
    pdf.text(quotationData.consigneeAddress || "Please enter address", margin, currentY);
    currentY += 5;
    pdf.text(`GSTIN: ${quotationData.consigneeGSTIN || "N/A"} State Code: ${quotationData.consigneeStateCode}`, margin, currentY);

    currentY += 10;
    pdf.text("Ship To", margin, currentY);
    currentY += 5;
    pdf.text(quotationData.consigneeAddress || "Please enter address", margin, currentY);

    // Items Table
    currentY += 10;
    const columns = ["S No.", "Code", "Product Name", "GST", "Qty.", "Units", "Rate", "Amount"];
    const rows = quotationData.items.map((item, index) => [
      index + 1,
      item.code,
      item.name || "No name specified",
      `${item.gst}%`,
      item.qty,
      item.units,
      `₹${item.rate.toFixed(2)}`,
      `₹${item.amount.toFixed(2)}`
    ]);

    const tableOptions = {
      startY: currentY,
      head: [columns],
      body: rows,
      theme: 'striped',
      styles: { 
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: { 
        0: { cellWidth: 10 },  // S.No
        1: { cellWidth: 15 },  // Code
        2: { cellWidth: 40 },  // Product
        3: { cellWidth: 10 },  // GST
        4: { cellWidth: 10 },  // Qty
        5: { cellWidth: 15 },  // Units
        6: { cellWidth: 20 },  // Rate
        7: { cellWidth: 20 },  // Amount
      },
      margin: { left: margin },
    };

    autoTable(pdf, tableOptions);

    // Get the final Y position of the table
    const finalY = pdf.previousAutoTable ? pdf.previousAutoTable.finalY : currentY + 50;

    // Totals Section
    pdf.setFontSize(10);
    pdf.text(`Total`, pageWidth - 50, finalY + 10, { align: 'right' });
    pdf.text(`Subtotal: ₹${quotationData.subtotal.toFixed(2)}`, pageWidth - 50, finalY + 15, { align: 'right' });
    pdf.text(`CGST (${quotationData.cgstRate}%): ₹${quotationData.cgstAmount.toFixed(2)}`, pageWidth - 50, finalY + 20, { align: 'right' });
    pdf.text(`SGST (${quotationData.sgstRate}%): ₹${quotationData.sgstAmount.toFixed(2)}`, pageWidth - 50, finalY + 25, { align: 'right' });
    pdf.text(`Grand Total: ₹${quotationData.total.toFixed(2)}`, pageWidth - 50, finalY + 30, { align: 'right' });

    // Tax Details and Amount in Words
    let taxY = finalY + 40;
    pdf.text("Total Taxes", margin, taxY);
    taxY += 5;
    pdf.text(`Tax%: ${quotationData.cgstRate + quotationData.sgstRate}%`, margin, taxY);
    taxY += 5;
    pdf.text(`CGST: ₹${quotationData.cgstAmount.toFixed(2)}`, margin, taxY);
    taxY += 5;
    pdf.text(`SGST: ₹${quotationData.sgstAmount.toFixed(2)}`, margin, taxY);
    taxY += 5;
    pdf.text(`Total Tax: ₹${(quotationData.cgstAmount + quotationData.sgstAmount).toFixed(2)}`, margin, taxY);

    // Amount in Words
    taxY += 10;
    pdf.text("Amount in words:", margin, taxY);
    taxY += 5;
    pdf.text(`Rupees ${numberToWords(quotationData.total)} only`, margin, taxY);

    // Terms and Conditions
    let termsY = taxY + 15;
    pdf.text("Terms & Conditions:", margin, termsY);
    const termsFields = [
      { label: "Validity", value: quotationData.validity },
      { label: "Payment Terms", value: quotationData.paymentTerms },
      { label: "Delivery", value: quotationData.delivery },
      { label: "Freight", value: quotationData.freight },
      { label: "Insurance", value: quotationData.insurance },
      { label: "Taxes", value: quotationData.taxes }
    ];

    termsFields.forEach((term, index) => {
      termsY += 5;
      pdf.text(`${term.label}: ${term.value}`, margin, termsY);
    });

    // Notes
    termsY += 10;
    pdf.text("Notes:", margin, termsY);
    quotationData.notes.forEach((note, index) => {
      termsY += 5;
      pdf.text(`${index + 1}. ${note}`, margin, termsY);
    });

    // Bank Details
    let bankY = termsY + 15;
    pdf.text("Bank Details:", margin, bankY);
    const bankFields = [
      { label: "Account No.", value: quotationData.accountNo },
      { label: "Bank Name", value: quotationData.bankName },
      { label: "Bank Address", value: quotationData.bankAddress },
      { label: "IFSC CODE", value: quotationData.ifscCode },
      { label: "Email", value: quotationData.email },
      { label: "Website", value: quotationData.website },
      { label: "Company PAN", value: quotationData.pan }
    ];

    bankFields.forEach((field, index) => {
      bankY += 5;
      pdf.text(`${field.label}: ${field.value}`, margin, bankY);
    });

    // Declaration
    let declarationY = bankY + 15;
    pdf.text("Declaration:", margin, declarationY);
    declarationY += 5;
    pdf.text("We declare that this Quotation shows the actual price of the goods described and that all", margin, declarationY);
    declarationY += 5;
    pdf.text("particulars are true and correct.", margin, declarationY);

    declarationY += 10;
    pdf.text(`Prepared By: ${quotationData.preparedBy}`, margin, declarationY);

    declarationY += 5;
    pdf.setFontSize(8);
    pdf.text("This Quotation Is computerized generated, hence doesn't required any seal & signature.", margin, declarationY);

    // Directly download the PDF
    pdf.save(`Quotation_${quotationData.quotationNo}.pdf`);

    showToast("Success", "PDF generated and downloaded successfully!");

  } catch (error) {
    console.error("Error generating PDF:", error);
    showToast("Error", `Failed to generate PDF: ${error.message}`, "error");
  } finally {
    setIsGenerating(false);
  }
};

const handleSaveQuotation = async () => {
  setIsSubmitting(true);
  try {
    // Validate form data
    if (!quotationData.consigneeName) {
      showToast("Error", "Please enter company name.", "error");
      setIsSubmitting(false);
      return;
    }

    // First, generate PDF 
    showToast("Processing", "Generating PDF and saving data...", "info");
    const generatedPdfUrl = await generatePdf();
    if (!generatedPdfUrl) {
      throw new Error("Failed to generate PDF");
    }

    // Get current timestamp
    const now = new Date();
    const timestamp = formatDate(now) + " " +
      String(now.getHours()).padStart(2, '0') + ":" +
      String(now.getMinutes()).padStart(2, '0') + ":" +
      String(now.getSeconds()).padStart(2, '0');

    // Prepare row data
    const rowData = [
      timestamp,
      quotationData.quotationNo,
      quotationData.date,
      quotationData.preparedBy,
      quotationData.consignorName,
      quotationData.consignorAddress,
      quotationData.consignorMobile,
      quotationData.consignorGSTIN,
      quotationData.consignorStateCode,
      quotationData.consigneeName,
      // quotationData.companyName,
      quotationData.consigneeAddress,
      quotationData.consigneeState,
      quotationData.consigneeContactName,
      quotationData.consigneeContactNo,
      quotationData.consigneeGSTIN,
      quotationData.consigneeStateCode,
      quotationData.msmeNumber,
      quotationData.total.toFixed(2),
      generatedPdfUrl,
      // quotationData.accountNo,
      // quotationData.bankName,
      // quotationData.bankAddress,
      // quotationData.ifscCode,
      // quotationData.email,
      // quotationData.website,
      // quotationData.pan,
    ];

    // Create FormData
    const formData = new FormData();
    formData.append('sheetName', sheetName);
    formData.append('action', 'insert');
    formData.append('rowData', JSON.stringify(rowData));

    // Save to sheet using no-cors mode
    await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData
    });

    // Show success message
    showToast("Success", "Quotation saved successfully!");

    // Reset form and fetch new quotation number
    setActiveTab("edit");
    fetchLastQuotationNumber();
    resetForm();

  } catch (error) {
    console.error("Error saving quotation:", error);
    showToast("Error", `Failed to save quotation: ${error.message}`, "error");
  } finally {
    setIsSubmitting(false);
  }
};

// Helper function to reset the form
// Modified resetForm function
// Helper function to reset the form
const resetForm = () => {
  setQuotationData(prevData => ({
    ...prevData,
    referenceName: "",
    companyName: "",
    consigneeAddress: "",
    // Don't reset the state - keep the current value
    // consigneeState: "Chhattisgarh", <- REMOVE THIS LINE
    consigneeContactName: "",
    consigneeContactNo: "",
    consigneeGSTIN: "",
    items: [{
      id: 1,
      code: "",
      name: "",
      gst: 18,
      qty: 1,
      units: "Nos",
      rate: 0,
      amount: 0,
    }],
    subtotal: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    total: 0,
  }));
  setQuotationLink("");
};

  const handleGenerateLink = () => {
    setIsGenerating(true)

    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false)
      setQuotationLink(`https://nbd-crr.vercel.app/quotations/${quotationData.quotationNo}`)

      showToast("Link Generated", "Quotation link has been successfully generated and is ready to share.")
    }, 1000)
  }

  const handleGeneratePDF = async () => {
    await generatePdf()
  }

  // Save the quotation data to the Google Sheet
  // const handleSaveQuotation = async () => {
  //   setIsSubmitting(true)

  //   try {
  //     // Validate form data
  //     if (!quotationData.companyName) {
  //       showToast("Error", "Please enter company name.", "error")
  //       setIsSubmitting(false)
  //       return
  //     }

  //     if (quotationData.items.some(item => !item.name || item.qty <= 0)) {
  //       showToast("Error", "Please complete all item details with valid quantities.", "error")
  //       setIsSubmitting(false)
  //       return
  //     }

  //     // First, generate PDF - this will switch to preview tab temporarily
  //     showToast("Processing", "Generating PDF and saving data...", "info")
  //     const generatedPdfUrl = await generatePdf()

  //     if (!generatedPdfUrl) {
  //       showToast("Error", "Failed to generate PDF. Please try again.", "error")
  //       setIsSubmitting(false)
  //       return
  //     }

  //     // Get current timestamp in DD/MM/YYYY HH:MM:SS format
  //     const now = new Date()
  //     const timestamp = formatDate(now) + " " +
  //       String(now.getHours()).padStart(2, '0') + ":" +
  //       String(now.getMinutes()).padStart(2, '0') + ":" +
  //       String(now.getSeconds()).padStart(2, '0')

  //     // Prepare data for the sheet
  //     // We'll save: Timestamp, Quotation No, Date, Company Name, Total, PDF URL
  //     const rowData = [
  //       timestamp, // Column A: Timestamp
  //       quotationData.quotationNo, // Column B: Quotation Number
  //       quotationData.date, // Column C: Date
  //       quotationData.companyName, // Column D: Company Name
  //       quotationData.total.toFixed(2), // Column E: Total Amount
  //       generatedPdfUrl // Column F: PDF URL
  //     ]

  //     // Build form data for submission
  //     const formPayload = new FormData()
  //     formPayload.append('sheetName', sheetName)
  //     formPayload.append('action', 'insert')
  //     formPayload.append('rowData', JSON.stringify(rowData))

  //     // Send data to Google Sheets via Apps Script
  //     const response = await fetch(scriptUrl, {
  //       method: 'POST',
  //       body: formPayload,
  //       mode: 'cors' // Change from no-cors to cors
  //     })

  //     // Switch back to edit tab
  //     setActiveTab("edit")

  //     showToast("Success", "Quotation saved successfully with PDF!")

  //     // Fetch a new quotation number for the next entry
  //     fetchLastQuotationNumber()

  //     // Reset form (but keep the new quotation number)
  //     setQuotationData(prevData => ({
  //       quotationNo: prevData.quotationNo,
  //       date: new Date().toLocaleDateString('en-GB'),
  //       companyName: "",
  //       contactPerson: "",
  //       items: [
  //         {
  //           id: Date.now(), // Use current timestamp as unique key
  //           name: "",
  //           qty: 0,
  //           rate: 0,
  //           amount: 0,
  //         }
  //       ],
  //       subtotal: 0,
  //       tax: 0,
  //       total: 0,
  //     }))

  //     // We want to keep the PDF URL displayed after saving
  //     setQuotationLink("")

  //   } catch (error) {
  //     console.error("Error saving quotation:", error)
  //     showToast("Error", "Failed to save quotation. Please try again.", "error")
  //   } finally {
  //     setIsSubmitting(false)
  //   }
  // }

  const numberToWords = (amount) => {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

    function convertToWords(num) {
        if (num === 0) return '';

        if (num < 10) return ones[num];

        if (num < 20) return teens[num - 10];

        if (num < 100) {
            return tens[Math.floor(num / 10)] + ' ' + convertToWords(num % 10);
        }

        if (num < 1000) {
            return ones[Math.floor(num / 100)] + ' hundred ' + convertToWords(num % 100);
        }

        if (num < 100000) {
            return convertToWords(Math.floor(num / 1000)) + ' thousand ' + convertToWords(num % 1000);
        }

        if (num < 10000000) {
            return convertToWords(Math.floor(num / 100000)) + ' lakh ' + convertToWords(num % 100000);
        }

        return convertToWords(Math.floor(num / 10000000)) + ' crore ' + convertToWords(num % 10000000);
    }

    const num = Number(amount).toFixed(2);
    const [integerPart, decimalPart] = num.split('.');

    let words = convertToWords(Number(integerPart));

    if (decimalPart !== '00') {
        words += ' point ' + convertToWords(Number(decimalPart));
    }

    return words;
};

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        Make Quotation
      </h1>

      <div className="bg-white rounded-lg shadow border">
        <div className="border-b">
          <div className="flex">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "edit"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-tl-lg"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("edit")}
            >
              Edit Quotation
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "preview" ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white" : "text-gray-600"
              }`}
              onClick={() => setActiveTab("preview")}
            >
              Preview
            </button>
          </div>
        </div>

        <div className="p-4">
          {activeTab === "edit" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <h3 className="text-lg font-medium mb-4">Quotation Details</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Quotation No.</label>
                        <input
                          type="text"
                          value={isLoadingQuotationNo ? "Generating..." : quotationData.quotationNo}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                        {isLoadingQuotationNo && (
                          <div className="text-xs text-blue-600">Generating quotation number...</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Date</label>
                        <input
                          type="date"
                          value={quotationData.date.split("/").reverse().join("-")}
                          onChange={(e) => {
                            // Convert from YYYY-MM-DD to DD/MM/YYYY format
                            const dateValue = e.target.value
                            if (dateValue) {
                              const [year, month, day] = dateValue.split("-")
                              handleInputChange("date", `${day}/${month}/${year}`)
                            }
                          }}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
  <label className="block text-sm font-medium">State</label>
  <select
    value={quotationData.consignorState}
    onChange={(e) => handleStateChange(e.target.value, 'consignor')}
    className="w-full p-2 border border-gray-300 rounded-md"
    disabled={isLoadingOptions}
  >
    <option value="">Select State</option>
    {stateOptions.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </select>
  {isLoadingOptions && (
    <div className="text-xs text-blue-600">Loading state options...</div>
  )}
</div>
                  </div>

                  <h3 className="text-lg font-medium mt-6 mb-4">Consignor Details</h3>
                  <div className="space-y-4">
                  <div className="space-y-2">
  <label className="block text-sm font-medium">Reference Name</label>
  <select
    value={quotationData.consignorName}
    onChange={(e) => handleInputChange("consignorName", e.target.value)}
    className="w-full p-2 border border-gray-300 rounded-md"
    disabled={isLoadingOptions}
  >
    <option value="">Select Reference Name</option>
    {referenceOptions.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </select>
  {isLoadingOptions && (
    <div className="text-xs text-blue-600">Loading reference options...</div>
  )}
</div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Address</label>
                      <textarea
                        value={quotationData.consignorAddress}
                        onChange={(e) => handleInputChange("consignorAddress", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Mobile</label>
                        <input
                          type="text"
                          value={quotationData.consignorMobile}
                          onChange={(e) => handleInputChange("consignorMobile", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Phone</label>
                        <input
                          type="text"
                          value={quotationData.consignorPhone}
                          onChange={(e) => handleInputChange("consignorPhone", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">GSTIN</label>
                        <input
                          type="text"
                          value={quotationData.consignorGSTIN}
                          onChange={(e) => handleInputChange("consignorGSTIN", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">State Code</label>
                        <input
                          type="text"
                          value={quotationData.consignorStateCode}
                          onChange={(e) => handleInputChange("consignorStateCode", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <h3 className="text-lg font-medium mb-4">Consignee Details</h3>
                  <div className="space-y-4">
                  <div className="space-y-2">
  <label className="block text-sm font-medium">Company Name</label>
  <select
    value={quotationData.consigneeName}
    onChange={(e) => handleCompanyNameChange(e.target.value)}
    className="w-full p-2 border border-gray-300 rounded-md"
    disabled={isLoadingOptions}
    required
  >
    <option value="">Select Company Name</option>
    {companyOptions.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </select>
  {isLoadingOptions && (
    <div className="text-xs text-blue-600">Loading company options...</div>
  )}
</div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Address</label>
                      <textarea
                        value={quotationData.consigneeAddress}
                        onChange={(e) => handleInputChange("consigneeAddress", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="Enter address"
                      />
                    </div>

                    <div className="space-y-2">
  <label className="block text-sm font-medium">State</label>
  <input
    type="text"
    value={quotationData.consigneeState}
    onChange={(e) => handleInputChange("consigneeState", e.target.value)}
    className="w-full p-2 border border-gray-300 rounded-md"
    placeholder="Enter State"
  />
</div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Contact Name</label>
                        <input
                          type="text"
                          value={quotationData.consigneeContactName}
                          onChange={(e) => handleInputChange("consigneeContactName", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Contact No.</label>
                        <input
                          type="text"
                          value={quotationData.consigneeContactNo}
                          onChange={(e) => handleInputChange("consigneeContactNo", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">GSTIN</label>
                        <input
                          type="text"
                          value={quotationData.consigneeGSTIN}
                          onChange={(e) => handleInputChange("consigneeGSTIN", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">State Code</label>
                        <input
                          type="text"
                          value={quotationData.consigneeStateCode}
                          onChange={(e) => handleInputChange("consigneeStateCode", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">MSME Number</label>
                      <input
                        type="text"
                        value={quotationData.msmeNumber}
                        onChange={(e) => handleInputChange("msmeNumber", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Items</h3>
                    <button
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                      onClick={handleAddItem}
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">S No.</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">GST %</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty.</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Units</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {quotationData.items.map((item, index) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2">{index + 1}</td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={item.code}
                                onChange={(e) => handleItemChange(item.id, "code", e.target.value)}
                                className="w-24 p-1 border border-gray-300 rounded-md"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded-md"
                                placeholder="Enter item name"
                                required
                              />
                            </td>
                            <td className="px-4 py-2">
                              <select
                                value={item.gst}
                                onChange={(e) => handleItemChange(item.id, "gst", Number.parseInt(e.target.value))}
                                className="w-20 p-1 border border-gray-300 rounded-md"
                              >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => handleItemChange(item.id, "qty", Number.parseInt(e.target.value) || 0)}
                                className="w-16 p-1 border border-gray-300 rounded-md"
                                placeholder="0"
                                required
                              />
                            </td>
                            <td className="px-4 py-2">
                              <select
                                value={item.units}
                                onChange={(e) => handleItemChange(item.id, "units", e.target.value)}
                                className="w-20 p-1 border border-gray-300 rounded-md"
                              >
                                <option value="Nos">Nos</option>
                                <option value="Pcs">Pcs</option>
                                <option value="Kg">Kg</option>
                                <option value="Set">Set</option>
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                value={item.rate}
                                onChange={(e) => handleItemChange(item.id, "rate", Number.parseFloat(e.target.value) || 0)}
                                className="w-24 p-1 border border-gray-300 rounded-md"
                                placeholder="0.00"
                                required
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                value={item.amount}
                                className="w-24 p-1 border border-gray-300 rounded-md bg-gray-50"
                                readOnly
                              />
                            </td>
                            <td className="px-4 py-2">
                              <button
                                className="text-red-500 hover:text-red-700 p-1 rounded-md"
                                onClick={() => {
                                  // Add a removeItem function
                                  const newItems = quotationData.items.filter((i) => i.id !== item.id)
                                  if (newItems.length === 0) return // Don't remove the last item

                                  // Recalculate totals
                                  const subtotal = newItems.reduce((sum, i) => sum + i.amount, 0)
                                  const cgstAmount = subtotal * (quotationData.cgstRate / 100)
                                  const sgstAmount = subtotal * (quotationData.sgstRate / 100)
                                  const total = subtotal + cgstAmount + sgstAmount

                                  setQuotationData({
                                    ...quotationData,
                                    items: newItems,
                                    subtotal,
                                    cgstAmount,
                                    sgstAmount,
                                    total,
                                  })
                                }}
                                disabled={quotationData.items.length <= 1}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="7" className="px-4 py-2 text-right font-medium">
                            Subtotal:
                          </td>
                          <td className="px-4 py-2">₹{quotationData.subtotal.toFixed(2)}</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan="7" className="px-4 py-2 text-right font-medium">
                            CGST ({quotationData.cgstRate}%):
                          </td>
                          <td className="px-4 py-2">₹{quotationData.cgstAmount.toFixed(2)}</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan="7" className="px-4 py-2 text-right font-medium">
                            SGST ({quotationData.sgstRate}%):
                          </td>
                          <td className="px-4 py-2">₹{quotationData.sgstAmount.toFixed(2)}</td>
                          <td></td>
                        </tr>
                        <tr className="font-bold">
                          <td colSpan="7" className="px-4 py-2 text-right">
                            Total:
                          </td>
                          <td className="px-4 py-2">₹{quotationData.total.toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-medium mb-4">Terms & Conditions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Validity</label>
                    <input
                      type="text"
                      value={quotationData.validity}
                      onChange={(e) => handleInputChange("validity", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Payment Terms</label>
                    <input
                      type="text"
                      value={quotationData.paymentTerms}
                      onChange={(e) => handleInputChange("paymentTerms", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Delivery</label>
                    <input
                      type="text"
                      value={quotationData.delivery}
                      onChange={(e) => handleInputChange("delivery", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Freight</label>
                    <input
                      type="text"
                      value={quotationData.freight}
                      onChange={(e) => handleInputChange("freight", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Insurance</label>
                    <input
                      type="text"
                      value={quotationData.insurance}
                      onChange={(e) => handleInputChange("insurance", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Taxes</label>
                    <input
                      type="text"
                      value={quotationData.taxes}
                      onChange={(e) => handleInputChange("taxes", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-medium mt-6 mb-4">Notes</h3>
                <div className="space-y-4">
                  {quotationData.notes.map((note, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <textarea
                        value={note}
                        onChange={(e) => handleNoteChange(index, e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows={2}
                      />
                      <button
                        type="button"
                        onClick={() => removeNote(index)}
                        disabled={quotationData.notes.length <= 1}
                        className="text-red-500 hover:text-red-700 p-1 rounded-md"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                    onClick={addNote}
                  >
                    + Add Note
                  </button>
                </div>

                <h3 className="text-lg font-medium mt-6 mb-4">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Account No.</label>
                    <input
                      type="text"
                      value={quotationData.accountNo}
                      onChange={(e) => handleInputChange("accountNo", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Bank Name</label>
                    <input
                      type="text"
                      value={quotationData.bankName}
                      onChange={(e) => handleInputChange("bankName", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Bank Address</label>
                    <input
                      type="text"
                      value={quotationData.bankAddress}
                      onChange={(e) => handleInputChange("bankAddress", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">IFSC Code</label>
                    <input
                      type="text"
                      value={quotationData.ifscCode}
                      onChange={(e) => handleInputChange("ifscCode", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Email</label>
                    <input
                      type="text"
                      value={quotationData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Website</label>
                    <input
                      type="text"
                      value={quotationData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">PAN</label>
                    <input
                      type="text"
                      value={quotationData.pan}
                      onChange={(e) => handleInputChange("pan", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
                  onClick={handleSaveQuotation}
                  disabled={isSubmitting || isLoadingQuotationNo || isGenerating}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Save Quotation
                    </>
                  )}
                </button>
                <div className="space-x-2">
                  <button
                    className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md flex items-center"
                    onClick={handleGenerateLink}
                    disabled={isGenerating || isLoadingQuotationNo || isSubmitting}
                  >
                    <i className="fas fa-share-alt mr-2"></i>
                    Generate Link
                  </button>
                  <button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
                    onClick={handleGeneratePDF}
                    disabled={isGenerating || isLoadingQuotationNo || isSubmitting}
                  >
                    <i className="fas fa-download mr-2"></i>
                    {isGenerating ? "Generating..." : "Generate PDF"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* The main quotation preview that will be captured for PDF */}
              <div id="quotation-preview" className="bg-white border p-6 rounded-lg" ref={previewRef}>
                <div className="flex justify-between items-start border-b pb-4">
                  <div className="w-1/3">
                    <p className="font-bold">{quotationData.consignorName}</p>
                    <p className="text-sm">{quotationData.consignorAddress}</p>
                    <p className="text-sm">Mobile: {quotationData.consignorMobile}</p>
                    <p className="text-sm">Phone: {quotationData.consignorPhone}</p>
                  </div>
                  <div className="w-1/3 text-center">
                    <h1 className="text-xl font-bold">QUOTATION</h1>
                  </div>
                  <div className="w-1/3 text-right">
                    <p className="font-bold">Quo No: {isLoadingQuotationNo ? "Generating..." : quotationData.quotationNo}</p>
                    <p>Date: {quotationData.date}</p>
                  </div>
                </div>

                {/* Consignor and Consignee Details */}
                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                  <div>
                    <h3 className="font-bold mb-2">Consignor Details</h3>
                    <p>{quotationData.consignorName}</p>
                    <p>{quotationData.consignorAddress}</p>
                    <p>
                      GSTIN: {quotationData.consignorGSTIN} State Code: {quotationData.consignorStateCode}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Consignee Details</h3>
                    <p>Reference Name: {quotationData.consigneeName || "Please enter company name"}</p>
                    <p>Contact Name: {quotationData.consigneeContactName || "Not specified"}</p>
                    <p>Contact No.: {quotationData.consigneeContactNo || "Not specified"}</p>
                    <p>{quotationData.consigneeState}</p>
                    <p>MSME Number- {quotationData.msmeNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                  <div>
                    <h3 className="font-bold mb-2">Bill To</h3>
                    <p>{quotationData.consigneeAddress || "Please enter address"}</p>
                    <p>
                      GSTIN: {quotationData.consigneeGSTIN || "N/A"} State Code: {quotationData.consigneeStateCode}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Ship To</h3>
                    <p>{quotationData.consigneeAddress || "Please enter address"}</p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border">
                        <th className="border p-2 text-left">S No.</th>
                        <th className="border p-2 text-left">Code</th>
                        <th className="border p-2 text-left">Product Name</th>
                        <th className="border p-2 text-left">GST</th>
                        <th className="border p-2 text-left">Qty.</th>
                        <th className="border p-2 text-left">Units</th>
                        <th className="border p-2 text-left">Rate</th>
                        <th className="border p-2 text-left">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotationData.items.map((item, index) => (
                        <tr key={item.id} className="border">
                          <td className="border p-2">{index + 1}</td>
                          <td className="border p-2">{item.code}</td>
                          <td className="border p-2">{item.name || "No name specified"}</td>
                          <td className="border p-2">{item.gst}%</td>
                          <td className="border p-2">{item.qty}</td>
                          <td className="border p-2">{item.units}</td>
                          <td className="border p-2">₹{item.rate.toFixed(2)}</td>
                          <td className="border p-2">₹{item.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border">
                        <td colSpan="7" className="border p-2 text-right font-bold">
                          TOTAL
                        </td>
                        <td className="border p-2 font-bold">₹{quotationData.subtotal.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Tax Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-bold mb-2">Total Taxes</h3>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border">
                          <th className="border p-2 text-left">Tax%</th>
                          <th className="border p-2 text-left">CGST</th>
                          <th className="border p-2 text-left">SGST</th>
                          <th className="border p-2 text-left">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border">
                          <td className="border p-2">{quotationData.cgstRate + quotationData.sgstRate}%</td>
                          <td className="border p-2">₹{quotationData.cgstAmount.toFixed(2)}</td>
                          <td className="border p-2">₹{quotationData.sgstAmount.toFixed(2)}</td>
                          <td className="border p-2">
                            ₹{(quotationData.cgstAmount + quotationData.sgstAmount).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col justify-between">
                    <div>
                      <p className="font-bold">Amount Chargeable (in words)</p>
                      <p className="capitalize">
                        {/* Use the numberToWords function here */}
                        Rupees {numberToWords(quotationData.total)} only
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Grand Total:</p>
                      <p className="text-xl font-bold">₹{quotationData.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div>
                  <h3 className="font-bold mb-2">Terms & Conditions</h3>
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="py-1">Validity-</td>
                        <td className="py-1">{quotationData.validity}</td>
                      </tr>
                      <tr>
                        <td className="py-1">Payment Terms-</td>
                        <td className="py-1">{quotationData.paymentTerms}</td>
                      </tr>
                      <tr>
                        <td className="py-1">Delivery-</td>
                        <td className="py-1">{quotationData.delivery}</td>
                      </tr>
                      <tr>
                        <td className="py-1">Freight-</td>
                        <td className="py-1">{quotationData.freight}</td>
                      </tr>
                      <tr>
                        <td className="py-1">Insurance-</td>
                        <td className="py-1">{quotationData.insurance}</td>
                      </tr>
                      <tr>
                        <td className="py-1">Taxes-</td>
                        <td className="py-1">{quotationData.taxes}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 className="font-bold mt-4 mb-2">Note</h4>
                  <ul className="list-disc pl-5">
                    {quotationData.notes.map((note, index) => (
                      <li key={index} className="py-1">
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bank Details and Footer */}
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <h3 className="font-bold mb-2">For Physical assistance</h3>
                    <p>Account No.: {quotationData.accountNo}</p>
                    <p>Bank Name: {quotationData.bankName}</p>
                    <p>Bank Address: {quotationData.bankAddress}</p>
                    <p>IFSC CODE: {quotationData.ifscCode}</p>
                    <p>Email: {quotationData.email}</p>
                    <p>Website: {quotationData.website}</p>
                    <p>Company PAN: {quotationData.pan}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold mb-2">Declaration:</h3>
                    <p>
                      We declare that this Quotation shows the actual price of the goods described and that all
                      particulars are true and correct.
                    </p>
                    <p className="mt-4">Prepared By- {quotationData.preparedBy}</p>
                    <p className="mt-4 text-sm italic">
                      This Quotation Is computerized generated, hence doesn't required any seal & signature.
                    </p>
                  </div>
                </div>
              </div>

              {quotationLink && (
                <div className="p-4 border rounded-md bg-gray-50">
                  <p className="font-medium mb-2">Quotation Link:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={quotationLink}
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    <button
                      className="border border-gray-300 hover:bg-gray-100 p-2 rounded-md"
                      onClick={() => {
                        navigator.clipboard.writeText(quotationLink)
                        showToast("Link Copied", "Quotation link copied to clipboard")
                      }}
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                    <button className="border border-gray-300 hover:bg-gray-100 p-2 rounded-md">
                      <i className="fas fa-share-alt"></i>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Share this link with the client. They can view and request updates to the quotation.
                  </p>
                </div>
              )}

              {pdfUrl && (
                <div className="p-4 border rounded-md bg-gray-50">
                  <p className="font-medium mb-2">PDF Document:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={pdfUrl}
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    <button
                      className="border border-gray-300 hover:bg-gray-100 p-2 rounded-md"
                      onClick={() => {
                        navigator.clipboard.writeText(pdfUrl)
                        showToast("URL Copied", "PDF URL copied to clipboard")
                      }}
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-gray-300 hover:bg-gray-100 p-2 rounded-md"
                    >
                      <i className="fas fa-external-link-alt"></i>
                    </a>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md flex items-center">
                  <i className="fas fa-eye mr-2"></i>
                  View as Client
                </button>
                <div className="space-x-2">
                  <button
                    className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md flex items-center"
                    onClick={handleGenerateLink}
                    disabled={isGenerating || isLoadingQuotationNo || isSubmitting}
                  >
                    <i className="fas fa-share-alt mr-2"></i>
                    Generate Link
                  </button>
                  <button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
                    onClick={handleGeneratePDF}
                    disabled={isGenerating || isLoadingQuotationNo || isSubmitting}
                  >
                    <i className="fas fa-download mr-2"></i>
                    {isGenerating ? "Generating..." : "Download PDF"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MakeQuotationPage