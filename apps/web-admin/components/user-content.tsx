"use client";
import { CheckCircle, Clock, XCircle, Eye, Edit, Trash2, X, Calendar, Download, Search, Filter } from "lucide-react";
import React from "react";
import { useState } from "react";

type User = {
  uuid?: string;
  id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  state?: string;
  street_address?: string;
  postal_code?: string;
  date_of_birth?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
};

const UserContent = () => {
  // State Management
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  // API Configuration
  const API_BASE_URL = 'https://cf-server.plantomart.workers.dev';
  const API_ENDPOINTS = {
    getAllProfiles: `${API_BASE_URL}/user-profile/get-all-profiles`,
    getProfileByUUID: (uuid:string) => `${API_BASE_URL}/user-profile/get/${uuid}`,
  };

  // Import necessary icons for UserContent
  const { 
    User,
    Mail,
    Phone,
    MapPin,
    Loader2,
    RefreshCw,
    AlertCircle
  } = require('lucide-react');

  // Fetch Users Data with enhanced error handling
  const fetchUsers = async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    setError(null);

    try {
      console.log('Fetching users from:', API_ENDPOINTS.getAllProfiles);
      
      const response = await fetch(API_ENDPOINTS.getAllProfiles, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError:any) {
        console.error('JSON parse error:', parseError);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }

      console.log('Parsed data:', data);
      
      // Handle different possible response structures
      let usersArray = [];
      if (Array.isArray(data)) {
        usersArray = data;
      } else if (data && data.profiles && Array.isArray(data.profiles)) {
        usersArray = data.profiles;
      } else if (data && data.users && Array.isArray(data.users)) {
        usersArray = data.users;
      } else if (data && data.data && Array.isArray(data.data)) {
        usersArray = data.data;
      } else if (data && typeof data === 'object') {
        const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (arrayKeys.length > 0) {
          usersArray = data[arrayKeys[0]];
        }
      }

      console.log('Users array:', usersArray);
      console.log('Users count:', usersArray.length);
      
      setUsers(usersArray);
      setFilteredUsers(usersArray);
      
      if (usersArray.length === 0) {
        console.warn('No users found in response');
      }
    } catch (err:any) {
      console.error('Detailed error fetching users:', err);
      setError(`Failed to fetch users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Individual User Details
  const fetchUserDetails = async (uuid:string) => {
    if (!uuid) {
      setError('Invalid user UUID');
      return;
    }

    try {
      console.log('Fetching user details for UUID:', uuid);
      const response = await fetch(API_ENDPOINTS.getProfileByUUID(uuid), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const userData:any = await response.json();
      console.log('User details:', userData);
      setSelectedUser(userData);
      setUserModalOpen(true);
    } catch (err:any) {
      console.error('Error fetching user details:', err);
      setError(`Failed to load user details: ${err.message}`);
    }
  };

  // Filter and Search Logic
  React.useEffect(() => {
    let filtered = [...users];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => {
        return (
          (user.full_name && user.full_name.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower)) ||
          (user.phone && user.phone.toLowerCase().includes(searchLower)) ||
          (user.city && user.city.toLowerCase().includes(searchLower)) ||
          (user.country && user.country.toLowerCase().includes(searchLower)) ||
          (user.uuid && user.uuid.toLowerCase().includes(searchLower))
        );
      });
    }

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.full_name || a.email || '';
          bValue = b.full_name || b.email || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'created':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        default:
          switch (sortBy) {
            case 'full_name':
              aValue = a.full_name || '';
              bValue = b.full_name || '';
              break;
            case 'email':
              aValue = a.email || '';
              bValue = b.email || '';
              break;
            case 'phone':
              aValue = a.phone || '';
              bValue = b.phone || '';
              break;
            case 'city':
              aValue = a.city || '';
              bValue = b.city || '';
              break;
            case 'country':
              aValue = a.country || '';
              bValue = b.country || '';
              break;
            case 'created_at':
              aValue = a.created_at || '';
              bValue = b.created_at || '';
              break;
            case 'status':
              aValue = a.status || '';
              bValue = b.status || '';
              break;
            default:
              aValue = '';
              bValue = '';
          }
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, sortBy, sortOrder]);

  // Load data on component mount
  React.useEffect(() => {
    console.log('UserContent component mounted, fetching users...');
    fetchUsers();
  }, []);

  // Pagination Logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Helper Functions
  type StatusType = 'active' | 'pending' | 'suspended' | 'inactive';

  const getStatusBadge = (status: StatusType | string) => {
    const statusConfig: Record<StatusType, { color: string; icon: any }> = {
      active: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
      suspended: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
      inactive: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: XCircle },
    };

    const config =
      typeof status === 'string' && status in statusConfig
        ? statusConfig[status as StatusType]
        : statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {typeof status === 'string' ? status.charAt(0).toUpperCase() + status.slice(1) : 'Active'}
      </span>
    );
  };

  const ActionButtons = ({ user }:any) => (
    <div className="flex items-center gap-1">
      <button 
        onClick={() => fetchUserDetails(user.uuid)}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors" 
        title="View Details"
      >
        <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>
      <button 
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors" 
        title="Edit User"
      >
        <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>
      <button 
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors" 
        title="Delete User"
      >
        <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
      </button>
    </div>
  );

  // User Detail Modal Component
  const UserDetailModal = ({ user, isOpen, onClose }:any) => {
    if (!isOpen || !user) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Details</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user.full_name || 'No Name Provided'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                <div className="mt-1">
                  {getStatusBadge(user.status || 'active')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Personal Information
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.full_name || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.phone || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Date of Birth</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Address & Location
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {user.street_address && <p>{user.street_address}</p>}
                        {(user.city || user.state || user.country) && (
                          <p>{[user.city, user.state, user.country].filter(Boolean).join(', ')}</p>
                        )}
                        {user.postal_code && <p>{user.postal_code}</p>}
                        {!user.street_address && !user.city && !user.state && !user.country && (
                          <p>Not provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Account Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">User UUID</p>
                  <p className="font-mono text-xs text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 p-2 rounded break-all">
                    {user.uuid}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Created Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Not available'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Not available'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Close
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors">
              Edit User
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
          <button 
            onClick={() => fetchUsers(false)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh Data"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({users.length} total users)
          </span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
            <Download className="h-4 w-4" />
            Export Users
          </button>
        </div>
      </div>
      
      {/* Debug Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Debug Info:</h4>
        <div className="grid grid-cols-2 gap-4 text-blue-800 dark:text-blue-300">
          <div>Loading: {loading ? 'Yes' : 'No'}</div>
          <div>Error: {error ? 'Yes' : 'No'}</div>
          <div>Total Users: {users.length}</div>
          <div>Filtered Users: {filteredUsers.length}</div>
          <div>Current Page Users: {currentUsers.length}</div>
          <div>API URL: {API_ENDPOINTS.getAllProfiles}</div>
        </div>
        {error && (
          <div className="mt-2 text-red-600 dark:text-red-400">Error: {error}</div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <h3 className="text-red-800 dark:text-red-200 font-medium">Error Loading Users</h3>
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
          <button 
            onClick={() => fetchUsers()}
            className="ml-auto px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Search and Filter */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, phone, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="created">Sort by Join Date</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <Filter className="h-4 w-4" />
              {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading users...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">User</th>
                  <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Email</th>
                  <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Phone</th>
                  <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Location</th>
                  <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Joined</th>
                  <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500 dark:text-gray-400">
                      {filteredUsers.length === 0 && users.length === 0 
                        ? 'No users found in database' 
                        : 'No users match your search criteria'
                      }
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => (
                    <tr key={user.uuid || user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-3 px-4 sm:px-6 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {user.full_name || 'No Name'}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {user.uuid?.slice(0, 8) || 'N/A'}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-sm text-gray-600 dark:text-gray-400">
                        {user.email || 'No email'}
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-sm text-gray-600 dark:text-gray-400">
                        {user.phone || 'Not provided'}
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-sm text-gray-600 dark:text-gray-400">
                        {user.city && user.country ? `${user.city}, ${user.country}` : 
                         user.country || user.city || 'Not provided'}
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-sm text-gray-600 dark:text-gray-400">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 sm:px-6">
                        {getStatusBadge(user.status || 'active')}
                      </td>
                      <td className="py-3 px-4 sm:px-6">
                        <ActionButtons user={user} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* User Detail Modal */}
      <UserDetailModal 
        user={selectedUser} 
        isOpen={userModalOpen} 
        onClose={() => {
          setUserModalOpen(false);
          setSelectedUser(null);
        }} 
      />
    </div>
  );
};


export default UserContent;