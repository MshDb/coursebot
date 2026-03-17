# Payment Module

## Overview
This module handles course purchases using the LiqPay integration. It manages purchase record creation, payment URL generation, and secure webhook processing to grant course access.

## Key Entities
- **CoursePurchase**: Records the transaction status, amount, and LiqPay order/payment IDs.

## Services
- **PaymentService**:
  - `createPurchase`: Generates a pending purchase and returns a LiqPay payment URL.
  - `processPurchaseWebhook`: Verifies LiqPay HMAC signature and updates purchase status.
  - `checkAccess`: Verifies if a user has a successful purchase for a specific course.
  - `grantAccess`: Manually grants access (bypass payment).

## Integration Flow
1. User clicks "Buy" in Telegram Bot.
2. Bot calls `PaymentService.createPurchase` and sends payoff link to user.
3. User pays via LiqPay.
4. LiqPay POSTs to `/api/webhooks/liqpay`.
5. Webhook handler calls `PaymentService.processPurchaseWebhook`.
6. If successful, handler triggers `payment.success` Inngest event.
7. Inngest worker delivers course links to the user's Telegram chat.

## Security
- All webhooks are verified using `LIQPAY_PRIVATE_KEY` HMAC signature.
- Idempotency is handled by checking for existing `liqpayPaymentId` on the purchase record.
