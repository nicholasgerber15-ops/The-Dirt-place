# QuickBooks Online integration handoff

Checkout records are prepared for a retry-safe QuickBooks Online sync after Stripe confirms payment. Each order stores canonical server-side SKU, quantity, unit, and price values plus an `integrations.quickbooks` status block. The mapper in `backend/services/quickbooks.py` produces a QuickBooks `SalesReceipt` payload.

## Required Intuit setup

1. Create a QuickBooks Online app in the Intuit Developer dashboard and connect a sandbox company.
2. Register the exact backend callback URL from `QUICKBOOKS_REDIRECT_URI`.
3. Add the environment variables listed in `backend/.env.example`. Never place client secrets or OAuth refresh tokens in Git.
4. Create QuickBooks Products and Services for the catalog plus Delivery, Pallet Fee, and Card Administration Fee. Store the resulting QuickBooks Item IDs against Dirt Place SKUs.
5. Implement the OAuth 2.0 authorization callback and encrypted refresh-token storage in the deployment secret/database layer.
6. On `payment_intent.succeeded`, enqueue a sync job keyed by `order_number`. The worker should create or find the customer, call the SalesReceipt API, then update `integrations.quickbooks` to `synced` with the returned entity ID. Retries must first query by `DocNumber` to avoid duplicates.

Use the sandbox until catalog mapping, Texas tax behavior, refunds, and Stripe fee reconciliation have been approved by the bookkeeper. The API configuration targets minor version 75 because older minor versions are no longer supported.
