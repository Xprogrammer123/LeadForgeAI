import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SolutionSection = () => {
  const [activeTab, setActiveTab] = useState('before');

  const beforeAfterData = {
    before: {
      title: "Manual Prospecting (Current State)",
      items: [
        { icon: "Search", text: "Manually search LinkedIn for prospects", time: "45 min/day" },
        { icon: "FileText", text: "Research each prospect individually", time: "30 min/day" },
        { icon: "MessageSquare", text: "Write personalized messages one by one", time: "60 min/day" },
        { icon: "Send", text: "Send connection requests manually", time: "20 min/day" },
        { icon: "Clock", text: "Follow up manually (often forgotten)", time: "30 min/day" }
      ],
      totalTime: "3+ hours daily",
      results: "2-3 qualified leads per week"
    },
    after: {
      title: "AI-Powered Automation (With AgenticAI SDR)",
      items: [
        { icon: "Zap", text: "AI finds ideal prospects automatically", time: "0 min" },
        { icon: "Brain", text: "AI researches prospects instantly", time: "0 min" },
        { icon: "Sparkles", text: "AI generates personalized messages", time: "0 min" },
        { icon: "Send", text: "Auto-sends connection requests", time: "0 min" },
        { icon: "Repeat", text: "Smart follow-up sequences run 24/7", time: "0 min" }
      ],
      totalTime: "5 minutes setup",
      results: "15-20 qualified leads per week"
    }
  };

  const benefits = [
    {
      icon: "TrendingUp",
      title: "3x More Qualified Leads",
      description: "AI identifies and engages perfect prospects while you focus on closing deals"
    },
    {
      icon: "Clock",
      title: "Save 15+ Hours Weekly",
      description: "Eliminate manual prospecting tasks and reclaim your time for high-value activities"
    },
    {
      icon: "Target",
      title: "Personalized at Scale",
      description: "Every message is tailored to the prospect's profile, industry, and recent activity"
    },
    {
      icon: "Moon",
      title: "Works 24/7",
      description: "Your AI SDR never sleeps, continuously building your pipeline around the clock"
    }
  ];

  return (
    <section id="solution" className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-headline-bold text-3xl md:text-5xl text-foreground mb-6">
            The AI-Powered Solution
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform your LinkedIn into an intelligent sales machine that works around the clock, 
            finding and engaging prospects with personalized messages that convert.
          </p>
        </motion.div>

        {/* Before/After Comparison */}
        <div className="mb-20">
          <div className="flex justify-center mb-8">
            <div className="glassmorphism rounded-lg p-1 inline-flex">
              <Button
                variant={activeTab === 'before' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('before')}
                className="px-6 py-3"
              >
                Before
              </Button>
              <Button
                variant={activeTab === 'after' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('after')}
                className="px-6 py-3"
              >
                After
              </Button>
            </div>
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'before' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="glassmorphism rounded-xl p-8"
          >
            <h3 className="font-headline-bold text-2xl text-foreground mb-8 text-center">
              {beforeAfterData[activeTab].title}
            </h3>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {beforeAfterData[activeTab].items.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center space-x-4 p-4 rounded-lg bg-surface/50"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activeTab === 'before' ? 'bg-error/10' : 'bg-primary/10'
                    }`}>
                      <Icon 
                        name={item.icon} 
                        size={20} 
                        color={activeTab === 'before' ? 'var(--color-error)' : 'var(--color-primary)'} 
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-body-medium text-foreground">{item.text}</div>
                      <div className={`text-sm ${
                        activeTab === 'before' ? 'text-error' : 'text-primary'
                      }`}>
                        {item.time}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col justify-center">
                <div className="text-center p-8 rounded-xl bg-surface/30">
                  <div className="text-4xl font-headline-black mb-4">
                    <span className={activeTab === 'before' ? 'text-error' : 'text-primary'}>
                      {beforeAfterData[activeTab].totalTime}
                    </span>
                  </div>
                  <div className="text-muted-foreground mb-6">Time Investment</div>
                  
                  <div className="text-2xl font-headline-bold mb-2">
                    <span className={activeTab === 'before' ? 'text-error' : 'text-primary'}>
                      {beforeAfterData[activeTab].results}
                    </span>
                  </div>
                  <div className="text-muted-foreground">Results</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glassmorphism rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name={benefit.icon} size={32} color="var(--color-primary)" />
              </div>
              <h3 className="font-headline-bold text-lg text-foreground mb-3">
                {benefit.title}
              </h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;