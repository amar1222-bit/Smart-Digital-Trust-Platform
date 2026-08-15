import { useEffect, useState } from "react";
import "./App.css";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

function App() {
  // =====================================================
  // AUTH STATES
  // =====================================================

  const [authMode, setAuthMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("access_token")
  );

  // =====================================================
  // DASHBOARD STATES
  // =====================================================

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [dashboardMessage, setDashboardMessage] = useState("");

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [myImages, setMyImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  const [selectedHistory, setSelectedHistory] = useState(null);

  const [dashboardStats, setDashboardStats] = useState({
    total_images: 0,
    total_analyses: 0,
    likely_authentic: 0,
    suspicious: 0,
    likely_tampered: 0,
    average_confidence: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const [deletingImageId, setDeletingImageId] = useState(null);
  const [clearingHistory, setClearingHistory] = useState(false);

  const API_URL = "http://127.0.0.1:8002";

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Login failed");
        return;
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_name", data.name);
      localStorage.setItem("user_email", data.email);
      localStorage.setItem("user_id", data.user_id);

      setIsLoggedIn(true);
      setMessage("");
    } catch (error) {
      console.error(error);

      setMessage(
        "Cannot connect to backend server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setMessage("");

    if (password !== confirmPassword) {
      setMessage(
        "Password and Confirm Password do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail || "Registration failed."
        );
        return;
      }

      setMessage(
        "Account created successfully. Please login."
      );

      setAuthMode("login");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);

      setMessage(
        "Cannot connect to backend server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.clear();

    setIsLoggedIn(false);

    setSelectedFile(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setAnalysisResult(null);
    setDashboardMessage("");
    setHistory([]);
    setMyImages([]);
    setDeletingImageId(null);
    setClearingHistory(false);
    setDashboardStats({
      total_images: 0,
      total_analyses: 0,
      likely_authentic: 0,
      suspicious: 0,
      likely_tampered: 0,
      average_confidence: 0,
    });

    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
  };

  // =====================================================
  // IMAGE SELECTION
  // =====================================================

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);

    setPreviewUrl(
      URL.createObjectURL(file)
    );

    setAnalysisResult(null);
    setDashboardMessage("");
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // =====================================================
  // LOAD ANALYSIS HISTORY
  // =====================================================

  const loadHistory = async () => {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    setHistoryLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/analysis-history`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        setDashboardMessage(
          "Session expired. Please login again."
        );

        localStorage.clear();
        setIsLoggedIn(false);
        return;
      }

      if (!response.ok) {
        setDashboardMessage(
          data.detail ||
            "Unable to load analysis history."
        );
        return;
      }

      setHistory(data.history || []);
    } catch (error) {
      console.error(
        "History Error:",
        error
      );

      setDashboardMessage(
        "Could not load analysis history."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // =====================================================
  // LOAD MY IMAGES
  // =====================================================

  const loadMyImages = async () => {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    setImagesLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/my-images`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        setDashboardMessage(
          "Session expired. Please login again."
        );

        localStorage.clear();
        setIsLoggedIn(false);
        return;
      }

      if (!response.ok) {
        setDashboardMessage(
          data.detail ||
            "Unable to load uploaded images."
        );
        return;
      }

      setMyImages(data.images || []);
    } catch (error) {
      console.error(
        "My Images Error:",
        error
      );

      setDashboardMessage(
        "Could not load uploaded images."
      );
    } finally {
      setImagesLoading(false);
    }
  };

  // =====================================================
  // LOAD DASHBOARD STATS
  // =====================================================

  const loadDashboardStats = async () => {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    setStatsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/dashboard-stats`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        setDashboardMessage(
          "Session expired. Please login again."
        );

        localStorage.clear();
        setIsLoggedIn(false);
        return;
      }

      if (!response.ok) {
        setDashboardMessage(
          data.detail ||
            "Unable to load dashboard statistics."
        );
        return;
      }

      setDashboardStats(data);
    } catch (error) {
      console.error(
        "Dashboard Stats Error:",
        error
      );

      setDashboardMessage(
        "Could not load dashboard statistics."
      );
    } finally {
      setStatsLoading(false);
    }
  };

  // =====================================================
  // AUTO LOAD HISTORY + IMAGES
  // =====================================================

  useEffect(() => {
    if (isLoggedIn) {
      loadHistory();
      loadMyImages();
      loadDashboardStats();
    }
  }, [isLoggedIn]);

  // =====================================================
  // UPLOAD + ANALYSIS
  // =====================================================

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setDashboardMessage(
        "Please select an image first."
      );
      return;
    }

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      handleLogout();
      return;
    }

    setAnalyzing(true);
    setDashboardMessage("");
    setAnalysisResult(null);

    try {
      const formData = new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const uploadResponse = await fetch(
        `${API_URL}/upload-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const uploadData =
        await uploadResponse.json();

      if (!uploadResponse.ok) {
        setDashboardMessage(
          uploadData.detail ||
            "Image upload failed."
        );
        return;
      }

      const imageId =
        uploadData.image_id;

      const analysisResponse = await fetch(
        `${API_URL}/analyze-image/${imageId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const analysisData =
        await analysisResponse.json();

      if (!analysisResponse.ok) {
        setDashboardMessage(
          analysisData.detail ||
            "Image analysis failed."
        );
        return;
      }

      setAnalysisResult(
        analysisData
      );

      await loadHistory();
      await loadMyImages();
      await loadDashboardStats();

      setDashboardMessage(
        "Image analyzed successfully."
      );
    } catch (error) {
      console.error(error);

      setDashboardMessage(
        "Cannot connect to AI analysis services."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // =====================================================
  // DELETE IMAGE
  // =====================================================

  const handleDeleteImage = async (image) => {
    const confirmed = window.confirm(
      `Delete "${image.original_filename}"?\n\n` +
      "This will also delete analysis history linked to this image."
    );

    if (!confirmed) {
      return;
    }

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      handleLogout();
      return;
    }

    setDeletingImageId(image.image_id);
    setDashboardMessage("");

    try {
      const response = await fetch(
        `${API_URL}/my-images/${image.image_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.clear();
        setIsLoggedIn(false);
        return;
      }

      if (!response.ok) {
        setDashboardMessage(
          data.detail || "Could not delete image."
        );
        return;
      }

      if (
        selectedHistory &&
        selectedHistory.image_id === image.image_id
      ) {
        setSelectedHistory(null);
      }

      setDashboardMessage(
        `Image deleted successfully. ${data.deleted_analysis_records || 0} linked analysis record(s) removed.`
      );

      await loadMyImages();
      await loadHistory();
      await loadDashboardStats();

    } catch (error) {
      console.error("Delete Image Error:", error);

      setDashboardMessage(
        "Could not connect to backend while deleting image."
      );
    } finally {
      setDeletingImageId(null);
    }
  };

  // =====================================================
  // CLEAR HISTORY
  // =====================================================

  const handleClearHistory = async () => {
    if (history.length === 0) {
      setDashboardMessage(
        "Analysis history is already empty."
      );
      return;
    }

    const confirmed = window.confirm(
      "Clear all analysis history?\n\nUploaded images will NOT be deleted."
    );

    if (!confirmed) {
      return;
    }

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      handleLogout();
      return;
    }

    setClearingHistory(true);
    setDashboardMessage("");

    try {
      const response = await fetch(
        `${API_URL}/analysis-history`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.clear();
        setIsLoggedIn(false);
        return;
      }

      if (!response.ok) {
        setDashboardMessage(
          data.detail || "Could not clear analysis history."
        );
        return;
      }

      setSelectedHistory(null);
      setHistory([]);

      setDashboardMessage(
        `Analysis history cleared successfully. ${data.deleted_analyses || 0} record(s) removed.`
      );

      await loadHistory();
      await loadDashboardStats();

    } catch (error) {
      console.error("Clear History Error:", error);

      setDashboardMessage(
        "Could not connect to backend while clearing history."
      );
    } finally {
      setClearingHistory(false);
    }
  };

  // =====================================================
  // VERDICT CLASS
  // =====================================================

  const getVerdictClass = () => {
    if (!analysisResult) {
      return "";
    }

    const verdict =
      analysisResult.final_result.verdict;

    if (verdict === "Likely Authentic") {
      return "verdict-authentic";
    }

    if (verdict === "Likely Tampered") {
      return "verdict-tampered";
    }

    return "verdict-suspicious";
  };

  // =====================================================
  // DASHBOARD
  // =====================================================

  const shortenFilename = (name, maxLength = 28) => {
    if (!name) return "Unknown";

    if (name.length <= maxLength) {
      return name;
    }

    const dotIndex = name.lastIndexOf(".");
    const extension =
      dotIndex > 0 ? name.slice(dotIndex) : "";

    const base =
      dotIndex > 0 ? name.slice(0, dotIndex) : name;

    const available =
      Math.max(
        8,
        maxLength - extension.length - 3
      );

    return `${base.slice(0, available)}...${extension}`;
  };

  const distributionData = [
    { name: "Likely Authentic", value: dashboardStats.likely_authentic },
    { name: "Suspicious", value: dashboardStats.suspicious },
    { name: "Likely Tampered", value: dashboardStats.likely_tampered },
  ];

  const confidenceData = [
    {
      name: "Average",
      confidence: Number(dashboardStats.average_confidence || 0),
    },
  ];

  const chartColors = ["#34d399", "#facc15", "#fb7185"];

  if (isLoggedIn) {
    return (
      <div className="dashboard-page">

        <header className="dashboard-header">

          <div className="dashboard-brand">

            <div className="small-shield">
              ✓
            </div>

            <div>
              <h2>
                Smart Digital Trust
              </h2>

              <p>
                AI Authenticity Detection
              </p>
            </div>

          </div>

          <div className="dashboard-user">

            <div>
              <strong>
                {localStorage.getItem(
                  "user_name"
                )}
              </strong>

              <span>
                {localStorage.getItem(
                  "user_email"
                )}
              </span>
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>

        </header>

        <main className="dashboard-content">

          <div className="dashboard-title">

            <h1>
              Digital Image Analysis
            </h1>

            <p>
              Upload an image and analyze
              authenticity using CNN,
              Random Forest and forensic
              ELA analysis.
            </p>

          </div>

          {/* =================================================
              DASHBOARD STATISTICS
          ================================================= */}

          <div className="stats-section">

            <div className="stats-header">
              <div>
                <h2>Dashboard Overview</h2>
                <p>
                  Live statistics from your image analyses
                </p>
              </div>

              <div className="history-actions">

                <button
                className="refresh-button"
                onClick={loadDashboardStats}
                disabled={statsLoading}
              >
                {statsLoading
                  ? "Loading..."
                  : "Refresh Stats"}
              </button>

                <button
                  className="clear-history-button"
                  onClick={handleClearHistory}
                  disabled={
                    clearingHistory ||
                    historyLoading ||
                    history.length === 0
                  }
                >
                  {clearingHistory
                    ? "Clearing..."
                    : "Clear History"}
                </button>

              </div>
            </div>

            <div className="stats-grid">

              <div className="stat-card">
                <span className="stat-icon">🖼️</span>
                <div>
                  <p>Total Images</p>
                  <strong>
                    {dashboardStats.total_images}
                  </strong>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">🔎</span>
                <div>
                  <p>Total Analyses</p>
                  <strong>
                    {dashboardStats.total_analyses}
                  </strong>
                </div>
              </div>

              <div className="stat-card stat-authentic">
                <span className="stat-icon">✓</span>
                <div>
                  <p>Likely Authentic</p>
                  <strong>
                    {dashboardStats.likely_authentic}
                  </strong>
                </div>
              </div>

              <div className="stat-card stat-suspicious">
                <span className="stat-icon">!</span>
                <div>
                  <p>Suspicious</p>
                  <strong>
                    {dashboardStats.suspicious}
                  </strong>
                </div>
              </div>

              <div className="stat-card stat-tampered">
                <span className="stat-icon">×</span>
                <div>
                  <p>Likely Tampered</p>
                  <strong>
                    {dashboardStats.likely_tampered}
                  </strong>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">%</span>
                <div>
                  <p>Avg. Confidence</p>
                  <strong>
                    {dashboardStats.average_confidence}%
                  </strong>
                </div>
              </div>

            </div>

          </div>

          {/* =================================================
              ANALYTICS CHARTS
          ================================================= */}

          <div className="analytics-section">
            <div className="analytics-header">
              <h2>Analysis Analytics</h2>
              <p>Visual summary of authenticity results and confidence</p>
            </div>

            <div className="analytics-grid">
              <div className="chart-card">
                <div className="chart-title">
                  <h3>Result Distribution</h3>
                  <span>{dashboardStats.total_analyses} analyses</span>
                </div>

                {dashboardStats.total_analyses > 0 ? (
                  <div className="chart-area">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={distributionData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={96}
                          paddingAngle={4}
                        >
                          {distributionData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={chartColors[index % chartColors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="chart-empty">No analysis data yet</div>
                )}

                <div className="chart-legend">
                  <div>
                    <span className="legend-dot authentic-dot" />
                    Likely Authentic
                    <strong>{dashboardStats.likely_authentic}</strong>
                  </div>
                  <div>
                    <span className="legend-dot suspicious-dot" />
                    Suspicious
                    <strong>{dashboardStats.suspicious}</strong>
                  </div>
                  <div>
                    <span className="legend-dot tampered-dot" />
                    Likely Tampered
                    <strong>{dashboardStats.likely_tampered}</strong>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-title">
                  <h3>Confidence Overview</h3>
                  <span>Average trust confidence</span>
                </div>

                <div className="confidence-number">
                  {dashboardStats.average_confidence}%
                </div>

                <div className="chart-area confidence-chart">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={confidenceData}
                      margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(148, 163, 184, 0.12)"
                      />
                      <XAxis dataKey="name" stroke="#7f96af" />
                      <YAxis domain={[0, 100]} stroke="#7f96af" />
                      <Tooltip />
                      <Bar
                        dataKey="confidence"
                        fill="#38bdf8"
                        radius={[10, 10, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              UPLOAD + FINAL RESULT
          ================================================= */}

          <div className="dashboard-grid">

            <div className="dashboard-card upload-card">

              <h2>
                Upload Image
              </h2>

              <p>
                Supported formats:
                JPG, PNG and WEBP
              </p>

              <label className="file-upload-box">

                <span className="upload-icon">
                  ↑
                </span>

                <span>
                  {selectedFile
                    ? shortenFilename(
                        selectedFile.name,
                        34
                      )
                    : "Choose an image"}
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                />

              </label>

              {previewUrl && (
                <div className="image-preview-section">

                  <img
                    src={previewUrl}
                    alt="Selected preview"
                    className="image-preview"
                  />

                  <p>
                    Preview:{" "}
                    {shortenFilename(
                      selectedFile?.name,
                      42
                    )}
                  </p>

                </div>
              )}

              <button
                className="analyze-button"
                onClick={handleAnalyze}
                disabled={
                  !selectedFile ||
                  analyzing
                }
              >
                {analyzing
                  ? "Analyzing..."
                  : "Analyze Image"}
              </button>

              {dashboardMessage && (
                <div className="dashboard-message">
                  {dashboardMessage}
                </div>
              )}

            </div>

            <div className="dashboard-card result-card">

              <h2>
                Final Verdict
              </h2>

              {analysisResult ? (
                <>
                  <div
                    className={`verdict-badge ${getVerdictClass()}`}
                  >
                    {
                      analysisResult
                        .final_result
                        .verdict
                    }
                  </div>

                  <div className="trust-score">

                    {
                      analysisResult
                        .final_result
                        .trust_score
                    }

                    <span>
                      /100
                    </span>

                  </div>

                  <p>
                    Trust Score
                  </p>

                </>
              ) : (
                <div className="empty-result">
                  No analysis yet
                </div>
              )}

            </div>

          </div>

          {/* =================================================
              MODEL RESULTS
          ================================================= */}

          <div className="analysis-grid">

            <div className="analysis-card">

              <h3>
                CNN Analysis
              </h3>

              {analysisResult ? (
                <>
                  <strong>
                    {
                      analysisResult
                        .cnn_analysis
                        .result
                    }
                  </strong>

                  <p>
                    Confidence:{" "}
                    {
                      analysisResult
                        .cnn_analysis
                        .confidence
                    }
                    %
                  </p>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width:
                          `${analysisResult.cnn_analysis.confidence}%`,
                      }}
                    />
                  </div>

                  <p>
                    Authentic:{" "}
                    {
                      analysisResult
                        .cnn_analysis
                        .authentic_probability
                    }
                    %
                  </p>

                  <p>
                    Tampered:{" "}
                    {
                      analysisResult
                        .cnn_analysis
                        .tampered_probability
                    }
                    %
                  </p>
                </>
              ) : (
                <p>
                  Waiting for analysis
                </p>
              )}

            </div>

            <div className="analysis-card">

              <h3>
                Random Forest
              </h3>

              {analysisResult ? (
                <>
                  <strong>
                    {
                      analysisResult
                        .random_forest_analysis
                        .result
                    }
                  </strong>

                  <p>
                    Confidence:{" "}
                    {
                      analysisResult
                        .random_forest_analysis
                        .confidence
                    }
                    %
                  </p>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width:
                          `${analysisResult.random_forest_analysis.confidence}%`,
                      }}
                    />
                  </div>

                  <p>
                    Authentic:{" "}
                    {
                      analysisResult
                        .random_forest_analysis
                        .authentic_probability
                    }
                    %
                  </p>

                  <p>
                    Tampered:{" "}
                    {
                      analysisResult
                        .random_forest_analysis
                        .tampered_probability
                    }
                    %
                  </p>
                </>
              ) : (
                <p>
                  Waiting for analysis
                </p>
              )}

            </div>

            <div className="analysis-card">

              <h3>
                Forensic ELA
              </h3>

              {analysisResult ? (
                <>
                  <strong>
                    {
                      analysisResult
                        .forensic_analysis
                        .result
                    }
                  </strong>

                  <p>
                    Confidence:{" "}
                    {
                      analysisResult
                        .forensic_analysis
                        .confidence
                    }
                    %
                  </p>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width:
                          `${analysisResult.forensic_analysis.confidence}%`,
                      }}
                    />
                  </div>

                  <p>
                    Max Difference:{" "}
                    {
                      analysisResult
                        .forensic_analysis
                        .max_difference
                    }
                  </p>
                </>
              ) : (
                <p>
                  Waiting for analysis
                </p>
              )}

            </div>

          </div>

          {/* =================================================
              MY IMAGES
          ================================================= */}

          <div className="my-images-section">

            <div className="history-header">

              <div>
                <h2>
                  My Images
                </h2>

                <p>
                  Images uploaded from your account
                </p>
              </div>

              <button
                className="refresh-button"
                onClick={loadMyImages}
                disabled={imagesLoading}
              >
                {imagesLoading
                  ? "Loading..."
                  : "Refresh"}
              </button>

            </div>

            {imagesLoading ? (

              <div className="history-empty">
                Loading images...
              </div>

            ) : myImages.length === 0 ? (

              <div className="history-empty">
                No uploaded images found.
              </div>

            ) : (

              <div className="images-grid">

                {myImages
                  .slice()
                  .reverse()
                  .map((image) => (

                    <div
                      className="image-item-card"
                      key={image.image_id}
                    >

                      <div className="image-icon-box">
                        🖼️
                      </div>

                      <div className="image-item-info">

                        <h3
                          title={
                            image.original_filename
                          }
                        >
                          {shortenFilename(
                            image.original_filename,
                            26
                          )}
                        </h3>

                        <p>
                          Image ID: #
                          {
                            image.image_id
                          }
                        </p>

                        <p>
                          Format:{" "}
                          {
                            image.format
                          }
                        </p>

                        <p>
                          Size:{" "}
                          {
                            image.width
                          }
                          {" × "}
                          {
                            image.height
                          }
                        </p>

                        <button
                          className="delete-image-button"
                          onClick={() =>
                            handleDeleteImage(image)
                          }
                          disabled={
                            deletingImageId ===
                            image.image_id
                          }
                        >
                          {deletingImageId === image.image_id
                            ? "Deleting..."
                            : "Delete Image"}
                        </button>

                      </div>

                    </div>

                  ))}

              </div>

            )}

          </div>

          {/* =================================================
              ANALYSIS HISTORY
          ================================================= */}

          <div className="history-section">

            <div className="history-header">

              <div>
                <h2>
                  Analysis History
                </h2>

                <p>
                  Previous image authenticity
                  analysis results
                </p>
              </div>

              <button
                className="refresh-button"
                onClick={loadHistory}
                disabled={historyLoading}
              >
                {historyLoading
                  ? "Loading..."
                  : "Refresh"}
              </button>

            </div>

            {historyLoading ? (

              <div className="history-empty">
                Loading history...
              </div>

            ) : history.length === 0 ? (

              <div className="history-empty">
                No analysis history available.
              </div>

            ) : (

              <div className="history-table-wrapper">

                <table className="history-table">

                  <thead>
                    <tr>
                      <th>Analysis ID</th>
                      <th>Filename</th>
                      <th>Result</th>
                      <th>Confidence</th>
                      <th>Date & Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>

                    {history
                      .slice()
                      .reverse()
                      .map((item) => (

                        <tr
                          key={item.analysis_id}
                        >

                          <td>
                            #{item.analysis_id}
                          </td>

                          <td
                            className="history-filename"
                            title={
                              item.filename || "Unknown"
                            }
                          >
                            {shortenFilename(
                              item.filename,
                              30
                            )}
                          </td>

                          <td>
                            <span className="history-result">
                              {item.result}
                            </span>
                          </td>

                          <td>
                            {item.confidence}%
                          </td>

                          <td>
                            {item.created_at
                              ? new Date(
                                  item.created_at
                                ).toLocaleString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                )
                              : "Old Record"}
                          </td>

                          <td>
                            <button
                              className="details-button"
                              onClick={() =>
                                setSelectedHistory(item)
                              }
                            >
                              View Details
                            </button>
                          </td>

                        </tr>

                      ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>


          {/* =================================================
              HISTORY DETAILS MODAL
          ================================================= */}

          {selectedHistory && (
            <div className="details-overlay">

              <div className="details-modal">

                <div className="details-modal-header">

                  <h2>
                    Analysis Details
                  </h2>

                  <button
                    className="close-details"
                    aria-label="Close analysis details"
                    onClick={() =>
                      setSelectedHistory(null)
                    }
                  >
                    ×
                  </button>

                </div>

                <div className="details-content">

                  <div className="detail-row">
                    <span>Analysis ID</span>
                    <strong>
                      #{selectedHistory.analysis_id}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Image ID</span>
                    <strong>
                      #{selectedHistory.image_id}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Filename</span>
                    <strong>
                      {selectedHistory.filename || "Unknown"}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Final Result</span>
                    <strong>
                      {selectedHistory.result}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Trust / Confidence</span>
                    <strong>
                      {selectedHistory.confidence}%
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>ELA Difference</span>
                    <strong>
                      {selectedHistory.max_difference}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Date & Time</span>
                    <strong>
                      {selectedHistory.created_at
                        ? new Date(
                            selectedHistory.created_at
                          ).toLocaleString(
                            "en-IN"
                          )
                        : "Old Record"}
                    </strong>
                  </div>

                </div>

              </div>

            </div>
          )}

        </main>

      </div>
    );
  }

  // =====================================================
  // LOGIN / REGISTER
  // =====================================================

  return (
    <div className="app">

      <div className="login-container">

        <div className="brand-section">

          <div className="shield">
            ✓
          </div>

          <h1>
            Smart Digital Trust
          </h1>

          <p>
            AI-Powered Image Authenticity
            & Tampering Detection Platform
          </p>

        </div>

        <div className="login-card">

          <h2>
            {authMode === "login"
              ? "Welcome Back"
              : "Create Account"}
          </h2>

          <p className="subtitle">
            {authMode === "login"
              ? "Sign in to analyze digital images"
              : "Create your Smart Digital Trust account"}
          </p>

          <form
            onSubmit={
              authMode === "login"
                ? handleLogin
                : handleRegister
            }
          >

            {authMode === "register" && (

              <div className="form-group">

                <label>
                  Full Name
                </label>

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  required
                />

              </div>

            )}

            <div className="form-group">

              <label>
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                required
              />

            </div>

            <div className="form-group">

              <label>
                Password
              </label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                required
              />

            </div>

            {authMode === "register" && (

              <div className="form-group">

                <label>
                  Confirm Password
                </label>

                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  required
                />

              </div>

            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : authMode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>

          </form>

          {message && (
            <div className="message">
              {message}
            </div>
          )}

          <div className="auth-switch">

            {authMode === "login" ? (
              <>
                <span>
                  Don't have an account?
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setMessage("");
                  }}
                >
                  Create Account
                </button>
              </>
            ) : (
              <>
                <span>
                  Already have an account?
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setMessage("");
                  }}
                >
                  Sign In
                </button>
              </>
            )}

          </div>

          <div className="security-text">
            🔒 Secured with JWT Authentication
          </div>

        </div>

      </div>

    </div>
  );
}

export default App;