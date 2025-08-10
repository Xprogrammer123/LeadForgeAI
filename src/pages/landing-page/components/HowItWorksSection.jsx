import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const HowItWorksSection = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      number: "01",
      title: "Create Your Campaign",
      description:
        "Easily create a new campaign in our dashboard. Supabase automatically generates a unique campaign ID so everything stays organized and traceable.",
      features: [
        "Quick campaign creation form",
        "Automatic UUID generation",
        "Supabase-powered storage",
        "Instant availability in dashboard"
      ],
      icon: "FolderPlus",
      color: "primary"
    },
    {
      number: "02",
      title: "Add & Manage Prospects",
      description:
        "Upload or sync your prospect list, or let the AI find them for you. All prospects are linked directly to your campaign via the campaign ID.",
      features: [
        "Manual upload or API sync",
        "AI prospect finder",
        "Real-time list updates",
        "Secure Supabase storage"
      ],
      icon: "Users",
      color: "secondary"
    },
    {
      number: "03",
      title: "Launch & Track Automation",
      description:
        "Run your outreach sequences directly from the platform. Monitor open rates, responses, and conversions, all tied back to the campaign ID for accurate tracking.",
      features: [
        "Automated outreach sequences",
        "Email & LinkedIn integration",
        "Response and status tracking",
        "Detailed campaign analytics"
      ],
      icon: "TrendingUp",
      color: "accent"
    }
  ];

  const handleStepClick = (index) => {
    setActiveStep(index);
  };

  return (
    <section id="how-it-works" className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-headline-bold text-3xl md:text-5xl text-foreground mb-6">
            How It Works
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            From campaign creation to automated outreach — here’s how your AI-powered lead generation runs on Supabase.
          </p>
        </motion.div>

        {/* Step Navigation */}
        <div className="flex justify-center mb-12">
          <div className="flex space-x-4 glassmorphism rounded-lg p-2">
            {steps.map((step, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`px-6 py-3 rounded-lg font-body-semibold transition-all duration-300 ${
                  activeStep === index
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Step {step.number}
              </button>
            ))}
          </div>
        </div>

        {/* Step Details */}
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <div className="flex items-center space-x-4 mb-6">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  steps[activeStep].color === 'primary'
                    ? 'bg-primary/10'
                    : steps[activeStep].color === 'secondary'
                    ? 'bg-secondary/10'
                    : 'bg-accent/10'
                }`}
              >
                <Icon
                  name={steps[activeStep].icon}
                  size={32}
                  color={
                    steps[activeStep].color === 'primary'
                      ? 'var(--color-primary)'
                      : steps[activeStep].color === 'secondary'
                      ? 'var(--color-secondary)'
                      : 'var(--color-accent)'
                  }
                />
              </div>
              <div>
                <div className="text-sm font-body-semibold text-muted-foreground">
                  Step {steps[activeStep].number}
                </div>
                <h3 className="font-headline-bold text-2xl text-foreground">
                  {steps[activeStep].title}
                </h3>
              </div>
            </div>

            <p className="font-body text-lg text-muted-foreground mb-8 leading-relaxed">
              {steps[activeStep].description}
            </p>

            <div className="space-y-4">
              {steps[activeStep].features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <Icon name="Check" size={20} color="var(--color-primary)" />
                  <span className="font-body-medium text-foreground">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="glassmorphism rounded-xl p-8">
            <div className="aspect-square bg-surface/50 rounded-lg flex items-center justify-center relative overflow-hidden">
              {/* Background dots */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`absolute w-2 h-2 rounded-full ${
                      steps[activeStep].color === 'primary'
                        ? 'bg-primary'
                        : steps[activeStep].color === 'secondary'
                        ? 'bg-secondary'
                        : 'bg-accent'
                    }`}
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${30 + i * 10}%`
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 0.8, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3
                    }}
                  />
                ))}
              </div>

              {/* Central Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`w-24 h-24 rounded-full flex items-center justify-center ${
                  steps[activeStep].color === 'primary'
                    ? 'bg-primary/20'
                    : steps[activeStep].color === 'secondary'
                    ? 'bg-secondary/20'
                    : 'bg-accent/20'
                }`}
              >
                <Icon
                  name={steps[activeStep].icon}
                  size={48}
                  color={
                    steps[activeStep].color === 'primary'
                      ? 'var(--color-primary)'
                      : steps[activeStep].color === 'secondary'
                      ? 'var(--color-secondary)'
                      : 'var(--color-accent)'
                  }
                />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Progress dots */}
        <div className="flex justify-center mt-12">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <motion.div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === activeStep ? 'bg-primary' : 'bg-muted'
                }`}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
