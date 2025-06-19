'use client';

import { useState } from 'react';
import { X, Crown, Users, Calendar, Activity, Plus, Minus, RefreshCw } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  plan_type: 'free' | 'pro';
  credits_used: number;
  last_active: string;
  total_generations: number;
}

interface UserDetailModalProps {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

export function UserDetailModal({ user, isOpen, onClose, onUserUpdated }: UserDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [creditAdjustment, setCreditAdjustment] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [planChangeLoading, setPlanChangeLoading] = useState(false);

  if (!isOpen || !user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreditAdjustment = async () => {
    if (!creditAdjustment || isNaN(Number(creditAdjustment))) {
      alert('Please enter a valid number');
      return;
    }

    const amount = parseInt(creditAdjustment);
    if (amount <= 0) {
      alert('Please enter a positive number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'adjust_credits',
          userId: user.id,
          amount: adjustmentType === 'add' ? amount : -amount,
          reason: `Manual ${adjustmentType === 'add' ? 'credit addition' : 'credit deduction'} by admin`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to adjust credits');
      }

      alert(`Successfully ${adjustmentType === 'add' ? 'added' : 'subtracted'} ${amount} credits`);
      setCreditAdjustment('');
      onUserUpdated();
    } catch (error) {
      console.error('Error adjusting credits:', error);
      alert('Failed to adjust credits');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (newPlan: 'free' | 'pro') => {
    if (user.plan_type === newPlan) {
      alert('User is already on this plan');
      return;
    }

    const confirmMessage = newPlan === 'pro' 
      ? 'Upgrade this user to Pro plan?' 
      : 'Downgrade this user to Free plan?';
    
    if (!confirm(confirmMessage)) return;

    setPlanChangeLoading(true);
    try {
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'change_plan',
          userId: user.id,
          newPlan,
          reason: `Manual plan change to ${newPlan} by admin`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to change plan');
      }

      alert(`Successfully ${newPlan === 'pro' ? 'upgraded' : 'downgraded'} user to ${newPlan} plan`);
      onUserUpdated();
    } catch (error) {
      console.error('Error changing plan:', error);
      alert('Failed to change plan');
    } finally {
      setPlanChangeLoading(false);
    }
  };

  const handleResetUsage = async () => {
    if (!confirm('Reset this user\'s usage statistics? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reset_usage',
          userId: user.id,
          reason: 'Manual usage reset by admin'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset usage');
      }

      alert('Successfully reset user usage statistics');
      onUserUpdated();
    } catch (error) {
      console.error('Error resetting usage:', error);
      alert('Failed to reset usage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Email</label>
                <p className="text-white font-medium">{user.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">User ID</label>
                <p className="text-white font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Plan Type</label>
                <div className="flex items-center mt-1">
                  {user.plan_type === 'pro' ? (
                    <>
                      <Crown className="w-4 h-4 text-yellow-400 mr-2" />
                      <span className="text-yellow-400 font-medium">Pro</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-400">Free</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Member Since</label>
                <div className="flex items-center mt-1">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-white">{formatDate(user.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Usage Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{user.credits_used.toLocaleString()}</p>
                <p className="text-sm text-gray-400">Credits Used</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{user.total_generations}</p>
                <p className="text-sm text-gray-400">Total Generations</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <Activity className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-white">{formatDate(user.last_active)}</span>
                </div>
                <p className="text-sm text-gray-400">Last Active</p>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Admin Actions</h3>
            
            {/* Plan Management */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-white mb-3">Plan Management</h4>
              <div className="flex gap-3">
                <button
                  onClick={() => handlePlanChange('pro')}
                  disabled={user.plan_type === 'pro' || planChangeLoading}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    user.plan_type === 'pro' || planChangeLoading
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  <span>Upgrade to Pro</span>
                </button>
                <button
                  onClick={() => handlePlanChange('free')}
                  disabled={user.plan_type === 'free' || planChangeLoading}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    user.plan_type === 'free' || planChangeLoading
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Downgrade to Free</span>
                </button>
              </div>
            </div>

            {/* Credit Adjustment */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-white mb-3">Credit Adjustment</h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'subtract')}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="add">Add Credits</option>
                  <option value="subtract">Subtract Credits</option>
                </select>
                <input
                  type="number"
                  value={creditAdjustment}
                  onChange={(e) => setCreditAdjustment(e.target.value)}
                  placeholder="Amount"
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleCreditAdjustment}
                  disabled={loading || !creditAdjustment}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    loading || !creditAdjustment
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : adjustmentType === 'add'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {adjustmentType === 'add' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  <span>Apply</span>
                </button>
              </div>
            </div>

            {/* Usage Reset */}
            <div>
              <h4 className="text-md font-medium text-white mb-3">Usage Management</h4>
              <button
                onClick={handleResetUsage}
                disabled={loading}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  loading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset Usage Statistics</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 