import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function DatePicker({ onDateRangeChange, disabled = false, resetTrigger = 0 }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoverDate, setHoverDate] = useState(null);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const previousResetTriggerRef = useRef(resetTrigger);

  useEffect(() => {
    if (resetTrigger > 0 && resetTrigger !== previousResetTriggerRef.current) {
      previousResetTriggerRef.current = resetTrigger;
      
      setStartDate(null);
      setEndDate(null);
      setSelectedFilter('');
      setShowDatePicker(false);
      setCurrentMonth(new Date());
      setHoverDate(null);
      setShowMonthDropdown(false);
      setShowYearDropdown(false);
      
      if (onDateRangeChange) {
        setTimeout(() => {
          onDateRangeChange(null, null);
        }, 0);
      }
    }
  }, [resetTrigger, onDateRangeChange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowDatePicker(false);
        setShowMonthDropdown(false);
        setShowYearDropdown(false);
      }
    };

    const handleScroll = () => {
      if (showDatePicker) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [showDatePicker]);

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 400;

      let top = rect.bottom + window.scrollY + 8;
      const left = rect.left + window.scrollX;

      if (rect.bottom + dropdownHeight > viewportHeight) {
        top = rect.top + window.scrollY - dropdownHeight - 8;
      }

      setDropdownPosition({ top, left });
    }
  };

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const fullMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const quickFilters = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last7days' },
    { label: 'Last 30 Days', value: 'last30days' },
    { label: 'This Month', value: 'thismonth' },
    { label: 'Last Month', value: 'lastmonth' }
  ];

  const getDateRange = (filterValue) => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    switch (filterValue) {
      case 'today':
        return { start: startOfToday, end: startOfToday };
      case 'yesterday':
        const yesterday = new Date(startOfToday);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: yesterday };
      case 'last7days':
        const last7Start = new Date(startOfToday);
        last7Start.setDate(last7Start.getDate() - 6);
        return { start: last7Start, end: startOfToday };
      case 'last30days':
        const last30Start = new Date(startOfToday);
        last30Start.setDate(last30Start.getDate() - 29);
        return { start: last30Start, end: startOfToday };
      case 'thismonth':
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: thisMonthStart, end: startOfToday };
      case 'lastmonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start: lastMonthStart, end: lastMonthEnd };
      default:
        return null;
    }
  };

  const handleQuickFilter = (filterValue) => {
    if (disabled) return;

    const range = getDateRange(filterValue);
    if (range) {
      setStartDate(range.start);
      setEndDate(range.end);
      setSelectedFilter(filterValue);
      setCurrentMonth(new Date(range.start.getFullYear(), range.start.getMonth(), 1));

      if (onDateRangeChange) {
        onDateRangeChange(range.start, range.end);
      }
    }
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  const formatDateDisplay = () => {
    if (disabled) {
      return 'Filter Tanggal';
    }

    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        return startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      }
      const start = startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const end = endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      return `${start} - ${end}`;
    }
    if (startDate) {
      const start = startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      return `${start} - Pilih akhir`;
    }
    return 'Filter Tanggal';
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, 0 - startingDayOfWeek + i + 1);
      days.push({ date: prevMonthDay, isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonthDay = new Date(year, month + 1, day);
      days.push({ date: nextMonthDay, isCurrentMonth: false });
    }

    return days;
  };

  const isDateInRange = (date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isDateSelected = (date) => {
    if (!startDate) return false;
    if (startDate && endDate) {
      return date.toDateString() === startDate.toDateString() || date.toDateString() === endDate.toDateString();
    }
    return date.toDateString() === startDate.toDateString();
  };

  const isDateInHoverRange = (date) => {
    if (!startDate || !hoverDate || endDate) return false;
    const rangeStart = startDate < hoverDate ? startDate : hoverDate;
    const rangeEnd = startDate < hoverDate ? hoverDate : startDate;
    return date >= rangeStart && date <= rangeEnd;
  };

  const handleDateClick = (date) => {
    if (disabled) return;

    setSelectedFilter('');
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (date >= startDate) {
        setEndDate(date);
        if (onDateRangeChange) {
          onDateRangeChange(startDate, date);
        }
      } else {
        setStartDate(date);
        setEndDate(startDate);
        if (onDateRangeChange) {
          onDateRangeChange(date, startDate);
        }
      }
    }
  };

  const navigateMonth = (direction) => {
    if (disabled) return;

    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const selectMonth = (monthIndex) => {
    if (disabled) return;

    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(monthIndex);
      return newMonth;
    });
    setShowMonthDropdown(false);
  };

  const selectYear = (year) => {
    if (disabled) return;

    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setFullYear(year);
      return newMonth;
    });
    setShowYearDropdown(false);
  };

  const clearDates = () => {
    if (disabled) return;

    setStartDate(null);
    setEndDate(null);
    setSelectedFilter('');
    setShowDatePicker(false);
    
    if (onDateRangeChange) {
      setTimeout(() => {
        onDateRangeChange(null, null);
      }, 0);
    }
  };

  const applyDateRange = () => {
    if (disabled) return;

    setShowDatePicker(false);
    if (onDateRangeChange && startDate && endDate) {
      onDateRangeChange(startDate, endDate);
    }
  };

  const days = getDaysInMonth(currentMonth);

  const toggleDatePicker = () => {
    if (disabled) return;

    if (!showDatePicker) {
      updateDropdownPosition();
    }
    setShowDatePicker(!showDatePicker);
  };

  const renderDropdown = () => {
    if (!showDatePicker || disabled) return null;

    return createPortal(
      <div 
        ref={dropdownRef}
        className="bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-80"
        style={{
          position: 'absolute',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          zIndex: 999999,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-1">
            {quickFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleQuickFilter(filter.value)}
                className={`px-2 py-1.5 text-xs rounded-md transition-colors ${
                  selectedFilter === filter.value
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>

            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowMonthDropdown(!showMonthDropdown);
                    setShowYearDropdown(false);
                  }}
                  className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <span className="text-sm font-medium text-gray-800">
                    {fullMonths[currentMonth.getMonth()]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>

                {showMonthDropdown && (
                  <div 
                    className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl w-32 max-h-40 overflow-y-auto"
                    style={{ zIndex: 999999 }}
                  >
                    {fullMonths.map((month, index) => (
                      <button
                        key={month}
                        onClick={() => selectMonth(index)}
                        className={`w-full text-left px-2 py-1.5 text-xs hover:bg-gray-50 transition-colors ${
                          index === currentMonth.getMonth() 
                            ? 'bg-blue-50 text-blue-600 font-medium' 
                            : 'text-gray-700'
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setShowYearDropdown(!showYearDropdown);
                    setShowMonthDropdown(false);
                  }}
                  className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <span className="text-sm font-medium text-gray-800">
                    {currentMonth.getFullYear()}
                  </span>
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>

                {showYearDropdown && (
                  <div 
                    className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl w-16 max-h-40 overflow-y-auto"
                    style={{ zIndex: 999999 }}
                  >
                    {generateYears().map((year) => (
                      <button
                        key={year}
                        onClick={() => selectYear(year)}
                        className={`w-full text-center px-2 py-1.5 text-xs hover:bg-gray-50 transition-colors ${
                          year === currentMonth.getFullYear() 
                            ? 'bg-blue-50 text-blue-600 font-medium' 
                            : 'text-gray-700'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => navigateMonth(1)}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 mb-3 relative">
            {days.map((day, index) => {
              const isSelected = isDateSelected(day.date);
              const isInRange = isDateInRange(day.date);
              const isInHoverRange = isDateInHoverRange(day.date);
              const isToday = day.date.toDateString() === new Date().toDateString();

              return (
                <div key={index} className="relative">
                  <button
                    onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                    onMouseEnter={() => setHoverDate(day.date)}
                    onMouseLeave={() => setHoverDate(null)}
                    disabled={!day.isCurrentMonth}
                    className={`h-7 w-full text-xs transition-all duration-150 flex items-center justify-center relative z-10 ${
                      !day.isCurrentMonth 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-blue-50 cursor-pointer'
                    } ${
                      isSelected 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 rounded-md' 
                        : isInRange 
                        ? 'bg-blue-100'
                        : ''
                    } ${
                      isToday && !isSelected && !isInRange
                        ? 'ring-1 ring-blue-400/30 rounded-md' 
                        : ''
                    }`}
                  >
                    {day.date.getDate()}
                  </button>
                  {(isInHoverRange && !isSelected && !isInRange) && (
                    <div className="absolute inset-0 bg-blue-50"></div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearDates}
              className="flex items-center justify-center gap-1 flex-1 px-3 py-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400/20 transition-all duration-150 text-xs"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
            <button
              onClick={applyDateRange}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-150 text-xs"
            >
              Apply
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={toggleDatePicker}
        disabled={disabled}
        className={`group flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
          disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-white hover:bg-gray-50 text-gray-700'
        }`}
      >
        <Calendar className={`w-4 h-4 transition-colors ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
        <span className={`font-medium min-w-32 text-left ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
          {formatDateDisplay()}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
          disabled ? 'text-gray-300' : showDatePicker ? 'rotate-180 text-gray-400' : 'text-gray-400'
        }`} />
      </button>

      {renderDropdown()}
    </div>
  );
}