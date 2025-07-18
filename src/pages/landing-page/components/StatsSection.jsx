import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const StatsSection = () => {
  const [counters, setCounters] = useState({
    linkedin: 0,
    ai: 0,
    efficiency: 0
  });

  const stats = [
    {
      key: 'linkedin',
      icon: 'Users',
      value: 15,
      suffix: '%',
      title: 'LinkedIn Users Increased',
      description: 'More professionals joining LinkedIn daily means bigger opportunity pool for sales teams'
    },
    {
      key: 'ai',
      icon: 'Brain',
      value: 340,
      suffix: '%',
      title: 'AI Adoption in Sales',
      description: 'Forward-thinking sales teams are leveraging AI to gain competitive advantage'
    },
    {
      key: 'efficiency',
      icon: 'TrendingDown',
      value: 23,
      suffix: '%',
      title: 'Manual Prospecting Efficiency Down',
      description: 'Traditional methods are becoming less effective as competition increases'
    }
  ];

  useEffect(() => {
    const animateCounters = () => {
      stats.forEach((stat) => {
        let current = 0;
        const increment = stat.value / 50;
        const timer = setInterval(() => {
          current += increment;
          if (current >= stat.value) {
            current = stat.value;
            clearInterval(timer);
          }
          setCounters(prev => ({
            ...prev,
            [stat.key]: Math.floor(current)
          }));
        }, 40);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animateCounters();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    const section = document.getElementById('stats-section');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="stats-section" className="py-20 bg-surface">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-headline-bold text-3xl md:text-5xl text-foreground mb-6">
            Why 2025 is the Year for AI Sales
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            The sales landscape is rapidly evolving. Companies that adapt to AI-powered prospecting 
            will dominate while others struggle with outdated manual methods.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="glassmorphism rounded-xl p-8 text-center hover:scale-105 transition-transform duration-300"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name={stat.icon} size={40} color="var(--color-primary)" />
              </div>
              
              <div className="mb-4">
                <motion.span
                  className="text-5xl font-headline-black text-primary"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  {counters[stat.key]}
                </motion.span>
                <span className="text-3xl font-headline-bold text-primary">
                  {stat.suffix}
                </span>
              </div>
              
              <h3 className="font-headline-bold text-xl text-foreground mb-4">
                {stat.title}
              </h3>
              
              <p className="font-body text-muted-foreground leading-relaxed">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="glassmorphism rounded-xl p-8 max-w-4xl mx-auto">
            <h3 className="font-headline-bold text-2xl text-foreground mb-4">
              Don't Get Left Behind
            </h3>
            <p className="font-body text-lg text-muted-foreground mb-6">
              While your competitors struggle with manual prospecting, you could be generating 
              qualified leads 24/7 with AI automation.
            </p>
            <div className="flex items-center justify-center space-x-2 text-primary">
              <Icon name="Clock" size={20} />
              <span className="font-body-semibold">The time to act is now</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;