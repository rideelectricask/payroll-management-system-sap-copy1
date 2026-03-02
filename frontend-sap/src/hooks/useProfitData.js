import { useState, useMemo, useCallback, useRef } from 'react';
import { groupByCourierAndDate } from '../utils/processors/groupData';

export const useProfitData = (data, getCourierNameForDisplay, forceRefreshKey = 0) => {
  const [groupedData, setGroupedData] = useState([]);
  const [showGroupedTable, setShowGroupedTable] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isProcessingRef = useRef(false);
  const lastProcessedKey = useRef(-1);
  const dataProcessedRef = useRef(false);

  const chartConfig = useMemo(() => {
    if (!groupedData.length) return { options: {}, series: [] };

    const categories = groupedData.map(
      (row) => `${row["Courier Name"]} (${row["DropOff Done"]})`
    );
    const seriesData = groupedData.map((row) => row["Profit"]);

    const options = {
      chart: {
        id: "profit-chart",
        toolbar: { show: true },
        background: "#ffffff",
        fontFamily: "Arial, sans-serif",
      },
      xaxis: {
        categories,
        title: {
          text: "Courier Name (Tanggal)",
          style: { fontWeight: 600, fontSize: "14px" },
        },
        labels: { rotate: -45, style: { fontSize: "12px" } },
      },
      yaxis: {
        title: {
          text: "Profit (Rp)",
          style: { fontWeight: 600, fontSize: "14px" },
        },
        labels: {
          formatter: (v) => `Rp${v?.toLocaleString("id-ID") || 0}`,
        },
      },
      tooltip: {
        y: { formatter: (v) => `Rp${v?.toLocaleString("id-ID") || 0}` },
      },
      dataLabels: {
        enabled: true,
        formatter: (v) => `Rp${v?.toLocaleString("id-ID") || 0}`,
        style: { fontSize: "11px", colors: ["#000"] },
      },
      title: {
        text: "Visualisasi Profit per Kurir",
        align: "center",
        style: { fontSize: "18px", fontWeight: "bold", color: "#1f2937" },
      },
      subtitle: {
        text: "Total keuntungan kurir berdasarkan tanggal drop-off",
        align: "center",
        style: { fontSize: "13px", color: "#6b7280" },
      },
      colors: ["#10b981"],
      grid: { borderColor: "#e5e7eb", strokeDashArray: 4 },
      plotOptions: {
        bar: {
          columnWidth: "40%",
          borderRadius: 4,
        },
      },
    };

    const series = [{ name: "Profit", data: seriesData }];
    return { options, series };
  }, [groupedData]);

  const handleGenerateGroupedData = useCallback(async () => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('No data available for processing');
      return;
    }

    if (isProcessingRef.current) {
      console.log('Already processing, skipping...');
      return;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      console.log('Starting data processing...');

      const processedData = data.map(row => {
        const courierName = getCourierNameForDisplay(row);
        const roundUp = parseInt(row["RoundUp"]) || 0;
        const roundUpDistance = parseInt(row["RoundUp Distance"]) || 0;
        let additional1 = 0;
        let additional2 = 0;

        if (row["Client Name"] === "Sayurbox") {
          if (roundUp >= 10) {
            additional1 = (roundUp - 10) * 500;
          }
          if (roundUpDistance >= 30) {
            additional2 = (roundUpDistance - 30) * 2000;
          }
        }

        return {
          ...row,
          "Courier Name": courierName,
          "Additional RoundUp Fee": additional1,
          "Additional Distance Fee": additional2,
          "Add Charge 1": (parseInt(row["Add Charge 1"]) || 0) + additional1 + additional2,
        };
      });

      console.log('Calling groupByCourierAndDate with processed data...');
      const result = await groupByCourierAndDate(processedData);
      console.log('Data processing completed, setting grouped data:', result.length, 'items');
      
      setGroupedData(result);
      setShowGroupedTable(true);
      setShowChart(false);
      dataProcessedRef.current = true;
      
    } catch (error) {
      console.error('Error processing data:', error);
      setGroupedData([]);
      setShowGroupedTable(false);
      dataProcessedRef.current = false;
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [data, getCourierNameForDisplay]);

  const refreshGroupedData = useCallback(async () => {
    if (showGroupedTable && data && Array.isArray(data) && data.length > 0 && !isProcessingRef.current) {
      console.log('Refreshing grouped data after data reload...');
      await handleGenerateGroupedData();
    }
  }, [showGroupedTable, data, handleGenerateGroupedData]);

  const resetProfitView = useCallback(() => {
    if (isProcessingRef.current) {
      console.log('Cannot reset while processing...');
      return;
    }
    
    console.log('Resetting profit view state...');
    setShowGroupedTable(false);
    setShowChart(false);
    setGroupedData([]);
    dataProcessedRef.current = false;
    lastProcessedKey.current = -1;
  }, []);

  const toggleChart = useCallback(() => {
    setShowChart(prev => !prev);
  }, []);

  return {
    groupedData,
    showGroupedTable,
    showChart,
    chartConfig,
    isProcessing,
    handleGenerateGroupedData,
    refreshGroupedData,
    toggleChart,
    resetProfitView
  };
};