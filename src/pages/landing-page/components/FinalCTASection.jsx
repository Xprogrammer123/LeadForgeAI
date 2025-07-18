import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const FinalCTASection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    hours: 72,
    minutes: 0,
    seconds: 0
  });

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) {
          return prev;
        }

        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 5000);
    }
  };

  const urgencyFeatures = [
    {
      icon: "Users",
      text: "Only 500 beta spots remaining"
    },
    {
      icon: "Percent",
      text: "30% early access discount"
    },
    {
      icon: "Clock",
      text: "Priority onboarding support"
    },
    {
      icon: "Star",
      text: "Lifetime feature updates"
    }
  ];

  return (
    <section id="get-access" className="py-20 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #84cc16 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, #22c55e 0%, transparent 50%)`
        }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-5 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Urgency Badge */}
          <div className="inline-flex items-center space-x-2 bg-error/10 border border-error/20 rounded-full px-4 py-2 mb-8">
            <div className="w-2 h-2 bg-error rounded-full animate-pulse" />
            <span className="text-sm font-body-semibold text-error">
              Limited Beta Access - Ending Soon
            </span>
          </div>

          {/* Main Headline */}
          <h2 className="font-headline-black text-4xl md:text-6xl text-foreground mb-6 leading-tight">
            Don't Miss Your Chance to{' '}
            <span className="text-primary">10x Your Sales</span>
          </h2>

          <p className="font-body text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Join the exclusive beta and be among the first to experience AI-powered LinkedIn prospecting. 
            Limited spots available with special early access pricing.
          </p>

          {/* Countdown Timer */}
          <div className="glassmorphism rounded-xl p-8 mb-12">
            <h3 className="font-headline-bold text-2xl text-foreground mb-6">
              Beta Access Closes In:
            </h3>
            
            <div className="flex justify-center items-center space-x-8 mb-6">
              <div className="text-center">
                <motion.div
                  key={timeLeft.hours}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-4xl md:text-6xl font-headline-black text-primary mb-2"
                >
                  {timeLeft.hours.toString().padStart(2, '0')}
                </motion.div>
                <div className="text-sm font-body-medium text-muted-foreground">Hours</div>
              </div>
              
              <div className="text-4xl text-primary">:</div>
              
              <div className="text-center">
                <motion.div
                  key={timeLeft.minutes}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-4xl md:text-6xl font-headline-black text-primary mb-2"
                >
                  {timeLeft.minutes.toString().padStart(2, '0')}
                </motion.div>
                <div className="text-sm font-body-medium text-muted-foreground">Minutes</div>
              </div>
              
              <div className="text-4xl text-primary">:</div>
              
              <div className="text-center">
                <motion.div
                  key={timeLeft.seconds}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-4xl md:text-6xl font-headline-black text-primary mb-2"
                >
                  {timeLeft.seconds.toString().padStart(2, '0')}
                </motion.div>
                <div className="text-sm font-body-medium text-muted-foreground">Seconds</div>
              </div>
            </div>
          </div>

          {/* Urgency Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {urgencyFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glassmorphism rounded-lg p-6 text-center"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name={feature.icon} size={24} color="var(--color-primary)" />
                </div>
                <p className="text-sm font-body-medium text-foreground">{feature.text}</p>
              </motion.div>
            ))}
          </div>

          {/* Email Capture Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="glassmorphism rounded-xl p-8 max-w-2xl mx-auto"
          >
            {!isSubmitted ? (
              <>
                <h3 className="font-headline-bold text-2xl text-foreground mb-4">
                  Secure Your Beta Access Now
                </h3>
                <p className="text-muted-foreground mb-6">
                  Enter your email to join the exclusive beta and get 30% off your first year.
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input
                    type="email"
                    placeholder="Enter your work email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="text-center"
                  />
                  
                  <Button
                    type="submit"
                    variant="default"
                    size="lg"
                    fullWidth
                    iconName="ArrowRight"
                    iconPosition="right"
                    className="cta-button text-lg py-4"
                  >
                    Get Exclusive Beta Access
                  </Button>
                </form>

                <div className="flex flex-wrap justify-center items-center gap-6 mt-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Icon name="Shield" size={16} color="var(--color-primary)" />
                    <span>No spam, ever</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon name="Clock" size={16} color="var(--color-primary)" />
                    <span>Setup in 5 minutes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon name="X" size={16} color="var(--color-primary)" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon name="CheckCircle" size={48} color="var(--color-primary)" />
                </div>
                <h3 className="font-headline-bold text-2xl text-foreground mb-4">
                  Welcome to the Beta!
                </h3>
                <p className="text-muted-foreground mb-6">
                  You're all set! We'll send you exclusive beta access details and setup instructions within 24 hours.
                </p>
                <div className="glassmorphism rounded-lg p-4 inline-block">
                  <p className="text-sm text-primary font-body-semibold">
                    🎉 You've saved 30% on your first year!
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Icon name="Users" size={16} color="var(--color-primary)" />
                <span>2,347 beta users already joined</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="Star" size={16} color="var(--color-primary)" />
                <span>4.9/5 average rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="TrendingUp" size={16} color="var(--color-primary)" />
                <span>3x average lead increase</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTASection;