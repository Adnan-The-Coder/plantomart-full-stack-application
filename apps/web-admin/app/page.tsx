"use client";
import React, { useState } from 'react';
import { 
  BarChart, Bar, 
  XAxis, YAxis, 
  CartesianGrid, Tooltip, 
  ResponsiveContainer,LineChart,
  Line,
  PieChart,Pie,Cell
} from 'recharts';
import {
  Users,
  ShoppingCart,
  Store,
  Package,
  TrendingUp,
  DollarSign,
  Eye,
  Plus,
  Search,
  Bell,
  Settings,
  LogOut,
  Edit,
  Trash2,
  Filter,
  Download,
  Calendar,
  PenTool,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Menu,
  X
} from 'lucide-react';
import UserContent from '@/components/user-content';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sample data
  const salesData = [
    { month: 'Jan', sales: 45000 },
    { month: 'Feb', sales: 52000 },
    { month: 'Mar', sales: 48000 },
    { month: 'Apr', sales: 61000 },
    { month: 'May', sales: 55000 },
    { month: 'Jun', sales: 67000 },
  ];

  const vendorData = [
    { name: 'Active', value: 245, color: '#10B981' },
    { name: 'Pending', value: 32, color: '#F59E0B' },
    { name: 'Suspended', value: 15, color: '#EF4444' },
  ];

  const tableData = {
    vendors: [
      { id: 1, name: 'Green Garden Co.', sales: '$45,230', orders: 234, rating: 4.8, status: 'active' },
      { id: 2, name: 'Plant Paradise', sales: '$38,920', orders: 187, rating: 4.7, status: 'active' },
      { id: 3, name: 'Urban Jungle', sales: '$32,150', orders: 156, rating: 4.6, status: 'pending' },
    ],
    orders: [
      { id: '#12345', customer: 'John Doe', vendor: 'Green Garden Co.', amount: '$156.99', status: 'completed', date: '2024-01-15' },
      { id: '#12346', customer: 'Jane Smith', vendor: 'Plant Paradise', amount: '$89.50', status: 'processing', date: '2024-01-15' },
      { id: '#12347', customer: 'Mike Johnson', vendor: 'Urban Jungle', amount: '$234.75', status: 'shipped', date: '2024-01-14' },
    ],
    blogs: [
      { id: 1, title: 'Top 10 Indoor Plants for Beginners', author: 'Admin', date: '2024-01-15', status: 'published', views: 1243 },
      { id: 2, title: 'Plant Care Tips for Winter', author: 'Admin', date: '2024-01-12', status: 'draft', views: 987 },
      { id: 3, title: 'Sustainable Gardening Practices', author: 'Admin', date: '2024-01-10', status: 'published', views: 756 },
    ]
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'vendors', label: 'Vendors', icon: Store },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'blogs', label: 'Blog Management', icon: PenTool },
    { id: 'analytics', label: 'Analytics', icon: BarChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const StatCard = ({ icon: Icon, title, value, change, color = "blue" }:any) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {change && (
            <p className={`text-xs sm:text-sm font-medium mt-1 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {change} from last month
            </p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl bg-${color}-100 dark:bg-${color}-900/30 ml-2`}>
          <Icon className={`h-4 w-4 sm:h-6 sm:w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  const statusConfig = {
    active: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
    pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
    suspended: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
    completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
    processing: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
    shipped: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: Package },
    published: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
    draft: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: Edit },
    inactive: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: XCircle },
  };
  type StatusKey = keyof typeof statusConfig;
  const getStatusBadge = (status: StatusKey | string) => {
    const config = (status in statusConfig ? statusConfig[status as StatusKey] : statusConfig.pending);
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {typeof status === 'string' ? status.charAt(0).toUpperCase() + status.slice(1) : String(status)}
      </span>
    );
  };

  const ActionButtons = ({ type = "default" }) => (
    <div className="flex items-center gap-1">
      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors" title="View">
        <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>
      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors" title="Edit">
        <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>
      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors" title="Delete">
        <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
      </button>
    </div>
  );

  const TableHeader = ({ title, buttonText, buttonIcon: ButtonIcon }:any) => (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
      <div className="flex gap-2 w-full sm:w-auto">
        <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
          <ButtonIcon className="h-4 w-4" />
          {buttonText}
        </button>
      </div>
    </div>
  );

  const SearchAndFilter = ({ placeholder }:any) => (
    <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard icon={DollarSign} title="Total Revenue" value="$284,590" change="+12.5%" color="green" />
        <StatCard icon={ShoppingCart} title="Total Orders" value="2,847" change="+8.2%" color="blue" />
        <StatCard icon={Store} title="Active Vendors" value="245" change="+15.3%" color="purple" />
        <StatCard icon={Users} title="Total Users" value="12,456" change="+6.1%" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sales Overview</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151', 
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }} 
                />
                <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vendor Distribution</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vendorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {vendorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {vendorData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Order</th>
                <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Customer</th>
                <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableData.orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-3 px-4 sm:px-6 text-sm font-medium text-gray-900 dark:text-white">{order.id}</td>
                  <td className="py-3 px-4 sm:px-6 text-sm text-gray-600 dark:text-gray-400">{order.customer}</td>
                  <td className="py-3 px-4 sm:px-6 text-sm font-medium text-gray-900 dark:text-white">{order.amount}</td>
                  <td className="py-3 px-4 sm:px-6">{getStatusBadge(order.status)}</td>
                  <td className="py-3 px-4 sm:px-6"><ActionButtons /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTable = (data:any, columns:any, title:any, buttonText:any, ButtonIcon:any) => (
    <div className="space-y-6">
      <TableHeader title={title} buttonText={buttonText} buttonIcon={ButtonIcon} />
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <SearchAndFilter placeholder={`Search ${title.toLowerCase()}...`} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                {columns.map((col:any) => (
                  <th key={col.key} className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {col.label}
                  </th>
                ))}
                <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item:any) => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  {columns.map((col:any) => (
                    <td key={col.key} className="py-3 px-4 sm:px-6 text-sm text-gray-600 dark:text-gray-400">
                      {col.key === 'status' ? getStatusBadge(item[col.key]) : 
                       col.key === 'name' ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {item.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                        </div>
                       ) : 
                       col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                  <td className="py-3 px-4 sm:px-6"><ActionButtons /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': 
        return renderOverview();
      case 'vendors': 
        return renderTable(
          tableData.vendors,
          [
            { key: 'name', label: 'Vendor' },
            { key: 'sales', label: 'Sales' },
            { key: 'orders', label: 'Orders' },
            { key: 'rating', label: 'Rating', render: (item:any) => `⭐ ${item.rating}` },
            { key: 'status', label: 'Status' }
          ],
          'Vendor Management',
          'Add Vendor',
          Plus
        );
      case 'users':
        return <UserContent/>;
      case 'orders':
        return renderTable(
          tableData.orders,
          [
            { key: 'id', label: 'Order ID' },
            { key: 'customer', label: 'Customer' },
            { key: 'vendor', label: 'Vendor' },
            { key: 'amount', label: 'Amount' },
            { key: 'status', label: 'Status' },
            { key: 'date', label: 'Date' }
          ],
          'Order Management',
          'Export Orders',
          Download
        );
      case 'blogs':
        return renderTable(
          tableData.blogs,
          [
            { key: 'title', label: 'Title' },
            { key: 'author', label: 'Author' },
            { key: 'date', label: 'Date' },
            { key: 'views', label: 'Views' },
            { key: 'status', label: 'Status' }
          ],
          'Blog Management',
          'Create Blog',
          PenTool
        );
      default:
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Coming Soon</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">This feature is under development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Plantomart</span>
            </div>
            <button 
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 px-3 py-6 overflow-y-auto">
            <div className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* User Profile - Fixed at bottom */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">Admin User</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">admin@plantomart.com</p>
              </div>
            </div>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white capitalize">{activeTab}</h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {renderContent()}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default AdminDashboard;