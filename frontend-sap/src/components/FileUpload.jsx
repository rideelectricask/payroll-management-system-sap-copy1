// components/FileUpload.jsx
import React, { useRef, useState } from "react";

const FileUpload = ({ 
  onFileSelect, 
  isLoading = false, 
  accept = ".xlsx,.xls",
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  className = ""
}) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);

  const handleFileValidation = (file) => {
    const errors = [];
    
    // Check file type
    const allowedTypes = accept.split(',').map(type => type.trim());
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      errors.push(`File type not allowed. Accepted: ${accept}`);
    }
    
    // Check file size
    if (file.size > maxSize) {
      errors.push(`File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`);
    }
    
    // Check if file is empty
    if (file.size === 0) {
      errors.push("File is empty");
    }
    
    return errors;
  };

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    
    const file = files[0]; // Take first file only
    const errors = handleFileValidation(file);
    
    if (errors.length > 0) {
      alert(`File validation failed:\n${errors.join('\n')}`);
      return;
    }
    
    setFileInfo({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toLocaleString()
    });
    
    // Create a synthetic event that matches what DriverPerformance expects
    const syntheticEvent = {
      preventDefault: () => {},
      target: { 
        files: [file], 
        value: null 
      }
    };
    
    onFileSelect(syntheticEvent);
  };

  const handleInputChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearFile = () => {
    setFileInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        multiple={multiple}
        className="hidden"
        id="file-upload"
        disabled={isLoading}
      />
      
      <div
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer
          ${dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
          ${fileInfo ? 'bg-green-50 border-green-300' : ''}
        `}
      >
        <div className="text-center">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
              <span className="text-gray-600">Processing file...</span>
            </div>
          ) : fileInfo ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center text-green-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-green-800">
                <p className="font-medium">{fileInfo.name}</p>
                <p className="text-green-600">
                  {formatFileSize(fileInfo.size)} • {fileInfo.lastModified}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-700">
                  {dragActive ? 'Drop file here' : 'Upload Excel File'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag and drop your Excel file here, or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Supported formats: {accept} • Max size: {Math.round(maxSize / 1024 / 1024)}MB
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Instructions */}
      {/* <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
        <p className="font-medium mb-1">📋 Instructions:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Upload Excel files (.xlsx or .xls) containing driver data</li>
          <li>Make sure your Excel file has the required columns: Username, Full Name, Courier ID, Hub Location, Askor, Fee</li>
          <li>File size should not exceed {Math.round(maxSize / 1024 / 1024)}MB</li>
          <li>Data will be validated before processing</li>
        </ul>
      </div> */}
    </div>
  );
};

export default FileUpload;