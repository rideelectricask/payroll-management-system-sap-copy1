import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Card, CardBody } from "@material-tailwind/react";
import { useCourierPerformance } from '../hooks/useCourierPerformance';
import {
  sortCourierData,
  calculateCourierTotals,
  validateCourierData,
  formatDurationToHMS,
  calculateCourierTotalDistances
} from '../utils/courierPerformance/courierPerformanceUtils';
import { getTopPerformerRanks, generatePerformanceReport } from '../utils/courierPerformance/topPerformerUtils';
import {
  CourierTableHeader,
  CourierTableContent,
  CourierTableFooter,
  CourierEmptyState,
  CourierSearchBar
} from '../components/CourierPerformanceComponents';

const CourierPerformanceTable = ({ 
  courierData, 
  deliveryCountsByDate, 
  roundUpData, 
  distanceData, 
  deliveryTimeData, 
  courierFinancialData = {}, 
  courierTotalDistances = {}, 
  onBack, 
  onDataUpdate 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const processedDataRef = useRef(null);
  const totalsRef = useRef(null);
  const filterCacheRef = useRef(new Map());

  const {
    filteredData,
    paginationData,
    openModal,
    handlePageChange,
    handleItemsPerPageChange,
    handleModalToggle,
    handleModalClose
  } = useCourierPerformance(courierData);

  const uniqueDates = useMemo(() => {
    if (!courierData || !Array.isArray(courierData)) return [];

    const datesSet = new Set();
    courierData.forEach(courier => {
      if (courier.deliveriesByDate) {
        Object.keys(courier.deliveriesByDate).forEach(date => {
          datesSet.add(date);
        });
      }
    });
    return Array.from(datesSet).sort((a, b) => {
      const parseDate = (dateStr) => {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          return new Date(year, month - 1, day);
        }
        return new Date(dateStr);
      };
      const dateA = parseDate(a);
      const dateB = parseDate(b);
      return dateA.getTime() - dateB.getTime();
    });
  }, [courierData]);

  const courierDistanceTotals = useMemo(() => {
    return calculateCourierTotalDistances(courierData);
  }, [courierData]);

  const performanceReport = useMemo(() => {
    return generatePerformanceReport(courierData, courierFinancialData);
  }, [courierData, courierFinancialData]);

  const topPerformerRanks = useMemo(() => {
    return getTopPerformerRanks(courierData, courierFinancialData);
  }, [courierData, courierFinancialData]);

  const processedData = useMemo(() => {
    if (!validateCourierData(filteredData)) {
      return { sortedData: [], searchIndex: null, dataLength: 0 };
    }

    const dataLength = filteredData.length;
    if (processedDataRef.current?.dataLength === dataLength) {
      return processedDataRef.current;
    }

    const sortedData = sortCourierData(filteredData, sortConfig, uniqueDates);

    const result = { 
      sortedData, 
      searchIndex: null,
      dataLength
    };

    processedDataRef.current = result;
    return result;
  }, [filteredData, sortConfig, uniqueDates]);

  const calculateTotalsAsync = useCallback(async (data) => {
    if (!data || data.length === 0) return null;

    const cacheKey = `totals_${data.length}`;
    if (totalsRef.current && totalsRef.current.cacheKey === cacheKey) {
      return totalsRef.current.data;
    }

    setIsProcessing(true);

    try {
      const result = calculateCourierTotals(data, uniqueDates);
      totalsRef.current = { data: result, cacheKey };
      return result;
    } catch (error) {
      console.warn('Totals calculation failed:', error);
      const result = calculateCourierTotals(data, uniqueDates);
      totalsRef.current = { data: result, cacheKey };
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [uniqueDates]);

  const [totals, setTotals] = useState(null);

  useEffect(() => {
    if (processedData.sortedData.length > 0) {
      calculateTotalsAsync(processedData.sortedData).then(setTotals);
    }
  }, [processedData.sortedData, calculateTotalsAsync]);

  const filteredAndSortedData = useMemo(() => {
    if (!processedData.sortedData.length) return [];

    let filtered = processedData.sortedData;

    if (searchTerm.trim()) {
      const cacheKey = `${searchTerm}_${processedData.dataLength}`;
      if (filterCacheRef.current.has(cacheKey)) {
        filtered = filterCacheRef.current.get(cacheKey);
      } else {
        setIsSearching(true);
        filtered = processedData.sortedData.filter(courier => {
          const searchLower = searchTerm.toLowerCase();
          return (
            (courier.hub && courier.hub.toLowerCase().includes(searchLower)) ||
            (courier.courierName && courier.courierName.toLowerCase().includes(searchLower)) ||
            (courier.courierCode && courier.courierCode.toLowerCase().includes(searchLower))
          );
        });
        filterCacheRef.current.set(cacheKey, filtered);
        setIsSearching(false);
      }
    }

    return filtered;
  }, [processedData.sortedData, processedData.dataLength, searchTerm]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig(prevSort => ({
      key,
      direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleExportExcel = useCallback(() => {
    console.log('Export to Excel functionality');
  }, []);

  const handlePrintReport = useCallback(() => {
    console.log('Print report functionality');
  }, []);

  useEffect(() => {
    return () => {
      filterCacheRef.current.clear();
    };
  }, []);

  if (!validateCourierData(courierData)) {
    return <CourierEmptyState />;
  }

  const { currentData, startIndex, totalItems, totalPages } = paginationData;

  return (
    <Card className="border-t !border-gray-300 p-4">
      <CourierTableHeader onBack={onBack} />

      <CardBody className="px-0">
        <CourierSearchBar
          searchTerm={searchTerm}
          onSearch={handleSearch}
          isSearching={isSearching || isProcessing}
          totalCount={processedData.sortedData.length}
          filteredCount={filteredAndSortedData.length}
        />

        <CourierTableContent
          data={currentData || filteredAndSortedData.slice(0, 100)}
          sortConfig={sortConfig}
          onSort={handleSort}
          uniqueDates={uniqueDates}
          roundUpData={roundUpData}
          distanceData={distanceData}
          deliveryTimeData={deliveryTimeData}
          courierFinancialData={courierFinancialData}
          courierTotalDistances={courierTotalDistances}
          courierDistanceTotals={courierDistanceTotals}
          topPerformerRanks={topPerformerRanks}
          performanceReport={performanceReport}
          openModal={openModal}
          onModalToggle={handleModalToggle}
          onModalClose={handleModalClose}
          totals={totals}
          totalCount={processedData.sortedData.length}
          filteredCount={filteredAndSortedData.length}
        />
      </CardBody>

      {totals && (
        <CourierTableFooter 
          data={filteredAndSortedData}
          totals={totals}
          originalCount={processedData.sortedData.length}
          filteredCount={filteredAndSortedData.length}
          paginationData={paginationData}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          totalPages={totalPages}
          courierDistanceTotals={courierDistanceTotals}
          onExportExcel={handleExportExcel}
          onPrintReport={handlePrintReport}
        />
      )}
    </Card>
  );
};

export default React.memo(CourierPerformanceTable, (prevProps, nextProps) => {
  return (
    prevProps.courierData === nextProps.courierData &&
    prevProps.deliveryCountsByDate === nextProps.deliveryCountsByDate &&
    prevProps.roundUpData === nextProps.roundUpData &&
    prevProps.distanceData === nextProps.distanceData &&
    prevProps.deliveryTimeData === nextProps.deliveryTimeData &&
    prevProps.courierFinancialData === nextProps.courierFinancialData &&
    prevProps.courierTotalDistances === nextProps.courierTotalDistances &&
    prevProps.onBack === nextProps.onBack &&
    prevProps.onDataUpdate === nextProps.onDataUpdate
  );
});