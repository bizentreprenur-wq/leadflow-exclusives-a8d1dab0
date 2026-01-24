<?php
/**
 * Stripe SetupIntent API for collecting payment methods without charging
 * Used for trial subscriptions where payment is collected after trial ends
 */

require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/stripe.php';

// Handle CORS
setCorsHeaders();
handlePreflight();

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'create-setup-intent':
        handleCreateSetupIntent();
        break;
    case 'save-payment-method':
        handleSavePaymentMethod();
        break;
    case 'check-payment-method':
        handleCheckPaymentMethod();
        break;
    default:
        sendError('Invalid action', 400);
}

/**
 * Create a SetupIntent for collecting payment method
 * This allows collecting card details without charging
 */
function handleCreateSetupIntent() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    $user = requireAuth();
    
    try {
        initStripe();
        
        // Get or create Stripe customer
        $customer = getOrCreateStripeCustomer($user);
        
        // Create SetupIntent for future payments
        $setupIntent = \Stripe\SetupIntent::create([
            'customer' => $customer->id,
            'payment_method_types' => ['card'],
            'metadata' => [
                'user_id' => $user['id'],
                'purpose' => 'trial_subscription',
            ],
            'usage' => 'off_session', // Allow charging later without customer present
        ]);
        
        sendJson([
            'success' => true,
            'client_secret' => $setupIntent->client_secret,
            'setup_intent_id' => $setupIntent->id,
        ]);
    } catch (Exception $e) {
        error_log("SetupIntent creation failed: " . $e->getMessage());
        sendError($e->getMessage(), 500);
    }
}

/**
 * Save payment method after successful SetupIntent confirmation
 * Also starts the trial subscription
 */
function handleSavePaymentMethod() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    $user = requireAuth();
    $input = getJsonInput();
    
    $setupIntentId = sanitizeInput($input['setup_intent_id'] ?? '', 100);
    $plan = sanitizeInput($input['plan'] ?? 'pro', 20);
    
    if (empty($setupIntentId)) {
        sendError('Setup intent ID required');
    }
    
    if (!in_array($plan, ['basic', 'pro', 'agency'])) {
        $plan = 'pro'; // Default to pro
    }
    
    try {
        initStripe();
        $db = getDB();
        
        // Retrieve the SetupIntent to get the payment method
        $setupIntent = \Stripe\SetupIntent::retrieve($setupIntentId);
        
        if ($setupIntent->status !== 'succeeded') {
            sendError('Payment method not verified');
        }
        
        $paymentMethodId = $setupIntent->payment_method;
        
        // Set as default payment method for customer
        \Stripe\Customer::update($user['stripe_customer_id'], [
            'invoice_settings' => [
                'default_payment_method' => $paymentMethodId,
            ],
        ]);
        
        // Get price ID for the plan with trial
        $prices = STRIPE_PRICES[$plan] ?? STRIPE_PRICES['pro'];
        $priceId = $prices['monthly'];
        
        // Create subscription with 7-day trial
        $subscription = \Stripe\Subscription::create([
            'customer' => $user['stripe_customer_id'],
            'items' => [['price' => $priceId]],
            'default_payment_method' => $paymentMethodId,
            'trial_period_days' => 7,
            'payment_settings' => [
                'payment_method_types' => ['card'],
                'save_default_payment_method' => 'on_subscription',
            ],
            'metadata' => [
                'user_id' => $user['id'],
                'plan' => $plan,
            ],
        ]);
        
        // Sync subscription to database
        syncSubscriptionFromStripe($subscription, $user['id']);
        
        // Update user record to indicate trial active
        $db->update(
            "UPDATE users SET 
                subscription_status = 'active',
                subscription_plan = ?,
                has_payment_method = 1,
                trial_ends_at = DATE_ADD(NOW(), INTERVAL 7 DAY)
             WHERE id = ?",
            [$plan, $user['id']]
        );
        
        sendJson([
            'success' => true,
            'message' => 'Trial started! You won\'t be charged until your 7-day trial ends.',
            'trial_ends_at' => date('Y-m-d H:i:s', strtotime('+7 days')),
            'plan' => $plan,
        ]);
    } catch (Exception $e) {
        error_log("Save payment method failed: " . $e->getMessage());
        sendError($e->getMessage(), 500);
    }
}

/**
 * Check if user has a valid payment method on file
 */
function handleCheckPaymentMethod() {
    $user = requireAuth();
    
    try {
        $db = getDB();
        
        // Check user flags
        $userRecord = $db->fetchOne(
            "SELECT has_payment_method, subscription_status, subscription_plan, trial_ends_at 
             FROM users WHERE id = ?",
            [$user['id']]
        );
        
        $hasPaymentMethod = $userRecord && $userRecord['has_payment_method'];
        $hasActiveSubscription = $userRecord && 
            in_array($userRecord['subscription_status'], ['active', 'trialing']);
        $isTrialing = $userRecord && $userRecord['subscription_status'] === 'trialing';
        
        // Check if owner or has free account
        $hasUnlimitedAccess = $user['is_owner'] || 
            ($userRecord && $userRecord['subscription_plan'] === 'free_granted');
        
        sendJson([
            'success' => true,
            'has_payment_method' => $hasPaymentMethod || $hasUnlimitedAccess,
            'has_active_subscription' => $hasActiveSubscription || $hasUnlimitedAccess,
            'is_trialing' => $isTrialing,
            'trial_ends_at' => $userRecord['trial_ends_at'] ?? null,
            'subscription_plan' => $userRecord['subscription_plan'] ?? null,
            'requires_payment_setup' => !$hasPaymentMethod && !$hasActiveSubscription && !$hasUnlimitedAccess,
        ]);
    } catch (Exception $e) {
        error_log("Check payment method failed: " . $e->getMessage());
        sendError($e->getMessage(), 500);
    }
}
