import React, { useState } from "react";
import { Button } from "@material-tailwind/react";
import { getSayurboxDataPaginated, getExcelData, compareDataSayurboxBatch } from "../services/apis";

const CompareDataSayurbox = ({
  onCompareResult,
  onDataReload,
  disabled = false,
  loading = false,
  variant = "filled",
  color = "blue",
  size = "md",
  className = "",
  children = "Compare Data Sayurbox"
}) => {
  const [isComparing, setIsComparing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });

  const handleCompareClick = async () => {
    setIsComparing(true);
    setProgress({ current: 0, total: 0, percentage: 0, stage: 'Initializing' });

    try {
      setProgress({ current: 0, total: 0, percentage: 10, stage: 'Validating Data Availability' });

      const compareResult = await compareDataSayurboxBatch((progressData) => {
        if (progressData.stage === 'loading_sayurbox') {
          setProgress({
            current: progressData.current,
            total: progressData.total,
            percentage: 10 + Math.round((progressData.current / progressData.total) * 20),
            stage: 'Loading Sayurbox Data from Database'
          });
        } else if (progressData.stage === 'loading_excel') {
          setProgress({
            current: progressData.current,
            total: progressData.total,
            percentage: 30 + Math.round((progressData.current / progressData.total) * 20),
            stage: 'Loading Excel Data from Database'
          });
        } else if (progressData.stage === 'comparing') {
          setProgress({
            current: progressData.current,
            total: progressData.total,
            percentage: 50 + Math.round((progressData.current / progressData.total) * 45),
            stage: `Comparing Batch ${progressData.batchNumber || ''}/${progressData.totalBatches || ''}`
          });
        }
      });

      if (!compareResult || compareResult.error) {
        throw new Error(compareResult?.error || 'Compare gagal - tidak ada response dari server');
      }

      setProgress({ 
        current: compareResult.summary?.totalChecked || 0, 
        total: compareResult.summary?.totalChecked || 0, 
        percentage: 95, 
        stage: 'Finalizing' 
      });

      if (onCompareResult) {
        onCompareResult(compareResult);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress({ 
        current: compareResult.summary?.totalChecked || 0, 
        total: compareResult.summary?.totalChecked || 0, 
        percentage: 100, 
        stage: 'Reloading Data' 
      });

      if (onDataReload) {
        await onDataReload();
      }

      alert(`Compare berhasil!\n- Total dicek: ${compareResult.summary?.totalChecked || 0}\n- Total diupdate: ${compareResult.summary?.totalUpdated || 0}\n- Data cocok: ${compareResult.summary?.matchedRecords || 0}\n- Excel tidak cocok: ${compareResult.summary?.unmatchedExcelCount || 0}\n- Sayurbox tidak cocok: ${compareResult.summary?.unmatchedSayurboxCount || 0}`);

    } catch (error) {
      console.error('Error during compare process:', error);
      
      let errorMessage = 'Terjadi kesalahan tidak diketahui';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      if (errorMessage.includes('timeout') || errorMessage.includes('ECONNABORTED')) {
        errorMessage = 'Request timeout - proses compare membutuhkan waktu lama. Data telah diproses sebagian. Silakan coba lagi.';
      } else if (errorMessage.includes('Network Error')) {
        errorMessage = 'Koneksi bermasalah. Pastikan internet stabil dan coba lagi.';
      } else if (errorMessage.includes('500')) {
        errorMessage = 'Server error. Silakan coba lagi dalam beberapa menit.';
      }

      alert(`Error: ${errorMessage}`);
    } finally {
      setIsComparing(false);
      setProgress({ current: 0, total: 0, percentage: 0 });
    }
  };

  const isButtonDisabled = disabled || loading || isComparing;
  const isButtonLoading = loading || isComparing;

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleCompareClick}
        disabled={isButtonDisabled}
        variant={variant}
        color={color}
        size={size}
        className={`${className} ${isButtonLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {isButtonLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {isComparing ? 'Comparing...' : 'Loading...'}
          </div>
        ) : (
          children
        )}
      </Button>
      
      {isComparing && progress.percentage > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progress.percentage}%` }}
          ></div>
          <div className="text-xs text-gray-600 mt-1">
            {progress.stage}: {progress.percentage}% 
            {progress.total > 0 && ` (${progress.current}/${progress.total})`}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareDataSayurbox;