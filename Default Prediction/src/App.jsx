import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import FileUpload from "./components/FileUpload";
import CreditRiskForm from "./components/CreditRiskForm";
import ResultsDisplay from "./components/ResultsDisplay";
import Notification from "./components/Notification";
import AnalysisHistory from "./components/AnalysisHistory";
import Signup from "./components/Authentication/Signup/Signup";
import Login from "./components/Authentication/Login/Login";
import LoadingOverlay from "./components/LoadingOverlay";
import "./App.css";
import ProtectedRoutes from "./routes/protectedRoutes";
import ResultsModal from "./assets/modal/ResultsModal";

function AppInner() {
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [booting, setBooting] = useState(true);
  const [showModal, setShowModal] = useState(false); // Single modal state
  const navigate = useNavigate();

  const userType = localStorage.getItem("userType");

  // Function to fetch analysis history from backend
  const fetchAnalysisHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("http://localhost:4000/results/GetResults", {
        method: "GET",
        headers: {
          "auth-token": `${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched analysis history:", data); // Debug log
        setAnalysisHistory(data);
      } else {
        console.error("Failed to fetch analysis history");
      }
    } catch (error) {
      console.error("Error fetching analysis history:", error);
    }
  }, []);

  // Fetch analysis history from backend on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchAnalysisHistory();
    }
  }, [fetchAnalysisHistory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBooting(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  // Function to save analysis to backend
  const saveAnalysisToBackend = async (analysisData) => {
    try {
      const token = localStorage.getItem("token");
      
      // Debug: Log what we're sending
      console.log("Saving analysis to backend:", analysisData);
      
      const response = await fetch(
        "http://localhost:4000/results/SaveResults",
        {
          method: "POST",
          headers: {
            "auth-token": `${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(analysisData),
        }
      );

      if (response.ok) {
        const savedAnalysis = await response.json();
        console.log("Analysis saved successfully:", savedAnalysis);
        return savedAnalysis;
      } else {
        const errorText = await response.text();
        console.error("Backend save error:", errorText);
        throw new Error("Failed to save analysis to backend");
      }
    } catch (error) {
      console.error("Error saving analysis:", error);
      throw error;
    }
  };

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileProcess = async (file) => {
    if (!file) {
      showNotification("Please provide valid data.", "error");
      return;
    }
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(
        "http://127.0.0.1:5000/api/credit_risk/analyze",
        { method: "POST", body: formData }
      );
      
      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Analysis API response:", data); // Debug log

      // Validate that we have analysis data
      if (!data || Object.keys(data).length === 0) {
        throw new Error("Analysis returned empty data");
      }

      // Structure the analysis object for saving and display
      const newAnalysis = {
        id: `ANL-${Date.now()}`,
        timestamp: new Date().toISOString(),
        filename: file.name,
        jsonData: data, // This must not be empty for Mongoose validation
        status: "completed",
        userType: userType,
      };

      console.log("Structured analysis object:", newAnalysis); // Debug log

      try {
        // Save to backend first
        const savedAnalysis = await saveAnalysisToBackend(newAnalysis);

        // Update history with saved analysis
        setAnalysisHistory(prevHistory => [savedAnalysis, ...prevHistory]);

        // Set data for modal display - pass the full analysis object
        setAnalysisData({
          filename: file.name,
          fileName: file.name, // Both for compatibility
          jsonData: data
        });
        
        setShowModal(true);
        showNotification("Analysis completed and saved successfully!", "success");
        
      } catch (saveError) {
        console.error("Save error:", saveError);
        
        // If backend save fails, still show the analysis
        setAnalysisData({
          filename: file.name,
          fileName: file.name,
          jsonData: data
        });
        
        setShowModal(true);
        showNotification("Analysis completed but failed to save to server.", "warning");
      }
      
    } catch (error) {
      console.error("Processing error:", error);
      showNotification(`Processing failed: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadFromHistory = (analysis) => {
    console.log("Loading analysis from history:", analysis); // Debug log
    
    // Ensure we have the right data structure
    setAnalysisData({
      filename: analysis.filename,
      fileName: analysis.filename, // Both for compatibility
      jsonData: analysis.jsonData
    });
    
    setShowModal(true);
    showNotification("Analysis loaded from history", "success");
  };

  // Single modal close handler
  const handleCloseModal = () => {
    setShowModal(false);
    setAnalysisData(null); // Clear data when closing
  };

  if (booting) return <LoadingOverlay />;

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      {/* Results Modal - Pass the full analysisData object */}
      <ResultsModal 
        analysisData={analysisData} // Pass full object, not just jsonData
        showNotification={showNotification}
      />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/"
          element={
            localStorage.getItem("token") ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route element={<ProtectedRoutes />}>
          <Route
            path="/dashboard"
            element={
              <Layout userType={userType}>
                <Dashboard
                  history={analysisHistory}
                  onLoadAnalysis={handleLoadFromHistory}
                  userType={userType}
                />
              </Layout>
            }
          />

          <Route
            path="/analyze"
            element={
              <Layout userType={userType}>
                <div className="max-w-5xl mx-auto">
                  <div className="bg-white rounded-xl shadow p-6 mb-8">
                    {userType === "banker" ? (
                      <FileUpload
                        onProcess={handleFileProcess}
                        isLoading={isLoading}
                      />
                    ) : (
                      <CreditRiskForm
                        onProcess={handleFileProcess}
                        isLoading={isLoading}
                      />
                    )}
                  </div>
                </div>
              </Layout>
            }
          />

          <Route
            path="/history"
            element={
              <Layout userType={userType}>
                <AnalysisHistory
                  history={analysisHistory}
                  onLoadAnalysis={handleLoadFromHistory}
                  showNotification={showNotification}
                  userType={userType}
                />
              </Layout>
            }
          />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}
