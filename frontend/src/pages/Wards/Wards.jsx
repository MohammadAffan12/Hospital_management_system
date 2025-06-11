import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wardsApi } from '../../services/api';
import { SearchIcon } from '../../icons';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Wards = () => {
  const [wards, setWards] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('ward_name');
  const [sortOrder, setSortOrder] = useState('ASC');

  const fetchWards = async (page = 1, search = searchQuery, sort = sortBy, order = sortOrder) => {
    try {
      setLoading(true);
      const response = await wardsApi.getAll({
        page,
        limit: pagination.limit,
        search,
        sortBy: sort,
        sortOrder: order
      });
      
      if (response.success) {
        setWards(response.data.wards);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.error || 'Failed to fetch wards');
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching wards:', err);
      setError('Failed to load wards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWards();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchWards(1, searchQuery);
  };

  const handleSort = (field) => {
    const newSortOrder = field === sortBy && sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setSortBy(field);
    setSortOrder(newSortOrder);
    fetchWards(1, searchQuery, field, newSortOrder);
  };

  const handlePageChange = (page) => {
    fetchWards(page);
  };

  const getOccupancyClass = (rate) => {
    if (rate < 50) return 'text-green-600';
    if (rate < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOccupancyBarClass = (rate) => {
    if (rate < 50) return 'bg-green-500';
    if (rate < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="sm:flex sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Hospital Wards</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage hospital wards and their occupancy
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Search bar */}
        <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
          <form onSubmit={handleSearch} className="sm:flex sm:items-center">
            <div className="w-full sm:max-w-xs">
              <label htmlFor="search" className="sr-only">Search wards</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search by name or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Search
            </button>
          </form>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Summary Cards */}
        {!loading && wards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Wards</h3>
              <p className="text-2xl font-semibold text-gray-900">{wards.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Capacity</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {wards.reduce((sum, ward) => sum + ward.capacity, 0)} beds
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Current Occupancy</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {wards.reduce((sum, ward) => sum + ward.current_occupancy, 0)} patients
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Available Beds</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {wards.reduce((sum, ward) => sum + ward.available_beds, 0)} available
              </p>
            </div>
          </div>
        )}

        {/* Wards Overview */}
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('ward_name')}
                  >
                    Ward Name
                    {sortBy === 'ward_name' && (
                      <span className="ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('ward_type')}
                  >
                    Type
                    {sortBy === 'ward_type' && (
                      <span className="ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Capacity
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('occupancy_rate')}
                  >
                    Occupancy
                    {sortBy === 'occupancy_rate' && (
                      <span className="ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Available Beds
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wards.length > 0 ? (
                  wards.map((ward) => (
                    <tr key={ward.ward_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ward.ward_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{ward.ward_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{ward.capacity} beds</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getOccupancyClass(ward.occupancy_rate)}`}>
                          {ward.occupancy_rate}% ({ward.current_occupancy}/{ward.capacity})
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                          <div 
                            className={`h-2.5 rounded-full ${getOccupancyBarClass(ward.occupancy_rate)}`} 
                            style={{width: `${ward.occupancy_rate}%`}}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{ward.available_beds} available</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/wards/${ward.ward_id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No wards found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && wards.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};

export default Wards;
