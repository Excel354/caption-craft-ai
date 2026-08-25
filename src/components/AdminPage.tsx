import React, { useState, useEffect } from 'react';
import { AppLogo } from './AppLogo';
import { AdminStats, UpgradeRequest, SystemAnnouncement, BankConfig, PlanTier } from '../types';
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
} from 'lucide-react';

interface AdminUserItem {
  id: string;
  email: string;
  name: string;
  plan: PlanTier;
  createdAt: string;
  usedToday: number;
  pendingUpgrade?: UpgradeRequest | null;
}

export const AdminPage: React.FC<{ onBackToApp: () => void }> = ({ onBackToApp }) => {
  const [adminToken, setAdminToken] = useState<string | null>(() => sessionStorage.getItem('caption_admin_token'));
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<'upgrades' | 'users' | 'announcement' | 'bank'>('upgrades');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [upgrades, setUpgrades] = useState<UpgradeRequest[]>([]);
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);

  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [upgradeFilter, setUpgradeFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Announcement edit form
  const [annMessage, setAnnMessage] = useState('');
  const [annActive, setAnnActive] = useState(true);
  const [annType, setAnnType] = useState<'info' | 'warning' | 'promo'>('promo');

  // Bank config edit form
  const [bankForm, setBankForm] = useState<BankConfig>({
    bankName: '',
    accountName: '',
    accountNumber: '',
    routingOrIban: '',
    swiftCode: '',
    instructions: '',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
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
        setUpgrades(d.upgrades);
      }
      if (annRes.ok) {
        const d = await annRes.json();
        setAnnouncement(d.announcement);
        setAnnMessage(d.announcement.message);
        setAnnActive(d.announcement.active);
        setAnnType(d.announcement.type);
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

  const handleApproveUpgrade = async (id: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/upgrades/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ note: 'Manual bank transfer verified and approved.' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to approve upgrade');
      }
      showToast('Upgrade approved! User plan updated immediately.');
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Error approving upgrade', 'error');
    }
  };

  const handleRejectUpgrade = async (id: string) => {
    if (!adminToken) return;
    const reason = window.prompt('Optional reason for rejection (e.g. invalid transfer code):') || undefined;
    try {
      const res = await fetch(`/api/admin/upgrades/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ note: reason || 'Transfer reference could not be matched.' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reject upgrade');
      }
      showToast('Upgrade request rejected.');
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
      showToast('Announcement updated! Users will see this banner on next visit.');
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
      showToast('Bank transfer settings securely updated on server!');
    } catch (err: any) {
      showToast(err.message || 'Error updating bank settings', 'error');
    }
  };

  // -------------------------------------------------------------
  // Admin Login Screen (Hidden Gateway)
  // -------------------------------------------------------------
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-[#172554] text-white flex flex-col justify-center items-center px-4 selection:bg-[#7C3AED] selection:text-white">
        <div className="w-full max-w-md bg-slate-900/90 border border-purple-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          <div className="flex justify-center mb-6">
            <AppLogo size="lg" theme="dark" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#EDE9FE] text-xs font-mono mb-2">
              <Shield className="w-3.5 h-3.5 text-[#FACC15]" />
              ADMIN CONTROL PORTAL
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">System Administration</h1>
            <p className="text-xs text-slate-400 mt-1">
              Enter authorized administrator password to access user records and upgrade approvals.
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3 rounded-lg bg-red-900/50 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
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
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter administrator password..."
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30 transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
              onClick={onBackToApp}
              className="flex items-center gap-1.5 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Public App
            </button>
            <span className="font-mono text-[10px] text-slate-500">v2.4 Protected</span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Filtered Upgrades and Users
  // -------------------------------------------------------------
  const filteredUpgrades = upgrades.filter(u => {
    if (upgradeFilter === 'all') return true;
    return u.status === upgradeFilter;
  });

  const filteredUsers = users.filter(u => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
  });

  // -------------------------------------------------------------
  // Authenticated Admin Dashboard
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#172554] text-slate-100 flex flex-col selection:bg-[#7C3AED] selection:text-white">
      {/* Admin Header */}
      <header className="bg-slate-900/90 border-b border-purple-500/20 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <AppLogo size="md" theme="dark" />
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#FACC15] text-[11px] font-mono font-bold">
              <Shield className="w-3 h-3 text-[#FACC15]" />
              ADMINISTRATOR CONSOLE
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              disabled={loading}
              title="Refresh Data"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onBackToApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Go to</span> App
            </button>

            <button
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
        {/* KPI Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-md">
            <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#2563EB]" /> Total Users
            </span>
            <div className="text-2xl font-black text-white mt-1">{stats?.totalUsers ?? '...'}</div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5">Registered accounts</span>
          </div>

          <div className="bg-slate-900/80 border border-purple-500/30 rounded-xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#7C3AED]/10 rounded-bl-full pointer-events-none"></div>
            <span className="text-[11px] font-mono uppercase text-[#FACC15] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#FACC15]" /> Pending Upgrades
            </span>
            <div className="text-2xl font-black text-[#FACC15] mt-1">
              {stats?.pendingUpgradesCount ?? '0'}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">Awaiting bank verification</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-md">
            <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Plan Distribution
            </span>
            <div className="text-sm font-bold text-slate-200 mt-1 flex items-center gap-2">
              <span className="text-xs text-purple-300">Pro: {stats?.planCounts.pro || 0}</span>
              <span className="text-slate-600">|</span>
              <span className="text-xs text-yellow-300">Prem: {stats?.planCounts.premium || 0}</span>
              <span className="text-slate-600">|</span>
              <span className="text-xs text-slate-400">Free: {stats?.planCounts.free || 0}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5">Active subscribers</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-md">
            <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#2563EB]" /> Generations Today
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {stats?.totalGenerationsToday ?? '...'}
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5">Global AI requests (UTC)</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2 sm:gap-4 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('upgrades')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'upgrades'
                ? 'bg-slate-900 text-white border-[#7C3AED]'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <CreditCard className="w-4 h-4 text-[#FACC15]" />
            <span>Bank Transfer Upgrades</span>
            {(stats?.pendingUpgradesCount || 0) > 0 && (
              <span className="px-1.5 py-0.5 bg-[#FACC15] text-[#172554] font-mono font-bold text-[10px] rounded-full">
                {stats?.pendingUpgradesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white border-[#7C3AED]'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Users className="w-4 h-4 text-[#2563EB]" />
            <span>User Directory & Usage</span>
          </button>

          <button
            onClick={() => setActiveTab('announcement')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'announcement'
                ? 'bg-slate-900 text-white border-[#7C3AED]'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Bell className="w-4 h-4 text-[#7C3AED]" />
            <span>Broadcast Banner</span>
          </button>

          <button
            onClick={() => setActiveTab('bank')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'bank'
                ? 'bg-slate-900 text-white border-[#7C3AED]'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Bank Destination Config</span>
          </button>
        </div>

        {/* TAB 1: Bank Transfer Upgrades */}
        {activeTab === 'upgrades' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Manual Upgrade Queue</span>
                  <span className="text-xs text-slate-400 font-normal">
                    (Verify bank receipts and approve tier activations)
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {(['pending', 'approved', 'rejected', 'all'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setUpgradeFilter(filter)}
                    className={`px-3 py-1 text-xs font-mono uppercase rounded-lg transition cursor-pointer ${
                      upgradeFilter === filter
                        ? 'bg-[#7C3AED] text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {filteredUpgrades.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-medium">No upgrade requests matching "{upgradeFilter}".</p>
                <p className="text-xs text-slate-500 mt-1">
                  When users select Pro or Premium and submit bank transfer details, they will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredUpgrades.map(upg => (
                  <div
                    key={upg.id}
                    className={`bg-slate-900/90 border rounded-xl p-5 shadow-lg transition flex flex-col md:flex-row justify-between gap-4 ${
                      upg.status === 'pending'
                        ? 'border-[#FACC15]/40 hover:border-[#FACC15]'
                        : upg.status === 'approved'
                        ? 'border-emerald-500/30'
                        : 'border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
                            upg.plan === 'premium'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          }`}
                        >
                          Target: {upg.plan.toUpperCase()} PLAN
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase flex items-center gap-1 ${
                            upg.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : upg.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {upg.status === 'pending' && <Clock className="w-3 h-3" />}
                          {upg.status === 'approved' && <Check className="w-3 h-3" />}
                          {upg.status === 'rejected' && <XCircle className="w-3 h-3" />}
                          {upg.status}
                        </span>

                        <span className="text-xs text-slate-400 font-mono">
                          Submitted {new Date(upg.requestedAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-sm">
                        <span className="font-bold text-white">{upg.userName}</span>{' '}
                        <span className="text-slate-400 font-mono">({upg.userEmail})</span>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 font-mono text-xs">
                        <div className="text-slate-300">
                          <span className="text-slate-500">Transfer / Receipt Ref:</span>{' '}
                          <span className="text-[#FACC15] font-bold text-sm select-all">
                            {upg.transferReference}
                          </span>
                        </div>
                        {upg.senderName && (
                          <div className="text-slate-300">
                            <span className="text-slate-500">Sender Name:</span> {upg.senderName}
                          </div>
                        )}
                        {upg.notes && (
                          <div className="text-slate-400">
                            <span className="text-slate-500">User Notes:</span> {upg.notes}
                          </div>
                        )}
                        {upg.resolutionNote && (
                          <div className="text-emerald-300 pt-1 border-t border-slate-800">
                            <span className="text-slate-500">Resolution Note:</span> {upg.resolutionNote}
                          </div>
                        )}
                      </div>
                    </div>

                    {upg.status === 'pending' && (
                      <div className="flex md:flex-col justify-end items-stretch gap-2 shrink-0">
                        <button
                          onClick={() => handleApproveUpgrade(upg.id)}
                          className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          Approve & Activate
                        </button>
                        <button
                          onClick={() => handleRejectUpgrade(upg.id)}
                          className="flex-1 md:flex-none px-4 py-2 bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-200 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Users & Quota Directory */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search user by email or name..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7C3AED]"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Showing {filteredUsers.length} of {users.length} users
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Current Plan</th>
                      <th className="py-3 px-4">Generations Today</th>
                      <th className="py-3 px-4">Account Created</th>
                      <th className="py-3 px-4 text-right">Upgrade Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              u.plan === 'premium'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : u.plan === 'pro'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {u.plan}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="text-white font-bold">{u.usedToday}</span>
                          <span className="text-slate-500">
                            {' '}
                            / {u.plan === 'premium' ? '∞' : u.plan === 'pro' ? '50' : '10'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {u.pendingUpgrade ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                              <Clock className="w-3 h-3" />
                              Upgrade Pending ({u.pendingUpgrade.plan.toUpperCase()})
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-[10px]">Standard</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Broadcast Announcement */}
        {activeTab === 'announcement' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-lg max-w-3xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#7C3AED]" />
                Top-of-App Broadcast Banner
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Broadcast messages, service updates, or promotional notices directly to all users. Users can dismiss the banner.
              </p>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={annActive}
                    onChange={e => setAnnActive(e.target.checked)}
                    className="w-4 h-4 text-[#7C3AED] rounded focus:ring-0 cursor-pointer"
                  />
                  Banner is Active / Visible to Users
                </label>

                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-slate-400">Type:</span>
                  {(['promo', 'info', 'warning'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAnnType(t)}
                      className={`px-2.5 py-1 text-xs font-mono uppercase rounded transition cursor-pointer ${
                        annType === t
                          ? 'bg-[#7C3AED] text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                  Message Content
                </label>
                <textarea
                  rows={3}
                  value={annMessage}
                  onChange={e => setAnnMessage(e.target.value)}
                  placeholder="e.g. 🚀 Welcome to Caption Generator Pro! Manual bank upgrades are verified within 15 minutes."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#7C3AED]"
                  required
                />
              </div>

              {/* Live Preview */}
              <div>
                <span className="block text-[11px] font-mono text-slate-400 uppercase mb-2">
                  Live Banner Preview:
                </span>
                <div
                  className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
                    annType === 'warning'
                      ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                      : annType === 'promo'
                      ? 'bg-purple-950/60 border-purple-500/50 text-purple-200'
                      : 'bg-blue-950/60 border-blue-500/50 text-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">✦</span>
                    <span>{annMessage || 'Your announcement will appear here...'}</span>
                  </div>
                  <button type="button" className="text-slate-400 hover:text-white text-xs">
                    ✕
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="py-2.5 px-6 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Publish Announcement
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: Bank Destination Configuration */}
        {activeTab === 'bank' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-lg max-w-3xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono mb-2">
                <Lock className="w-3 h-3" />
                SECURE BACKEND STORAGE ONLY
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                Manual Bank Transfer Destination Details
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                These financial destination details are stored exclusively on the server and viewable only inside this admin portal for accounting reconciliation.
              </p>
            </div>

            <form onSubmit={handleSaveBankConfig} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                    Bank Institution Name
                  </label>
                  <input
                    type="text"
                    value={bankForm.bankName}
                    onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                    Account Beneficiary Name
                  </label>
                  <input
                    type="text"
                    value={bankForm.accountName}
                    onChange={e => setBankForm({ ...bankForm, accountName: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={bankForm.accountNumber}
                    onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                    Routing Number / IBAN
                  </label>
                  <input
                    type="text"
                    value={bankForm.routingOrIban}
                    onChange={e => setBankForm({ ...bankForm, routingOrIban: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                    SWIFT / BIC Code
                  </label>
                  <input
                    type="text"
                    value={bankForm.swiftCode}
                    onChange={e => setBankForm({ ...bankForm, swiftCode: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                  Accounting & Verification Instructions (Admin Internal)
                </label>
                <textarea
                  rows={2}
                  value={bankForm.instructions}
                  onChange={e => setBankForm({ ...bankForm, instructions: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Server Configuration
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
