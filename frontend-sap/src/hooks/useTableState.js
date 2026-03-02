import { useState, useMemo } from 'react';

export const useTableState = (data, getCourierNameForDisplay, ROWS_PER_PAGE, TABLE_HEAD) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);

  // Memoized sorted data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !data.length) return data;
    
    return [...data].sort((a, b) => {
      let valA, valB;

      if (sortConfig.key === "Courier Name") {
        valA = getCourierNameForDisplay(a).toString().toLowerCase();
        valB = getCourierNameForDisplay(b).toString().toLowerCase();
      } else {
        valA = (a[sortConfig.key] || "").toString().toLowerCase();
        valB = (b[sortConfig.key] || "").toString().toLowerCase();
      }

      return sortConfig.direction === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }, [data, sortConfig, getCourierNameForDisplay]);

  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return sortedData;
    
    const searchLower = searchTerm.toLowerCase();
    return sortedData.filter((row) =>
      TABLE_HEAD.some((key) => {
        let value = "";
        if (key === "Courier Name") {
          value = getCourierNameForDisplay(row);
        } else {
          value = row[key] || "";
        }
        return value.toString().toLowerCase().includes(searchLower);
      })
    );
  }, [sortedData, searchTerm, getCourierNameForDisplay, TABLE_HEAD]);

  // Memoized paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredData.slice(start, start + ROWS_PER_PAGE);
  }, [filteredData, currentPage, ROWS_PER_PAGE]);

  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  };

  return {
    searchTerm,
    setSearchTerm: handleSearch,
    sortConfig,
    currentPage,
    setCurrentPage,
    paginatedData,
    filteredData,
    totalPages,
    handleSort
  };
};