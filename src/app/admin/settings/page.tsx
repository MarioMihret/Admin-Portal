import React from 'react';
import { 
  Save, 
  Bell, 
  Mail, 
  Shield, 
  Users, 
  CreditCard, 
  Globe, 
  Lock, 
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Layers,
  Server,
  Settings
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Platform Settings Group */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-medium text-gray-800 flex items-center">
              <Layers className="w-5 h-5 mr-2 text-blue-500" />
              Platform Settings
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {/* General Settings Card */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
              <a href="#general" className="flex flex-col h-full">
                <div className="flex items-center mb-3">
                  <Globe className="w-5 h-5 text-blue-500 mr-2" />
                  <h3 className="font-medium text-gray-800">General</h3>
                </div>
                <p className="text-sm text-gray-500 mb-2 flex-grow">Configure site name, description, timezone and basic settings</p>
              </a>
            </div>
            
            {/* API & Integrations Card */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
              <a href="#api" className="flex flex-col h-full">
                <div className="flex items-center mb-3">
                  <Server className="w-5 h-5 text-green-500 mr-2" />
                  <h3 className="font-medium text-gray-800">API & Integrations</h3>
                </div>
                <p className="text-sm text-gray-500 mb-2 flex-grow">Manage API keys and third-party service integrations</p>
              </a>
            </div>
            
            {/* Email Settings Card */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
              <a href="#email" className="flex flex-col h-full">
                <div className="flex items-center mb-3">
                  <Mail className="w-5 h-5 text-indigo-500 mr-2" />
                  <h3 className="font-medium text-gray-800">Email Settings</h3>
                </div>
                <p className="text-sm text-gray-500 mb-2 flex-grow">Configure SMTP settings and email templates</p>
              </a>
            </div>
          </div>
        </div>
        
        {/* User Management Group */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-medium text-gray-800 flex items-center">
              <Users className="w-5 h-5 mr-2 text-indigo-500" />
              User Management
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {/* User Management Card */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
              <a href="#users" className="flex flex-col h-full">
                <div className="flex items-center mb-3">
                  <Users className="w-5 h-5 text-indigo-500 mr-2" />
                  <h3 className="font-medium text-gray-800">User Management</h3>
                </div>
                <p className="text-sm text-gray-500 mb-2 flex-grow">Manage user accounts, roles and permissions</p>
              </a>
            </div>
            
            {/* Security Settings Card */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
              <a href="#security" className="flex flex-col h-full">
                <div className="flex items-center mb-3">
                  <Shield className="w-5 h-5 text-red-500 mr-2" />
                  <h3 className="font-medium text-gray-800">Security</h3>
                </div>
                <p className="text-sm text-gray-500 mb-2 flex-grow">Configure security settings, 2FA and access controls</p>
              </a>
            </div>
          </div>
        </div>
        
        {/* Communication Group */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-medium text-gray-800 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-yellow-500" />
              Communication
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {/* Notification Settings Card */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
              <a href="#notifications" className="flex flex-col h-full">
                <div className="flex items-center mb-3">
                  <Bell className="w-5 h-5 text-yellow-500 mr-2" />
                  <h3 className="font-medium text-gray-800">Notifications</h3>
                </div>
                <p className="text-sm text-gray-500 mb-2 flex-grow">Configure notification preferences and alerts</p>
              </a>
            </div>
            
            {/* Help & Support Card */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
              <a href="#help" className="flex flex-col h-full">
                <div className="flex items-center mb-3">
                  <HelpCircle className="w-5 h-5 text-purple-500 mr-2" />
                  <h3 className="font-medium text-gray-800">Help & Support</h3>
                </div>
                <p className="text-sm text-gray-500 mb-2 flex-grow">Access support resources and documentation</p>
              </a>
            </div>
          </div>
        </div>
        
        {/* Billing Group */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-medium text-gray-800 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-green-500" />
              Billing & Subscription
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {/* Billing Card */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
              <a href="#billing" className="flex flex-col h-full">
                <div className="flex items-center mb-3">
                  <CreditCard className="w-5 h-5 text-green-500 mr-2" />
                  <h3 className="font-medium text-gray-800">Billing</h3>
                </div>
                <p className="text-sm text-gray-500 mb-2 flex-grow">Manage payment methods and billing information</p>
              </a>
            </div>
          </div>
        </div>

        {/* Content Panels (same as before) */}
        <div id="general" className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">General Settings</h2>
            <p className="text-sm text-gray-500 mt-1">Configure your platform's general settings and appearance.</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="site-name" className="block text-sm font-medium text-gray-700 mb-1">
                Site Name
              </label>
              <input
                type="text"
                id="site-name"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue="Event Management Platform"
              />
            </div>
            
            <div>
              <label htmlFor="site-description" className="block text-sm font-medium text-gray-700 mb-1">
                Site Description
              </label>
              <textarea
                id="site-description"
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue="A comprehensive platform for managing and organizing events of all types."
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                Default Timezone
              </label>
              <select
                id="timezone"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>UTC</option>
                <option>America/New_York</option>
                <option>America/Los_Angeles</option>
                <option>Europe/London</option>
                <option>Europe/Paris</option>
                <option>Asia/Tokyo</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="date-format" className="block text-sm font-medium text-gray-700 mb-1">
                Date Format
              </label>
              <select
                id="date-format"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Maintenance Mode</h3>
                <p className="text-sm text-gray-500">Enable to show a maintenance page to visitors</p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none">
                <input type="checkbox" id="maintenance-mode" className="sr-only" />
                <label htmlFor="maintenance-mode" className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer">
                  <span className="block h-6 w-6 rounded-full bg-white shadow transform translate-x-0 transition-transform duration-200 ease-in-out"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Settings (Same as before) */}
        <div id="notifications" className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Notification Settings</h2>
            <p className="text-sm text-gray-500 mt-1">Configure how and when you receive notifications.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none">
                <input type="checkbox" id="email-notifications" className="sr-only" defaultChecked />
                <label htmlFor="email-notifications" className="block overflow-hidden h-6 rounded-full bg-blue-500 cursor-pointer">
                  <span className="block h-6 w-6 rounded-full bg-white shadow transform translate-x-6 transition-transform duration-200 ease-in-out"></span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Push Notifications</h3>
                <p className="text-sm text-gray-500">Receive push notifications in the browser</p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none">
                <input type="checkbox" id="push-notifications" className="sr-only" defaultChecked />
                <label htmlFor="push-notifications" className="block overflow-hidden h-6 rounded-full bg-blue-500 cursor-pointer">
                  <span className="block h-6 w-6 rounded-full bg-white shadow transform translate-x-6 transition-transform duration-200 ease-in-out"></span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">New User Registrations</h3>
                <p className="text-sm text-gray-500">Get notified when new users register</p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none">
                <input type="checkbox" id="new-user-notifications" className="sr-only" defaultChecked />
                <label htmlFor="new-user-notifications" className="block overflow-hidden h-6 rounded-full bg-blue-500 cursor-pointer">
                  <span className="block h-6 w-6 rounded-full bg-white shadow transform translate-x-6 transition-transform duration-200 ease-in-out"></span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">New Event Submissions</h3>
                <p className="text-sm text-gray-500">Get notified when new events are submitted</p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none">
                <input type="checkbox" id="new-event-notifications" className="sr-only" defaultChecked />
                <label htmlFor="new-event-notifications" className="block overflow-hidden h-6 rounded-full bg-blue-500 cursor-pointer">
                  <span className="block h-6 w-6 rounded-full bg-white shadow transform translate-x-6 transition-transform duration-200 ease-in-out"></span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Organizer Applications</h3>
                <p className="text-sm text-gray-500">Get notified when new organizer applications are submitted</p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none">
                <input type="checkbox" id="organizer-app-notifications" className="sr-only" defaultChecked />
                <label htmlFor="organizer-app-notifications" className="block overflow-hidden h-6 rounded-full bg-blue-500 cursor-pointer">
                  <span className="block h-6 w-6 rounded-full bg-white shadow transform translate-x-6 transition-transform duration-200 ease-in-out"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings (Same as before) */}
        <div id="security" className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Security Settings</h2>
            <p className="text-sm text-gray-500 mt-1">Configure security settings for your platform.</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="session-timeout" className="block text-sm font-medium text-gray-700 mb-1">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                id="session-timeout"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={30}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none">
                <input type="checkbox" id="two-factor-auth" className="sr-only" />
                <label htmlFor="two-factor-auth" className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer">
                  <span className="block h-6 w-6 rounded-full bg-white shadow transform translate-x-0 transition-transform duration-200 ease-in-out"></span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">IP Restriction</h3>
                <p className="text-sm text-gray-500">Restrict admin access to specific IP addresses</p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none">
                <input type="checkbox" id="ip-restriction" className="sr-only" />
                <label htmlFor="ip-restriction" className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer">
                  <span className="block h-6 w-6 rounded-full bg-white shadow transform translate-x-0 transition-transform duration-200 ease-in-out"></span>
                </label>
              </div>
            </div>
            
            <div>
              <label htmlFor="allowed-ips" className="block text-sm font-medium text-gray-700 mb-1">
                Allowed IP Addresses
              </label>
              <textarea
                id="allowed-ips"
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter IP addresses separated by commas"
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">Leave blank to allow all IPs</p>
            </div>
            
            <div>
              <label htmlFor="password-policy" className="block text-sm font-medium text-gray-700 mb-1">
                Password Policy
              </label>
              <select
                id="password-policy"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>Standard (8+ characters, letters & numbers)</option>
                <option>Strong (12+ characters, mixed case, numbers & symbols)</option>
                <option>Custom</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 