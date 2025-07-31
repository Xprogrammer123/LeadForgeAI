import OpenAI from 'openai';

        /**
         * OpenAI service for LinkedIn SDR automation
         * Handles AI messaging, reply analysis, and intent detection
         */

        const openai = new OpenAI({
          apiKey: import.meta.env.VITE_OPENAI_API_KEY,
          dangerouslyAllowBrowser: true,
        });

        const openaiService = {
          /**
           * Generate personalized LinkedIn message using AI
           */
          generatePersonalizedMessage: async (leadData, messageTemplate, campaignContext) => {
            try {
              const prompt = `
                You are an expert LinkedIn outreach specialist. Generate a personalized LinkedIn direct message based on:
                
                Lead Information:
                - Name: ${leadData.full_name}
                - Job Title: ${leadData.job_title || 'Not specified'}
                - Company: ${leadData.company || 'Not specified'}
                - Location: ${leadData.location || 'Not specified'}
                
                Message Template: ${messageTemplate}
                
                Campaign Context: ${campaignContext}
                
                Instructions:
                1. Personalize the message using the lead's information
                2. Keep it professional but friendly
                3. Maximum 300 characters (LinkedIn DM limit)
                4. Include a clear call-to-action
                5. Avoid spam-like language
                
                Generate only the message content, no additional text.
              `;

              const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                  { role: 'system', content: 'You are a professional LinkedIn outreach specialist.' },
                  { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 150
              });

              return {
                success: true,
                message: response.choices[0].message.content.trim()
              };
            } catch (error) {
              console.error('Error generating personalized message:', error);
              return {
                success: false,
                error: 'Failed to generate personalized message'
              };
            }
          },

          /**
           * Analyze reply content for intent detection
           */
          analyzeReplyIntent: async (originalMessage, replyContent) => {
            try {
              const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                  {
                    role: 'system',
                    content: `You are an AI assistant that analyzes LinkedIn message replies to determine if the prospect is interested in scheduling a meeting or call. Respond only with a JSON object containing: {"intent": "interested|not_interested|unclear", "confidence": 0.0-1.0, "reason": "brief explanation", "suggested_action": "action to take"}`
                  },
                  {
                    role: 'user',
                    content: `Original Message: "${originalMessage}"\n\nReply: "${replyContent}"\n\nAnalyze the intent:`
                  }
                ],
                response_format: {
                  type: 'json_schema',
                  json_schema: {
                    name: 'reply_analysis',
                    schema: {
                      type: 'object',
                      properties: {
                        intent: { type: 'string' },
                        confidence: { type: 'number' },
                        reason: { type: 'string' },
                        suggested_action: { type: 'string' }
                      },
                      required: ['intent', 'confidence', 'reason', 'suggested_action'],
                      additionalProperties: false
                    }
                  }
                },
                temperature: 0.3
              });

              const analysis = JSON.parse(response.choices[0].message.content);
              
              return {
                success: true,
                analysis
              };
            } catch (error) {
              console.error('Error analyzing reply intent:', error);
              return {
                success: false,
                error: 'Failed to analyze reply intent'
              };
            }
          },

          /**
           * Generate follow-up message based on reply analysis
           */
          generateFollowUpMessage: async (leadData, replyContent, intent) => {
            try {
              let systemPrompt = '';
              
              if (intent === 'interested') {
                systemPrompt = 'Generate a professional follow-up message to schedule a meeting. Include a calendar link placeholder.';
              } else if (intent === 'not_interested') {
                systemPrompt = 'Generate a polite acknowledgment message thanking them for their time.';
              } else {
                systemPrompt = 'Generate a clarifying follow-up message to better understand their interest level.';
              }

              const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                  { role: 'system', content: systemPrompt },
                  {
                    role: 'user',
                    content: `Lead: ${leadData.full_name} (${leadData.job_title} at ${leadData.company})\nTheir reply: "${replyContent}"\n\nGenerate appropriate follow-up:`
                  }
                ],
                temperature: 0.7,
                max_tokens: 150
              });

              return {
                success: true,
                message: response.choices[0].message.content.trim()
              };
            } catch (error) {
              console.error('Error generating follow-up message:', error);
              return {
                success: false,
                error: 'Failed to generate follow-up message'
              };
            }
          },

          /**
           * Generate campaign message template with AI
           */
          generateCampaignTemplate: async (campaignGoal, targetAudience, companyInfo) => {
            try {
              const prompt = `
                Create a LinkedIn outreach message template for:
                
                Campaign Goal: ${campaignGoal}
                Target Audience: ${targetAudience}
                Company Info: ${companyInfo}
                
                Requirements:
                1. Use placeholders like {{firstName}}, {{company}}, {{jobTitle}}
                2. Keep under 300 characters
                3. Professional yet personable tone
                4. Clear value proposition
                5. Specific call-to-action
                
                Generate only the template, no additional text.
              `;

              const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                  { role: 'system', content: 'You are a LinkedIn outreach expert creating message templates.' },
                  { role: 'user', content: prompt }
                ],
                temperature: 0.8,
                max_tokens: 200
              });

              return {
                success: true,
                template: response.choices[0].message.content.trim()
              };
            } catch (error) {
              console.error('Error generating campaign template:', error);
              return {
                success: false,
                error: 'Failed to generate campaign template'
              };
            }
          },

          /**
           * Optimize message for better response rates
           */
          optimizeMessage: async (originalMessage, performanceData) => {
            try {
              const prompt = `
                Optimize this LinkedIn outreach message for better response rates:
                
                Original Message: "${originalMessage}"
                
                Performance Data:
                - Current open rate: ${performanceData.openRate}%
                - Current reply rate: ${performanceData.replyRate}%
                - Meetings booked: ${performanceData.meetingsBooked}
                
                Provide:
                1. Optimized version of the message
                2. Key changes made
                3. Expected improvements
                
                Format as JSON: {"optimized_message": "", "changes": [], "expected_improvements": ""}
              `;

              const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                  { role: 'system', content: 'You are a LinkedIn outreach optimization expert.' },
                  { role: 'user', content: prompt }
                ],
                response_format: {
                  type: 'json_schema',
                  json_schema: {
                    name: 'message_optimization',
                    schema: {
                      type: 'object',
                      properties: {
                        optimized_message: { type: 'string' },
                        changes: { type: 'array', items: { type: 'string' } },
                        expected_improvements: { type: 'string' }
                      },
                      required: ['optimized_message', 'changes', 'expected_improvements'],
                      additionalProperties: false
                    }
                  }
                },
                temperature: 0.6
              });

              const optimization = JSON.parse(response.choices[0].message.content);
              
              return {
                success: true,
                optimization
              };
            } catch (error) {
              console.error('Error optimizing message:', error);
              return {
                success: false,
                error: 'Failed to optimize message'
              };
            }
          }
        };

        export default openaiService;