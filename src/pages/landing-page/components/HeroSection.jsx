import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const HeroSection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Animated Waveform Background */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#84cc16" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#22c55e" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#84cc16" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {[...Array(8)].map((_, i) => (
            <motion.path
              key={i}
              d={`M0,${400 + i * 20} Q300,${350 + i * 15} 600,${400 + i * 20} T1200,${400 + i * 20}`}
              stroke="url(#waveGradient)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: 1, 
                opacity: [0, 0.8, 0.4, 0.8, 0.4],
                y: [0, -10, 0, 10, 0]
              }}
              transition={{ 
                duration: 4 + i * 0.5, 
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-5 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Trust Indicator */}
          <div className="inline-flex items-center space-x-2 glassmorphism rounded-full px-4 py-2 mb-8">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-body-medium text-muted-foreground">
              2,847 sales professionals already joined
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-headline-black text-4xl md:text-6xl lg:text-7xl text-foreground mb-6 leading-tight">
            Turn LinkedIn Into Your{' '}
            <span className="text-primary">24/7 AI Sales Machine</span>
          </h1>

          {/* Supporting Subheadline */}
          <p className="font-body text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
            Generate 3x More Qualified Leads While You Sleep - No Manual Prospecting Required
          </p>

          {/* Email Capture Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-md mx-auto"
          >
            {!isSubmitted ? (
              <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Enter your work email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  iconName="ArrowRight"
                  iconPosition="right"
                  className="cta-button whitespace-nowrap"
                >
                  Get Early Access
                </Button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glassmorphism rounded-lg p-6 text-center"
              >
                <Icon name="CheckCircle" size={48} color="var(--color-primary)" className="mx-auto mb-4" />
                <h3 className="font-headline-bold text-xl text-foreground mb-2">You're In!</h3>
                <p className="text-muted-foreground">
                  We'll send you early access details within 24 hours.
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center items-center gap-8 mt-16 text-sm text-muted-foreground"
          >
            <div className="flex items-center space-x-2">
              <Icon name="Shield" size={16} color="var(--color-primary)" />
              <span>LinkedIn Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="Zap" size={16} color="var(--color-primary)" />
              <span>Setup in 5 Minutes</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="Users" size={16} color="var(--color-primary)" />
              <span>No Team Training Required</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center space-y-2 text-muted-foreground"
        >
          <span className="text-sm font-body-medium">Scroll to explore</span>
          <Icon name="ChevronDown" size={20} />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;