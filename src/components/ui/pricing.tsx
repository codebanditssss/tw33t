'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Check } from 'lucide-react';
import { AuthModal } from "@/components/ui/auth-modal";
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

function PricingSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { user } = useAuth();

  // Listen for auth state changes
  useEffect(() => {
    if (user && selectedPlan) {
      handleSubscription(selectedPlan);
    }
  }, [user]);

  const handleSubscription = async (planName: string) => {
    if (planName === 'SuperTw33t') {
      try {
        toast.info('Creating subscription...');
        
        const response = await fetch('/api/subscription/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for auth
          body: JSON.stringify({ planType: 'pro' }),
        });

        const data = await response.json();
        console.log('Subscription creation response:', data);

        if (response.ok && data.payment_link) {
          toast.success('Redirecting to payment...');
          // Small delay to show the toast before redirect
          setTimeout(() => {
            window.location.href = data.payment_link;
          }, 1000);
        } else {
          console.error('Subscription creation failed:', data);
          toast.error(data.error || 'Failed to create subscription');
        }
      } catch (error) {
        console.error('Subscription error:', error);
        toast.error('Failed to create subscription. Please try again.');
      }
    }
    
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
      name: 'SuperTw33t',
      description: 'For power users and creators',
      price: 5.99,
      popular: true,
      features: [
        '500 credits per month',
        'All tweet styles & tones',
        'Unlimited thread generation',
        'Premium templates',
        'Priority support',
        'Advanced AI features'
      ]
    }
  ];



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
            Upgrade to SuperTw33t
          </h2>
          <p 
            className="text-xl md:text-2xl font-medium"
            style={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              maxWidth: '600px',
              margin: '0 auto'
            }}
          >
            Unlock unlimited potential for your Twitter content
          </p>
        </div>


      </div>

      {/* Free Plan Info */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{
          background: 'linear-gradient(135deg, rgba(45, 45, 55, 0.8) 0%, rgba(35, 35, 45, 0.8) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-sm" style={{ color: '#FFFFFF' }}>
            Free plan included: 50 credits per month for all users
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="flex justify-center">
        {plans.map((plan) => (
          <div 
            key={plan.name}
            className={`
              relative rounded-2xl overflow-hidden w-full max-w-md
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
                    ${plan.price === 0 ? '0' : plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm ml-2" style={{ color: '#B5B5B5' }}>
                      /month
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-sm" style={{ color: '#FFFFFF' }}>
                      {feature}
                    </span>
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
                {user ? 'Upgrade to SuperTw33t' : 'Get Started'}
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
