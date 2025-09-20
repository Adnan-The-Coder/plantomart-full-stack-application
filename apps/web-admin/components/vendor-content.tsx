"use client";
import { CheckCircle, Clock, XCircle, Eye, Edit, Trash2, X, Calendar, Download, Search, Filter, Building, MapPin, Phone, Mail, User, CreditCard, FileText, Star, ShieldCheck, AlertTriangle } from "lucide-react";
import React from "react";
import { useState } from "react";

type Vendor = {
  id?: number;
  user_uuid?: string;
  vendor_id?: string;
  slug?: string;
  name?: string;
  description?: string;
  banner_image?: string;
  logo?: string;
  image_gallery?: string;
  rating?: number;
  about_us?: string;
  features?: string;
  business_name?: string;
  business_address?: string;
  business_registration_number?: string;
  gstin_number?: string;
  legal_structure?: string;
  pan_number?: string;
  contact_person_name?: string;
  contact_email?: string;
  contact_phone?: string;
  bank_account_number?: string;
  bank_name?: string;
  ifsc_code?: string;
  shipping_fee_mode?: string;
  gst_rate?: number;
  return_policy?: string;
  shipping_policy?: string;
  privacy_policy?: string;
  seller_terms?: string;
  business_license?: string;
  identity_verification?: string;
  is_verified?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

const VendorContent = () => {
  // State Management
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [vendorsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');

  // API Configuration
  const API_BASE_URL = 'https://cf-server.plantomart.workers.dev';
  const API_ENDPOINTS = {
    getAllVendorsAdmin: `${API_BASE_URL}/vendor/get-all-vendors-admin`,
    getVendorByUserUUID: (uuid: string) => `${API_BASE_URL}/vendor/get-admin/${uuid}`,
    updateVendorById: (vendor_id: string) => `${API_BASE_URL}/vendor/update/${vendor_id}`,
    deleteVendorById: (vendor_id: string) => `${API_BASE_URL}/vendor/delete/${vendor_id}`,
  };

  // Import necessary icons
  const { 
    Loader2,
    RefreshCw,
    AlertCircle
  } = require('lucide-react');

  // Fetch Vendors Data with enhanced error handling
  const fetchVendors = async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    setError(null);

    try {
      console.log('Fetching vendors from:', API_ENDPOINTS.getAllVendorsAdmin);
      
      const response = await fetch(API_ENDPOINTS.getAllVendorsAdmin, {
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
      } catch (parseError: any) {
        console.error('JSON parse error:', parseError);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }

      console.log('Parsed data:', data);
      
      // Handle different possible response structures
      let vendorsArray = [];
      if (Array.isArray(data)) {
        vendorsArray = data;
      } else if (data && data.data && Array.isArray(data.data)) {
        vendorsArray = data.data;
      } else if (data && data.vendors && Array.isArray(data.vendors)) {
        vendorsArray = data.vendors;
      } else if (data && typeof data === 'object') {
        const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (arrayKeys.length > 0) {
          vendorsArray = data[arrayKeys[0]];
        }
      }

      console.log('Vendors array:', vendorsArray);
      console.log('Vendors count:', vendorsArray.length);
      
      setVendors(vendorsArray);
      setFilteredVendors(vendorsArray);
      
      if (vendorsArray.length === 0) {
        console.warn('No vendors found in response');
      }
    } catch (err: any) {
      console.error('Detailed error fetching vendors:', err);
      setError(`Failed to fetch vendors: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Individual Vendor Details
  const fetchVendorDetails = async (userUuid: string) => {
    if (!userUuid) {
      setError('Invalid vendor UUID');
      return;
    }

    try {
      console.log('Fetching vendor details for UUID:', userUuid);
      const response = await fetch(API_ENDPOINTS.getVendorByUserUUID(userUuid), {
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
      
      const vendorData: any = await response.json();
      console.log('Vendor details:', vendorData);
      
      // Handle response structure
      const vendor = vendorData.data || vendorData;
      setSelectedVendor(vendor);
      setVendorModalOpen(true);
    } catch (err: any) {
      console.error('Error fetching vendor details:', err);
      setError(`Failed to load vendor details: ${err.message}`);
    }
  };

  // Filter and Search Logic
  React.useEffect(() => {
    let filtered = [...vendors];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vendor => vendor.status === statusFilter);
    }

    // Verification filter
    if (verificationFilter !== 'all') {
      const isVerified = verificationFilter === 'verified';
      filtered = filtered.filter(vendor => (vendor.is_verified === 1) === isVerified);
    }

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(vendor => {
        return (
          (vendor.name && vendor.name.toLowerCase().includes(searchLower)) ||
          (vendor.business_name && vendor.business_name.toLowerCase().includes(searchLower)) ||
          (vendor.contact_email && vendor.contact_email.toLowerCase().includes(searchLower)) ||
          (vendor.vendor_id && vendor.vendor_id.toLowerCase().includes(searchLower)) ||
          (vendor.contact_person_name && vendor.contact_person_name.toLowerCase().includes(searchLower)) ||
          (vendor.business_address && vendor.business_address.toLowerCase().includes(searchLower))
        );
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name || a.business_name || '';
          bValue = b.name || b.business_name || '';
          break;
        case 'business_name':
          aValue = a.business_name || '';
          bValue = b.business_name || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'created':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'verification':
          aValue = a.is_verified || 0;
          bValue = b.is_verified || 0;
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredVendors(filtered);
    setCurrentPage(1);
  }, [vendors, searchTerm, sortBy, sortOrder, statusFilter, verificationFilter]);

  // Load data on component mount
  React.useEffect(() => {
    console.log('VendorContent component mounted, fetching vendors...');
    fetchVendors();
  }, []);

  // Pagination Logic
  const indexOfLastVendor = currentPage * vendorsPerPage;
  const indexOfFirstVendor = indexOfLastVendor - vendorsPerPage;
  const currentVendors = filteredVendors.slice(indexOfFirstVendor, indexOfLastVendor);
  const totalPages = Math.ceil(filteredVendors.length / vendorsPerPage);

  // Helper Functions
  type StatusType = 'active' | 'pending' | 'suspended' | 'inactive' | 'approved' | 'rejected';

  const getStatusBadge = (status: StatusType | string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      active: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
      approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
      suspended: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
      inactive: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: XCircle },
    };

    const config =
      typeof status === 'string' && status in statusConfig
        ? statusConfig[status]
        : statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {typeof status === 'string' ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending'}
      </span>
    );
  };

  const getVerificationBadge = (isVerified: number) => {
    if (isVerified === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <ShieldCheck className="h-3 w-3" />
          Verified
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
          <AlertTriangle className="h-3 w-3" />
          Unverified
        </span>
      );
    }
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const ActionButtons = ({ vendor }: any) => (
    <div className="flex items-center gap-1">
      <button 
        onClick={() => fetchVendorDetails(vendor.user_uuid)}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors" 
        title="View Details"
      >
        <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>
      <button 
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors" 
        title="Edit Vendor"
      >
        <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>
      <button 
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors" 
        title="Delete Vendor"
      >
        <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
      </button>
    </div>
  );

  // Vendor Detail Modal Component
  const VendorDetailModal = ({ vendor, isOpen, onClose }: any) => {
    if (!isOpen || !vendor) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vendor Details</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Vendor Header */}
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {vendor.name?.charAt(0) || vendor.business_name?.charAt(0) || 'V'}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {vendor.name || vendor.business_name || 'Vendor Name'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{vendor.vendor_id}</p>
                <div className="flex flex-wrap items-center gap-3">
                  {getStatusBadge(vendor.status || 'pending')}
                  {getVerificationBadge(vendor.is_verified || 0)}
                  {vendor.rating !== undefined && getRatingStars(vendor.rating)}
                </div>
              </div>
            </div>

            {/* Vendor Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Business Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Business Information
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Building className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Business Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {vendor.business_name || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Business Address</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {vendor.business_address || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Legal Structure</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {vendor.legal_structure || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">PAN Number</p>
                      <p className="font-medium text-gray-900 dark:text-white font-mono">
                        {vendor.pan_number || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">GSTIN Number</p>
                      <p className="font-medium text-gray-900 dark:text-white font-mono">
                        {vendor.gstin_number || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Contact Information
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Contact Person</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {vendor.contact_person_name || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {vendor.contact_email || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {vendor.contact_phone || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Banking Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bank Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {vendor.bank_name || 'Not provided'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Account Number</p>
                  <p className="font-medium text-gray-900 dark:text-white font-mono">
                    {vendor.bank_account_number || 'Not provided'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">IFSC Code</p>
                  <p className="font-medium text-gray-900 dark:text-white font-mono">
                    {vendor.ifsc_code || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Business Settings */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Business Settings
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Shipping Fee Mode</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {vendor.shipping_fee_mode || 'Not set'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">GST Rate</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {vendor.gst_rate !== undefined ? `${vendor.gst_rate}%` : 'Not set'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Registration Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'Not available'}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Account Details
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">User UUID</p>
                  <p className="font-mono text-xs text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 p-2 rounded break-all">
                    {vendor.user_uuid}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vendor Slug</p>
                  <p className="font-mono text-xs text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    {vendor.slug}
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
            <button className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors">
              Edit Vendor
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Pagination Component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing {indexOfFirstVendor + 1} to {Math.min(indexOfLastVendor, filteredVendors.length)} of {filteredVendors.length} vendors
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {[...Array(Math.min(5, totalPages))].map((_, index) => {
            const pageNum = currentPage <= 3 ? index + 1 : currentPage - 2 + index;
            if (pageNum > totalPages) return null;
            
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  currentPage === pageNum
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Vendor Management</h2>
          <button 
            onClick={() => fetchVendors(false)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh Data"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({vendors.length} total vendors)
          </span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
            <Download className="h-4 w-4" />
            Export Vendors
          </button>
        </div>
      </div>
      
      {/* Debug Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Debug Info:</h4>
        <div className="grid grid-cols-2 gap-4 text-blue-800 dark:text-blue-300">
          <div>Loading: {loading ? 'Yes' : 'No'}</div>
          <div>Error: {error ? 'Yes' : 'No'}</div>
          <div>Total Vendors: {vendors.length}</div>
          <div>Filtered Vendors: {filteredVendors.length}</div>
          <div>Current Page Vendors: {currentVendors.length}</div>
          <div>API URL: {API_ENDPOINTS.getAllVendorsAdmin}</div>
        </div>
        {error && (
          <div className="mt-2 text-red-600 dark:text-red-400">Error: {error}</div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <h3 className="text-red-800 dark:text-red-200 font-medium">Error Loading Vendors</h3>
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
          <button 
            onClick={() => fetchVendors()}
            className="ml-auto px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Search and Filter */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendors by name, business, email, or vendor ID..."
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
                <option value="business_name">Sort by Business Name</option>
                <option value="created">Sort by Join Date</option>
                <option value="status">Sort by Status</option>
                <option value="rating">Sort by Rating</option>
                <option value="verification">Sort by Verification</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                <Filter className="h-4 w-4" />
                {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
              </button>
            </div>
            
            {/* Additional Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="approved">Approved</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
                <option value="inactive">Inactive</option>
              </select>
              
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="all">All Verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading vendors...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Vendor</th>
                  <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Business</th>
                  <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Contact</th>
                  <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Rating</th>
                  <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Verified</th>
                  <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Joined</th>
                  <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentVendors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500 dark:text-gray-400">
                      {filteredVendors.length === 0 && vendors.length === 0 
                        ? 'No vendors found in database' 
                        : 'No vendors match your search criteria'
                      }
                    </td>
                  </tr>
                ) : (
                  currentVendors.map((vendor) => (
                    <tr key={vendor.id || vendor.vendor_id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-3 px-4 sm:px-6 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {vendor.name?.charAt(0) || vendor.business_name?.charAt(0) || 'V'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {vendor.name || vendor.business_name || 'Unnamed Vendor'}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {vendor.vendor_id || 'No ID'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-sm">
                        <div>
                          <span className="text-gray-900 dark:text-white">
                            {vendor.business_name || 'Not provided'}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {vendor.legal_structure || 'Unknown structure'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-sm">
                        <div>
                          <span className="text-gray-900 dark:text-white">
                            {vendor.contact_person_name || 'Not provided'}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {vendor.contact_email || 'No email'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {vendor.contact_phone || 'No phone'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-sm">
                        {vendor.rating !== undefined ? (
                          getRatingStars(vendor.rating)
                        ) : (
                          <span className="text-gray-400 text-xs">No rating</span>
                        )}
                      </td>
                      <td className="py-3 px-4 sm:px-6">
                        {getStatusBadge(vendor.status || 'pending')}
                      </td>
                      <td className="py-3 px-4 sm:px-6">
                        {getVerificationBadge(vendor.is_verified || 0)}
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-sm text-gray-600 dark:text-gray-400">
                        {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 sm:px-6">
                        <ActionButtons vendor={vendor} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        <Pagination />
      </div>
      
      {/* Vendor Detail Modal */}
      <VendorDetailModal 
        vendor={selectedVendor} 
        isOpen={vendorModalOpen} 
        onClose={() => {
          setVendorModalOpen(false);
          setSelectedVendor(null);
        }} 
      />
    </div>
  );
};

export default VendorContent;