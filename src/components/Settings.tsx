import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  User, 
  Shield, 
  Database, 
  Palette, 
  Globe,
  Save,
  Check,
  Moon,
  Sun,
  Mail,
  Smartphone,
  Trash2,
  Download,
  Upload
} from 'lucide-react';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  dataRetention: number;
  autoLogout: number;
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>({
    theme: 'light',
    language: 'en',
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    dailyDigest: true,
    weeklyReport: true,
    dataRetention: 12,
    autoLogout: 30
  });

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'privacy' | 'data'>('general');

  useEffect(() => {
    const savedSettings = localStorage.getItem('metapharsic_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('metapharsic_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportData = () => {
    const data = {
      settings,
      notifications: localStorage.getItem('metapharsic_notifications'),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metapharsic-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.settings) {
            setSettings(data.settings);
            localStorage.setItem('metapharsic_settings', JSON.stringify(data.settings));
            alert('Settings imported successfully!');
          }
        } catch {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'data', label: 'Data Management', icon: Database }
  ] as const;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-600 mt-2">Manage your preferences and application settings</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-64 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Theme
                  </label>
                  <div className="flex gap-3">
                    {(['light', 'dark', 'system'] as const).map((theme) => (
                      <button
                        key={theme}
                        onClick={() => setSettings({ ...settings, theme })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          settings.theme === theme
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {theme === 'light' && <Sun className="w-4 h-4" />}
                        {theme === 'dark' && <Moon className="w-4 h-4" />}
                        {theme === 'system' && <Palette className="w-4 h-4" />}
                        <span className="capitalize">{theme}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Language
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="te">Telugu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Auto Logout (minutes)
                  </label>
                  <select
                    value={settings.autoLogout}
                    onChange={(e) => setSettings({ ...settings, autoLogout: parseInt(e.target.value) })}
                    className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={0}>Never</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </h2>

              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', icon: Mail, desc: 'Receive updates via email' },
                  { key: 'pushNotifications', label: 'Push Notifications', icon: Bell, desc: 'Browser push notifications' },
                  { key: 'smsNotifications', label: 'SMS Notifications', icon: Smartphone, desc: 'Text messages for urgent updates' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <Icon className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800">{item.label}</h3>
                          <p className="text-sm text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings[item.key as keyof SettingsState] as boolean}
                          onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  );
                })}

                <div className="border-t border-slate-200 pt-4 mt-4">
                  <h3 className="font-medium text-slate-800 mb-3">Digest Options</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={settings.dailyDigest}
                        onChange={(e) => setSettings({ ...settings, dailyDigest: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-slate-800">Daily Digest</span>
                        <p className="text-sm text-slate-500">Summary of daily activities</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={settings.weeklyReport}
                        onChange={(e) => setSettings({ ...settings, weeklyReport: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-slate-800">Weekly Report</span>
                        <p className="text-sm text-slate-500">Comprehensive weekly summary</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Security */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Security
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="font-medium text-amber-800 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Data Retention
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Automatically delete data older than {settings.dataRetention} months
                  </p>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={settings.dataRetention}
                    onChange={(e) => setSettings({ ...settings, dataRetention: parseInt(e.target.value) })}
                    className="w-full mt-3 accent-amber-500"
                  />
                  <div className="flex justify-between text-xs text-amber-600 mt-1">
                    <span>1 month</span>
                    <span className="font-medium">{settings.dataRetention} months</span>
                    <span>60 months</span>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg">
                  <h3 className="font-medium text-slate-800">Security Options</h3>
                  <div className="mt-3 space-y-2">
                    <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                      Change Password
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                      Enable Two-Factor Authentication
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                      Manage Active Sessions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Management */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Management
              </h2>

              <div className="space-y-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h3 className="font-medium text-slate-800 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export Data
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Download a backup of your settings and preferences
                  </p>
                  <button
                    onClick={handleExportData}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Export Settings
                  </button>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg">
                  <h3 className="font-medium text-slate-800 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Import Data
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Restore settings from a backup file
                  </p>
                  <label className="mt-3 inline-block px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm cursor-pointer">
                    Import Settings
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h3 className="font-medium text-red-800 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Clear Data
                  </h3>
                  <p className="text-sm text-red-600 mt-1">
                    Permanently delete all local data and reset settings
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure? This will delete all your settings and notifications.')) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Clear All Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
