import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import bcrypt from "npm:bcryptjs@2.4.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !serviceKey) throw new Error("Supabase server environment is not configured");
const db = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const deliveryFee = Number.parseInt(Deno.env.get("DELIVERY_FEE") || "150", 10);
const validBranches = new Set(["Clifton", "Gulshan-e-Iqbal", "North Nazimabad"]);
const validStatuses = new Set(["Received", "Preparing", "Out for Delivery", "Delivered"]);

function allowedOrigin(origin: string | null): string {
  if (!origin) return "";
  if (origin === "http://localhost:5173" || origin === "http://localhost:3000") return origin;
  if (origin === "https://karachi-bites.vercel.app" || origin === "https://karachi-bites-haider18.vercel.app" || origin === "https://karachi-bites-git-main-haider18.vercel.app") return origin;
  if (/^https:\/\/karachi-bites-[a-z0-9-]+-haider18\.vercel\.app$/.test(origin)) return origin;
  return "";
}
function response(req: Request, data: unknown, status = 200) {
  const origin = allowedOrigin(req.headers.get("origin"));
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info, x-setup-secret",
    "X-Content-Type-Options": "nosniff",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(data), { status, headers });
}
function fail(req: Request, status: number, message: string) {
  return response(req, { error: message }, status);
}
async function jsonBody(req: Request) {
  try { return await req.json(); } catch { return null; }
}
function validName(value: unknown) {
  return typeof value === "string" && value.trim().length >= 2 && value.trim().length <= 100;
}
function validPhone(value: unknown) {
  return typeof value === "string" && /^03\d{9}$/.test(value.replace(/[\s-]/g, ""));
}
function validAddress(value: unknown) {
  return typeof value === "string" && value.trim().length >= 5 && value.trim().length <= 500;
}
function validQuantity(value: unknown) {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 100;
}
function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
async function sha256(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}
async function adminUser(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return { error: "Authentication required", status: 401 as const };
  const tokenHash = await sha256(authHeader.slice(7));
  const { data, error } = await db.from("admin_sessions")
    .select("user_id, expires_at, users(id, username, role, is_active)")
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error || !data || !data.users) return { error: "Invalid or expired token", status: 401 as const };
  const user = Array.isArray(data.users) ? data.users[0] : data.users;
  if (!user || user.role !== "admin" || user.is_active === false) return { error: "Admin access required", status: 403 as const };
  return { user, status: 200 as const };
}
async function getOrder(publicId: string) {
  const { data: order, error } = await db.from("orders").select("*").eq("public_order_id", publicId).maybeSingle();
  if (error) throw error;
  if (!order) return null;
  const { data: items, error: itemsError } = await db.from("order_items")
    .select("menu_item_id, quantity, price_at_order, name_at_order")
    .eq("order_id", order.id).order("id", { ascending: true });
  if (itemsError) throw itemsError;
  return {
    orderId: order.public_order_id,
    status: order.status,
    items: (items || []).map((item) => ({
      id: item.menu_item_id,
      name: item.name_at_order,
      quantity: item.quantity,
      price: item.price_at_order,
      lineTotal: item.price_at_order * item.quantity,
    })),
    total: order.total,
    customer: { name: order.customer_name, phone: order.customer_phone, address: order.customer_address },
    branch: order.branch,
    createdAt: order.created_at,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return response(req, { ok: true });
  const url = new URL(req.url);
  let route = url.pathname.split("/karachi-bites-api").pop() || "/";
  route = route.replace(/^\/+/, "");
  if (route.startsWith("api/")) route = route.slice(4);
  if (route === "api") route = "";
  route = "/" + route;
  try {
    if (req.method === "GET" && route === "/menu") {
      const { data, error } = await db.from("menu_items")
        .select("id, name, price, category, tags, available, description, image")
        .eq("available", true).order("id", { ascending: true });
      if (error) throw error;
      return response(req, data || []);
    }

    if (req.method === "POST" && route === "/orders") {
      const body = await jsonBody(req);
      if (!body || !validName(body.customer?.name)) return fail(req, 400, "customer.name is required and must be a valid name");
      if (!validPhone(body.customer?.phone)) return fail(req, 400, "customer.phone is required and must be a valid Pakistani phone number");
      if (!validAddress(body.customer?.address)) return fail(req, 400, "customer.address is required and must be a valid address");
      if (!validBranches.has(body.branch)) return fail(req, 400, "Invalid branch");
      if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50 ||
          body.items.some((item: any) => !Number.isInteger(item?.id) || item.id <= 0 || !validQuantity(item.qty))) {
        return fail(req, 400, "Invalid order items");
      }
      const cleanPhone = body.customer.phone.replace(/[\s-]/g, "");
      const { data, error } = await db.rpc("create_order", {
        p_customer_name: body.customer.name.trim(),
        p_customer_phone: cleanPhone,
        p_customer_address: body.customer.address.trim(),
        p_customer_email: typeof body.customer.email === "string" && body.customer.email.trim() ? body.customer.email.trim().slice(0, 254) : null,
        p_branch: body.branch,
        p_items: body.items.map((item: any) => ({ id: item.id, qty: item.qty })),
        p_delivery_fee: Number.isInteger(deliveryFee) && deliveryFee >= 0 ? deliveryFee : 150,
      });
      if (error) {
        const msg = error.message || "";
        if (error.code === "22023" || /unavailable|not found|invalid/i.test(msg)) return fail(req, 400, msg.includes("unavailable") ? "One or more menu items are currently unavailable" : "Order validation failed");
        throw error;
      }
      return response(req, data, 201);
    }

    const orderMatch = route.match(/^\/orders\/([A-Za-z0-9-]+)$/);
    if (req.method === "GET" && orderMatch) {
      const order = await getOrder(orderMatch[1]);
      if (!order) return fail(req, 404, "Order not found");
      return response(req, order);
    }

    if (req.method === "POST" && route === "/auth/setup-admin") {
      const configuredSecret = Deno.env.get("ADMIN_SETUP_SECRET");
      if (!configuredSecret || configuredSecret.length < 32) return fail(req, 503, "Admin setup is not configured");
      const suppliedSecret = req.headers.get("x-setup-secret") || "";
      if (suppliedSecret.length !== configuredSecret.length || suppliedSecret !== configuredSecret) return fail(req, 401, "Invalid setup authorization");
      const body = await jsonBody(req);
      if (!body || typeof body.username !== "string" || !/^[A-Za-z0-9_.-]{3,50}$/.test(body.username) ||
          typeof body.password !== "string" || body.password.length < 12 || body.password.length > 200) {
        return fail(req, 400, "Username must be 3-50 safe characters and password must be at least 12 characters");
      }
      const passwordHash = await bcrypt.hash(body.password, 12);
      const { data, error } = await db.rpc("bootstrap_admin", {
        p_username: body.username,
        p_password_hash: passwordHash,
      });
      if (error) {
        if (error.code === "23505") return fail(req, 409, "Admin bootstrap is already closed");
        if (error.code === "22023") return fail(req, 400, "Invalid initial admin data");
        throw error;
      }
      return response(req, { configured: true, username: data.username }, 201);
    }

    if (req.method === "POST" && route === "/auth/login") {
      const body = await jsonBody(req);
      if (!body || typeof body.username !== "string" || typeof body.password !== "string" || !body.username.trim() || !body.password) {
        return fail(req, 400, "Username and password are required");
      }
      const resendKey = Deno.env.get("RESEND_API_KEY");
      const fromEmail = Deno.env.get("AUTH_EMAIL_FROM");
      const otpPepper = Deno.env.get("OTP_HASH_SECRET");
      if (!resendKey || !fromEmail || !otpPepper || otpPepper.length < 32) {
        return fail(req, 503, "Email verification is not configured. Contact the site administrator.");
      }
      const { data: user, error } = await db.from("users")
        .select("id, username, password_hash, role, email, is_active")
        .eq("username", body.username.trim()).maybeSingle();
      if (error) throw error;
      if (!user || !(await bcrypt.compare(body.password, user.password_hash)) || user.is_active === false) {
        return fail(req, 401, "Invalid credentials");
      }
      if (user.role !== "admin") return fail(req, 403, "Admin access required");
      if (typeof user.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        return fail(req, 409, "This account needs an email address before email verification can be enabled.");
      }
      const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: recentCount, error: countError } = await db.from("auth_challenges")
        .select("id", { count: "exact", head: true }).eq("user_id", user.id)
        .eq("purpose", "login").gte("created_at", since);
      if (countError) throw countError;
      if ((recentCount || 0) >= 3) return fail(req, 429, "Too many verification emails. Please wait five minutes and try again.");
      const challengeId = crypto.randomUUID();
      const otp = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");
      const preAuthToken = randomToken();
      const codeHash = await sha256(challengeId + ":" + otp + ":" + otpPepper);
      const preAuthHash = await sha256(preAuthToken);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const { error: challengeError } = await db.from("auth_challenges").insert({
        id: challengeId, user_id: user.id, purpose: "login", channel: "email",
        destination: user.email, code_hash: codeHash, preauth_token_hash: preAuthHash,
        expires_at: expiresAt, max_attempts: 5, attempts: 0,
      });
      if (challengeError) throw challengeError;
      try {
        const mail = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": "Bearer " + resendKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: fromEmail, to: [user.email], subject: "Your Karachi Bites sign-in code",
            text: "Your Karachi Bites verification code is " + otp + ". It expires in 5 minutes. If you did not request this, ignore this email.",
            html: "<div style=\"font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px\"><h2>Karachi Bites sign-in</h2><p>Use this verification code to finish signing in:</p><p style=\"font-size:32px;font-weight:700;letter-spacing:8px\">" + otp + "</p><p>This code expires in 5 minutes. Never share it with anyone.</p></div>"
          })
        });
        if (!mail.ok) throw new Error("Email provider rejected the message");
      } catch (_) {
        await db.from("auth_challenges").delete().eq("id", challengeId);
        return fail(req, 502, "Could not send the verification email. Please try again later.");
      }
      return response(req, {
        requiresOtp: true, preAuthToken, channel: "email",
        maskedDestination: user.email.replace(/^(.).+(@.+)$/, "$1••••$2"),
        expiresInSeconds: 300
      });
    }

    if (req.method === "POST" && route === "/auth/verify-otp") {
      const body = await jsonBody(req);
      if (!body || typeof body.preAuthToken !== "string" || typeof body.code !== "string" ||
          !/^\d{6}$/.test(body.code) || body.preAuthToken.length < 32 || body.preAuthToken.length > 200) {
        return fail(req, 400, "A valid verification code is required");
      }
      const otpPepper = Deno.env.get("OTP_HASH_SECRET");
      if (!otpPepper || otpPepper.length < 32) return fail(req, 503, "Email verification is not configured.");
      const preAuthHash = await sha256(body.preAuthToken);
      const { data: challenge, error: challengeError } = await db.from("auth_challenges")
        .select("id, user_id, code_hash, expires_at, attempts, max_attempts, consumed_at")
        .eq("preauth_token_hash", preAuthHash).eq("purpose", "login").maybeSingle();
      if (challengeError) throw challengeError;
      if (!challenge || challenge.consumed_at || new Date(challenge.expires_at).getTime() <= Date.now() ||
          challenge.attempts >= challenge.max_attempts) return fail(req, 401, "Invalid or expired verification code");
      const expectedHash = await sha256(challenge.id + ":" + body.code + ":" + otpPepper);
      if (expectedHash !== challenge.code_hash) {
        const nextAttempts = Number(challenge.attempts) + 1;
        const update: Record<string, unknown> = { attempts: nextAttempts };
        if (nextAttempts >= Number(challenge.max_attempts)) update.consumed_at = new Date().toISOString();
        await db.from("auth_challenges").update(update).eq("id", challenge.id).is("consumed_at", null);
        return fail(req, 401, "Invalid or expired verification code");
      }
      const { data: consumed, error: consumeError } = await db.rpc("consume_auth_challenge", {
        p_preauth_token_hash: preAuthHash, p_code_hash: expectedHash
      });
      if (consumeError) throw consumeError;
      if (!consumed) return fail(req, 401, "Invalid or expired verification code");
      const { data: user, error: userError } = await db.from("users")
        .select("id, username, role, is_active").eq("id", consumed).maybeSingle();
      if (userError) throw userError;
      if (!user || user.role !== "admin" || user.is_active === false) return fail(req, 403, "Admin access required");
      const token = randomToken();
      const tokenHash = await sha256(token);
      const { error: sessionError } = await db.from("admin_sessions").insert({
        user_id: user.id, token_hash: tokenHash, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
      if (sessionError) throw sessionError;
      return response(req, { token });
    }

    if (req.method === "GET" && route === "/admin/orders") {
      const auth = await adminUser(req);
      if ("error" in auth) return fail(req, auth.status, auth.error);
      let query = db.from("orders").select("public_order_id, status, total, branch, customer_name, customer_phone, customer_address, created_at");
      const branch = url.searchParams.get("branch");
      const date = url.searchParams.get("date");
      if (branch) {
        if (!validBranches.has(branch)) return fail(req, 400, "Invalid branch filter");
        query = query.eq("branch", branch);
      }
      if (date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail(req, 400, "Invalid date filter");
        const start = new Date(date + "T00:00:00+05:00");
        if (Number.isNaN(start.getTime())) return fail(req, 400, "Invalid date filter");
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        query = query.gte("created_at", start.toISOString()).lt("created_at", end.toISOString());
      }
      const { data, error } = await query.order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return response(req, (data || []).map((row) => ({
        orderId: row.public_order_id, status: row.status, total: row.total, branch: row.branch,
        customer: { name: row.customer_name, phone: row.customer_phone, address: row.customer_address },
        createdAt: row.created_at,
      })));
    }

    const statusMatch = route.match(/^\/admin\/orders\/([A-Za-z0-9-]+)\/status$/);
    if (req.method === "PATCH" && statusMatch) {
      const auth = await adminUser(req);
      if ("error" in auth) return fail(req, auth.status, auth.error);
      const body = await jsonBody(req);
      if (!body || !validStatuses.has(body.status)) return fail(req, 400, "Invalid status");
      const { data, error } = await db.rpc("update_order_status", {
        p_public_order_id: statusMatch[1], p_new_status: body.status,
      });
      if (error) {
        if (error.code === "22023") return fail(req, 400, "Invalid order status transition");
        throw error;
      }
      if (!data) return fail(req, 404, "Order not found");
      return response(req, data);
    }

    return fail(req, 404, "Not found");
  } catch (error) {
    console.error("Karachi Bites API error:", error instanceof Error ? error.message : "unknown error");
    return fail(req, 500, "Internal server error");
  }
});
