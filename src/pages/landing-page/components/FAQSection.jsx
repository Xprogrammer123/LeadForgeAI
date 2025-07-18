import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState(0);

  const faqs = [
    {
      question: "Is AgenticAI SDR compliant with LinkedIn\'s terms of service?",
      answer: `Yes, absolutely. AgenticAI SDR is fully compliant with LinkedIn's terms of service and API guidelines. We use official LinkedIn integrations and respect all rate limits and usage policies.\n\nOur AI operates within LinkedIn's acceptable use parameters, ensuring your account remains safe and in good standing. We continuously monitor LinkedIn's policy updates to maintain compliance.`,
      category: "Compliance"
    },
    {
      question: "How quickly can I see results with AgenticAI SDR?",
      answer: `Most users see initial results within 48-72 hours of setup. Here's the typical timeline:\n\n• Day 1: Complete setup and AI training\n• Days 2-3: First prospects identified and initial outreach begins\n• Week 1: First responses and connection acceptances\n• Week 2-4: Consistent lead flow and meeting bookings\n\nThe AI improves continuously, so results typically get better over time as it learns your ideal prospect patterns.`,
      category: "Results"
    },
    {
      question: "What makes your AI personalization different from other tools?",
      answer: `Our AI goes beyond basic template personalization. It analyzes:\n\n• Recent LinkedIn activity and posts\n• Company news and industry trends\n• Mutual connections and shared interests\n• Job changes and career progression\n• Engagement patterns and response timing\n\nThis creates genuinely personalized messages that feel human-written, not automated. Our response rates are 3-4x higher than generic outreach tools.`,
      category: "Technology"
    },
    {
      question: "Can I customize the AI\'s messaging style and tone?",
      answer: `Yes, completely. During setup, you can:\n\n• Upload examples of your best-performing messages\n• Set tone preferences (professional, casual, friendly, etc.)\n• Define your unique value proposition\n• Specify industry-specific language\n• Create custom message templates\n\nThe AI learns your style and maintains consistency across all outreach while adapting to each prospect's profile.`,
      category: "Customization"
    },
    {
      question: "How does the follow-up sequence work?",
      answer: `Our smart follow-up system creates multi-touch sequences based on prospect behavior:\n\n• Connection accepted: Welcome message with value proposition\n• No response after 3 days: Soft follow-up with additional value\n• Profile viewed: Personalized message about shared interests\n• Post engagement: Comment on their content before following up\n\nThe AI adjusts timing and messaging based on response patterns and optimal engagement windows for each prospect.`,
      category: "Features"
    },
    {
      question: "What integrations are available?",
      answer: `AgenticAI SDR integrates with popular sales tools:\n\n• CRM Systems: Salesforce, HubSpot, Pipedrive, Zoho\n• Email Platforms: Gmail, Outlook, SendGrid\n• Calendar Tools: Calendly, Acuity, Google Calendar\n• Analytics: Google Analytics, Mixpanel\n• Slack for team notifications\n\nWe're constantly adding new integrations based on user requests. Custom integrations are available for Enterprise plans.`,
      category: "Integrations"
    },
    {
      question: "Is there a limit on the number of prospects I can target?",
      answer: `Limits depend on your plan:\n\n• Starter: 50 prospects per month\n• Professional: 200 prospects per month\n• Enterprise: Unlimited prospects\n\nThese limits ensure quality over quantity and maintain LinkedIn compliance. The AI focuses on highly qualified prospects rather than mass outreach, leading to better conversion rates.`,
      category: "Limits"
    },
    {
      question: "What kind of support do you provide?",
      answer: `We offer comprehensive support across all plans:\n\n• Starter: Email support with 24-hour response time\n• Professional: Priority email + live chat support\n• Enterprise: Dedicated success manager + phone support\n\nAll plans include:\n• Detailed onboarding and setup assistance\n• Best practices training\n• Regular strategy reviews\n• Access to our knowledge base and video tutorials`,
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