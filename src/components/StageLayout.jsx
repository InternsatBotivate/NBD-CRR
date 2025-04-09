import { useState } from "react";
import { Link } from "react-router-dom";

function StageLayout({ title, description, pendingContent, historyContent, formLink, formLinkText }) {
  const [activeTab, setActiveTab] = useState("pending");
  
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Main header with title and action button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        {/* <Link
          to={formLink}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <i className="fas fa-plus-circle mr-2"></i>
          {formLinkText}
        </Link> */}
      </div>
      
      {/* Tab navigation */}
      <div className="space-y-4">
        <div className="bg-white border-b border-gray-200">
          <div className="flex">
            <button
              className={`py-2 px-4 ${
                activeTab === "pending"
                  ? "border-b-2 border-indigo-500 text-indigo-600 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("pending")}
            >
              Pending
            </button>
            <button
              className={`py-2 px-4 ${
                activeTab === "history"
                  ? "border-b-2 border-indigo-500 text-indigo-600 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("history")}
            >
              History
            </button>
          </div>
        </div>
        
        {/* Content panel */}
        <div className="bg-white rounded-lg shadow border">
          {activeTab === "pending" && (
            <div className="p-4">
              {pendingContent}
            </div>
          )}
          
          {activeTab === "history" && (
            <div className="p-4">
              {historyContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StageLayout;