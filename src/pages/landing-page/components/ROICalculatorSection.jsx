import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';

const ROICalculatorSection = () => {
  const [inputs, setInputs] = useState({
    hoursPerDay: 3,
    responseRate: 2,
    dealValue: 5000,
    hourlyRate: 50
  });

  const [results, setResults] = useState({
    currentLeads: 0,
    projectedLeads: 0,
    timeSaved: 0,
    costSavings: 0,
    additionalRevenue: 0,
    totalROI: 0
  });

  useEffect(() => {
    calculateROI();
  }, [inputs]);

  const calculateROI = () => {
    const { hoursPerDay, responseRate, dealValue, hourlyRate } = inputs;
    
    // Current state calculations
    const currentWeeklyHours = hoursPerDay * 5;
    const currentMonthlyHours = currentWeeklyHours * 4;
    const currentLeadsPerWeek = (hoursPerDay * 10 * responseRate) / 100; // 10 prospects per hour
    const currentMonthlyLeads = currentLeadsPerWeek * 4;
    
    // With AI calculations
    const projectedResponseRate = responseRate * 4; // 4x improvement
    const projectedLeadsPerWeek = currentLeadsPerWeek * 3; // 3x more leads
    const projectedMonthlyLeads = projectedLeadsPerWeek * 4;
    
    // Time savings (85% reduction in manual work)
    const timeSavedHours = currentMonthlyHours * 0.85;
    const costSavings = timeSavedHours * hourlyRate;
    
    // Additional revenue from more leads
    const additionalLeads = projectedMonthlyLeads - currentMonthlyLeads;
    const additionalRevenue = additionalLeads * dealValue * 0.2; // 20% close rate
    
    // Total ROI calculation
    const totalBenefit = costSavings + additionalRevenue;
    const toolCost = 99; // Professional plan
    const totalROI = ((totalBenefit - toolCost) / toolCost) * 100;

    setResults({
      currentLeads: Math.round(currentMonthlyLeads),
      projectedLeads: Math.round(projectedMonthlyLeads),
      timeSaved: Math.round(timeSavedHours),
      costSavings: Math.round(costSavings),
      additionalRevenue: Math.round(additionalRevenue),
      totalROI: Math.round(totalROI)
    });
  };

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const metrics = [
    {
      label: "Monthly Leads",
      current: results.currentLeads,
      projected: results.projectedLeads,
      icon: "Users",
      color: "primary"
    },
    {
      label: "Hours Saved",
      current: inputs.hoursPerDay * 20,
      projected: results.timeSaved,
      icon: "Clock",
      color: "secondary"
    },
    {
      label: "Cost Savings",
      current: 0,
      projected: results.costSavings,
      icon: "DollarSign",
      color: "accent",
      prefix: "$"
    },
    {
      label: "Additional Revenue",
      current: 0,
      projected: results.additionalRevenue,
      icon: "TrendingUp",
      color: "success",
      prefix: "$"
    }
  ];

  return (
    <section className="py-20 bg-surface">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-headline-bold text-3xl md:text-5xl text-foreground mb-6">
            Calculate Your ROI
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
            See exactly how much time and money you could save with AgenticAI SDR. 
            Adjust the inputs below to match your current situation.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="glassmorphism rounded-xl p-8"
          >
            <h3 className="font-headline-bold text-2xl text-foreground mb-6">
              Your Current Situation
            </h3>
            
            <div className="space-y-6">
              <div>
                <Input
                  label="Hours spent prospecting daily"
                  type="number"
                  value={inputs.hoursPerDay}
                  onChange={(e) => handleInputChange('hoursPerDay', e.target.value)}
                  min="1"
                  max="8"
                  step="0.5"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Average sales rep spends 3-4 hours daily on prospecting
                </p>
              </div>

              <div>
                <Input
                  label="Current LinkedIn response rate (%)"
                  type="number"
                  value={inputs.responseRate}
                  onChange={(e) => handleInputChange('responseRate', e.target.value)}
                  min="1"
                  max="10"
                  step="0.1"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Industry average is 2-3% for cold LinkedIn outreach
                </p>
              </div>

              <div>
                <Input
                  label="Average deal value ($)"
                  type="number"
                  value={inputs.dealValue}
                  onChange={(e) => handleInputChange('dealValue', e.target.value)}
                  min="1000"
                  max="100000"
                  step="500"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Your typical deal size or contract value
                </p>
              </div>

              <div>
                <Input
                  label="Your hourly rate ($)"
                  type="number"
                  value={inputs.hourlyRate}
                  onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                  min="25"
                  max="200"
                  step="5"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Your effective hourly rate (salary ÷ working hours)
                </p>
              </div>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="glassmorphism rounded-xl p-8">
              <h3 className="font-headline-bold text-2xl text-foreground mb-6">
                Projected Results with AI
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-surface/50 rounded-lg p-4"
                  >
                    <div className="flex items-center space-x-2 mb-3">
                      <Icon 
                        name={metric.icon} 
                        size={20} 
                        color={`var(--color-${metric.color})`} 
                      />
                      <span className="text-sm font-body-semibold text-muted-foreground">
                        {metric.label}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Current</span>
                        <span className="text-sm font-body-medium text-foreground">
                          {metric.prefix}{metric.current.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">With AI</span>
                        <span className={`text-lg font-headline-bold text-${metric.color}`}>
                          {metric.prefix}{metric.projected.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ROI Summary */}
            <div className="glassmorphism rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="Calculator" size={32} color="var(--color-primary)" />
              </div>
              
              <h4 className="font-headline-bold text-xl text-foreground mb-2">
                Total Monthly ROI
              </h4>
              
              <div className="text-4xl font-headline-black text-primary mb-4">
                {results.totalROI > 0 ? '+' : ''}{results.totalROI}%
              </div>
              
              <p className="text-muted-foreground mb-6">
                Based on your inputs, AgenticAI SDR could generate{' '}
                <span className="text-primary font-body-semibold">
                  ${(results.costSavings + results.additionalRevenue).toLocaleString()}
                </span>{' '}
                in monthly value.
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-surface/50 rounded-lg p-3">
                  <div className="text-muted-foreground">Monthly Savings</div>
                  <div className="font-body-semibold text-foreground">
                    ${results.costSavings.toLocaleString()}
                  </div>
                </div>
                <div className="bg-surface/50 rounded-lg p-3">
                  <div className="text-muted-foreground">Additional Revenue</div>
                  <div className="font-body-semibold text-foreground">
                    ${results.additionalRevenue.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
            * Results are projections based on industry averages and user-reported improvements. 
            Individual results may vary depending on industry, target audience, and implementation. 
            We offer a 30-day money-back guarantee if you don't see measurable improvement.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ROICalculatorSection;