import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const SocialProofSection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const companies = [
    { name: "Salesforce", logo: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=120&h=60&fit=crop" },
    { name: "HubSpot", logo: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=120&h=60&fit=crop" },
    { name: "Pipedrive", logo: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=120&h=60&fit=crop" },
    { name: "Outreach", logo: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=120&h=60&fit=crop" },
    { name: "ZoomInfo", logo: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=120&h=60&fit=crop" },
    { name: "Apollo", logo: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=120&h=60&fit=crop" }
  ];

  const testimonials = [
    {
      id: 1,
      name: "Michael Rodriguez",
      title: "Senior SDR",
      company: "TechFlow Solutions",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
      content: "AgenticAI SDR transformed our prospecting game. We went from 5 qualified leads per week to 18. The personalization is incredible - prospects actually respond!",
      metrics: "3x more meetings booked",
      verified: true
    },
    {
      id: 2,
      name: "Sarah Chen",
      title: "Sales Manager",
      company: "GrowthTech Inc",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b9e2b8c4?w=80&h=80&fit=crop&crop=face",
      content: "I was skeptical about AI prospecting, but the results speak for themselves. Our team saves 15+ hours weekly and our pipeline is consistently full.",
      metrics: "50% time savings",
      verified: true
    },
    {
      id: 3,
      name: "David Park",
      title: "VP of Sales",
      company: "ScaleUp Ventures",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
      content: "The ROI is insane. We replaced 2 SDR positions with AgenticAI and still generate 40% more qualified opportunities. It's like having a sales team that never sleeps.",
      metrics: "$150K annual savings",
      verified: true
    },
    {
      id: 4,
      name: "Lisa Thompson",
      title: "Business Development",
      company: "InnovateCorp",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
      content: "The follow-up sequences are brilliant. Prospects get perfectly timed messages that feel human. Our response rates increased from 2% to 8%.",
      metrics: "4x response rate improvement",
      verified: true
    }
  ];

  const usageStats = [
    { label: "Messages Sent", value: "2.4M+", icon: "Send" },
    { label: "Meetings Booked", value: "47K+", icon: "Calendar" },
    { label: "Revenue Generated", value: "$12M+", icon: "DollarSign" },
    { label: "Active Users", value: "2,847", icon: "Users" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="social-proof" className="py-20 bg-surface">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-headline-bold text-3xl md:text-5xl text-foreground mb-6">
            Trusted by Sales Teams Worldwide
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            Join thousands of sales professionals who've transformed their LinkedIn prospecting 
            with AI automation and achieved remarkable results.
          </p>
        </motion.div>

        {/* Company Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-center text-sm font-body-medium text-muted-foreground mb-8">
            Used by sales teams at leading companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {companies.map((company, index) => (
              <motion.div
                key={index}
                whileHover={{ opacity: 1, scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="grayscale hover:grayscale-0 transition-all duration-300"
              >
                <Image
                  src={company.logo}
                  alt={`${company.name} logo`}
                  className="h-12 w-auto object-contain"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonial Carousel */}
        <div className="mb-16">
          <motion.div
            key={currentTestimonial}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="glassmorphism rounded-xl p-8 max-w-4xl mx-auto"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="relative">
                  <Image
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  {testimonials[currentTestimonial].verified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Icon name="Check" size={14} color="var(--color-primary-foreground)" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <blockquote className="font-body text-lg text-foreground mb-4 italic">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>
                
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-body-semibold text-foreground">
                      {testimonials[currentTestimonial].name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonials[currentTestimonial].title} at {testimonials[currentTestimonial].company}
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0">
                    <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2">
                      <Icon name="TrendingUp" size={16} color="var(--color-primary)" />
                      <span className="text-sm font-body-semibold text-primary">
                        {testimonials[currentTestimonial].metrics}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Testimonial Navigation */}
          <div className="flex justify-center mt-6 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentTestimonial ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Usage Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {usageStats.map((stat, index) => (
            <div key={index} className="glassmorphism rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name={stat.icon} size={24} color="var(--color-primary)" />
              </div>
              <div className="text-2xl font-headline-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-sm font-body-medium text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProofSection;