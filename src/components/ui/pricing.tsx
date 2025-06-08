'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Check } from 'lucide-react';
import { AuthModal } from "@/components/ui/auth-modal";
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { user } = useAuth();

  // Listen for auth state changes
  useEffect(() => {
    if (user && selectedPlan) {
      handleSubscription(selectedPlan);
    }
  }, [user]);

  const handleSubscription = (planName: string) => {
    // Here you would integrate with your payment provider
    toast.success(`Starting subscription process for ${planName} plan`);
    setSelectedPlan(null);
  };

  const handleGetStarted = (planName: string) => {
    setSelectedPlan(planName);
    if (!user) {
      setIsModalOpen(true);
      // Add visual feedback
      toast.info('Please sign up or log in to continue');
    } else {
      handleSubscription(planName);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for trying out tw33t',
      price: billingCycle === 'monthly' ? 0 : 0,
      features: {
        tweets: 'Generate up to 50 tweets/month',
        analytics: 'Basic tweet performance metrics',
        templates: '10+ tweet templates',
        support: 'Community support',
        scheduling: 'Basic scheduling',
        ai: 'Basic AI suggestions',
        collaboration: '-',
        api: '-',
        customization: '-'
      }
    },
    {
      name: 'Pro',
      description: 'For power users and creators',
      price: billingCycle === 'monthly' ? 19 : 190,
      popular: true,
      features: {
        tweets: 'Generate up to 500 tweets/month',
        analytics: 'Advanced analytics dashboard',
        templates: '50+ premium templates',
        support: 'Priority email support',
        scheduling: 'Advanced scheduling',
        ai: 'Advanced AI suggestions',
        collaboration: '2 team members',
        api: 'Basic API access',
        customization: 'Basic customization'
      }
    },
    {
      name: 'Enterprise',
      description: 'For teams and businesses',
      price: billingCycle === 'monthly' ? 49 : 490,
      features: {
        tweets: 'Unlimited tweet generation',
        analytics: 'Full analytics suite',
        templates: 'Unlimited custom templates',
        support: '24/7 dedicated support',
        scheduling: 'Custom scheduling rules',
        ai: 'Custom AI training',
        collaboration: 'Unlimited team members',
        api: 'Full API access',
        customization: 'Full customization'
      }
    }
  ];

  const featureLabels = {
    tweets: 'Tweet Generation',
    analytics: 'Analytics',
    templates: 'Templates',
    support: 'Support',
    scheduling: 'Scheduling',
    ai: 'AI Features',
    collaboration: 'Team Members',
    api: 'API Access',
    customization: 'Customization'
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16">
      <div className="text-center space-y-8 mb-16">
        <div className="space-y-4">
          <h2 
            className="text-4xl md:text-5xl font-bold"
            style={{ 
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: '1.2'
            }}
          >
            Get started with tw33t today
          </h2>
          <p 
            className="text-xl md:text-2xl font-medium"
            style={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              maxWidth: '600px',
              margin: '0 auto'
            }}
          >
            and elevate your Twitter game
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <div 
            className="inline-flex p-1.5 rounded-2xl relative"
            style={{ 
              backgroundColor: 'rgba(30, 30, 35, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
              minWidth: '300px'
            }}
          >
            {/* Sliding Background */}
            <div 
              className="absolute transition-all duration-500 ease-out"
              style={{
                top: '6px',
                bottom: '6px',
                left: billingCycle === 'monthly' ? '6px' : '50%',
                right: billingCycle === 'monthly' ? '50%' : '6px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                zIndex: 0
              }}
            />

            {/* Monthly Button */}
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`
                relative z-10 px-12 py-3 text-sm font-medium rounded-xl transition-all duration-300
                ${billingCycle === 'monthly' 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-gray-300'}
              `}
            >
              Monthly
            </button>

            {/* Yearly Button */}
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`
                relative z-10 px-12 py-3 text-sm font-medium rounded-xl transition-all duration-300
                ${billingCycle === 'yearly' 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-gray-300'}
              `}
            >
              Yearly
            </button>
          </div>

          {/* Savings Badge */}
          <div 
            className={`
              transform transition-all duration-500 ease-out
              ${billingCycle === 'yearly' 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 -translate-y-4 pointer-events-none'
              }
            `}
          >
            <div
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF'
              }}
            >
              Save 20% yearly
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan) => (
          <div 
            key={plan.name}
            className={`
              relative rounded-2xl overflow-hidden
              ${plan.popular ? 'transform -translate-y-4' : ''}
              group
            `}
            style={{
              background: plan.popular
                ? 'linear-gradient(135deg, rgba(60, 60, 70, 0.95) 0%, rgba(45, 45, 55, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(45, 45, 55, 0.8) 0%, rgba(35, 35, 45, 0.8) 100%)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${plan.popular ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
              boxShadow: plan.popular
                ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
                : '0 4px 20px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* Hover Glow Effect */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `
                  linear-gradient(135deg, 
                    ${plan.popular ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)'} 0%, 
                    transparent 100%
                  )
                `,
                border: `1px solid ${plan.popular ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
                boxShadow: `0 0 40px ${plan.popular ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '1rem'
              }}
            />

            {plan.popular && (
              <div 
                className="absolute top-0 left-0 right-0 px-4 py-2 text-center text-xs font-medium"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%)',
                  backdropFilter: 'blur(10px)',
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Most Popular
              </div>
            )}

            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#FFFFFF' }}>
                  {plan.name}
                </h3>
                <p className="text-sm" style={{ color: '#B5B5B5' }}>
                  {plan.description}
                </p>
                <div className="mt-4">
                  <span className="text-3xl font-bold" style={{ color: '#FFFFFF' }}>
                    ${billingCycle === 'monthly' ? plan.price : plan.price * 10}
                  </span>
                  <span className="text-sm ml-2" style={{ color: '#B5B5B5' }}>
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {Object.entries(plan.features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#B5B5B5' }}>
                      {key}
                    </span>
                    <div className="flex items-center">
                      <span 
                        className="text-sm ml-2" 
                        style={{ 
                          color: value === '-' ? '#666668' : '#FFFFFF'
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handleGetStarted(plan.name)}
                className={`
                  w-full py-3 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-[0.98] active:scale-[0.97]
                  ${plan.popular ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : ''}
                `}
                style={{
                  color: '#FFFFFF',
                  background: plan.popular
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)'
                    : 'linear-gradient(135deg, rgba(65,65,70,0.8) 0%, rgba(55,55,60,0.8) 100%)',
                  border: `1px solid ${plan.popular ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: plan.popular
                    ? '0 4px 20px rgba(16, 185, 129, 0.3), inset 0 1px 1px rgba(255,255,255,0.2)'
                    : '0 4px 15px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1)',
                  transform: 'translateZ(0)',
                  willChange: 'transform',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {user ? 'Choose Plan' : 'Get Started'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        defaultTab="signup"
      />
    </div>
  );
}

export { PricingSection };
