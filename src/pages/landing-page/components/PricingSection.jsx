import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  const plans = [
    {
      name: "Starter",
      description: "Perfect for individual sales professionals",
      monthlyPrice: 49,
      yearlyPrice: 39,
      features: [
        "50 prospects per month",
        "Basic message templates",
        "LinkedIn integration",
        "Email support",
        "Basic analytics"
      ],
      limitations: [
        "Limited customization",
        "No A/B testing"
      ],
      popular: false,
      cta: "Start Free Trial"
    },
    {
      name: "Professional",
      description: "Ideal for growing sales teams",
      monthlyPrice: 99,
      yearlyPrice: 79,
      features: [
        "200 prospects per month",
        "Advanced AI personalization",
        "Multi-sequence campaigns",
        "CRM integration",
        "Advanced analytics",
        "A/B testing",
        "Priority support"
      ],
      limitations: [],
      popular: true,
      cta: "Get Early Access"
    },
    {
      name: "Enterprise",
      description: "For large sales organizations",
      monthlyPrice: 199,
      yearlyPrice: 159,
      features: [
        "Unlimited prospects",
        "Custom AI training",
        "Team collaboration",
        "Advanced integrations",
        "Custom reporting",
        "Dedicated success manager",
        "White-label options"
      ],
      limitations: [],
      popular: false,
      cta: "Contact Sales"
    }
  ];

  const handlePricingAlert = (e) => {
    e.preventDefault();
    if (email) {
      setShowEmailCapture(false);
      setEmail('');
      // Show success message
    }
  };

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-headline-bold text-3xl md:text-5xl text-foreground mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Choose the plan that fits your sales goals. All plans include our core AI prospecting features 
            with a 14-day free trial and no setup fees.
          </p>

          {/* Yearly Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className={`font-body-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                isYearly ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <motion.div
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm"
                animate={{ x: isYearly ? 32 : 4 }}
                transition={{ duration: 0.3 }}
              />
            </button>
            <span className={`font-body-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            {isYearly && (
              <span className="bg-primary/10 text-primary text-sm font-body-semibold px-3 py-1 rounded-full">
                Save 20%
              </span>
            )}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`glassmorphism rounded-xl p-8 relative ${
                plan.popular ? 'ring-2 ring-primary scale-105' : ''
              } hover:scale-105 transition-transform duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-body-semibold">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="font-headline-bold text-2xl text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {plan.description}
                </p>
                
                <div className="mb-6">
                  <span className="text-4xl font-headline-black text-foreground">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                  {isYearly && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Billed annually (${plan.yearlyPrice * 12})
                    </div>
                  )}
                </div>

                <Button
                  variant={plan.popular ? "default" : "outline"}
                  fullWidth
                  onClick={() => setShowEmailCapture(true)}
                  className="cta-button"
                >
                  {plan.cta}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="text-sm font-body-semibold text-foreground mb-3">
                  What's included:
                </div>
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start space-x-3">
                    <Icon name="Check" size={16} color="var(--color-primary)" className="mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
                
                {plan.limitations.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <div className="text-sm font-body-semibold text-muted-foreground mb-3">
                      Limitations:
                    </div>
                    {plan.limitations.map((limitation, limitIndex) => (
                      <div key={limitIndex} className="flex items-start space-x-3">
                        <Icon name="X" size={16} color="var(--color-muted-foreground)" className="mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{limitation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Email Capture Modal */}
        {showEmailCapture && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowEmailCapture(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative glassmorphism rounded-xl p-8 max-w-md mx-4"
            >
              <button
                onClick={() => setShowEmailCapture(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Icon name="X" size={20} color="var(--color-foreground)" />
              </button>
              
              <h3 className="font-headline-bold text-xl text-foreground mb-4">
                Get Pricing Updates
              </h3>
              <p className="text-muted-foreground mb-6">
                Be the first to know about special offers and pricing changes.
              </p>
              
              <form onSubmit={handlePricingAlert} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" fullWidth>
                  Notify Me
                </Button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Money Back Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="glassmorphism rounded-xl p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Icon name="Shield" size={32} color="var(--color-primary)" />
              <h3 className="font-headline-bold text-2xl text-foreground">
                30-Day Money-Back Guarantee
              </h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Try AgenticAI SDR risk-free. If you don't see at least 2x improvement in your lead generation within 30 days, we'll refund every penny.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Icon name="Clock" size={16} color="var(--color-primary)" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="CreditCard" size={16} color="var(--color-primary)" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="X" size={16} color="var(--color-primary)" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;