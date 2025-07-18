import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const UseCaseSection = () => {
  const [activeUseCase, setActiveUseCase] = useState(0);

  const useCases = [
    {
      industry: "SaaS Companies",
      icon: "Code",
      color: "primary",
      description: "Scale your software sales with AI-powered prospecting",
      challenges: [
        "Long sales cycles requiring multiple touchpoints",
        "Technical decision-makers hard to reach",
        "Need to demonstrate ROI and value proposition",
        "Competitive market with similar solutions"
      ],
      solutions: [
        "AI identifies decision-makers and technical influencers",
        "Personalized messages highlighting relevant use cases",
        "Automated follow-up sequences for long sales cycles",
        "Integration with product usage data for warm leads"
      ],
      results: {
        leadIncrease: "4x",
        timeReduction: "60%",
        responseRate: "12%"
      },
      testimonial: {
        quote: "AgenticAI SDR helped us identify and engage CTOs at growing startups. Our demo booking rate increased 300% in just 2 months.",
        author: "Sarah Kim, VP Sales at CloudTech"
      }
    },
    {
      industry: "Consulting Firms",
      icon: "Users",
      color: "secondary",
      description: "Connect with executives who need strategic guidance",
      challenges: [
        "Reaching C-level executives and decision-makers",
        "Demonstrating expertise and credibility",
        "Building trust before the first meeting",
        "Competing with established consulting firms"
      ],
      solutions: [
        "AI targets executives based on company growth signals",
        "Messages reference recent company news and challenges",
        "Thought leadership content shared automatically",
        "Warm introductions through mutual connections"
      ],
      results: {
        leadIncrease: "3x",
        timeReduction: "70%",
        responseRate: "8%"
      },
      testimonial: {
        quote: "The AI perfectly identifies companies going through transitions that need our expertise. We've booked more C-suite meetings than ever before.",
        author: "Michael Chen, Partner at Strategic Advisors"
      }
    },
    {
      industry: "Marketing Agencies",
      icon: "Megaphone",
      color: "accent",
      description: "Find businesses ready to scale their marketing efforts",
      challenges: [
        "Identifying companies with marketing budget",
        "Proving ROI in competitive agency market",
        "Reaching marketing directors and CMOs",
        "Showcasing portfolio and case studies effectively"
      ],
      solutions: [
        "AI detects hiring patterns and growth indicators",
        "Personalized outreach with relevant case studies",
        "Automated sharing of marketing insights and tips",
        "Follow-up sequences with portfolio highlights"
      ],
      results: {
        leadIncrease: "5x",
        timeReduction: "55%",
        responseRate: "15%"
      },
      testimonial: {
        quote: "We went from cold calling to having qualified prospects reach out to us. The AI finds companies at the perfect growth stage for our services.",
        author: "Lisa Rodriguez, Founder of GrowthLab Agency"
      }
    }
  ];

  const handleUseCaseChange = (index) => {
    setActiveUseCase(index);
  };

  return (
    <section className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-headline-bold text-3xl md:text-5xl text-foreground mb-6">
            Perfect for Every Industry
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            See how AgenticAI SDR adapts to different industries and use cases. 
            Our AI understands industry-specific challenges and tailors outreach accordingly.
          </p>
        </motion.div>

        {/* Industry Selector */}
        <div className="flex justify-center mb-12">
          <div className="flex flex-wrap justify-center gap-4 glassmorphism rounded-lg p-2">
            {useCases.map((useCase, index) => (
              <Button
                key={index}
                variant={activeUseCase === index ? "default" : "ghost"}
                onClick={() => handleUseCaseChange(index)}
                iconName={useCase.icon}
                iconPosition="left"
                className="px-6 py-3"
              >
                {useCase.industry}
              </Button>
            ))}
          </div>
        </div>

        {/* Active Use Case Content */}
        <motion.div
          key={activeUseCase}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid lg:grid-cols-2 gap-12"
        >
          {/* Use Case Details */}
          <div className="space-y-8">
            <div className="glassmorphism rounded-xl p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  useCases[activeUseCase].color === 'primary' ? 'bg-primary/10' :
                  useCases[activeUseCase].color === 'secondary'? 'bg-secondary/10' : 'bg-accent/10'
                }`}>
                  <Icon 
                    name={useCases[activeUseCase].icon} 
                    size={32} 
                    color={`var(--color-${useCases[activeUseCase].color})`}
                  />
                </div>
                <div>
                  <h3 className="font-headline-bold text-2xl text-foreground">
                    {useCases[activeUseCase].industry}
                  </h3>
                  <p className="text-muted-foreground">
                    {useCases[activeUseCase].description}
                  </p>
                </div>
              </div>

              {/* Challenges */}
              <div className="mb-8">
                <h4 className="font-headline-bold text-lg text-foreground mb-4 flex items-center">
                  <Icon name="AlertCircle" size={20} color="var(--color-error)" className="mr-2" />
                  Common Challenges
                </h4>
                <div className="space-y-3">
                  {useCases[activeUseCase].challenges.map((challenge, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Icon name="X" size={16} color="var(--color-error)" className="mt-1 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{challenge}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solutions */}
              <div>
                <h4 className="font-headline-bold text-lg text-foreground mb-4 flex items-center">
                  <Icon name="CheckCircle" size={20} color="var(--color-primary)" className="mr-2" />
                  AI-Powered Solutions
                </h4>
                <div className="space-y-3">
                  {useCases[activeUseCase].solutions.map((solution, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Icon name="Check" size={16} color="var(--color-primary)" className="mt-1 flex-shrink-0" />
                      <span className="text-sm text-foreground">{solution}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="glassmorphism rounded-xl p-8">
              <h4 className="font-headline-bold text-lg text-foreground mb-6 text-center">
                Typical Results
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-3xl font-headline-black mb-2 text-${useCases[activeUseCase].color}`}>
                    {useCases[activeUseCase].results.leadIncrease}
                  </div>
                  <div className="text-sm text-muted-foreground">More Leads</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-headline-black mb-2 text-${useCases[activeUseCase].color}`}>
                    {useCases[activeUseCase].results.timeReduction}
                  </div>
                  <div className="text-sm text-muted-foreground">Time Saved</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-headline-black mb-2 text-${useCases[activeUseCase].color}`}>
                    {useCases[activeUseCase].results.responseRate}
                  </div>
                  <div className="text-sm text-muted-foreground">Response Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial & Visual */}
          <div className="space-y-8">
            <div className="glassmorphism rounded-xl p-8">
              <Icon name="Quote" size={48} color="var(--color-primary)" className="mx-auto mb-6 opacity-50" />
              <blockquote className="font-body text-lg text-foreground mb-6 italic text-center">
                "{useCases[activeUseCase].testimonial.quote}"
              </blockquote>
              <div className="text-center">
                <div className="font-body-semibold text-foreground">
                  {useCases[activeUseCase].testimonial.author}
                </div>
              </div>
            </div>

            {/* Visual Representation */}
            <div className="glassmorphism rounded-xl p-8">
              <div className="aspect-square bg-surface/50 rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* Industry-specific visualization */}
                <div className="absolute inset-0 opacity-10">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-3 h-3 rounded-full ${
                        useCases[activeUseCase].color === 'primary' ? 'bg-primary' :
                        useCases[activeUseCase].color === 'secondary'? 'bg-secondary' : 'bg-accent'
                      }`}
                      style={{
                        left: `${10 + (i * 8)}%`,
                        top: `${20 + (i * 6)}%`
                      }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.8, 0.3]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </div>

                {/* Central Icon */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className={`w-32 h-32 rounded-full flex items-center justify-center ${
                    useCases[activeUseCase].color === 'primary' ? 'bg-primary/20' :
                    useCases[activeUseCase].color === 'secondary'? 'bg-secondary/20' : 'bg-accent/20'
                  }`}
                >
                  <Icon 
                    name={useCases[activeUseCase].icon} 
                    size={64} 
                    color={`var(--color-${useCases[activeUseCase].color})`}
                  />
                </motion.div>

                {/* Connecting Lines */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`absolute w-1 ${
                      useCases[activeUseCase].color === 'primary' ? 'bg-primary' :
                      useCases[activeUseCase].color === 'secondary'? 'bg-secondary' : 'bg-accent'
                    }`}
                    style={{
                      height: '40px',
                      left: '50%',
                      top: '50%',
                      transformOrigin: '0 0',
                      transform: `rotate(${i * 60}deg)`
                    }}
                    animate={{
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
            </div>
          </div>
        </motion.div>

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
              Ready to Transform Your Industry's Approach?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of professionals who've revolutionized their prospecting 
              with industry-specific AI automation.
            </p>
            <Button variant="default" size="lg" className="cta-button">
              Start Your Free Trial
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default UseCaseSection;