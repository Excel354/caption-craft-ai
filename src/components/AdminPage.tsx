import React, { useState, useEffect } from 'react';
import { AppLogo } from './AppLogo';
import { AdminStats, UpgradeRequest, SystemAnnouncement, BankConfig, AdminUserItem } from '../types';
import {
  Shield,
  Lock,
  Users,
  CreditCard,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Search,
  Check,
  AlertTriangle,
  Building2,
  Save,
  Key,
  Flame,
  Zap,
  Activity,
  UserX,
  UserCheck,
  FileText,
  BadgeAlert,
  Server,
  Layers,
} from 'lucide-react';
import { DEFAULT_BANK_DETAILS } from '../constants/platforms';

export const AdminPage: React.FC<{ onBackToApp: () => void }> = ({ onBackToApp }) => {
  const [adminToken, setAdminToken] = useState<string | null>(() => sessionStorage.getItem('caption_admin_token'));
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<'insights' | 'upgrades' | 'announcement' | 'bank'>('insights');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [upgrades, setUpgrades] = useState<UpgradeRequest[]>([]);
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);

  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [upgradeFilter, setUpgradeFilter] = useState<'pending' | 'resolved' | 'all'>('pending');

  // Announcement edit form
  const [annMessage, setAnnMessage] = useState('');
  const [annActive, setAnnActive] = useState(true);
  const [annType, setAnnType] = useState<'info' | 'warning' | 'promo'>('promo');

  // Bank config edit form
  const [bankForm, setBankForm] = useState<BankConfig>({
    bankName: DEFAULT_BANK_DETAILS.bankName,
    accountName: DEFAULT_BANK_DETAILS.accountName,
    accountNumber: DEFAULT_BANK_DETAILS.accountNumber,
    instructions: DEFAULT_BANK_DETAILS.instructions,
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4500);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid admin password');
      }

      sessionStorage.setItem('caption_admin_token', data.token);
      setAdminToken(data.token);
      setPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    if (adminToken) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'x-admin-token': adminToken },
      }).catch(() => {});
    }
    sessionStorage.removeItem('caption_admin_token');
    setAdminToken(null);
  };

  const fetchAdminData = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const headers = { 'x-admin-token': adminToken };

      const [statsRes, usersRes, upgradesRes, annRes, bankRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/upgrades', { headers }),
        fetch('/api/admin/announcement', { headers }),
        fetch('/api/admin/bank-config', { headers }),
      ]);

      if (statsRes.status === 401) {
        handleAdminLogout();
        return;
      }

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.stats);
      }
      if (usersRes.ok) {
        const d = await usersRes.json();
        setUsers(d.users);
      }
      if (upgradesRes.ok) {
        const d = await upgradesRes.json();
        setUpgrades(d.all || d.upgrades || []);
      }
      if (annRes.ok) {
        const d = await annRes.json();
        setAnnouncement(d.announcement);
        setAnnouncements(d.announcements || []);
        if (d.announcement) {
          setAnnMessage(d.announcement.message);
          setAnnActive(d.announcement.active);
          setAnnType(d.announcement.type);
        }
      }
      if (bankRes.ok) {
        const d = await bankRes.json();
        setBankConfig(d.bankConfig);
        setBankForm(d.bankConfig);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchAdminData();
    }
  }, [adminToken]);

  const handleToggleSuspend = async (user: AdminUserItem) => {
    if (!adminToken) return;
    const action = user.isSuspended ? 'unsuspend' : 'suspend';
    const confirmMsg = user.isSuspended
      ? `Re-activate generation access for ${user.email}?`
      : `Temporarily pause account ${user.email}? Login will still work but generation requests will return a paused account message.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}/${action}`, {
        method: 'POST',
        headers: { 'x-admin-token': adminToken },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to ${action} user`);
      }
      showToast(user.isSuspended ? `User ${user.email} re-activated!` : `User ${user.email} temporarily suspended.`);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || `Error modifying user suspension state`, 'error');
    }
  };

  const handleApproveUpgrade = async (id: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/upgrades/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ note: 'First Bank transfer matched and approved.' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to approve upgrade');
      }
      showToast('Upgrade approved! User tier upgraded and request moved to Resolved inbox.');
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Error approving upgrade', 'error');
    }
  };

  const handleRejectUpgrade = async (id: string) => {
    if (!adminToken) return;
    const reason = window.prompt('Optional note for rejection (e.g. sender name or reference not found on bank statement):') || undefined;
    try {
      const res = await fetch(`/api/admin/upgrades/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ note: reason || 'Transfer reference could not be verified on bank records.' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reject upgrade');
      }
      showToast('Upgrade request marked as rejected and moved to Resolved inbox.');
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Error rejecting upgrade', 'error');
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !annMessage.trim()) return;
    try {
      const res = await fetch('/api/admin/announcement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({
          message: annMessage.trim(),
          active: annActive,
          type: annType,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save announcement');
      }
      setAnnouncement(data.announcement);
      setAnnouncements(data.announcements || []);
      showToast('Announcement posted! Broadcasted to user inbox and active banner.');
    } catch (err: any) {
      showToast(err.message || 'Error saving announcement', 'error');
    }
  };

  const handleSaveBankConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/bank-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify(bankForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save bank settings');
      }
      setBankConfig(data.bankConfig);
      showToast('Bank transfer details saved successfully.');
    } catch (err: any) {
      showToast(err.message || 'Error updating bank settings', 'error');
    }
  };

  // -------------------------------------------------------------
  // Admin Login Screen (Hidden Gateway)
  // -------------------------------------------------------------
  if (!adminToken) {
    return (
      <div id="admin-login-screen" className="min-h-screen bg-[#172554] text-white flex flex-col justify-center items-center px-4 selection:bg-violet-600 selection:text-white">
        <div className="w-full max-w-md bg-slate-900/90 border border-violet-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          <div className="flex justify-center mb-6">
            <AppLogo size="lg" theme="dark" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-500/40 text-violet-200 text-xs font-mono mb-2">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              ADMIN CONTROL PORTAL
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">System Administration</h1>
            <p className="text-xs text-slate-400 mt-1">
              Enter password to access usage insights, payment inbox, and user management.
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <input
                  id="admin-password-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter administrator password..."
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-lg shadow-violet-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Authenticate Admin
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <button
              id="admin-back-btn"
              onClick={onBackToApp}
              className="flex items-center gap-1.5 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Public App
            </button>
            <span className="font-mono text-[10px] text-slate-500">v2.5 Protected</span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Filtered Upgrades and Users
  // -------------------------------------------------------------
  const filteredUpgrades = upgrades.filter(u => {
    if (upgradeFilter === 'pending') return u.status === 'pending';
    if (upgradeFilter === 'resolved') return u.status === 'approved' || u.status === 'rejected';
    return true;
  });

  const filteredUsers = users.filter(u => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
  });

  const pendingUpgradesCount = upgrades.filter(u => u.status === 'pending').length;

  // -------------------------------------------------------------
  // Authenticated Admin Dashboard
  // -------------------------------------------------------------
  return (
    <div id="admin-dashboard" className="min-h-screen bg-[#172554] text-slate-100 flex flex-col selection:bg-violet-600 selection:text-white">
      {/* Admin Header */}
      <header className="bg-slate-900/90 border-b border-violet-500/20 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <AppLogo size="md" theme="dark" />
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-violet-950/60 border border-violet-500/40 text-amber-400 text-[11px] font-mono font-bold">
              <Shield className="w-3 h-3 text-amber-400" />
              ADMINISTRATOR CONSOLE
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="admin-refresh-btn"
              onClick={fetchAdminData}
              disabled={loading}
              title="Refresh Data"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              id="admin-return-app-btn"
              onClick={onBackToApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Go to</span> App
            </button>

            <button
              id="admin-logout-btn"
              onClick={handleAdminLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-200 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div
          id="admin-toast-message"
          className={`fixed top-16 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-medium flex items-center gap-2 transition transform animate-in slide-in-from-top-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
              : 'bg-red-950/95 border-red-500 text-red-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          )}
          {actionMessage.text}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* KPI Stats Bar - Detailed Monitoring Insights */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* 1. Real Gemini Calls Today */}
          <div className="bg-slate-900/80 border border-violet-500/30 rounded-xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-violet-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-violet-400" /> Real API Calls
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-violet-950 text-violet-300">TODAY</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {stats?.totalRealGeminiCallsToday ?? '0'}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">Real Gemini invocations</span>
          </div>

          {/* 2. Fallbacks Served Today */}
          <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-amber-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Fallbacks Served
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300">UNBILLED</span>
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">
              {stats?.totalFallbackCallsToday ?? '0'}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">High-demand syntheses</span>
          </div>

          {/* 3. Cached Hits Served */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" /> Cached Requests
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-sky-300">SAVED</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {stats?.totalCachedCallsToday ?? '0'}
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5">Duplicate idea cache hits</span>
          </div>

          {/* 4. Payment Inbox Pending */}
          <div className="bg-slate-900/80 border border-amber-500/40 rounded-xl p-4 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-amber-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" /> Payment Inbox
              </span>
              {pendingUpgradesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-slate-950 animate-pulse">
                  NEW
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {pendingUpgradesCount}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">Pending bank matches</span>
          </div>

          {/* 5. Total Users & Suspensions */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-md">
            <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" /> Users & Suspended
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {stats?.totalUsers ?? '0'}
              <span className="text-xs font-normal text-slate-400 ml-2">
                ({stats?.suspendedUsersCount ?? 0} paused)
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5">
              Pro: {stats?.planCounts.pro || 0} • Prem: {stats?.planCounts.premium || 0}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2 sm:gap-4 overflow-x-auto pb-1">
          <button
            id="tab-insights-btn"
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-slate-900 text-white border-violet-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Activity className="w-4 h-4 text-violet-400" />
            <span>Usage Insights & Users</span>
          </button>

          <button
            id="tab-upgrades-btn"
            onClick={() => setActiveTab('upgrades')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'upgrades'
                ? 'bg-slate-900 text-white border-violet-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Payment Notifications Inbox</span>
            {pendingUpgradesCount > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-mono font-bold text-[10px] rounded-full">
                {pendingUpgradesCount}
              </span>
            )}
          </button>

          <button
            id="tab-announcement-btn"
            onClick={() => setActiveTab('announcement')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'announcement'
                ? 'bg-slate-900 text-white border-violet-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Bell className="w-4 h-4 text-sky-400" />
            <span>Announcements & Messages</span>
          </button>

          <button
            id="tab-bank-btn"
            onClick={() => setActiveTab('bank')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'bank'
                ? 'bg-slate-900 text-white border-violet-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Bank Account Details</span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: USAGE INSIGHTS & USER DIRECTORY */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-400" />
                  Real API vs Cached Usage & Account Status
                </h3>
                <p className="text-xs text-slate-400">
                  Monitor real Gemini API calls vs cached duplicate requests, track repeated idea triggers, and toggle user suspensions.
                </p>
              </div>

              <div className="w-full sm:w-64 relative">
                <input
                  type="text"
                  placeholder="Filter by email or name..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2" />
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Plan</th>
                      <th className="py-3 px-4">Today's Usage (Real vs Cached)</th>
                      <th className="py-3 px-4">Abuse Signal / Nudge Flag</th>
                      <th className="py-3 px-4">Account Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No users found matching search.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => {
                        const isSuspended = !!user.isSuspended;
                        const hasRepeatedFlag = (user.repeatedNudgeCount || 0) >= 3;

                        return (
                          <tr key={user.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-white">{user.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Joined {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                                  user.plan === 'premium'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                    : user.plan === 'pro'
                                    ? 'bg-violet-950 text-violet-300 border border-violet-500/40'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {user.plan}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white font-mono">{user.usedToday}</span>
                                  <span className="text-[11px] text-slate-400">total today</span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] font-mono">
                                  <span className="text-violet-400 font-medium">⚡ {user.realCallsToday || 0} real AI</span>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-sky-400 font-medium">📦 {user.cachedCallsToday || 0} cached</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {hasRepeatedFlag ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-950/80 border border-amber-500 text-amber-300 animate-pulse">
                                  <BadgeAlert className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Repeated Idea Nudge ({user.repeatedNudgeCount}x)</span>
                                </span>
                              ) : (user.repeatedNudgeCount || 0) > 0 ? (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {user.repeatedNudgeCount} repeated ideas
                                </span>
                              ) : (
                                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Normal usage
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              {isSuspended ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-500/50">
                                  <UserX className="w-3 h-3 text-red-400" />
                                  PAUSED / SUSPENDED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                                  <UserCheck className="w-3 h-3 text-emerald-400" />
                                  ACTIVE
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                id={`user-suspend-btn-${user.id}`}
                                onClick={() => handleToggleSuspend(user)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ml-auto ${
                                  isSuspended
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                                    : 'bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200'
                                }`}
                              >
                                {isSuspended ? (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Unsuspend</span>
                                  </>
                                ) : (
                                  <>
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>Suspend</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: PAYMENT NOTIFICATIONS INBOX */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'upgrades' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  Payment Notifications Inbox
                </h3>
                <p className="text-xs text-slate-400">
                  Review submitted bank transfers. Approving an entry immediately updates the user's plan tier and moves it to Resolved.
                </p>
              </div>

              {/* Filter Tabs (Pending vs Resolved) */}
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  id="filter-pending-btn"
                  onClick={() => setUpgradeFilter('pending')}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    upgradeFilter === 'pending'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Pending</span>
                  {pendingUpgradesCount > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      upgradeFilter === 'pending' ? 'bg-slate-950 text-amber-400' : 'bg-amber-400 text-slate-950 font-bold'
                    }`}>
                      {pendingUpgradesCount}
                    </span>
                  )}
                </button>

                <button
                  id="filter-resolved-btn"
                  onClick={() => setUpgradeFilter('resolved')}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    upgradeFilter === 'resolved'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Resolved Archive
                </button>

                <button
                  id="filter-all-btn"
                  onClick={() => setUpgradeFilter('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    upgradeFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({upgrades.length})
                </button>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">User & Plan</th>
                      <th className="py-3 px-4">Sender Account Name (Bank Reference)</th>
                      <th className="py-3 px-4">Transfer Reference / Notes</th>
                      <th className="py-3 px-4">Submitted Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUpgrades.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="font-medium text-slate-400">
                            {upgradeFilter === 'pending' ? 'No pending payment notifications to review!' : 'No payment records found.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredUpgrades.map(item => {
                        const isItemPending = item.status === 'pending';
                        return (
                          <tr key={item.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-white">{item.userName || item.userEmail}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{item.userEmail}</div>
                              <div className="mt-1">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                                    item.plan === 'premium'
                                      ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                      : 'bg-violet-950 text-violet-300 border border-violet-500/40'
                                  }`}
                                >
                                  {item.plan} Plan
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 inline-block font-mono text-xs text-amber-300">
                                {item.senderName || 'Not specified'}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1">Match with First Bank deposit name</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-mono text-xs font-bold text-slate-200 select-all">
                                {item.transferReference}
                              </div>
                              {item.notes && (
                                <div className="text-[11px] text-slate-400 italic mt-0.5">
                                  "{item.notes}"
                                </div>
                              )}
                              {item.resolutionNote && (
                                <div className="text-[10px] text-violet-400 mt-1">
                                  Admin note: {item.resolutionNote}
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                              <div>{new Date(item.requestedAt).toLocaleDateString()}</div>
                              <div className="text-[10px] text-slate-500">{new Date(item.requestedAt).toLocaleTimeString()}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              {item.status === 'pending' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/50 animate-pulse">
                                  <Clock className="w-3 h-3" /> PENDING
                                </span>
                              ) : item.status === 'approved' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                                  <CheckCircle2 className="w-3 h-3" /> APPROVED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-500/50">
                                  <XCircle className="w-3 h-3" /> REJECTED
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              {isItemPending ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    id={`approve-upgrade-btn-${item.id}`}
                                    onClick={() => handleApproveUpgrade(item.id)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    id={`reject-upgrade-btn-${item.id}`}
                                    onClick={() => handleRejectUpgrade(item.id)}
                                    className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 text-xs font-bold rounded-lg transition cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-500 font-mono">Resolved</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: ANNOUNCEMENTS BROADCAST */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'announcement' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-sky-400" />
                  Broadcast Announcement
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Posts to user announcement inboxes and top notification banner.
                </p>
              </div>

              <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Announcement Message *
                  </label>
                  <textarea
                    id="announcement-message-textarea"
                    rows={4}
                    value={annMessage}
                    onChange={e => setAnnMessage(e.target.value)}
                    placeholder="Enter announcement text..."
                    required
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Type
                    </label>
                    <select
                      id="announcement-type-select"
                      value={annType}
                      onChange={e => setAnnType(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="promo">Promo / Feature (Purple)</option>
                      <option value="info">Info / Tip (Blue)</option>
                      <option value="warning">Alert / Notice (Amber)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Banner State
                    </label>
                    <div className="flex items-center h-10">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          id="announcement-active-checkbox"
                          type="checkbox"
                          checked={annActive}
                          onChange={e => setAnnActive(e.target.checked)}
                          className="w-4 h-4 rounded text-violet-600 border-slate-700 bg-slate-950 focus:ring-violet-500"
                        />
                        <span>Active Top Banner</span>
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  id="broadcast-announcement-btn"
                  type="submit"
                  className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Publish Broadcast
                </button>
              </form>
            </div>

            {/* Announcement History */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-400" />
                  Announcement History ({announcements.length})
                </h3>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {announcements.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No announcements recorded.</p>
                ) : (
                  announcements.map(ann => (
                    <div
                      key={ann.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                            ann.type === 'warning'
                              ? 'bg-amber-950 text-amber-300'
                              : ann.type === 'promo'
                              ? 'bg-violet-950 text-violet-300'
                              : 'bg-blue-950 text-blue-300'
                          }`}
                        >
                          {ann.type}
                        </span>
                        <span className="text-slate-500 text-[11px] font-mono">
                          {new Date(ann.createdAt || ann.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                        {ann.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: BANK ACCOUNT CONFIGURATION */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'bank' && (
          <div className="max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Nigerian Bank Account Details
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                These details are displayed to users on the Upgrade modal for manual bank transfers.
              </p>
            </div>

            <form onSubmit={handleSaveBankConfig} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Account Number *
                  </label>
                  <input
                    id="bank-account-number-input"
                    type="text"
                    value={bankForm.accountNumber}
                    onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bank Name *
                  </label>
                  <input
                    id="bank-name-input"
                    type="text"
                    value={bankForm.bankName}
                    onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Name *
                </label>
                <input
                  id="bank-account-name-input"
                  type="text"
                  value={bankForm.accountName}
                  onChange={e => setBankForm({ ...bankForm, accountName: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Transfer Instructions & Memo Notice
                </label>
                <textarea
                  id="bank-instructions-textarea"
                  rows={3}
                  value={bankForm.instructions}
                  onChange={e => setBankForm({ ...bankForm, instructions: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-2">
                <button
                  id="save-bank-details-btn"
                  type="submit"
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Bank Account Details
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
