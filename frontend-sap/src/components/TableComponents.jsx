import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { Search, Edit, Trash2, SortAsc, SortDesc, FileSpreadsheet, Loader2 } from 'lucide-react';

export const PROFIT_TABLE_HEAD = [
  "Select", "Actions", "Client Name", "Order Code", "Courier Name", "Courier Code", "Hub",
  "Base Cost", "Additional Cost 1", "Additional Cost 2",
  "Additional Charge 1", "Additional Charge 2", "Selling Price", "Profit", "Zone", "Delivery Status",
  "Weight", "RoundUp", "Distance", "RoundUp Distance"
];

const CLIENT_COLORS = {
  "Blibli": "text-blue-600",
  "Zalora": "text-purple-600",
  "Sayurbox": "text-green-600"
};

const STATUS_COLORS = {
  "ONTIME": "text-green-600",
  "DELAY": "text-red-600",
  "EARLY": "text-blue-600"
};

const currencyFormatter = new Intl.NumberFormat("id-ID");

export const getClientColor = (client) => CLIENT_COLORS[client] || "text-gray-600";
export const getDeliveryStatusColor = (status) => STATUS_COLORS[status] || "text-gray-600";

export const calculateProfit = (row) => {
  return (row["Selling Price"] || 0) + 
         (row["Add Charge 1"] || 0) + 
         (row["Add Charge 2"] || 0) - 
         (row["Cost"] || 0) - 
         (row["Add Cost 1"] || 0) - 
         (row["Add Cost 2"] || 0);
};

export const formatCurrency = (amount) => `Rp${currencyFormatter.format(amount || 0)}`;

export const SearchInput = memo(({ searchTerm, onSearchChange, disabled }) => {
  const inputRef = useRef(null);
  const [localValue, setLocalValue] = useState(searchTerm || '');

  useEffect(() => {
    setLocalValue(searchTerm || '');
  }, [searchTerm]);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setLocalValue(value);
    onSearchChange(value);
  }, [onSearchChange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setLocalValue('');
      onSearchChange('');
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  }, [onSearchChange]);

  const clearSearch = useCallback(() => {
    setLocalValue('');
    onSearchChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onSearchChange]);

  return (
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      <input
        ref={inputRef}
        type="text"
        placeholder="Cari client name, order code, courier name..."
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        disabled={disabled}
      />
      {localValue && (
        <button
          onClick={clearSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          disabled={disabled}
        >
          ×
        </button>
      )}
      {localValue && localValue.length > 0 && localValue.length < 2 && (
        <div className="absolute top-full left-0 right-0 bg-yellow-50 border border-yellow-200 rounded-b-md px-3 py-2 text-xs text-yellow-700 z-10">
          Ketik minimal 2 karakter untuk pencarian
        </div>
      )}
    </div>
  );
});

export const BulkActionBar = memo(({ selectedItems, onBulkDelete, onSelectAll, onDeselectAll, totalItems }) => {
  if (selectedItems.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-blue-900">
            {selectedItems.length} items selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onSelectAll}
              className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors"
            >
              Select All ({totalItems})
            </button>
            <button
              onClick={onDeselectAll}
              className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBulkDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </button>
        </div>
      </div>
    </div>
  );
});

const ClientCard = memo(({ client, data }) => (
  <div className="bg-white rounded-lg px-3 py-2 border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
    <span className="text-sm font-semibold text-gray-800">
      {client}
    </span>
    <div className="text-sm text-gray-600">
      {data.count} records
    </div>
    <div className="text-sm text-green-600 font-semibold">
      Profit: {formatCurrency(data.totalProfit)}
    </div>
    <div className="text-sm text-blue-600">
      Selling: {formatCurrency(data.totalSellingPrice)}
    </div>
    <div className="text-sm text-red-600">
      Cost: {formatCurrency(data.totalCost)}
    </div>
    <div className="text-sm text-orange-600">
      Charges: {formatCurrency(data.totalAddCharge1 + data.totalAddCharge2)}
    </div>
  </div>
));

export const ClientSummary = memo(({ clientSummary }) => (
  <div className="mt-4 flex flex-wrap gap-4">
    {Object.entries(clientSummary).map(([client, data]) => (
      <ClientCard key={client} client={client} data={data} />
    ))}
  </div>
));

const generateItemId = (row) => {
  const orderCode = row["Order Code"];
  if (!orderCode || orderCode.trim() === '') {
    return null;
  }
  return orderCode.trim();
};

export const ProfitTableContent = memo(({ 
  data, 
  sortConfig, 
  onSort, 
  startIndex, 
  selectedItems, 
  onItemSelect, 
  onEdit, 
  onDelete, 
  onSelectAll, 
  onDeselectAll,
  currentPage,
  itemsPerPage
}) => {
  const [loading, setLoading] = useState(false);

  const handleSort = useCallback((key) => {
    if (onSort && typeof onSort === 'function') {
      onSort(key);
    }
  }, [onSort]);

  const getSortIcon = useCallback((column) => {
    if (sortConfig.key !== column) {
      return <SortAsc className="w-4 h-4 ml-1 text-gray-400" />;
    }

    return sortConfig.direction === 'asc' 
      ? <SortAsc className="w-4 h-4 ml-1 text-blue-500" />
      : <SortDesc className="w-4 h-4 ml-1 text-blue-500" />;
  }, [sortConfig]);

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      let aSort, bSort;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        aSort = aValue || 0;
        bSort = bValue || 0;
      } else {
        aSort = (aValue || '').toString();
        bSort = (bValue || '').toString();
      }

      if (typeof aSort === 'number') {
        return sortConfig.direction === 'asc' ? aSort - bSort : bSort - aSort;
      } else {
        return sortConfig.direction === 'asc' 
          ? aSort.localeCompare(bSort) 
          : bSort.localeCompare(aSort);
      }
    });
  }, [data, sortConfig]);

  const validCurrentIds = useMemo(() => {
    if (!sortedData || sortedData.length === 0) return [];
    return sortedData
      .map(row => generateItemId(row))
      .filter(id => id !== null);
  }, [sortedData]);

  const currentSelected = useMemo(() => {
    return selectedItems.filter(id => validCurrentIds.includes(id));
  }, [selectedItems, validCurrentIds]);

  const isAllSelected = validCurrentIds.length > 0 && currentSelected.length === validCurrentIds.length;
  const isIndeterminate = currentSelected.length > 0 && currentSelected.length < validCurrentIds.length;

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  }, [isAllSelected, onSelectAll, onDeselectAll]);

  const handleItemSelect = useCallback((itemId, row) => {
    if (onItemSelect && typeof onItemSelect === 'function') {
      onItemSelect(itemId, row);
    }
  }, [onItemSelect]);

  const handleEdit = useCallback((row, rowId) => {
    if (onEdit && typeof onEdit === 'function') {
      onEdit(row, rowId);
    }
  }, [onEdit]);

  const handleDelete = useCallback((row, rowId) => {
    if (onDelete && typeof onDelete === 'function') {
      onDelete(row, rowId);
    }
  }, [onDelete]);

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="text-center py-12">
        <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">There are no records to display at this time.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {PROFIT_TABLE_HEAD.map((head) => (
                <th
                  key={head}
                  className={`px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    head !== 'Select' && head !== 'Actions' 
                      ? 'cursor-pointer hover:bg-gray-100 select-none transition-colors min-w-32' 
                      : head === 'Select' ? 'w-16' : 'min-w-32'
                  }`}
                  onClick={head !== 'Select' && head !== 'Actions' ? () => handleSort(head) : undefined}
                >
                  {head === 'Select' ? (
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isIndeterminate;
                        }}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  ) : head === 'Actions' ? (
                    <span className="text-center block">{head}</span>
                  ) : (
                    <div className="flex items-center">
                      <span className="truncate">{head}</span>
                      {getSortIcon(head)}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((row, index) => {
              const rowId = generateItemId(row);
              if (!rowId) return null;

              const actualRowIndex = (currentPage - 1) * itemsPerPage + index;
              const isSelected = selectedItems.includes(rowId);
              const calculatedProfit = calculateProfit(row);
              const clientColor = getClientColor(row["Client Name"]);
              const profitTitle = `Calculation: ${formatCurrency(row["Selling Price"])} + ${formatCurrency(row["Add Charge 1"])} + ${formatCurrency(row["Add Charge 2"])} - ${formatCurrency(row["Cost"])} - ${formatCurrency(row["Add Cost 1"])} - ${formatCurrency(row["Add Cost 2"])}`;

              return (
                <tr 
                  key={rowId} 
                  className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <td className="w-16 px-4 py-4 text-sm text-gray-900 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleItemSelect(rowId, row)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-900 text-center min-w-32">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(row, rowId)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit Record"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(row, rowId)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm min-w-32">
                    <div className={`max-w-xs truncate font-semibold ${clientColor}`} title={row["Client Name"] || ''}>
                      {row["Client Name"] || "-"}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600 min-w-32">
                    <div className="max-w-xs truncate font-semibold" title={row["Order Code"] || ''}>
                      {row["Order Code"] || "-"}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600 min-w-32">
                    <div className="max-w-xs truncate" title={row["Courier Name"] || ''}>
                      {row["Courier Name"] || "-"}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600 min-w-32">
                    <div className="max-w-xs truncate" title={row["Courier Code"] || ''}>
                      {row["Courier Code"] || "-"}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600 text-center min-w-32">
                    <div className="truncate" title={row["HUB"] || ''}>
                      {row["HUB"] || "-"}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm font-semibold text-red-600 min-w-32">
                    {formatCurrency(row["Cost"])}
                  </td>

                  <td className="px-4 py-4 text-sm text-red-500 min-w-32">
                    {formatCurrency(row["Add Cost 1"])}
                  </td>

                  <td className="px-4 py-4 text-sm text-red-400 min-w-32">
                    {formatCurrency(row["Add Cost 2"])}
                  </td>

                  <td className="px-4 py-4 text-sm font-semibold text-orange-600 min-w-32">
                    {formatCurrency(row["Add Charge 1"])}
                  </td>

                  <td className="px-4 py-4 text-sm font-semibold text-purple-600 min-w-32">
                    {formatCurrency(row["Add Charge 2"])}
                  </td>

                  <td className="px-4 py-4 text-sm font-semibold text-blue-600 min-w-32">
                    {formatCurrency(row["Selling Price"])}
                  </td>

                  <td className="px-4 py-4 text-sm min-w-32">
                    <div 
                      className={`font-bold ${calculatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      title={profitTitle}
                    >
                      {formatCurrency(calculatedProfit)}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600 text-center min-w-32">
                    <div className="truncate" title={row["Zona"] || ''}>
                      {row["Zona"] || "-"}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-center min-w-32">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      row["Delivery Status"] === "ONTIME" ? "bg-green-100 text-green-800" :
                      row["Delivery Status"] === "DELAY" ? "bg-red-100 text-red-800" :
                      row["Delivery Status"] === "EARLY" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {row["Delivery Status"] || "-"}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600 text-center min-w-32">
                    <div className="truncate" title={row["Weight"] || ''}>
                      {row["Weight"] || "-"}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600 text-center min-w-32">
                    <div className="truncate" title={row["RoundUp"] || ''}>
                      {row["RoundUp"] || "-"}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600 text-center min-w-32">
                    <div className="truncate" title={row["Distance"] || ''}>
                      {row["Distance"] || "-"}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600 min-w-32">
                    <div className="max-w-xs truncate" title={row["RoundUp Distance"] || ''}>
                      {row["RoundUp Distance"] || "-"}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
});

export const EmptyState = memo(({ message = "No data found matching your search criteria" }) => (
  <div className="flex justify-center items-center py-10 bg-white rounded-lg border border-gray-300">
    <span className="text-sm text-gray-600">
      {message}
    </span>
  </div>
));

SearchInput.displayName = 'SearchInput';
BulkActionBar.displayName = 'BulkActionBar';
ClientCard.displayName = 'ClientCard';
ClientSummary.displayName = 'ClientSummary';
ProfitTableContent.displayName = 'ProfitTableContent';
EmptyState.displayName = 'EmptyState';