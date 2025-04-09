// Mock data for pending tasks
export const pendingEnquiries = [
  {
    id: "e1", // Changed from "1" to "e1"
    enquiryNo: "ENQ-001",
    companyName: "Tech Solutions Ltd",
    contactPerson: "John Smith",
    priority: "High",
    days: 3,
    formLink: "/forms/on-call-followup",
  },
  {
    id: "2",
    enquiryNo: "ENQ-002",
    companyName: "Global Innovations",
    contactPerson: "Sarah Johnson",
    priority: "Medium",
    days: 5,
    formLink: "/forms/on-call-followup",
  },
  {
    id: "3",
    enquiryNo: "ENQ-003",
    companyName: "Nexus Systems",
    contactPerson: "Michael Brown",
    priority: "Low",
    days: 7,
    formLink: "/forms/on-call-followup",
  },
]

export const pendingQuotations = [
  {
    id: "q1", // Changed from "1" to "q1"
    enquiryNo: "ENQ-001",
    companyName: "Tech Solutions Ltd",
    contactPerson: "John Smith",
    priority: "High",
    days: 2,
    formLink: "/forms/update-quotation",
  },
  {
    id: "2",
    enquiryNo: "ENQ-004",
    companyName: "Apex Industries",
    contactPerson: "Emily Davis",
    priority: "Medium",
    days: 4,
    formLink: "/forms/update-quotation",
  },
]

export const pendingValidations = [
  {
    id: "v1", // Changed from "1" to "v1"
    enquiryNo: "ENQ-002",
    companyName: "Global Innovations",
    contactPerson: "Sarah Johnson",
    priority: "High",
    days: 1,
    formLink: "/forms/quotation-validation",
  },
]

export const pendingScreenshots = [
  {
    id: "s1", // Changed from "1" to "s1"
    enquiryNo: "ENQ-003",
    companyName: "Nexus Systems",
    contactPerson: "Michael Brown",
    priority: "Medium",
    days: 3,
    formLink: "/forms/screenshot-update",
  },
]

export const pendingFollowups = [
  {
    id: "f1", // Changed from "1" to "f1"
    enquiryNo: "ENQ-001",
    companyName: "Tech Solutions Ltd",
    contactPerson: "John Smith",
    priority: "High",
    days: 1,
    formLink: "/forms/followup-steps",
  },
  {
    id: "2",
    enquiryNo: "ENQ-004",
    companyName: "Apex Industries",
    contactPerson: "Emily Davis",
    priority: "Medium",
    days: 2,
    formLink: "/forms/followup-steps",
  },
]

export const pendingOrders = [
  {
    id: "o1", // Changed from "1" to "o1"
    enquiryNo: "ENQ-002",
    companyName: "Global Innovations",
    contactPerson: "Sarah Johnson",
    priority: "High",
    days: 4,
    formLink: "/forms/order-status",
  },
]

// Mock data for history
export const enquiryHistory = [
  {
    id: "eh1", // Changed from "1" to "eh1"
    enquiryNo: "ENQ-005",
    companyName: "Quantum Enterprises",
    completedBy: "Rahul Sharma",
    completedDate: "2023-10-15",
    status: "Completed",
    detailsLink: "/history/enquiry/ENQ-005",
  },
  {
    id: "2",
    enquiryNo: "ENQ-006",
    companyName: "Innovate Solutions",
    completedBy: "Priya Patel",
    completedDate: "2023-10-12",
    status: "Converted",
    detailsLink: "/history/enquiry/ENQ-006",
  },
]

export const quotationHistory = [
  {
    id: "qh1", // Changed from "1" to "qh1"
    enquiryNo: "ENQ-005",
    companyName: "Quantum Enterprises",
    completedBy: "Amit Singh",
    completedDate: "2023-10-16",
    status: "Completed",
    detailsLink: "/history/quotation/ENQ-005",
  },
]

export const validationHistory = [
  {
    id: "vh1", // Changed from "1" to "vh1"
    enquiryNo: "ENQ-006",
    companyName: "Innovate Solutions",
    completedBy: "Neha Gupta",
    completedDate: "2023-10-13",
    status: "Completed",
    detailsLink: "/history/validation/ENQ-006",
  },
]

export const screenshotHistory = [
  {
    id: "sh1", // Changed from "1" to "sh1"
    enquiryNo: "ENQ-005",
    companyName: "Quantum Enterprises",
    completedBy: "Rahul Sharma",
    completedDate: "2023-10-17",
    status: "Completed",
    detailsLink: "/history/screenshot/ENQ-005",
  },
]

export const followupHistory = [
  {
    id: "fh1", // Changed from "1" to "fh1"
    enquiryNo: "ENQ-006",
    companyName: "Innovate Solutions",
    completedBy: "Priya Patel",
    completedDate: "2023-10-14",
    status: "Converted",
    detailsLink: "/history/followup/ENQ-006",
  },
]

export const orderHistory = [
  {
    id: "oh1", // Changed from "1" to "oh1"
    enquiryNo: "ENQ-006",
    companyName: "Innovate Solutions",
    completedBy: "Amit Singh",
    completedDate: "2023-10-18",
    status: "Completed",
    detailsLink: "/history/order/ENQ-006",
  },
]
