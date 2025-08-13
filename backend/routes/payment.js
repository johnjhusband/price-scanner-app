const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database');
const { getFlipStatus, markAsPaid } = require('../services/flipTracker');

// TODO: Add Stripe SDK
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Get current flip status for user
 */
router.get('/flip-status', async (req, res) => {
  try {
    const userId = req.user?.id;
    const deviceFingerprint = req.headers['x-device-fingerprint'] || req.body.device_fingerprint;
    const sessionId = req.session?.id;
    
    const status = await getFlipStatus(userId, deviceFingerprint, sessionId);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting flip status:', error);
    res.status(500).json({
      error: 'Failed to get flip status',
      message: error.message
    });
  }
});

/**
 * Create checkout session for payment
 */
router.post('/checkout', async (req, res) => {
  try {
    const { payment_type } = req.body; // 'single' or 'pro'
    const userId = req.user?.id;
    
    if (!payment_type || !['single', 'pro'].includes(payment_type)) {
      return res.status(400).json({
        error: 'Invalid payment type'
      });
    }
    
    // TODO: Implement Stripe checkout
    // For now, return mock response
    const mockCheckoutUrl = payment_type === 'single' 
      ? 'https://checkout.stripe.com/pay/mock-flip-bundle-5'
      : 'https://checkout.stripe.com/pay/mock-pro-subscription';
    
    res.json({
      success: true,
      checkout_url: mockCheckoutUrl,
      message: 'Stripe integration pending'
    });
    
    /* Stripe implementation:
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: payment_type === 'single' ? [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '5 Flip Bundle',
              description: 'Get 5 additional scans'
            },
            unit_amount: 100, // $1.00 for 5 flips
          },
          quantity: 1,
        }
      ] : [
        {
          price: process.env.STRIPE_PRO_PRICE_ID, // Monthly subscription price
          quantity: 1,
        }
      ],
      mode: payment_type === 'single' ? 'payment' : 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        payment_type: payment_type
      }
    });
    
    res.json({
      success: true,
      checkout_url: session.url
    });
    */
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
});

/**
 * Handle Stripe webhook events
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // TODO: Implement Stripe webhook handling
    res.json({ received: true });
    
    /* Stripe implementation:
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        req.body, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    const db = getDatabase();
    
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const userId = session.client_reference_id;
        const paymentType = session.metadata.payment_type;
        
        if (paymentType === 'single') {
          // Record single payment
          db.prepare(`
            INSERT INTO payments (
              user_id, stripe_payment_intent_id, amount, 
              payment_type, status
            ) VALUES (?, ?, ?, ?, ?)
          `).run(
            userId,
            session.payment_intent,
            session.amount_total,
            'single',
            'completed'
          );
          
          // Mark user as having made a payment
          await markAsPaid(userId, 'single');
        } else if (paymentType === 'pro') {
          // Create/update subscription record
          db.prepare(`
            INSERT INTO subscriptions (
              user_id, stripe_customer_id, stripe_subscription_id,
              plan, status, current_period_start, current_period_end
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              stripe_customer_id = excluded.stripe_customer_id,
              stripe_subscription_id = excluded.stripe_subscription_id,
              plan = excluded.plan,
              status = excluded.status,
              current_period_start = excluded.current_period_start,
              current_period_end = excluded.current_period_end,
              updated_at = CURRENT_TIMESTAMP
          `).run(
            userId,
            session.customer,
            session.subscription,
            'pro',
            'active',
            new Date().toISOString(),
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          );
          
          await markAsPaid(userId, 'pro');
        }
        break;
        
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Handle subscription changes
        const subscription = event.data.object;
        // Update subscription status in database
        break;
    }
    
    res.json({ received: true });
    */
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      error: 'Webhook processing failed'
    });
  }
});

/**
 * Get user's subscription status
 */
router.get('/subscription-status', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }
    
    const db = getDatabase();
    const subscription = db.prepare(`
      SELECT * FROM subscriptions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(userId);
    
    res.json({
      success: true,
      data: {
        has_subscription: !!subscription,
        plan: subscription?.plan || 'free',
        status: subscription?.status || 'none',
        current_period_end: subscription?.current_period_end
      }
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({
      error: 'Failed to get subscription status'
    });
  }
});

module.exports = router;