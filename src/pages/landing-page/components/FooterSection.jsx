import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const FooterSection = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: "Features", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "Integrations", href: "#integrations" },
      { label: "API Documentation", href: "/docs" }
    ],
    company: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press Kit", href: "/press" },
      { label: "Contact", href: "/contact" }
    ],
    resources: [
      { label: "Blog", href: "/blog" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Help Center", href: "/help" },
      { label: "LinkedIn Guide", href: "/guide" }
    ],
    legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" }
    ]
  };

  const socialLinks = [
    { name: "Twitter", icon: "Twitter", href: "https://twitter.com/agenticsdr" },
    { name: "LinkedIn", icon: "Linkedin", href: "https://linkedin.com/company/agenticsdr" },
    { name: "YouTube", icon: "Youtube", href: "https://youtube.com/agenticsdr" },
    { name: "GitHub", icon: "Github", href: "https://github.com/agenticsdr" }
  ];

  const contactInfo = {
    email: "hello@agenticsdr.com",
    phone: "+1 (555) 123-4567",
    address: "123 Innovation Drive, San Francisco, CA 94105"
  };

  return (
    <footer className="bg-surface border-t border-border">
      <div className="max-w-6xl mx-auto px-5 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Icon name="Zap" size={24} color="var(--color-primary-foreground)" />
                </div>
                <span className="font-headline-bold text-xl text-foreground">
                 LeadForge AI
                </span>
              </div>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Transform your LinkedIn into a 24/7 AI-powered sales machine. 
                Generate more qualified leads while you focus on closing deals.
              </p>

              {/* Contact Information */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-3">
                  <Icon name="Mail" size={16} color="var(--color-primary)" />
                  <a href={`mailto:${contactInfo.email}`} className="text-muted-foreground hover:text-primary transition-colors">
                    {contactInfo.email}
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <Icon name="Phone" size={16} color="var(--color-primary)" />
                  <a href={`tel:${contactInfo.phone}`} className="text-muted-foreground hover:text-primary transition-colors">
                    {contactInfo.phone}
                  </a>
                </div>
                <div className="flex items-start space-x-3">
                  <Icon name="MapPin" size={16} color="var(--color-primary)" className="mt-0.5" />
                  <span className="text-muted-foreground">
                    {contactInfo.address}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer Links */}
          <div className="lg:col-span-4 grid md:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: categoryIndex * 0.1 }}
                viewport={{ once: true }}
              >
                <h3 className="font-headline-bold text-foreground mb-4 capitalize">
                  {category}
                </h3>
                <ul className="space-y-3">
                  {links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Newsletter Signup 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="glassmorphism rounded-xl p-8 mb-12"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-headline-bold text-xl text-foreground mb-2">
                Stay Updated
              </h3>
              <p className="text-muted-foreground">
                Get the latest AI sales insights, tips, and product updates delivered to your inbox.
              </p>
            </div>
            <div className="flex space-x-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-body-semibold hover:bg-primary/90 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </motion.div>
        */}

        {/* Bottom Footer */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
              className="text-sm text-muted-foreground"
            >
              © {currentYear} LeadForge AI. All rights reserved.
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              viewport={{ once: true }}
              className="flex items-center space-x-4"
            >
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  aria-label={`Follow us on ${social.name}`}
                >
                  <Icon name={social.icon} size={20} />
                </a>
              ))}
            </motion.div>
          </div>

          {/* Additional Legal Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            viewport={{ once: true }}
            className="mt-8 pt-8 border-t border-border text-center"
          >
            <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Icon name="Shield" size={14} color="var(--color-primary)" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="Lock" size={14} color="var(--color-primary)" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="Award" size={14} color="var(--color-primary)" />
                <span>LinkedIn Partner</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="Database" size={14} color="var(--color-primary)" />
                <span>256-bit Encryption</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;