import React, { useState } from 'react';
import { X, Check, Zap, Crown, Sparkles, Building2, Clock, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_BANK_DETAILS, PLAN_PRICING } from '../constants/platforms';

export const UpgradeModal: React.FC = () => {
  const { user, isUpgradeModalOpen, closeUpgradeModal, requestUpgrade } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'premium' | null>(null);
  const [transferRef, setTransferRef] = useState('');
  const [senderName, setSenderName] = useState(user?.name || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successSubmitted, setSuccessSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isUpgradeModalOpen) return null;

  const currentPlan = user?.plan || 'free';
  const pendingUpgrade = user?.pendingUpgrade;
  const isPending = !!pendingUpgrade && pendingUpgrade.status === 'pending';

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleStartUpgrade = (tier: 'pro' | 'premium') => {
    setSelectedPlan(tier);
    setErrorMessage(null);
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    if (!senderName.trim()) {
      setErrorMessage('Please enter the bank account name the transfer was sent from.');
      return;
    }

    if (!transferRef.trim()) {
      setErrorMessage('Please enter your bank transfer reference, receipt number, or transaction ID.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await requestUpgrade(selectedPlan, transferRef.trim(), senderName.trim(), notes.trim());
      setSuccessSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit upgrade claim. Please check details.');
    } finally {
      setSubmitting(false);
    }
  };

  const PLANS = [
    {
      id: 'free' as const,
      name: 'Free Starter',
      limitDesc: '10 GENERATIONS / DAY',
      price: PLAN_PRICING.free.priceNaira,
      period: 'forever',
      description: 'Ideal for casual creators testing ideas and exploring captions.',
      features: [
        '10 daily generation batches',
        'All 5 platforms (IG, TikTok, X, FB, LI)',
        'Tone & emoji toggles',
        'Basic hashtag suggestions',
      ],
      icon: Sparkles,
      colorClass: 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50',
    },
    {
      id: 'pro' as const,
      name: 'Creator Pro',
      limitDesc: '50 GENERATIONS / DAY',
      price: PLAN_PRICING.pro.priceNaira,
      period: '/ month',
      popular: true,
      description: 'For active creators, influencers, and social media managers.',
      features: [
        '50 daily generation batches',
        'Full saved caption history & favorites',
        'Smart hashtag clustering',
        'High-priority AI response cascade',
        'Instant one-click copy & variations',
      ],
      icon: Zap,
      colorClass: 'border-violet-600 dark:border-violet-500 bg-violet-50/40 dark:bg-violet-950/30 ring-2 ring-violet-500/40',
    },
    {
      id: 'premium' as const,
      name: 'Agency Premium',
      limitDesc: 'UNLIMITED GENERATIONS',
      price: PLAN_PRICING.premium.priceNaira,
      period: '/ month',
      description: 'For power creators, marketing agencies, and growing brands.',
      features: [
        'Unlimited generations daily',
        'Highest priority AI generation queue',
        'Full saved caption history & favorites',
        'Instant multi-platform reformatting',
        'Direct priority support',
      ],
      icon: Crown,
      colorClass: 'border-amber-500/80 bg-amber-50/40 dark:bg-amber-950/30 ring-2 ring-amber-500/40',
    },
  ];

  return (
    <div id="upgrade-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div id="upgrade-modal-card" className="relative w-full max-w-4xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl my-8">
        {/* Close Button */}
        <button
          id="close-upgrade-modal-btn"
          type="button"
          onClick={closeUpgradeModal}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-300 dark:border-violet-800 mb-3">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            PRO UPGRADE & CAPACITY TIERS
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Scale Your Caption Output
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Upgrade with simple Nigerian bank transfer. Verified and activated promptly by our team.
          </p>
        </div>

        {/* Pending Upgrade Alert if active */}
        {isPending && !successSubmitted && (
          <div id="pending-upgrade-alert" className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-200 flex items-start gap-3 shadow-xs">
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold uppercase tracking-wide">Upgrade Request Pending Confirmation</span>
              <p className="mt-1 opacity-90 leading-relaxed">
                You have a pending request for the <strong className="uppercase">{pendingUpgrade.plan} Plan</strong> with reference <code className="font-mono font-bold text-slate-900 dark:text-amber-300 px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50">{pendingUpgrade.transferReference}</code>. An administrator is matching your transfer with bank records.
              </p>
            </div>
          </div>
        )}

        {/* State 1: Success Submitted */}
        {successSubmitted ? (
          <div id="upgrade-success-view" className="text-center py-8 px-4 max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto text-emerald-500 shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold">Transfer Details Received!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Your submission for <strong className="text-violet-600 dark:text-violet-400 uppercase font-bold">{selectedPlan} Plan</strong> sent from <strong className="font-semibold">{senderName}</strong> with reference <strong className="font-mono text-slate-900 dark:text-white">{transferRef}</strong> has been logged in the admin verification inbox.
            </p>
            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Status: <strong className="text-amber-600 dark:text-amber-400 font-bold uppercase">Pending Confirmation</strong></span>
            </div>
            <button
              id="back-to-generator-btn"
              onClick={() => {
                setSuccessSubmitted(false);
                setSelectedPlan(null);
                closeUpgradeModal();
              }}
              className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              Back to Caption Generator
            </button>
          </div>
        ) : selectedPlan ? (
          /* State 2: Bank Transfer Details & Payment Reference Form */
          <div id="upgrade-form-view" className="max-w-2xl mx-auto bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                <span className="font-bold text-sm">
                  Bank Transfer Details — <span className="uppercase text-violet-600 dark:text-violet-400 font-extrabold">{selectedPlan} Plan ({selectedPlan === 'pro' ? PLAN_PRICING.pro.priceNaira : PLAN_PRICING.premium.priceNaira})</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer font-medium"
              >
                Change Plan
              </button>
            </div>

            {/* Official Bank Account Information with Copy Buttons */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Official Bank Account</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold">
                  Instant Transfer
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Account Number */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Account Number</span>
                    <span className="text-base font-bold font-mono text-slate-900 dark:text-white tracking-wider">
                      {DEFAULT_BANK_DETAILS.accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(DEFAULT_BANK_DETAILS.accountNumber, 'accountNumber')}
                    className="mt-2 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'accountNumber' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'accountNumber' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                {/* Bank Name */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Bank Name</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {DEFAULT_BANK_DETAILS.bankName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(DEFAULT_BANK_DETAILS.bankName, 'bankName')}
                    className="mt-2 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'bankName' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'bankName' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                {/* Account Name */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Account Name</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {DEFAULT_BANK_DETAILS.accountName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(DEFAULT_BANK_DETAILS.accountName, 'accountName')}
                    className="mt-2 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'accountName' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'accountName' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Instruction Notice */}
            <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/50 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-violet-700 dark:text-violet-300">
                <ShieldCheck className="w-4 h-4" />
                <span>Transfer Verification Instructions:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1 text-xs leading-relaxed">
                <li>Transfer <strong>{selectedPlan === 'pro' ? '₦3,500' : '₦9,000'}</strong> to <strong>{DEFAULT_BANK_DETAILS.bankName}</strong> ({DEFAULT_BANK_DETAILS.accountNumber}).</li>
                <li>Enter the <strong>Sender Account Name</strong> and <strong>Transaction Reference</strong> below so we can verify your transfer on our bank statement.</li>
              </ol>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitTransfer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sender Account Name *
                  </label>
                  <input
                    id="sender-name-input"
                    type="text"
                    value={senderName}
                    onChange={e => setSenderName(e.target.value)}
                    placeholder="Name transfer was sent from"
                    required
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Used to identify your deposit in our bank statement.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Reference / Session ID *
                  </label>
                  <input
                    id="transfer-ref-input"
                    type="text"
                    value={transferRef}
                    onChange={e => setTransferRef(e.target.value)}
                    placeholder="e.g. 0000132410... or Transaction ID"
                    required
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Transaction number or description from your bank app.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Notes (Optional)
                </label>
                <input
                  id="transfer-notes-input"
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Sent via GTBank / Kuda at 2:30 PM"
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="w-1/3 py-2.5 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  id="submit-payment-claim-btn"
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting Claim...' : 'Submit Payment Claim'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* State 3: Plan Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map(plan => {
              const isCurrent = currentPlan === plan.id;
              const Icon = plan.icon;

              return (
                <div
                  key={plan.id}
                  id={`plan-card-${plan.id}`}
                  className={`relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 border transition-all ${
                    plan.colorClass
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-mono font-bold uppercase tracking-widest shadow-md">
                      POPULAR CHOICE
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                        <Icon
                          className={`w-4 h-4 ${
                            plan.id === 'premium'
                              ? 'text-amber-500'
                              : plan.id === 'pro'
                              ? 'text-violet-600 dark:text-violet-400'
                              : 'text-slate-500'
                          }`}
                        />
                      </div>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          CURRENT PLAN
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold uppercase tracking-wide">
                      {plan.name}
                    </h3>
                    <p className="text-[11px] font-mono font-bold text-violet-600 dark:text-violet-400 mt-0.5">
                      {plan.limitDesc}
                    </p>

                    <div className="my-4 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold font-mono">
                        {plan.price}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{plan.period}</span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
                      {plan.description}
                    </p>

                    {/* Features List */}
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-6">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.id === 'free' ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-default"
                    >
                      {isCurrent ? 'ACTIVE PLAN' : 'INCLUDED'}
                    </button>
                  ) : (
                    <button
                      id={`select-plan-${plan.id}-btn`}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => handleStartUpgrade(plan.id)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 ${
                        isCurrent
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-default'
                          : plan.id === 'premium'
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                          : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/30'
                      }`}
                    >
                      <span>{isCurrent ? 'CURRENT PLAN' : `UPGRADE TO ${plan.name.toUpperCase()}`}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <p className="text-[11px] font-mono text-slate-400 text-center mt-6">
          FIRST BANK: 3040505559 (CHRISTABEL CLEMENT) • MANUAL TRANSFERS VERIFIED BY ADMIN
        </p>
      </div>
    </div>
  );
};
