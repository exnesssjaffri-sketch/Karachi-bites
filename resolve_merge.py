import sys
path = r'supabase/functions/karachi-bites-api/index.ts'
conflict_start = 381  # 0-indexed line 382
conflict_end = 580   # 0-indexed line 581 (exclusive)

replacement = '''      if (!await rateAllowed(req, "login", body.username.trim(), 10, 900)) return fail(req, 429, "Too many sign-in attempts. Wait 15 minutes and try again.");
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
        maskedPhone: user.phone ? user.phone.replace(/^03(\\d{2})\\d{5}(\\d{2})$/, "03$1•••••$2") : null
      });
    }

    if (req.method === "POST" && route === "/auth/send-otp") {
      const body = await jsonBody(req);
      if (!body || typeof body.challengeId !== "string" || !["email", "sms"].includes(body.method)) {
        return fail(req, 400, "Challenge ID and a valid verification method are required.");
      }
      const { data: challenge, error } = await db.from("auth_challenges")
        .select("id, purpose, consumed_at").eq("id", body.challengeId).maybeSingle();
      if (error) throw error;
      if (!challenge || challenge.consumed_at) return fail(req, 410, "This verification request has expired. Start again.");
      if (!await rateAllowed(req, "send-otp", body.challengeId, 10, 900)) return fail(req, 429, "Too many code requests. Try again later.");
      if (challenge.purpose !== "login" && body.method !== "email") return fail(req, 400, "Account registration and setup must be verified by email.");
      const sent = await issueOtp(body.challengeId, body.method);
      if ("error" in sent) return fail(req, sent.status, sent.error);
      return response(req, sent);
    }

    if (req.method === "POST" && route === "/auth/verify-otp") {
      const body = await jsonBody(req);
      if (!body || typeof body.challengeId !== "string" || typeof body.code !== "string" || !/^\\d{6}$/.test(body.code)) {
        return fail(req, 400, "Enter the six-digit verification code.");
      }
      const { data: challenge, error } = await db.from("auth_challenges")
        .select("id, user_id, purpose, code_hash, expires_at, code_expires_at, attempts, consumed_at")
        .eq("id", body.challengeId).maybeSingle();
      if (error) throw error;
      if (!challenge || challenge.consumed_at || new Date(challenge.expires_at).getTime() <= Date.now() ||
          !challenge.code_expires_at || new Date(challenge.code_expires_at).getTime() <= Date.now() || !challenge.code_hash) {
        return fail(req, 410, "The code has expired. Request a new code.");
      }
      if (!await rateAllowed(req, "verify-otp", body.challengeId, 10, 900)) return fail(req, 429, "Too many verification attempts. Try again later.");
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
'''

with open(path, 'r', encoding='utf-8') as f:
    all_lines = f.readlines()

prefix = all_lines[:conflict_start]
suffix = all_lines[conflict_end:]
new_lines = prefix + replacement.splitlines(keepends=True) + suffix

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f'Lines before: {len(all_lines)}')
print(f'Lines after: {len(new_lines)}')