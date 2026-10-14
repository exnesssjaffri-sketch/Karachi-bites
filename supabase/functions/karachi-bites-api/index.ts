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

async function rateAllowed(req: Request, scope: string, identity: string, limit: number, windowSeconds: number) {
  const forwarded = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown";
  const ip = forwarded.split(",")[0].trim().slice(0, 80);
  const bucketKey = await sha256(scope + ":" + ip + ":" + identity.toLowerCase());
  const { data, error } = await db.rpc("consume_auth_rate_limit", {
    p_bucket_key: bucketKey, p_limit: limit, p_window_seconds: windowSeconds
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return Boolean(row && row.allowed);
}
function emailReady() {
  return Boolean(Deno.env.get("RESEND_API_KEY") && Deno.env.get("RESEND_FROM_EMAIL"));
}
function smsReady() {
  return Boolean(Deno.env.get("TWILIO_ACCOUNT_SID") && Deno.env.get("TWILIO_AUTH_TOKEN") && Deno.env.get("TWILIO_FROM_NUMBER"));
}
function normalizePhone(value: string) {
  const compact = value.replace(/[\\s()-]/g, "");
  if (/^03\\d{9}$/.test(compact)) return compact;
  if (/^\\+923\\d{9}$/.test(compact)) return "0" + compact.slice(3);
  if (/^923\\d{9}$/.test(compact)) return "0" + compact.slice(2);
  return "";
}
function maskEmail(email: string) {
  const parts = email.split("@");
  if (parts.length !== 2) return "••••";
  return (parts[0].slice(0, 1) || "•") + "••••@" + parts[1];
}
function validEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value.trim());
}
function randomCode() {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return String(value[0] % 1000000).padStart(6, "0");
}
async function hashCode(challengeId: string, code: string) {
  const pepper = Deno.env.get("OTP_PEPPER") || serviceKey;
  return sha256(challengeId + ":" + code + ":" + pepper);
}
function equalConstantTime(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function sendEmailOtp(to: string, code: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  if (!apiKey || !from) throw new Error("Email delivery is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [to], subject: "Your Karachi Bites staff verification code",
      text: "Your Karachi Bites verification code is " + code + ". It expires in 5 minutes. Never share this code with anyone. If you did not request it, ignore this email.",
      html: '<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#181614"><h2>Karachi Bites security code</h2><p>Use this code to verify your staff portal sign-in:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">' + code + '</p><p>This code expires in <strong>5 minutes</strong>. Never share it with anyone.</p><p>If you did not request this code, you can ignore this email.</p></div>'
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Resend delivery failed:", response.status, detail.slice(0, 300));
    throw new Error("Email delivery failed");
  }
}
async function sendSmsOtp(to: string, code: string) {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM_NUMBER");
  if (!sid || !token || !from) throw new Error("SMS delivery is not configured");
  const normalized = normalizePhone(to);
  if (!normalized) throw new Error("Invalid phone number");
  const params = new URLSearchParams({
    To: "+92" + normalized.slice(1),
    From: from,
    Body: "Karachi Bites staff verification code: " + code + ". Expires in 5 minutes. Do not share this code."
  });
  const response = await fetch("https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json", {
    method: "POST",
    headers: { "Authorization": "Basic " + btoa(sid + ":" + token), "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Twilio delivery failed:", response.status, detail.slice(0, 300));
    throw new Error("SMS delivery failed");
  }
}
async function createChallenge(userId: number, purpose: "register" | "enroll" | "login") {
  const id = crypto.randomUUID();
  const { error } = await db.from("auth_challenges").insert({
    id, user_id: userId, purpose, method: "email", code_hash: "",
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    code_expires_at: null, attempts: 0, send_count: 0,
    last_sent_at: new Date(Date.now() - 60000).toISOString()
  });
  if (error) throw error;
  return id;
}
async function issueOtp(challengeId: string, method: "email" | "sms") {
  const { data: challenge, error } = await db.from("auth_challenges")
    .select("id, user_id, purpose, expires_at, attempts, send_count, last_sent_at, consumed_at")
    .eq("id", challengeId).maybeSingle();
  if (error) throw error;
  if (!challenge || challenge.consumed_at || new Date(challenge.expires_at).getTime() <= Date.now()) {
    return { error: "This verification request has expired. Start again.", status: 410 };
  }
  if (challenge.send_count >= 5) return { error: "Too many codes requested. Start again later.", status: 429 };
  if (challenge.send_count > 0 && Date.now() - new Date(challenge.last_sent_at).getTime() < 60000) {
    return { error: "Please wait 60 seconds before requesting another code.", status: 429 };
  }
  if (method === "email" && !emailReady()) return { error: "Email verification is not configured yet.", status: 503 };
  if (method === "sms" && !smsReady()) return { error: "SMS verification is not configured yet.", status: 503 };
  const { data: user, error: userError } = await db.from("users")
    .select("email, phone").eq("id", challenge.user_id).maybeSingle();
  if (userError) throw userError;
  if (!user) return { error: "Account not found.", status: 404 };
  if (method === "email" && !user.email) return { error: "No email is registered for this account.", status: 400 };
  if (method === "sms" && !user.phone) return { error: "No phone number is registered for this account.", status: 400 };
  const code = randomCode();
  const now = new Date();
  const { data: updated, error: updateError } = await db.from("auth_challenges").update({
    method, code_hash: await hashCode(challengeId, code),
    code_expires_at: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
    attempts: 0, send_count: challenge.send_count + 1, last_sent_at: now.toISOString()
  }).eq("id", challengeId).is("consumed_at", null).select("id").maybeSingle();
  if (updateError) throw updateError;
  if (!updated) return { error: "This verification request is no longer active.", status: 410 };
  try {
    if (method === "email") await sendEmailOtp(user.email, code);
    else await sendSmsOtp(user.phone, code);
  } catch {
    return { error: method === "email" ? "Could not send the email code. Check email service configuration and try again in 60 seconds." : "Could not send the SMS code. Check SMS service configuration.", status: 502 };
  }
  return { ok: true, message: "Verification code sent." };
}
async function authenticatedUser(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return { error: "Authentication required", status: 401 as const };
  const tokenHash = await sha256(authHeader.slice(7));
  const { data, error } = await db.from("admin_sessions")
    .select("user_id, expires_at, users(id, username, role)")
    .eq("token_hash", tokenHash).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error || !data || !data.users) return { error: "Invalid or expired token", status: 401 as const };
  const user = Array.isArray(data.users) ? data.users[0] : data.users;
  if (!user || !["admin", "staff"].includes(user.role)) return { error: "Staff access required", status: 403 as const };
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

    if (req.method === "POST" && route === "/auth/register") {
      if (!emailReady()) return fail(req, 503, "Email verification is not configured yet. Please contact the site administrator.");
      const body = await jsonBody(req);
      if (!body || typeof body.username !== "string" || !/^[A-Za-z0-9_.-]{3,50}$/.test(body.username.trim()) ||
          typeof body.password !== "string" || body.password.length < 12 || body.password.length > 200 ||
          !validEmail(body.email) || typeof body.phone !== "string" || !normalizePhone(body.phone)) {
        return fail(req, 400, "Enter a valid username, a password of at least 12 characters, email address, and Pakistani mobile number.");
      }
      if (!await rateAllowed(req, "register", body.username.trim(), 5, 3600)) return fail(req, 429, "Too many account creation attempts. Try again later.");
      const email = body.email.trim().toLowerCase();
      const phone = normalizePhone(body.phone);
      const { data: user, error } = await db.from("users").insert({
        username: body.username.trim(), password_hash: await bcrypt.hash(body.password, 12),
        role: "staff", email, phone, email_verified: false
      }).select("id, username").single();
      if (error) {
        if (error.code === "23505") return fail(req, 409, "Username or email is already registered.");
        throw error;
      }
      const challengeId = await createChallenge(user.id, "register");
      const sent = await issueOtp(challengeId, "email");
      if ("error" in sent) return fail(req, sent.status, sent.error);
      return response(req, { challengeId, purpose: "register", methods: ["email"], maskedEmail: maskEmail(email) }, 201);
    }

    if (req.method === "POST" && route === "/auth/enroll") {
      if (!emailReady()) return fail(req, 503, "Email verification is not configured yet. Please contact the site administrator.");
      const body = await jsonBody(req);
      if (!body || typeof body.username !== "string" || typeof body.password !== "string" ||
          !validEmail(body.email) || typeof body.phone !== "string" || !normalizePhone(body.phone)) {
        return fail(req, 400, "Username, password, valid email, and Pakistani mobile number are required.");
      }
      if (!await rateAllowed(req, "enroll", body.username.trim(), 5, 3600)) return fail(req, 429, "Too many account setup attempts. Try again later.");
      const { data: user, error } = await db.from("users")
        .select("id, username, password_hash, email_verified")
        .eq("username", body.username.trim()).maybeSingle();
      if (error) throw error;
      if (!user || !(await bcrypt.compare(body.password, user.password_hash))) return fail(req, 401, "Invalid credentials.");
      if (user.email_verified) return fail(req, 409, "This account already has verified contact details. Sign in normally.");
      const email = body.email.trim().toLowerCase();
      const { error: updateError } = await db.from("users").update({
        email, phone: normalizePhone(body.phone), email_verified: false
      }).eq("id", user.id);
      if (updateError) {
        if (updateError.code === "23505") return fail(req, 409, "This email is already associated with another account.");
        throw updateError;
      }
      const challengeId = await createChallenge(user.id, "enroll");
      const sent = await issueOtp(challengeId, "email");
      if ("error" in sent) return fail(req, sent.status, sent.error);
      return response(req, { challengeId, purpose: "enroll", methods: ["email"], maskedEmail: maskEmail(email) }, 201);
    }

    if (req.method === "POST" && route === "/auth/login") {
      const body = await jsonBody(req);
      if (!body || typeof body.username !== "string" || typeof body.password !== "string" || !body.username.trim() || !body.password) {
        return fail(req, 400, "Username and password are required");
      }
      if (!await rateAllowed(req, "login", body.username.trim(), 10, 900)) return fail(req, 429, "Too many sign-in attempts. Wait 15 minutes and try again.");
      const { data: user, error } = await db.from("users")
        .select("id, username, password_hash, role, email, phone, email_verified")
        .eq("username", body.username.trim()).maybeSingle();
      if (error) throw error;
      if (!user || !(await bcrypt.compare(body.password, user.password_hash))) return fail(req, 401, "Invalid credentials");
      if (!user.email_verified || !user.email) {
        return response(req, { enrollmentRequired: true, message: "Verify an email address before using staff portal 2FA." }, 200);
      }
      const methods: string[] = [];
      if (emailReady()) methods.push("email");
      if (smsReady() && user.phone) methods.push("sms");
      const challengeId = await createChallenge(user.id, "login");
      return response(req, {
        challengeId, purpose: "login", methods,
        maskedEmail: maskEmail(user.email),
        maskedPhone: user.phone ? user.phone.replace(/^03(\d{2})\d{5}(\d{2})$/, "03$1•••••$2") : null
      });
    }

    if (req.method === "POST" && route === "/auth/send-otp") {
      const body = await jsonBody(req);
      if (!body || typeof body.challengeId !== "string" || !["email", "sms"].includes(body.method)) {
        return fail(req, 400, "Challenge ID and a valid verification method are required.");
      }
      if (!await rateAllowed(req, "send-otp", body.challengeId, 10, 900)) return fail(req, 429, "Too many code requests. Try again later.");
      const { data: challenge, error } = await db.from("auth_challenges")
        .select("id, purpose, consumed_at").eq("id", body.challengeId).maybeSingle();
      if (error) throw error;
      if (!challenge || challenge.consumed_at) return fail(req, 410, "This verification request has expired. Start again.");
      if (challenge.purpose !== "login" && body.method !== "email") return fail(req, 400, "Account registration and setup must be verified by email.");
      const sent = await issueOtp(body.challengeId, body.method);
      if ("error" in sent) return fail(req, sent.status, sent.error);
      return response(req, sent);
    }

    if (req.method === "POST" && route === "/auth/verify-otp") {
      const body = await jsonBody(req);
      if (!body || typeof body.challengeId !== "string" || typeof body.code !== "string" || !/^\d{6}$/.test(body.code)) {
        return fail(req, 400, "Enter the six-digit verification code.");
      }
      if (!await rateAllowed(req, "verify-otp", body.challengeId, 10, 900)) return fail(req, 429, "Too many verification attempts. Try again later.");
      const { data: challenge, error } = await db.from("auth_challenges")
        .select("id, user_id, purpose, code_hash, expires_at, code_expires_at, attempts, consumed_at")
        .eq("id", body.challengeId).maybeSingle();
      if (error) throw error;
      if (!challenge || challenge.consumed_at || new Date(challenge.expires_at).getTime() <= Date.now() ||
          !challenge.code_expires_at || new Date(challenge.code_expires_at).getTime() <= Date.now() || !challenge.code_hash) {
        return fail(req, 410, "The code has expired. Request a new code.");
      }
      if (challenge.attempts >= 5) return fail(req, 429, "Too many incorrect codes. Start again.");
      const suppliedHash = await hashCode(body.challengeId, body.code);
      if (!equalConstantTime(suppliedHash, challenge.code_hash)) {
        const { error: attemptError } = await db.rpc("increment_auth_challenge_attempts", { p_challenge_id: challenge.id });
        if (attemptError) throw attemptError;
        return fail(req, 401, "Incorrect verification code.");
      }
      const { data: consumed, error: consumeError } = await db.from("auth_challenges").update({ consumed_at: new Date().toISOString() })
        .eq("id", challenge.id).eq("code_hash", challenge.code_hash).is("consumed_at", null)
        .gt("code_expires_at", new Date().toISOString()).select("id").maybeSingle();
      if (consumeError) throw consumeError;
      if (!consumed) return fail(req, 401, "This code has already been used or expired.");
      if (challenge.purpose === "register" || challenge.purpose === "enroll") {
        const { error: verifyError } = await db.from("users").update({ email_verified: true }).eq("id", challenge.user_id);
        if (verifyError) throw verifyError;
        return response(req, { verified: true, accountReady: true, message: "Email verified. You can now sign in with your username and password." });
      }
      const token = randomToken();
      const tokenHash = await sha256(token);
      const { error: sessionError } = await db.from("admin_sessions").insert({
        user_id: challenge.user_id, token_hash: tokenHash,
        expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
      });
      if (sessionError) throw sessionError;
      return response(req, { verified: true, token });
    }

    if (req.method === "POST" && route === "/auth/logout") {
      const authHeader = req.headers.get("authorization") || "";
      if (!authHeader.startsWith("Bearer ")) return fail(req, 401, "Authentication required");
      const tokenHash = await sha256(authHeader.slice(7));
      const { error } = await db.from("admin_sessions").delete().eq("token_hash", tokenHash);
      if (error) throw error;
      return response(req, { ok: true });
    }

    if (req.method === "GET" && route === "/admin/orders") {
      const auth = await authenticatedUser(req);
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
      const auth = await authenticatedUser(req);
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
