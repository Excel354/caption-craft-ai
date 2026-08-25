import React, { useState } from 'react';
import { X, Check, Zap, Crown, Sparkles, Building2, Clock, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppLogo } from './AppLogo';

export const UpgradeModal: React.FC = () => {
  const { user, isUpgradeModalOpen, closeUpgradeModal, requestUpgrade } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'premium' | null>(null);
  const [transferRef, setTransferRef] = useState('');
  const [senderName, setSenderName] = useState(user?.name || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successSubmitted, setSuccessSubmitted] = useState(false);

  if (!isUpgradeModalOpen) return null;

  const currentPlan = user?.plan || 'free';
  const pendingUpgrade = user?.pendingUpgrade;
  const isPending = !!pendingUpgrade && pendingUpgrade.status === 'pending';

  const handleStartUpgrade = (tier: 'pro' | 'premium') => {
    setSelectedPlan(tier);
    setErrorMessage(null);
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (!transferRef.trim()) {
      setErrorMessage('Please enter your bank transfer reference or transaction ID.');
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
      price: '$0',
      period: 'forever',
      description: 'Ideal for casual creators testing ideas and exploring platforms.',
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
      price: '$9',
      period: '/ month',
      popular: true,
      description: 'For active creators, influencers, and social media managers.',
      features: [
        '50 daily generation batches',
        'Full saved caption history',
        'Smart hashtag clustering',
        'High-priority AI response queue',
        'Export and one-click copy options',
      ],
      icon: Zap,
      colorClass: 'border-[#7C3AED] dark:border-[#7C3AED] bg-[#EDE9FE]/30 dark:bg-purple-950/20 ring-2 ring-[#7C3AED]/40',
    },
    {
      id: 'premium' as const,
      name: 'Agency Premium',
      limitDesc: 'UNLIMITED GENERATIONS',
      price: '$19',
      period: '/ month',
      description: 'For marketing agencies, power creators, and scaling brands.',
      features: [
        'Unlimited generations daily',
        'No quota restrictions',
        'Full saved caption history & favorites',
        'Instant multi-platform reformatting',
        'Direct priority support',
      ],
      icon: Crown,
      colorClass: 'border-amber-500/80 bg-amber-50/30 dark:bg-amber-950/20 ring-2 ring-amber-500/40',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#172554] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-700/80 p-6 sm:p-8 shadow-2xl my-8">
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#EDE9FE] text-[#7C3AED] dark:bg-[#7C3AED]/20 dark:text-[#EDE9FE] border border-[#7C3AED]/30 mb-3">
            <Crown className="w-3.5 h-3.5 text-[#FACC15]" />
            PRO UPGRADE & CAPACITY TIERS
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans">
            Scale Your Caption Power
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 mt-1.5">
            Upgrade with simple manual bank transfer. Verified and activated promptly by our admin team.
          </p>
        </div>

        {/* Pending Upgrade Alert if active */}
        {isPending && !successSubmitted && (
          <div className="mb-6 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/40 text-yellow-800 dark:text-yellow-200 flex items-start gap-3 shadow-xs">
            <Clock className="w-5 h-5 text-[#FACC15] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold">Upgrade Request Pending Confirmation</span>
              <p className="mt-0.5 opacity-90">
                You have a pending request for the <strong className="uppercase">{pendingUpgrade.plan} Plan</strong> with transfer reference <code className="font-mono font-bold text-slate-900 dark:text-yellow-300">{pendingUpgrade.transferReference}</code>. An administrator is verifying your transfer.
              </p>
            </div>
          </div>
        )}

        {/* State 1: Success Submitted */}
        {successSubmitted ? (
          <div className="text-center py-8 px-4 max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto text-emerald-500 shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold">Transfer Claim Received!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Your claim for <strong className="text-[#7C3AED] uppercase">{selectedPlan} Plan</strong> with reference <strong className="font-mono text-slate-900 dark:text-white">{transferRef}</strong> has been sent to our verification queue.
            </p>
            <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Status: <span className="text-[#FACC15] font-bold">PENDING ADMIN APPROVAL</span>
            </div>
            <button
              onClick={() => {
                setSuccessSubmitted(false);
                setSelectedPlan(null);
                closeUpgradeModal();
              }}
              className="w-full py-2.5 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              Back to Generator
            </button>
          </div>
        ) : selectedPlan ? (
          /* State 2: Bank Transfer Instruction & Reference Form */
          <div className="max-w-xl mx-auto bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#7C3AED]" />
                <span className="font-bold text-sm">
                  Manual Bank Transfer — <span className="uppercase text-[#7C3AED]">{selectedPlan} Plan</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                Change Plan
              </button>
            </div>

            {/* Instruction Notice */}
            <div className="p-4 rounded-xl bg-[#EDE9FE]/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[#7C3AED] dark:text-purple-300">
                <ShieldCheck className="w-4 h-4" />
                <span>How Manual Bank Transfer Works:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1 text-[11px] leading-relaxed">
                <li>Initiate a manual bank transfer for <strong>{selectedPlan === 'pro' ? '$9/month' : '$19/month'}</strong> using your standard online banking or wire application.</li>
                <li>Include your account email <code className="bg-white dark:bg-slate-950 px-1 py-0.5 rounded font-bold text-[#7C3AED]">{user?.email}</code> in your payment memo/reference note.</li>
                <li>Enter your bank transaction code / receipt reference below so our administration team can match and activate your plan.</li>
              </ol>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase font-mono text-slate-600 dark:text-slate-300 mb-1">
                  Bank Transfer Reference / Transaction ID *
                </label>
                <input
                  type="text"
                  value={transferRef}
                  onChange={e => setTransferRef(e.target.value)}
                  placeholder="e.g. TXN-94827103 or Wire Receipt No."
                  required
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED] font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase font-mono text-slate-600 dark:text-slate-300 mb-1">
                    Sender Account Name
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={e => setSenderName(e.target.value)}
                    placeholder="Name on bank account"
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase font-mono text-slate-600 dark:text-slate-300 mb-1">
                    Additional Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Bank name or time sent"
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
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
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-2.5 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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
                  className={`relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 border transition-all ${
                    plan.colorClass
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#7C3AED] text-white text-[10px] font-mono font-bold uppercase tracking-widest shadow-md">
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
                              ? 'text-[#7C3AED]'
                              : 'text-slate-500'
                          }`}
                        />
                      </div>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          CURRENT TIER
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold uppercase tracking-wide">
                      {plan.name}
                    </h3>
                    <p className="text-[11px] font-mono font-bold text-[#7C3AED] dark:text-[#A78BFA] mt-0.5">
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
                      {isCurrent ? 'ACTIVE TIER' : 'INCLUDED'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => handleStartUpgrade(plan.id)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 ${
                        isCurrent
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-default'
                          : plan.id === 'premium'
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                          : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-purple-600/30'
                      }`}
                    >
                      <span>{isCurrent ? 'CURRENT TIER' : `TRANSFER FOR ${plan.name.toUpperCase()}`}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <p className="text-[11px] font-mono text-slate-400 text-center mt-6">
          MANUAL BANK TRANSFERS ARE VERIFIED MANUALLY BY SYSTEM ADMINISTRATORS
        </p>
      </div>
    </div>
  );
};
