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
import About from "./components/About";
import "./App.css";
import ProtectedRoutes from "./routes/protectedRoutes";
import ResultsModal from "./assets/modal/ResultsModal";

function AppInner() {
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [booting, setBooting] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const navigate = useNavigate();

  const userType = localStorage.getItem("userType");

  const fetchAnalysisHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setAnalysisHistory([]);
        return;
      }

      const response = await fetch("http://localhost:4000/results/GetResults", {
        method: "GET",
        headers: {
          "auth-token": `${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisHistory(data);
      } else {
        console.error("Failed to fetch analysis history");
        setAnalysisHistory([]);
      }
    } catch (error) {
      console.error("Error fetching analysis history:", error);
      setAnalysisHistory([]);
    }
  }, []);

  const handleDeleteAnalysis = async (analysis) => {
    try {
      const token = localStorage.getItem("token");
      const analysisId = analysis._id || analysis.id;

      const response = await fetch(
        `http://localhost:4000/results/DeleteResult/${analysisId}`,
        {
          method: "DELETE",
          headers: {
            "auth-token": token,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setAnalysisHistory((prev) =>
          prev.filter((item) => (item._id || item.id) !== analysisId)
        );
        showNotification("Analysis deleted successfully", "success");
      } else {
        const errorData = await response.json();
        showNotification(
          `Failed to delete analysis: ${errorData.message || response.statusText}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error deleting analysis:", error);
      showNotification("Error deleting analysis", "error");
    }
  };

  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem("token");
      const loggedIn = !!token;

      setIsLoggedIn(loggedIn);

      if (loggedIn) {
        fetchAnalysisHistory();
      } else {
        setAnalysisHistory([]);
      }
    };

    window.addEventListener("auth-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [fetchAnalysisHistory]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      fetchAnalysisHistory();
    }
  }, [fetchAnalysisHistory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBooting(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  const saveAnalysisToBackend = async (analysisData) => {
    try {
      const token = localStorage.getItem("token");

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
        // Try to capture JSON errors else fallback to text for better diagnostics
        const contentType = response.headers.get("content-type") || "";
        const errorPayload = contentType.includes("application/json")
          ? await response.json()
          : await response.text();
        console.error("Python endpoint error:", errorPayload);
        throw new Error(
          `Analysis failed: ${response.status} - ${
            typeof errorPayload === "string"
              ? errorPayload
              : JSON.stringify(errorPayload)
          }`
        );
      }

      // Parse as JSON; may be an array (new API) or object (legacy)
      const parsed = await response.json();

      // Normalize to an array of records
      const records = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.data)
        ? parsed.data
        : Array.isArray(parsed?.records)
        ? parsed.records
        : Array.isArray(parsed?.result)
        ? parsed.result
        : Array.isArray(parsed?.payload)
        ? parsed.payload
        : null;

      if (!Array.isArray(records) || records.length === 0) {
        console.error("Invalid response structure:", parsed);
        throw new Error("Analysis returned empty or invalid results");
      }

      const newAnalysis = {
        filename: file.name,
        jsonData: records,
        timestamp: new Date().toISOString(),
      };

      console.log("New analysis data:", newAnalysis);

      // Save to backend for BOTH user types
      try {
        const savedAnalysis = await saveAnalysisToBackend(newAnalysis);
        await fetchAnalysisHistory();

        setAnalysisData(newAnalysis);
        setShowModal(true);

        if (userType === "user") {
          // Additional localStorage save for users
          localStorage.setItem("userAnalysisData", JSON.stringify(records));
          showNotification(
            `Your analysis completed successfully! Processed ${records.length} records.`,
            "success"
          );
        } else {
          showNotification(
            `Analysis completed and saved successfully! Processed ${records.length} records.`,
            "success"
          );
        }
      } catch (saveError) {
        console.error("Save error:", saveError);

        // Fallback for both user types when save fails
        setAnalysisData({
          filename: file.name,
          jsonData: records,
          timestamp: new Date().toISOString(),
          recordCount: records.length,
        });

        if (userType === "user") {
          localStorage.setItem("userAnalysisData", JSON.stringify(records));
        }

        setShowModal(true);
        showNotification(
          `Analysis completed but failed to save to server. Processed ${records.length} records.`,
          "warning"
        );
      }
    } catch (error) {
      console.error("Processing error:", error);
      console.error("Error stack:", error.stack);
      showNotification(`Processing failed: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadFromHistory = (analysis) => {
    setAnalysisData(analysis);
    setShowModal(true);
    showNotification("Analysis loaded from history", "success");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setAnalysisData(null);
  };

  if (booting) {
    return <LoadingOverlay />;
  }

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <ResultsModal
        isOpen={showModal}
        onClose={handleCloseModal}
        analysisData={analysisData}
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
                  onDeleteAnalysis={handleDeleteAnalysis}
                  userType={userType}
                />
              </Layout>
            }
          />

          <Route
            path="/about"
            element={
              <Layout userType={userType}>
                <About />
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
