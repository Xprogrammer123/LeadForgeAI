import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const ProblemSection = () => {
  const problems = [
    {
      icon: "Clock",
      title: "3+ Hours Daily Wasted",
      description: "Sales reps spend 21 hours per week on manual prospecting instead of selling",
      stat: "87%",
      statLabel: "of sales time on non-selling activities"
    },
    {
      icon: "TrendingDown",
      title: "Response Rates Declining",
      description: "Generic LinkedIn messages get ignored, with response rates dropping yearly",
      stat: "2.3%",
      statLabel: "average LinkedIn response rate"
    },
    {
      icon: "Users",
      title: "Can\'t Scale Without Hiring",
      description: "Growing outreach means hiring more SDRs, increasing costs exponentially",
      stat: "$75K",
      statLabel: "average SDR salary + benefits"
    }
  ];

  return (
    <section id="problem" className="py-20 bg-surface">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-headline-bold text-3xl md:text-5xl text-foreground mb-6">
            The LinkedIn Prospecting Problem
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            Sales teams are drowning in manual tasks while missing opportunities. 
            The old way of prospecting doesn't scale in 2025.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="glassmorphism rounded-xl p-8 text-center hover:scale-105 transition-transform duration-300"
            >
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name={problem.icon} size={32} color="var(--color-error)" />
              </div>
              
              <h3 className="font-headline-bold text-xl text-foreground mb-4">
                {problem.title}
              </h3>
              
              <p className="font-body text-muted-foreground mb-6 leading-relaxed">
                {problem.description}
              </p>
              
              <div className="border-t border-border pt-6">
                <div className="text-3xl font-headline-black text-error mb-2">
                  {problem.stat}
                </div>
                <div className="text-sm font-body-medium text-muted-foreground">
                  {problem.statLabel}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pain Point Quote */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="glassmorphism rounded-xl p-8 max-w-4xl mx-auto">
            <Icon name="Quote" size={48} color="var(--color-primary)" className="mx-auto mb-6 opacity-50" />
            <blockquote className="font-body text-xl md:text-2xl text-foreground mb-6 italic">
              "I spend more time searching for prospects than actually talking to them. 
              By the time I craft personalized messages, my best leads have gone cold."
            </blockquote>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Icon name="User" size={24} color="var(--color-muted-foreground)" />
              </div>
              <div className="text-left">
                <div className="font-body-semibold text-foreground">Sarah Chen</div>
                <div className="text-sm text-muted-foreground">Senior SDR, TechCorp</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;