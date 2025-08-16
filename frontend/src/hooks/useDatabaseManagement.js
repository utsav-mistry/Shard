import { useState } from 'react';
import api from '../utils/axiosConfig';

export const useDatabaseManagement = () => {
  const [tables, setTables] = useState([
    { name: 'users', count: 0 },
    { name: 'projects', count: 0 },
    { name: 'deployments', count: 0 },
    { name: 'logs', count: 0 },
  ]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [isLoadingTable, setIsLoadingTable] = useState(false);

  const handleTableSelect = async (table) => {
    // Accept either a table object { name } or a string table name
    const tableName = typeof table === 'string' ? table : table?.name;
    setSelectedTable(tableName);
    setIsLoadingTable(true);
    try {
      const response = await api.get(`/admin/db/${tableName}`);
      setTableData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching table data:', error);
    } finally {
      setIsLoadingTable(false);
    }
  };

  const handleAddRecord = async (tableName, recordData) => {
    try {
      const response = await api.post(`/admin/db/${tableName}`, recordData);
      if (selectedTable === tableName) {
        await handleTableSelect(selectedTable);
      }
      return response.data;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  };

  const handleEditRecord = async (tableName, id, recordData) => {
    try {
      const response = await api.put(`/admin/db/${tableName}/${id}`, recordData);
      if (selectedTable === tableName) {
        await handleTableSelect(selectedTable);
      }
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  };

  const handleDeleteRecord = async (tableName, id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await api.delete(`/admin/db/${tableName}/${id}`);
        // When selectedTable is the string name, compare directly
        if (selectedTable === tableName) {
          await handleTableSelect(selectedTable);
        }
      } catch (error) {
        console.error('Error deleting record:', error);
        throw error;
      }
    }
  };

  const fetchTables = async () => {
    try {
      const response = await api.get('/admin/db/tables');
      setTables(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  return {
    tables,
    selectedTable,
    tableData,
    isLoadingTable,
    handleTableSelect,
    handleAddRecord,
    handleEditRecord,
    handleDeleteRecord,
    fetchTables,
  };
};
