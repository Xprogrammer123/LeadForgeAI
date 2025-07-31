import React, { useState, useEffect } from 'react';
        import { loadStripe } from '@stripe/stripe-js';
        import {
          Elements,
          PaymentElement,
          useStripe,
          useElements
        } from '@stripe/react-stripe-js';
        import { motion } from 'framer-motion';
        import Button from '../ui/Button';
        import { useAuth } from '../../contexts/AuthContext';
        import stripeService from '../../utils/stripeService';

        // Initialize Stripe
        const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

        const CheckoutForm = ({ creditPackage, onSuccess, onError, onCancel }) => {
          const stripe = useStripe();
          const elements = useElements();
          const { user } = useAuth();
          const [isProcessing, setIsProcessing] = useState(false);
          const [message, setMessage] = useState('');

          const handleSubmit = async (event) => {
            event.preventDefault();

            if (!stripe || !elements) {
              onError?.('Stripe has not loaded yet. Please try again.');
              return;
            }

            setIsProcessing(true);
            setMessage('Processing payment...');

            try {
              const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                  payment_method_data: {
                    billing_details: {
                      name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Customer',
                      email: user?.email,
                    }
                  }
                },
                redirect: 'if_required'
              });

              if (error) {
                setMessage(`Payment failed: ${error.message}`);
                onError?.(error.message);
              } else if (paymentIntent.status === 'succeeded') {
                setMessage('Payment succeeded! Your credits will be added shortly.');
                onSuccess?.(paymentIntent);
              } else {
                setMessage(`Payment status: ${paymentIntent.status}`);
                onError?.(`Unexpected payment status: ${paymentIntent.status}`);
              }
            } catch (err) {
              setMessage('An unexpected error occurred.');
              onError?.('An unexpected error occurred during payment processing.');
            } finally {
              setIsProcessing(false);
            }
          };

          return (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="glassmorphism rounded-lg p-4 border border-border">
                <h4 className="text-md font-headline-bold text-foreground mb-2">
                  Purchase Summary
                </h4>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">{creditPackage.name}</span>
                  <span className="text-sm font-body-semibold text-foreground">
                    {stripeService.formatPrice(creditPackage.price)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Credits</span>
                  <span className="text-sm font-body-semibold text-foreground">
                    {creditPackage.credits} credits
                  </span>
                </div>
                {creditPackage.savings && (
                  <div className="mt-2 text-xs text-success">
                    You save {creditPackage.savings}!
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <PaymentElement 
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: 'var(--color-foreground)',
                        backgroundColor: 'var(--color-input)',
                        '::placeholder': {
                          color: 'var(--color-muted-foreground)',
                        },
                      },
                    },
                  }}
                />
              </div>

              {message && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg text-sm ${
                    message.includes('succeeded') 
                      ? 'bg-success/10 text-success border border-success/20' : message.includes('failed')
                      ? 'bg-error/10 text-error border border-error/20' :'bg-warning/10 text-warning border border-warning/20'
                  }`}
                >
                  {message}
                </motion.div>
              )}

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  disabled={isProcessing || !stripe || !elements}
                  className="cta-button flex-1"
                  iconName={isProcessing ? "Loader2" : "CreditCard"}
                  iconPosition="left"
                >
                  {isProcessing ? 'Processing...' : `Pay ${stripeService.formatPrice(creditPackage.price)}`}
                </Button>
              </div>
            </form>
          );
        };

        function StripePaymentForm({ creditPackage, onSuccess, onError, onCancel }) {
          const [clientSecret, setClientSecret] = useState('');
          const [loading, setLoading] = useState(true);
          const [error, setError] = useState('');
          const { user } = useAuth();

          useEffect(() => {
            if (creditPackage && user?.email) {
              createPaymentIntent();
            }
          }, [creditPackage, user]);

          const createPaymentIntent = async () => {
            try {
              setLoading(true);
              const result = await stripeService.createPaymentIntent(creditPackage, user.email);

              if (result.success) {
                setClientSecret(result.data.clientSecret);
              } else {
                setError(result.error || 'Failed to initialize payment');
                onError?.(result.error);
              }
            } catch (err) {
              setError('Failed to initialize payment');
              onError?.('Failed to initialize payment');
            } finally {
              setLoading(false);
            }
          };

          if (loading) {
            return (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground font-body-medium">Initializing payment...</p>
              </div>
            );
          }

          if (error) {
            return (
              <div className="text-center py-8">
                <p className="text-error font-body-medium mb-4">{error}</p>
                <Button variant="outline" onClick={onCancel}>
                  Go Back
                </Button>
              </div>
            );
          }

          const options = {
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: 'var(--color-primary)',
                colorBackground: 'var(--color-input)',
                colorText: 'var(--color-foreground)',
                colorDanger: 'var(--color-error)',
              },
            },
          };

          return (
            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm 
                creditPackage={creditPackage}
                onSuccess={onSuccess}
                onError={onError}
                onCancel={onCancel}
              />
            </Elements>
          );
        }

        export default StripePaymentForm;