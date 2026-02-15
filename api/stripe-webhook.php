<?php
/**
 * Stripe Webhook Handler
 * Receives events from Stripe and updates subscription status
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/database.php';
require_once __DIR__ . '/includes/stripe.php';

// Stripe webhooks don't use our normal CORS
header('Content-Type: application/json');

// Get the raw POST data
$payload = file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

if (!$payload || !$sigHeader) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing payload or signature']);
    exit;
}

try {
    // Initialize Stripe
    if (!class_exists('\Stripe\Stripe')) {
        throw new Exception('Stripe SDK not installed');
    }
    \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
    
    // Verify webhook signature
    $event = \Stripe\Webhook::constructEvent(
        $payload,
        $sigHeader,
        STRIPE_WEBHOOK_SECRET
    );
} catch (\UnexpectedValueException $e) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload']);
    exit;
} catch (\Stripe\Exception\SignatureVerificationException $e) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

// Log the event for debugging
error_log("Stripe webhook received: " . $event->type);

// Handle the event
switch ($event->type) {
    case 'checkout.session.completed':
        handleCheckoutCompleted($event->data->object);
        break;
        
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
        handleSubscriptionUpdated($event->data->object);
        break;
        
    case 'customer.subscription.deleted':
        handleSubscriptionDeleted($event->data->object);
        break;
        
    case 'invoice.paid':
        handleInvoicePaid($event->data->object);
        break;
        
    case 'invoice.payment_failed':
        handlePaymentFailed($event->data->object);
        break;
        
    default:
        // Unhandled event type
        error_log("Unhandled Stripe event: " . $event->type);
}

// Return success
http_response_code(200);
echo json_encode(['received' => true]);

/**
 * Handle checkout session completed
 */
function handleCheckoutCompleted($session) {
    $userId = $session->metadata->user_id ?? null;
    
    if (!$userId) {
        error_log("Checkout completed but no user_id in metadata");
        return;
    }

    $purchaseType = $session->metadata->purchase_type ?? 'subscription';

    if ($purchaseType === 'credits') {
        recordCreditCheckoutPayment($session, $userId);
        error_log("Credits checkout completed for user: $userId");
        return;
    }

    // Handle AI Calling add-on checkout
    if ($purchaseType === 'addon' || ($session->metadata->addon_type ?? '') === 'ai_calling') {
        activateAICallingAddon($userId);
        error_log("AI Calling addon activated for user: $userId");
        return;
    }

    // Subscription updates are handled by customer.subscription.created/updated events
    error_log("Subscription checkout completed for user: $userId");
}

/**
 * Record one-time credit checkout payments and add credits to user account.
 */
function recordCreditCheckoutPayment($session, $userId) {
    $paymentIntentId = $session->payment_intent ?? null;
    if (!$paymentIntentId) {
        error_log("Credits checkout missing payment_intent for user: $userId");
        return;
    }

    $db = getDB();

    $existing = $db->fetchOne(
        "SELECT id FROM payment_history WHERE stripe_payment_intent_id = ? LIMIT 1",
        [$paymentIntentId]
    );
    if ($existing) {
        return;
    }

    $credits = (int)($session->metadata->credits ?? 0);
    $packageId = $session->metadata->package_id ?? 'unknown';
    $description = "AI Credit Pack ($packageId)";
    if ($credits > 0) {
        $description .= " - $credits credits";
    }

    $db->insert(
        "INSERT INTO payment_history (user_id, stripe_payment_intent_id, stripe_invoice_id, amount, currency, status, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
            $userId,
            $paymentIntentId,
            null,
            (int)($session->amount_total ?? 0),
            strtolower((string)($session->currency ?? 'usd')),
            (string)($session->payment_status ?? 'paid'),
            $description,
        ]
    );

    // Add purchased credits to the user's balance
    if ($credits > 0) {
        $db->update(
            "UPDATE users SET credits_remaining = COALESCE(credits_remaining, 0) + ? WHERE id = ?",
            [$credits, $userId]
        );
        error_log("Added $credits credits to user $userId (package: $packageId)");
    }
}

/**
 * Handle subscription created or updated
 * Also marks user as having used their trial to prevent future trial abuse
 * Detects AI Calling addon subscriptions and activates them
 */
function handleSubscriptionUpdated($subscription) {
    syncSubscriptionFromStripe($subscription);
    
    $userId = $subscription->metadata->user_id ?? null;
    if ($userId) {
        $db = getDB();
        
        // Mark trial as used
        $db->update(
            "UPDATE users SET 
                had_trial = 1,
                first_subscription_at = COALESCE(first_subscription_at, NOW())
             WHERE id = ?",
            [$userId]
        );
        
        // Check if this is an AI Calling addon subscription
        $addonType = $subscription->metadata->addon_type ?? '';
        if ($addonType === 'ai_calling' && $subscription->status === 'active') {
            activateAICallingAddon($userId);
            error_log("AI Calling addon activated via subscription for user: $userId");
        }
        
        // Auto-activate addon for Autopilot plan
        $plan = $subscription->metadata->plan ?? '';
        if ($plan === 'autopilot' && $subscription->status === 'active') {
            activateAICallingAddon($userId);
            error_log("AI Calling auto-activated for Autopilot user: $userId");
        }
    }
    
    error_log("Subscription synced: " . $subscription->id);
}

/**
 * Handle subscription deleted/canceled
 * Also deactivates AI Calling addon if it was an addon subscription
 */
function handleSubscriptionDeleted($subscription) {
    $db = getDB();
    
    $db->update(
        "UPDATE subscriptions SET status = 'canceled', updated_at = NOW() WHERE stripe_subscription_id = ?",
        [$subscription->id]
    );
    
    $userId = $subscription->metadata->user_id ?? null;
    
    if ($userId) {
        $db->update(
            "UPDATE users SET subscription_status = 'cancelled' WHERE id = ?",
            [$userId]
        );
        
        // Deactivate AI Calling addon if this was the addon subscription
        $addonType = $subscription->metadata->addon_type ?? '';
        if ($addonType === 'ai_calling') {
            $db->update(
                "UPDATE calling_config SET addon_active = 0, updated_at = NOW() WHERE user_id = ?",
                [$userId]
            );
            error_log("AI Calling addon deactivated for user: $userId");
        }
    }
    
    error_log("Subscription canceled: " . $subscription->id);
}

/**
 * Activate AI Calling add-on for a user
 * Sets addon_active=1 in calling_config table
 */
function activateAICallingAddon($userId) {
    $db = getDB();
    
    // Check if calling_config row exists
    $existing = $db->fetchOne("SELECT id FROM calling_config WHERE user_id = ?", [$userId]);
    
    if ($existing) {
        $db->update(
            "UPDATE calling_config SET addon_active = 1, updated_at = NOW() WHERE user_id = ?",
            [$userId]
        );
    } else {
        $db->insert(
            "INSERT INTO calling_config (user_id, addon_active, enabled) VALUES (?, 1, 0)",
            [$userId]
        );
    }
}



/**
 * Handle successful invoice payment
 */
function handleInvoicePaid($invoice) {
    // Get user from customer
    $db = getDB();
    $user = $db->fetchOne(
        "SELECT id FROM users WHERE stripe_customer_id = ?",
        [$invoice->customer]
    );
    
    if ($user) {
        recordPayment($user['id'], $invoice);
        error_log("Payment recorded for user: " . $user['id']);
    }
}

/**
 * Handle failed payment
 */
function handlePaymentFailed($invoice) {
    $db = getDB();
    
    // Update subscription status to past_due
    $db->update(
        "UPDATE subscriptions SET status = 'past_due', updated_at = NOW() WHERE stripe_customer_id = ?",
        [$invoice->customer]
    );
    
    // Could also send email notification to user here
    error_log("Payment failed for customer: " . $invoice->customer);
}
