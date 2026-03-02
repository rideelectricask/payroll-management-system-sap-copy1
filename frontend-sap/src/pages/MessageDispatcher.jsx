import React, { useState, useEffect, useRef } from "react";

export default function MessageDispatcher() {
  const [isWahaReady, setIsWahaReady] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [qrCode, setQrCode] = useState(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startMessage, setStartMessage] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [messageLogs, setMessageLogs] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  const [safeMode, setSafeMode] = useState(true);
  const [messagesPerBatch, setMessagesPerBatch] = useState(20);
  const [sendingProgress, setSendingProgress] = useState(null);
  const [currentPhone, setCurrentPhone] = useState("");
  const [waitingTime, setWaitingTime] = useState(0);
  const fileInputRef = useRef(null);

  const API_KEY = "1c67560aad774aa7a5f7fdf28ae01ae7";
  const WAHA_BASE_URL = "https://waha-production-1839.up.railway.app";

  useEffect(() => {
    const checkWahaHealth = async () => {
      try {
        const response = await fetch("/api/health");
        const data = await response.json();
        
        if (response.ok && data.waha === "connected") {
          setIsWahaReady(true);
          setError(null);
          setRetryCount(0);
        } else {
          setError("WAHA is not responding");
          setIsWahaReady(false);
        }
      } catch (err) {
        setError("Cannot connect to backend server.");
        setIsWahaReady(false);
        setRetryCount(prev => prev + 1);
      }
    };

    checkWahaHealth();
    fetchMessageCount();
    fetchStatistics();
    const interval = setInterval(() => {
      checkWahaHealth();
      fetchMessageCount();
      fetchStatistics();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessageCount = async () => {
    try {
      const response = await fetch("/api/phone-message/all");
      if (response.ok) {
        const data = await response.json();
        setMessageCount(data.count || 0);
      }
    } catch (err) {
      console.error("Failed to fetch message count:", err);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch("/api/phone-message/statistics");
      if (response.ok) {
        const data = await response.json();
        setStatistics(data.statistics);
      }
    } catch (err) {
      console.error("Failed to fetch statistics:", err);
    }
  };

  const fetchMessageLogs = async (status = "all") => {
    try {
      const url = status === "all" 
        ? "/api/phone-message/logs"
        : `/api/phone-message/logs?status=${status}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMessageLogs(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch message logs:", err);
    }
  };

  const handleExportLogs = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/phone-message/export");
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `message-logs-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setSendResult({ 
          type: "success", 
          text: "Report exported successfully" 
        });
      } else {
        setSendResult({ 
          type: "error", 
          text: "Failed to export report" 
        });
      }
    } catch (err) {
      setSendResult({ 
        type: "error", 
        text: `Export error: ${err.message}` 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/phone-message/upload", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setUploadMessage({ type: "success", text: data.message, details: data.warning });
        fetchMessageCount();
        fetchStatistics();
      } else {
        setUploadMessage({ type: "error", text: data.message || "Upload failed" });
      }
    } catch (err) {
      setUploadMessage({ type: "error", text: `Error: ${err.message}` });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSendMessages = async () => {
    if (messageCount === 0) {
      setSendResult({ type: "error", text: "No contacts available. Please upload Excel file first." });
      return;
    }

    const actualBatchSize = safeMode ? Math.min(messageCount, messagesPerBatch) : messageCount;
    const estimatedTime = safeMode ? Math.ceil(actualBatchSize * 45 / 60) : Math.ceil(actualBatchSize * 4 / 60);

    const confirmMessage = safeMode 
      ? `🛡️ SAFE MODE: Send ${actualBatchSize} messages?\n\n⏱️ Estimated time: ${estimatedTime} minutes\n⏰ Delay: 30-60 seconds between messages\n✅ Human-like behavior: Seen → Typing → Send\n\n${messageCount > actualBatchSize ? `\n⚠️ ${messageCount - actualBatchSize} messages will remain for next batch` : ''}\n\n⚠️ NOTE: Failed contacts will NOT be retried automatically`
      : `⚠️ UNSAFE MODE: This mode is NOT recommended!\n\nSend ${actualBatchSize} messages quickly?\nRisk: Account may get restricted`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsSending(true);
    setSendResult(null);
    setSendingProgress({ processed: 0, total: 0, success: 0, failed: 0, skipped: 0 });
    setCurrentPhone("");
    setWaitingTime(0);

    try {
      const response = await fetch("/api/phone-message/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customMessage: customMessage.trim(),
          safeMode: safeMode,
          messagesPerBatch: messagesPerBatch
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'start') {
              setSendingProgress({
                processed: 0,
                total: data.total,
                success: 0,
                failed: 0,
                skipped: 0
              });
            } else if (data.type === 'progress') {
              setCurrentPhone(data.phone || "");
              setSendingProgress({
                processed: data.processed || 0,
                total: data.total || 0,
                success: data.successCount || 0,
                failed: data.failedCount || 0,
                skipped: data.skippedCount || 0
              });
            } else if (data.type === 'waiting') {
              setWaitingTime(data.delay || 0);
            } else if (data.type === 'complete') {
              setSendResult({ 
                type: "success", 
                text: data.message,
                details: data.recommendation
              });
              setCustomMessage("");
              fetchStatistics();
              fetchMessageLogs(filterStatus);
            } else if (data.type === 'error') {
              setSendResult({ type: "error", text: data.error || "Unknown error occurred" });
            }
          } catch (parseError) {
            console.error("Error parsing stream data:", parseError);
          }
        }
      }
    } catch (err) {
      setSendResult({ type: "error", text: `Error: ${err.message}` });
    } finally {
      setIsSending(false);
      setSendingProgress(null);
      setCurrentPhone("");
      setWaitingTime(0);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutMessage(null);
    
    try {
      const response = await fetch(`${WAHA_BASE_URL}/api/sessions/default/logout`, {
        method: "POST",
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        setLogoutMessage({ type: "success", text: "Successfully logged out from WhatsApp session" });
        setQrCode(null);
      } else {
        setLogoutMessage({ type: "error", text: "Failed to logout. Please try again." });
      }
    } catch (err) {
      setLogoutMessage({ type: "error", text: `Error: ${err.message}` });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleStartSession = async () => {
    setIsStarting(true);
    setStartMessage(null);
    
    try {
      const response = await fetch(`${WAHA_BASE_URL}/api/sessions/default/start`, {
        method: "POST",
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        setStartMessage({ type: "success", text: "WAHA session started successfully! Please scan QR code if needed." });
        setTimeout(() => {
          handleRefreshQr();
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setStartMessage({ type: "error", text: errorData.message || "Failed to start session. Please try again." });
      }
    } catch (err) {
      setStartMessage({ type: "error", text: `Error: ${err.message}` });
    } finally {
      setIsStarting(false);
    }
  };

  const handleRefreshQr = async () => {
    setIsLoadingQr(true);
    setLogoutMessage(null);
    
    try {
      const response = await fetch(`${WAHA_BASE_URL}/api/default/auth/qr`, {
        method: "GET",
        headers: {
          "x-api-key": API_KEY,
          "Accept": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setQrCode(data.data);
          setLogoutMessage({ type: "success", text: "QR Code refreshed successfully" });
        } else {
          setLogoutMessage({ type: "error", text: "No QR Code data received" });
        }
      } else {
        setLogoutMessage({ type: "error", text: "Failed to fetch QR Code" });
      }
    } catch (err) {
      setLogoutMessage({ type: "error", text: `Error: ${err.message}` });
    } finally {
      setIsLoadingQr(false);
    }
  };

  const handleViewLogs = async (status) => {
    setFilterStatus(status);
    await fetchMessageLogs(status);
  };

  const openWahaDirectly = () => {
    window.open(`${WAHA_BASE_URL}/dashboard`, "_blank", "noopener,noreferrer");
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "success": return "text-green-600 bg-green-50";
      case "failed": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const progressPercentage = sendingProgress 
    ? Math.round((sendingProgress.processed / sendingProgress.total) * 100) 
    : 0;

  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-50">
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Message Dispatcher</h1>
            <p className="text-sm text-gray-600 mt-1">WhatsApp HTTP API Dashboard - Anti-Ban Mode</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-700">{messageCount} Contacts</span>
            </div>
            {statistics && (
              <>
                <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">{statistics.success} Sent</span>
                </div>
                <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-red-700">{statistics.failed} Failed</span>
                </div>
              </>
            )}
            {isWahaReady ? (
              <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">WAHA Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-700">WAHA Disconnected</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && !isWahaReady && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <p className="text-xs text-red-600 mt-2">
                Make sure the backend server and WAHA service are running.
              </p>
              {retryCount > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  Retry attempt: {retryCount}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {sendingProgress && (
        <div className="mx-6 mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="animate-spin h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                {safeMode ? "🛡️ Safe Mode: Sending Messages with Human-Like Behavior..." : "⚡ Sending Messages..."}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Progress: {sendingProgress.processed} / {sendingProgress.total} 
                {currentPhone && ` - Current: ${currentPhone}`}
              </p>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                ✓ {sendingProgress.success} sent | ✗ {sendingProgress.failed} failed | ⊘ {sendingProgress.skipped} skipped
                {waitingTime > 0 && ` | ⏳ Waiting ${waitingTime}s...`}
              </p>
            </div>
          </div>
        </div>
      )}

      {(logoutMessage || uploadMessage || sendResult || startMessage) && !sendingProgress && (
        <div className="mx-6 mt-4 space-y-3">
          {[logoutMessage, uploadMessage, sendResult, startMessage].filter(Boolean).map((msg, idx) => (
            <div key={idx} className={`border rounded-lg p-4 ${
              msg.type === "success" 
                ? "bg-green-50 border-green-200" 
                : "bg-orange-50 border-orange-200"
            }`}>
              <div className="flex items-start gap-3">
                <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  msg.type === "success" ? "text-green-600" : "text-orange-600"
                }`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    msg.type === "success" ? "text-green-800" : "text-orange-800"
                  }`}>{msg.text}</p>
                  {msg.details && (
                    <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{msg.details}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 p-6 space-y-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 font-semibold">
                ⚠️ Anti-Ban Guidelines
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                • Use SAFE MODE (enabled by default)<br/>
                • Send max 20-30 messages per batch<br/>
                • Wait 1 hour between batches<br/>
                • Never send to people who haven't chatted with you first<br/>
                • <strong>Failed contacts will NOT be retried automatically</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Contacts</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-upload"
            />
            <label
              htmlFor="excel-upload"
              className={`w-full px-6 py-3 rounded-lg transition-colors font-medium shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                isUploading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Excel
                </>
              )}
            </label>
            <p className="text-xs text-gray-500 mt-2">Excel must have columns: phone, message</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Messages</h2>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Custom message (optional). Leave empty to use individual messages from Excel."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none mb-3"
              rows="2"
            />
            
            <div className="space-y-3 mb-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="safeMode"
                    checked={safeMode}
                    onChange={(e) => setSafeMode(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="safeMode" className="text-sm font-medium text-green-900">
                    🛡️ Safe Mode (Recommended)
                  </label>
                </div>
                <span className="text-xs text-green-700">30-60s delay</span>
              </div>

              {safeMode && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="text-xs font-medium text-blue-900 block mb-2">
                    Messages per batch (max {messagesPerBatch})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={messagesPerBatch}
                    onChange={(e) => setMessagesPerBatch(Math.min(30, Math.max(1, parseInt(e.target.value) || 20)))}
                    className="w-full px-3 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    Wait 1 hour before sending next batch
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleSendMessages}
              disabled={isSending || messageCount === 0}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {safeMode ? `🛡️ Send Safely (${Math.min(messageCount, messagesPerBatch)} msgs)` : `⚡ Send Fast (${messageCount} msgs)`}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Sending History</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportLogs}
                disabled={isExporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center gap-2 disabled:bg-gray-400"
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Report
                  </>
                )}
              </button>
              <select
                value={filterStatus}
                onChange={(e) => handleViewLogs(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Messages</option>
                <option value="success">Success Only</option>
                <option value="failed">Failed Only</option>
              </select>
            </div>
          </div>

          {messageLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">WhatsApp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {messageLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono">{log.normalizedPhone}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.isWhatsAppRegistered === null ? "Unknown" : log.isWhatsAppRegistered ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{log.errorMessage || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {log.successAt ? new Date(log.successAt).toLocaleString() : new Date(log.lastAttemptAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No message history yet. Send some messages to see logs here.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">WAHA Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={handleStartSession}
              disabled={isStarting}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isStarting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Starting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Session
                </>
              )}
            </button>

            <button
              onClick={openWahaDirectly}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Open Dashboard
            </button>

            <button
              onClick={handleRefreshQr}
              disabled={isLoadingQr}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoadingQr ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh QR
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging out...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout Session
                </>
              )}
            </button>
          </div>
        </div>

        {qrCode && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">Scan QR Code to Connect WhatsApp</h2>
            <div className="flex justify-center">
              <img 
                src={`data:image/png;base64,${qrCode}`} 
                alt="WhatsApp QR Code"
                className="border-4 border-gray-200 rounded-lg shadow-md"
              />
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Open WhatsApp on your phone and scan this QR code to connect
            </p>
          </div>
        )}
      </div>
    </div>
  );
}