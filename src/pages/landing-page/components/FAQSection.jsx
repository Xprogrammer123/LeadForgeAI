import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState(0);

const faqs = [
  {
    question: "How does AgenticAI SDR fetch leads from LinkedIn?",
    answer: `We use our secure Lix integration to search, filter, and fetch leads directly from LinkedIn while staying compliant with their terms. The system pulls details like job titles, industries, locations, and contact info when available.\n\nYour campaigns run through our backend service which triggers Supabase updates when each fetch completes.`,
    category: "Technology"
  },
  {
    question: "Is the lead data fresh and accurate?",
    answer: `Yes. Each lead search is performed in real time, so you’re not getting stale lists. Our Lix integration verifies contact data, checks LinkedIn activity, and flags unverified entries.\n\nWe focus on quality over volume, prioritizing verified emails and phone numbers whenever possible.`,
    category: "Data Quality"
  },
  {
    question: "What happens after a campaign finishes fetching leads?",
    answer: `When a campaign completes, our backend automatically updates its status in Supabase to "completed".\n\nThis ensures your dashboard reflects real-time progress without you having to manually track each campaign.`,
    category: "Automation"
  },
  {
    question: "Can I filter prospects before fetching?",
    answer: `Absolutely. You can target by:\n\n• Job titles\n• Industries\n• Locations\n• Company size\n• Experience level\n\nThese filters are passed to our Lix search endpoint so only relevant, qualified leads are fetched.`,
    category: "Targeting"
  },
  {
    question: "How fast can I start seeing leads?",
    answer: `In most cases, leads start appearing in your dashboard within minutes after launching a campaign. Larger searches may take a few hours to fully process.\n\nThe system updates your campaign in Supabase as soon as the fetch is done, so you’ll know the exact completion time.`,
    category: "Results"
  },
  {
    question: "What tools does AgenticAI SDR integrate with?",
    answer: `Alongside LinkedIn and Lix, we integrate with:\n\n• Supabase for storage & real-time updates\n• CRMs like HubSpot, Pipedrive, and Salesforce (via API)\n• Email delivery through Gmail, Outlook, and SendGrid\n• Slack for instant lead alerts\n\nWe can also build custom integrations for Enterprise clients.`,
    category: "Integrations"
  },
  {
    question: "Is my LinkedIn account safe?",
    answer: `Yes. All LinkedIn operations are performed via approved APIs or browser automation within compliance limits.\n\nWe never store your LinkedIn password, and we monitor usage patterns to prevent triggering LinkedIn’s security checks.`,
    category: "Compliance"
  },
  {
    question: "What kind of support do you offer?",
    answer: `We provide:\n\n• Email support for all plans\n• Priority live chat for Professional and Enterprise\n• Dedicated account managers for Enterprise\n\nWe also offer onboarding help, best practice advice, and campaign optimization sessions.`,
    category: "Support"
  }
];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? -1 : index);
  };

  return (
    <section id="faq" className="py-20 bg-surface">
      <div className="max-w-4xl mx-auto px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-headline-bold text-3xl md:text-5xl text-foreground mb-6">
            Frequently Asked Questions
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            Get answers to common questions about AgenticAI SDR. Can't find what you're looking for? 
            Contact our support team for personalized assistance.
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glassmorphism rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/20 transition-colors duration-200"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-xs font-body-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                      {faq.category}
                    </span>
                  </div>
                  <h3 className="font-body-semibold text-lg text-foreground pr-4">
                    {faq.question}
                  </h3>
                </div>
                <motion.div
                  animate={{ rotate: openFAQ === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <Icon name="ChevronDown" size={24} color="var(--color-muted-foreground)" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openFAQ === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 border-t border-border">
                      <div className="pt-4">
                        {faq.answer.split('\n').map((paragraph, pIndex) => (
                          <p key={pIndex} className="font-body text-muted-foreground leading-relaxed mb-3 last:mb-0">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="glassmorphism rounded-xl p-8">
            <Icon name="MessageCircle" size={48} color="var(--color-primary)" className="mx-auto mb-4" />
            <h3 className="font-headline-bold text-xl text-foreground mb-4">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-6">
              Our support team is here to help you succeed with AgenticAI SDR. 
              Get personalized answers to your specific questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Icon name="Clock" size={16} color="var(--color-primary)" />
                <span>24/7 Support Available</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Icon name="Zap" size={16} color="var(--color-primary)" />
                <span>Average Response: 2 hours</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;