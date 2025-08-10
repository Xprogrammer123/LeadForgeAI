import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const PricingSection = () => {
  const [email, setEmail] = useState('');
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  const plans = [
    {
      name: "Starter",
      description: "Perfect for testing the platform",
      price: 40,
      credits: 100,
      features: [
        "Full platform access",
        "Basic analytics",
        "Email support"
      ],
      popular: false,
      cta: "Buy Credits"
    },
    {
      name: "Professional",
      description: "Best for growing outreach",
      price: 200,
      credits: 500,
      features: [
        "Full platform access",
        "Advanced analytics",
        "Priority support"
      ],
      popular: true,
      cta: "Buy Credits"
    },
    {
      name: "Enterprise",
      description: "High-volume prospecting",
      price: 300,
      credits: 1000,
      features: [
        "Full platform access",
        "Custom reporting",
        "Dedicated success manager"
      ],
      popular: false,
      cta: "Contact Sales"
    }
  ];

  const handlePricingAlert = (e) => {
    e.preventDefault();
    if (email) {
      setShowEmailCapture(false);
      setEmail('');
      // Handle form submission here
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
            Pay only for what you need — buy credits and use them anytime. No monthly commitment.
          </p>
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
                    ${plan.price}
                  </span>
                  <span className="text-muted-foreground"> / {plan.credits} credits</span>
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
                Be the first to know about special offers and credit discounts.
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
      </div>
    </section>
  );
};

export default PricingSection;
