CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_name text, p_customer_phone text, p_customer_address text,
  p_customer_email text, p_branch text, p_items jsonb, p_delivery_fee integer DEFAULT 150
)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  v_order_id bigint; v_public_id text; v_total integer := 0; v_subtotal integer := 0;
  v_item jsonb; v_menu public.menu_items%ROWTYPE; v_qty integer;
BEGIN
  IF char_length(trim(coalesce(p_customer_name, ''))) NOT BETWEEN 2 AND 100 THEN
    RAISE EXCEPTION 'Invalid customer name' USING ERRCODE = '22023';
  END IF;
  IF coalesce(p_customer_phone, '') !~ '^03[0-9]{9}$' THEN
    RAISE EXCEPTION 'Invalid Pakistani phone number' USING ERRCODE = '22023';
  END IF;
  IF char_length(trim(coalesce(p_customer_address, ''))) NOT BETWEEN 5 AND 500 THEN
    RAISE EXCEPTION 'Invalid customer address' USING ERRCODE = '22023';
  END IF;
  IF p_branch NOT IN ('Clifton', 'Gulshan-e-Iqbal', 'North Nazimabad') THEN
    RAISE EXCEPTION 'Invalid branch' USING ERRCODE = '22023';
  END IF;
  IF p_delivery_fee < 0 OR p_delivery_fee > 10000 THEN
    RAISE EXCEPTION 'Invalid delivery fee' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Invalid order items' USING ERRCODE = '22023';
  END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    IF coalesce(v_item->>'id','') !~ '^[0-9]+$' OR coalesce(v_item->>'qty','') !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'Invalid item id or quantity' USING ERRCODE = '22023';
    END IF;
    v_qty := (v_item->>'qty')::integer;
    IF v_qty NOT BETWEEN 1 AND 100 THEN
      RAISE EXCEPTION 'Invalid item quantity' USING ERRCODE = '22023';
    END IF;
    SELECT * INTO v_menu FROM public.menu_items WHERE id = (v_item->>'id')::bigint FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Menu item not found' USING ERRCODE = '22023'; END IF;
    IF NOT v_menu.available THEN RAISE EXCEPTION 'Menu item unavailable' USING ERRCODE = '22023'; END IF;
    v_subtotal := v_subtotal + (v_menu.price * v_qty);
  END LOOP;
  v_total := v_subtotal + p_delivery_fee;
  v_public_id := 'KB-' || to_char(now() AT TIME ZONE 'Asia/Karachi', 'YYYYMMDD') || '-' ||
                 upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16));
  INSERT INTO public.orders (public_order_id, customer_name, customer_phone, customer_address, customer_email, branch, status, total)
  VALUES (v_public_id, trim(p_customer_name), p_customer_phone, trim(p_customer_address), nullif(trim(coalesce(p_customer_email, '')), ''), p_branch, 'Received', v_total)
  RETURNING id INTO v_order_id;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'qty')::integer;
    SELECT * INTO v_menu FROM public.menu_items WHERE id = (v_item->>'id')::bigint;
    INSERT INTO public.order_items (order_id, menu_item_id, quantity, price_at_order, name_at_order)
    VALUES (v_order_id, v_menu.id, v_qty, v_menu.price, v_menu.name);
  END LOOP;
  RETURN jsonb_build_object('orderId', v_public_id, 'total', v_total, 'status', 'Received');
END;
$$;
CREATE OR REPLACE FUNCTION public.update_order_status(p_public_order_id text, p_new_status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE v_old_status text;
BEGIN
  SELECT status INTO v_old_status FROM public.orders WHERE public_order_id = p_public_order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF NOT ((v_old_status = 'Received' AND p_new_status = 'Preparing') OR
          (v_old_status = 'Preparing' AND p_new_status = 'Out for Delivery') OR
          (v_old_status = 'Out for Delivery' AND p_new_status = 'Delivered')) THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', v_old_status, p_new_status USING ERRCODE = '22023';
  END IF;
  UPDATE public.orders SET status = p_new_status, updated_at = now() WHERE public_order_id = p_public_order_id;
  RETURN jsonb_build_object('orderId', p_public_order_id, 'status', p_new_status);
END;
$$;
REVOKE ALL ON FUNCTION public.create_order(text, text, text, text, text, jsonb, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_order_status(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order(text, text, text, text, text, jsonb, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_order_status(text, text) TO service_role;
