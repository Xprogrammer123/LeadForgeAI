import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const TrustBadgesSection = () => {
  const securityBadges = [
    {
      icon: "Shield",
      title: "SOC 2 Compliant",
      description: "Enterprise-grade security standards",
      verified: true
    },
    {
      icon: "Lock",
      title: "GDPR Compliant",
      description: "Full data protection compliance",
      verified: true
    },
    {
      icon: "Database",
      title: "256-bit Encryption",
      description: "Bank-level data encryption",
      verified: true
    }
  ];

  const certifications = [
    {
      icon: "Award",
      title: "LinkedIn Partner",
      description: "Official LinkedIn integration partner",
      badge: "Verified Partner"
    },
    {
      icon: "Brain",
      title: "AI Ethics Certified",
      description: "Responsible AI development practices",
      badge: "Certified"
    },
    {
      icon: "Users",
      title: "ISO 27001",
      description: "Information security management",
      badge: "Certified"
    }
  ];

  const awards = [
    {
      title: "Best AI Sales Tool 2024",
      organization: "Sales Tech Awards",
      year: "2024"
    },
    {
      title: "Innovation in Sales Automation",
      organization: "TechCrunch Disrupt",
      year: "2024"
    },
    {
      title: "Top 50 Sales Tools",
      organization: "G2 Crowd",
      year: "2024"
    }
  ];

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
            Trusted & Secure
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            Your data security and privacy are our top priorities. We maintain the highest 
            standards of compliance and security to protect your business information.
          </p>
        </motion.div>

        {/* Security Badges */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h3 className="font-headline-bold text-2xl text-foreground mb-4">
              Security & Compliance
            </h3>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {securityBadges.map((badge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glassmorphism rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <Icon name={badge.icon} size={32} color="var(--color-primary)" />
                  {badge.verified && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center">
                      <Icon name="Check" size={14} color="var(--color-success-foreground)" />
                    </div>
                  )}
                </div>
                <h4 className="font-headline-bold text-lg text-foreground mb-2">
                  {badge.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {badge.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h3 className="font-headline-bold text-2xl text-foreground mb-4">
              Certifications & Partnerships
            </h3>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glassmorphism rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300"
              >
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name={cert.icon} size={32} color="var(--color-secondary)" />
                </div>
                <div className="mb-3">
                  <span className="inline-block bg-secondary/10 text-secondary text-xs font-body-semibold px-3 py-1 rounded-full">
                    {cert.badge}
                  </span>
                </div>
                <h4 className="font-headline-bold text-lg text-foreground mb-2">
                  {cert.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {cert.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Awards & Recognition */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="font-headline-bold text-2xl text-foreground mb-8">
            Awards & Recognition
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {awards.map((award, index) => (
              <div key={index} className="glassmorphism rounded-xl p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Trophy" size={24} color="var(--color-accent)" />
                </div>
                <h4 className="font-headline-bold text-lg text-foreground mb-2">
                  {award.title}
                </h4>
                <p className="text-sm text-muted-foreground mb-1">
                  {award.organization}
                </p>
                <p className="text-xs text-accent font-body-semibold">
                  {award.year}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust Statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="glassmorphism rounded-xl p-8 text-center max-w-4xl mx-auto">
            <Icon name="ShieldCheck" size={48} color="var(--color-primary)" className="mx-auto mb-6" />
            <h3 className="font-headline-bold text-2xl text-foreground mb-4">
              Your Trust is Our Foundation
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              We understand that you're trusting us with your most valuable business relationships. That's why we've built AgenticAI SDR with enterprise-grade security, transparent practices, 
              and unwavering commitment to protecting your data and maintaining LinkedIn compliance.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustBadgesSection;