"use client";

import { useState } from 'react';
import { Save, Info, Image as ImageIcon, Clock, Shield, Palette, Moon, Sun, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';

// Mock initial settings data - replace with actual data fetching and saving later
const initialSettings = {
  appName: 'Admin Portal Pro',
  appLogoUrl: '/images/logo_default.png',
  defaultTimezone: 'America/New_York',
  enableAdminMFA: true,
  adminSessionTimeout: 60, // minutes
  minPasswordLength: 10,
  primaryThemeColor: '#6D28D9', // Purple
  enableDarkModeDefault: false,
};

// Available timezones (example list - can be expanded)
const timezones = [
  { value: 'Etc/GMT+12', label: '(GMT-12:00) International Date Line West' },
  { value: 'Pacific/Midway', label: '(GMT-11:00) Midway Island, Samoa' },
  { value: 'Pacific/Honolulu', label: '(GMT-10:00) Hawaii' },
  { value: 'America/Anchorage', label: '(GMT-09:00) Alaska' },
  { value: 'America/Los_Angeles', label: '(GMT-08:00) Pacific Time (US & Canada)' },
  { value: 'America/Denver', label: '(GMT-07:00) Mountain Time (US & Canada)' },
  { value: 'America/Chicago', label: '(GMT-06:00) Central Time (US & Canada)' },
  { value: 'America/New_York', label: '(GMT-05:00) Eastern Time (US & Canada)' },
  { value: 'Europe/London', label: '(GMT+00:00) London' },
  { value: 'Europe/Berlin', label: '(GMT+01:00) Amsterdam, Berlin, Rome' },
  { value: 'Asia/Tokyo', label: '(GMT+09:00) Tokyo, Seoul, Osaka' },
  { value: 'Australia/Sydney', label: '(GMT+10:00) Sydney' },
];

// Helper for a simple toggle switch UI
const ToggleSwitch = ({ id, checked, onChange, labelOn = 'Enabled', labelOff = 'Disabled' }: 
  { id: string, checked: boolean, onChange: (checked: boolean) => void, labelOn?: string, labelOff?: string }) => {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer">
      <div className="relative">
        <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`block w-14 h-8 rounded-full transition-colors ${checked ? 'bg-purple-600 dark:bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'translate-x-6' : ''}`}></div>
      </div>
      <div className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
        {checked ? labelOn : labelOff}
      </div>
    </label>
  );
};

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }
    if (type === 'number') {
      processedValue = parseInt(value, 10);
    }
    setSettings(prev => ({ ...prev, [name]: processedValue }));
  };
  
  const handleToggleChange = (name: keyof typeof initialSettings, checked: boolean) => {
    setSettings(prev => ({...prev, [name]: checked }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    console.log("Saving settings:", settings);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Replace with actual API call. If successful:
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSettingInput = (settingKey: keyof typeof initialSettings, label: string, type: string, options?: { value: string, label: string }[], placeholder?: string, helpText?: string, icon?: React.ReactNode) => {
    const commonInputClasses = "mt-1 block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors";
    
    return (
      <div className="mb-6">
        <label htmlFor={settingKey} className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          {icon && <span className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400">{icon}</span>}
          {label}
        </label>
        {type === 'toggle' ? (
          <div className="mt-2">
            <ToggleSwitch 
              id={settingKey} 
              checked={settings[settingKey] as boolean} 
              onChange={(checked) => handleToggleChange(settingKey, checked)}
            />
          </div>
        ) : type === 'select' ? (
          <select 
            id={settingKey} 
            name={settingKey} 
            value={settings[settingKey] as string}
            onChange={handleChange}
            className={`${commonInputClasses} h-[46px]`}
          >
            {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        ) : (
          <input 
            type={type} 
            id={settingKey} 
            name={settingKey} 
            value={settings[settingKey] as string | number}
            onChange={handleChange}
            placeholder={placeholder}
            className={commonInputClasses}
            min={type === 'number' ? 0 : undefined}
          />
        )}
        {helpText && <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center"><Info size={14} className="mr-1.5 flex-shrink-0"/>{helpText}</p>}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Optional: Page specific title or breadcrumbs if needed, TopBarTitle handles main title */}
      
      <div className="space-y-8">
        {/* General Settings Card */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b pb-3 border-gray-200 dark:border-gray-700 flex items-center">
            <SettingsIcon className="mr-3 h-6 w-6 text-purple-600 dark:text-purple-400"/> General Settings
          </h2>
          {renderSettingInput('appName', 'Application Name', 'text', undefined, 'Your App Name', 'The public name of your application.', <Info/>)}
          {renderSettingInput('appLogoUrl', 'Application Logo URL', 'text', undefined, 'https://example.com/logo.png', 'URL of the logo to be displayed. Ensure it is publicly accessible.', <ImageIcon/>)}
          {renderSettingInput('defaultTimezone', 'Default Timezone', 'select', timezones, undefined, 'Set the default timezone for date and time displays throughout the application.', <Clock/>)}
        </div>

        {/* Security Settings Card */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b pb-3 border-gray-200 dark:border-gray-700 flex items-center">
            <Shield className="mr-3 h-6 w-6 text-purple-600 dark:text-purple-400"/> Security Settings
          </h2>
          {renderSettingInput('enableAdminMFA', 'Enable MFA for Admins', 'toggle', undefined, undefined, 'Require Multi-Factor Authentication for all Admin and Super Admin accounts.')}
          {renderSettingInput('adminSessionTimeout', 'Admin Session Timeout (minutes)', 'number', undefined, '60', 'Automatically log out admins after this period of inactivity.', <Clock/>)}
          {renderSettingInput('minPasswordLength', 'Minimum Password Length', 'number', undefined, '8', 'Minimum character length required for new admin passwords.', <Info/>)}
        </div>

        {/* Appearance Settings Card */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b pb-3 border-gray-200 dark:border-gray-700 flex items-center">
            <Palette className="mr-3 h-6 w-6 text-purple-600 dark:text-purple-400"/> Appearance Settings
          </h2>
          {renderSettingInput('primaryThemeColor', 'Primary Theme Color', 'text', undefined, '#RRGGBB', 'Set the main accent color (e.g., for buttons, links). Use a valid hex code.', <Palette/>)}
          {renderSettingInput('enableDarkModeDefault', 'Enable Dark Mode by Default', 'toggle', undefined, undefined, 'Users will see dark mode first, but can switch manually if a theme switcher is available.', <Moon/>)}
        </div>

        {/* Save Button Area */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-purple-500 dark:hover:bg-purple-600 transition-all duration-150 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save All Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 