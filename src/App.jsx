import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import AppLayout from "./layouts/AppLayout"
import Dashboard from "./pages/Dashboard"
import NewEnquiry from "./pages/NewEnquiry"
import OnCallFollowup from "./pages/OnCallFollowup"
import UpdateQuotation from "./pages/UpdateQuotation"
import QuotationValidation from "./pages/QuotationValidation"
import ScreenshotUpdate from "./pages/ScreenshotUpdate"
import FollowupSteps from "./pages/FollowupSteps"
import OrderStatus from "./pages/OrderStatus"
import MakeQuotation from "./pages/MakeQuotation"
import UserManagement from "./pages/UserManagement"
import Login from "./pages/Login"
import OnCallFollowupForm from "./pages/forms/OnCallFollowupForm"
import UpdateQuotationForm from "./pages/forms/UpdateQuotationForm"
import QuotationValidationForm from "./pages/forms/QuotationValidationForm"
import ScreenshotUpdateForm from "./pages/forms/ScreenshotUpdateForm"
import FollowupStepsForm from "./pages/forms/FollowupStepsForm"
import OrderStatusForm from "./pages/forms/OrderStatusForm"
import { AuthProvider } from "./contexts/AuthContext"
import { ToastProvider } from "./contexts/ToastContext"

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/new-enquiry" element={<NewEnquiry />} />
              <Route path="/on-call-followup" element={<OnCallFollowup />} />
              <Route path="/update-quotation" element={<UpdateQuotation />} />
              <Route path="/quotation-validation" element={<QuotationValidation />} />
              <Route path="/screenshot-update" element={<ScreenshotUpdate />} />
              <Route path="/followup-steps" element={<FollowupSteps />} />
              <Route path="/order-status" element={<OrderStatus />} />
              <Route path="/make-quotation" element={<MakeQuotation />} />
              <Route path="/user-management" element={<UserManagement />} />

              {/* Form routes */}
              <Route path="/forms/on-call-followup" element={<OnCallFollowupForm />} />
              <Route path="/enquiry/:enquiryNo" element={<OnCallFollowupForm />} />
              <Route path="/forms/on-call-followup/:enquiryNo" element={<OnCallFollowupForm />} />
              <Route path="/forms/update-quotation/:enquiryNo" element={<UpdateQuotationForm />} />
              <Route path="/forms/quotation-validation/:enquiryNo" element={<QuotationValidationForm />} />
              <Route path="/forms/screenshot-update/:enquiryNo" element={<ScreenshotUpdateForm />} />
              <Route path="/forms/followup-steps/:enquiryNo" element={<FollowupStepsForm />} />
              <Route path="/forms/order-status/:enquiryNo" element={<OrderStatusForm />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
