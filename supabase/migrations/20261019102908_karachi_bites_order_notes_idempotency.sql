-- Reconcile order columns used by the Express backend.
-- Safe for existing databases: adds nullable columns without changing existing orders.
-- The partial unique index allows multiple NULL keys while preventing duplicate non-null keys.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_notes text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key_unique
  ON public.orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
