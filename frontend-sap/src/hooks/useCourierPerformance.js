import { useState, useMemo, useCallback } from 'react';
import _ from 'lodash';

export const useCourierPerformance = (courierData) => {
const [searchTerm, setSearchTerm] = useState('');
const [sortConfig, setSortConfig] = useState({ key: 7, direction: 'desc' });
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(25);
const [openModal, setOpenModal] = useState(null);

const filteredData = useMemo(() => {
if (!Array.isArray(courierData)) return [];

if (!searchTerm.trim()) return courierData;

const lowercaseSearch = searchTerm.toLowerCase();
return courierData.filter(item => 
(item.courierCode?.toLowerCase().includes(lowercaseSearch)) ||
(item.courierName?.toLowerCase().includes(lowercaseSearch)) ||
(item.hub?.toLowerCase().includes(lowercaseSearch))
);
}, [courierData, searchTerm]);

const paginationData = useMemo(() => {
const totalItems = filteredData.length;
const totalPages = Math.ceil(totalItems / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const currentData = filteredData.slice(startIndex, endIndex);

return {
currentData,
startIndex,
totalItems,
totalPages,
currentPage,
itemsPerPage
};
}, [filteredData, currentPage, itemsPerPage]);

const handleSearchChange = useCallback((value) => {
setSearchTerm(value);
setCurrentPage(1);
if (openModal) {
setOpenModal(null);
}
}, [openModal]);

const handleSort = useCallback((columnIndex) => {
setSortConfig(prev => ({
key: columnIndex,
direction: prev.key === columnIndex && prev.direction === 'desc' ? 'asc' : 'desc'
}));
if (openModal) {
setOpenModal(null);
}
}, [openModal]);

const handlePageChange = useCallback((page) => {
setCurrentPage(page);
if (openModal) {
setOpenModal(null);
}
}, [openModal]);

const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
setItemsPerPage(newItemsPerPage);
setCurrentPage(1);
if (openModal) {
setOpenModal(null);
}
}, [openModal]);

const handleModalToggle = useCallback((courierCode) => {
setOpenModal(prev => {
const newModal = prev === courierCode ? null : courierCode;
return newModal;
});
}, []);

const handleModalClose = useCallback(() => {
setOpenModal(null);
}, []);

return {
searchTerm,
sortConfig,
filteredData,
paginationData,
openModal,
handleSearchChange,
handleSort,
handlePageChange,
handleItemsPerPageChange,
handleModalToggle,
handleModalClose
};
};