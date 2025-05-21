'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiSearch, FiFilter, FiDownload } from 'react-icons/fi';
import Link from 'next/link';
import * as XLSX from 'xlsx';

import { getAllSpins } from '@/lib/api';
import Pagination from '@/components/Pagination';

interface Spin {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    codeShop?: string;
  };
  prize: {
    _id: string;
    name: string;
    description?: string;
    originalQuantity?: number;
    remainingQuantity?: number;
  } | null;
  isWin: boolean;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function SpinsPage() {
  const [spins, setSpins] = useState<Spin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  useEffect(() => {
    fetchSpins();
  }, [dateRange]);
  
  const fetchSpins = async (page = 1) => {
    try {
      setIsLoading(true);
      const params = {
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate }),
        page,
        limit: 10
      };
      
      const response = await getAllSpins(params);
      
      if (response.data.success) {
        setSpins(response.data.data);
        
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (error) {
      toast.error('Lỗi khi tải lịch sử quay');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value,
    });
  };
  
  const resetDateRange = () => {
    setDateRange({
      startDate: '',
      endDate: '',
    });
  };
  
  const handlePageChange = (page: number) => {
    fetchSpins(page);
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    // Cập nhật limit trong state pagination
    setPagination(prev => ({
      ...prev,
      limit: newLimit
    }));
    // Gọi API để fetch lại dữ liệu với limit mới, bắt đầu từ trang 1
    fetchSpins(1);
  };
  
  const handleExport = () => {
    try {
      setIsExporting(true);
      
      // Chuyển đổi dữ liệu cho Excel
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(spins.map((spin) => ({
        'ID': spin._id,
        'Người dùng': spin.user.name,
        'Email': spin.user.email,
        'Số điện thoại': spin.user.phone,
        'Địa chỉ': spin.user.address || 'Chưa cung cấp',
        'Mã cửa hàng': spin.user.codeShop || 'Không có',
        'Phần thưởng': spin.prize ? spin.prize.name : 'Không trúng',
        'Kết quả': spin.isWin ? 'Trúng thưởng' : 'Không trúng',
        'Thời gian': new Date(spin.createdAt).toLocaleString('vi-VN')
      })));
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch sử quay');
      XLSX.writeFile(workbook, 'lich-su-quay.xlsx');
      
      toast.success('Xuất dữ liệu thành công');
    } catch (error) {
      toast.error('Lỗi khi xuất dữ liệu');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Lượt quay</h1>
        <button
          onClick={handleExport}
          disabled={isExporting || spins.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50"
        >
          <FiDownload className="mr-2" /> Xuất Excel
        </button>
      </div>
      
      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateRangeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateRangeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={resetDateRange}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              Đặt lại
            </button>
          </div>
        </div>
      </div>
      
      {/* Lịch sử quay */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {spins.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thời gian
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Người dùng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số điện thoại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Địa chỉ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã cửa hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phần thưởng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kết quả
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {spins.map((spin) => (
                      <tr key={spin._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(spin.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold">
                                {spin.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {spin.user.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {spin.user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {spin.user.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {spin.user.address ? (
                            spin.user.address.length > 30 ? `${spin.user.address.substring(0, 30)}...` : spin.user.address
                          ) : 'Chưa cung cấp'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {spin.user.codeShop || 'Không có'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {spin.prize ? spin.prize.name : 'Không có'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            spin.isWin 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {spin.isWin ? 'Trúng thưởng' : 'Không trúng'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {pagination.totalPages > 1 && (
                <div className="py-2">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    totalItems={pagination.totalItems}
                    itemsPerPage={pagination.limit}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-gray-500">
              Không có lượt quay nào trong khoảng thời gian đã chọn
            </div>
          )}
        </div>
      )}
    </div>
  );
} 