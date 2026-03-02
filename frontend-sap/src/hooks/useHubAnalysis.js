import { useState, useCallback, useMemo } from 'react';
import _ from 'lodash';

export const useHubAnalysis = (memoizedData) => {
  const [hubAnalysisData, setHubAnalysisData] = useState([]);
  const [showChart, setShowChart] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const calculateDifferencePercentage = useCallback((count, lateCount) => {
    if (count === 0) return 0;
    return (lateCount / count) * 100;
  }, []);

  const processHubData = useMemo(() => {
    if (!memoizedData.length) return { hubCounts: {}, hubLateStatus: {}, totalData: 0 };

    const grouped = _.groupBy(memoizedData, row => {
      const hub = row.HUB?.toString().trim();
      return hub || 'Unknown';
    });

    const hubCounts = {};
    const hubLateStatus = {};
    let totalData = 0;

    Object.entries(grouped).forEach(([hub, rows]) => {
      if (hub && hub !== 'Unknown') {
        hubCounts[hub] = rows.length;
        totalData += rows.length;

        hubLateStatus[hub] = rows.filter(row => 
          row["Delivery Status"]?.toString().trim() === 'LATE'
        ).length;
      }
    });

    return { hubCounts, hubLateStatus, totalData };
  }, [memoizedData]);

  const analyzeHubData = useCallback(() => {
    if (!memoizedData.length || isAnalyzing) return;

    setIsAnalyzing(true);

    try {
      const { hubCounts, hubLateStatus, totalData } = processHubData;
      const uniqueHubs = Object.keys(hubCounts);
      const sortedHubs = uniqueHubs.sort((a, b) => hubCounts[b] - hubCounts[a]);

      const hubAnalysisResults = sortedHubs.map((hub, index) => {
        const count = hubCounts[hub];
        const lateCount = hubLateStatus[hub] || 0;
        const onTimePercentage = count > 0 ? (((count - lateCount) / count) * 100) : 0;
        const latePercentage = calculateDifferencePercentage(count, lateCount);

        return {
          rank: index + 1,
          hubName: hub,
          totalDeliveries: count,
          lateDeliveries: lateCount,
          onTimePercentage: parseFloat(onTimePercentage.toFixed(2)),
          latePercentage: parseFloat(latePercentage.toFixed(2)),
          lokasi: hub,
          totalPengiriman: count,
          terlambat: lateCount,
          persentaseTepat: parseFloat(onTimePercentage.toFixed(2)),
          selisihPersentase: parseFloat(latePercentage.toFixed(2)),
          kategori: hub.includes('Satellite') ? 'Hub Satelit' : hub.includes('O2O') ? 'O2O' : 'Hub Utama',
          tingkatKinerja: onTimePercentage >= 99.5 ? 'Perfect' : 
                         onTimePercentage >= 98 ? 'Excellent' : 
                         onTimePercentage >= 97 ? 'Good' : 'Needs Improvement'
        };
      });

      setHubAnalysisData(hubAnalysisResults);
    } catch (error) {
      console.error('Error analyzing hub data:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [memoizedData, isAnalyzing, processHubData, calculateDifferencePercentage]);

  const debouncedAnalyzeHubData = useMemo(
    () => _.debounce(analyzeHubData, 300),
    [analyzeHubData]
  );

  const handleShowChart = useCallback(() => {
    debouncedAnalyzeHubData();
    setShowChart(true);
  }, [debouncedAnalyzeHubData]);

  return {
    hubAnalysisData,
    showChart,
    isAnalyzing,
    handleShowChart,
    analyzeHubData: debouncedAnalyzeHubData
  };
};