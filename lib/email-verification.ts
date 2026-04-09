import { randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

const VERIFY_TOKEN_TTL_HOURS = 24;
const EMAIL_OTP_TTL_MINUTES = 15;
/** After OTP check, user must finish registration within this window. */
const REGISTRATION_VERIFIED_TTL_MINUTES = 30;

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function makeVerifyUrl(baseUrl: string, email: string, token: string) {
  const root = normalizeBaseUrl(baseUrl);
  const q = new URLSearchParams({ email, token });
  return `${root}/api/auth/verify-email?${q.toString()}`;
}

function getEmailFromAddress() {
  return process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
}

export async function sendEmailVerificationEmail({
  email,
  baseUrl,
}: {
  email: string;
  baseUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false as const, reason: "missing_api_key" as const };
  }

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  const verifyUrl = makeVerifyUrl(baseUrl, email, token);
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: getEmailFromAddress(),
    to: email,
    subject: "Verify your email | تأكيد البريد الإلكتروني",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height:1.7; color:#111827;">
        <h2 style="margin:0 0 12px 0;">تأكيد البريد الإلكتروني</h2>
        <p style="margin:0 0 12px 0;">شكراً لإنشاء حساب جديد. اضغط الزر التالي لتأكيد بريدك الإلكتروني:</p>
        <p style="margin:18px 0;">
          <a href="${verifyUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">
            تأكيد البريد الإلكتروني
          </a>
        </p>
        <p style="margin:0 0 16px 0; font-size: 13px; color:#4b5563;">هذا الرابط صالح لمدة ${VERIFY_TOKEN_TTL_HOURS} ساعة.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0;" />
        <div dir="ltr">
          <h3 style="margin:0 0 8px 0;">Verify your email</h3>
          <p style="margin:0 0 8px 0;">Thanks for creating an account. Click the button above to verify your email.</p>
          <p style="margin:0 0 8px 0; font-size: 13px; color:#4b5563;">This link expires in ${VERIFY_TOKEN_TTL_HOURS} hours.</p>
          <p style="margin:0; font-size: 13px; color:#4b5563;">If the button does not work, use this URL: <a href="${verifyUrl}">${verifyUrl}</a></p>
        </div>
      </div>
    `,
    text: [
      "تأكيد البريد الإلكتروني",
      `افتح الرابط التالي لتأكيد البريد: ${verifyUrl}`,
      "",
      "Verify your email",
      `Open this link to verify your email: ${verifyUrl}`,
    ].join("\n"),
  });

  return { sent: true as const };
}

export function normalizeEmailKey(email: string) {
  return email.trim().toLowerCase();
}

function generateSixDigitCode() {
  return String(randomInt(100_000, 1_000_000));
}

function otpCodesEqual(stored: string, input: string) {
  const a = Buffer.from(stored, "utf8");
  const b = Buffer.from(input, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Sends a 6-digit code by email for verification (guest checkout / inline flows).
 * Replaces any existing OTP for this address.
 */
export async function sendEmailVerificationCode({
  email,
}: {
  email: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false as const, reason: "missing_api_key" as const };
  }

  const emailKey = normalizeEmailKey(email);
  const code = generateSixDigitCode();
  const expires = new Date(Date.now() + EMAIL_OTP_TTL_MINUTES * 60 * 1000);

  await prisma.emailVerificationOtp.deleteMany({
    where: { email: emailKey },
  });

  await prisma.emailVerificationOtp.create({
    data: {
      email: emailKey,
      code,
      expires,
    },
  });

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: getEmailFromAddress(),
    to: email.trim(),
    subject: "Your verification code | رمز التحقق",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height:1.7; color:#111827;">
        <h2 style="margin:0 0 12px 0;">رمز التحقق</h2>
        <p style="margin:0 0 12px 0;">استخدم الرمز التالي لتأكيد بريدك الإلكتروني:</p>
        <p style="margin:18px 0; font-size: 28px; letter-spacing: 0.25em; font-weight: 700;">${code}</p>
        <p style="margin:0; font-size: 13px; color:#4b5563;">صالح لمدة ${EMAIL_OTP_TTL_MINUTES} دقيقة. لا تشارك هذا الرمز مع أحد.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0;" />
        <div dir="ltr">
          <h3 style="margin:0 0 8px 0;">Your verification code</h3>
          <p style="margin:0 0 8px 0;">Use this code to verify your email:</p>
          <p style="margin:18px 0; font-size: 28px; letter-spacing: 0.25em; font-weight: 700;">${code}</p>
          <p style="margin:0; font-size: 13px; color:#4b5563;">Valid for ${EMAIL_OTP_TTL_MINUTES} minutes. Do not share this code.</p>
        </div>
      </div>
    `,
    text: [
      "رمز التحقق",
      `الرمز: ${code} (صالح ${EMAIL_OTP_TTL_MINUTES} دقيقة)`,
      "",
      "Verification code",
      `Your code: ${code} (expires in ${EMAIL_OTP_TTL_MINUTES} minutes)`,
    ].join("\n"),
  });

  return { sent: true as const };
}

/**
 * After valid OTP, allow guest registration for this email until {@link REGISTRATION_VERIFIED_TTL_MINUTES}.
 * Does not create or update a user.
 */
export async function verifyRegistrationOtp({
  email,
  code,
}: {
  email: string;
  code: string;
}): Promise<{ ok: true } | { ok: false; reason: "invalid" | "expired" }> {
  const emailKey = normalizeEmailKey(email);
  const digits = code.replace(/\D/g, "").slice(0, 6);
  if (digits.length !== 6) {
    return { ok: false, reason: "invalid" };
  }

  const row = await prisma.emailVerificationOtp.findUnique({
    where: { email: emailKey },
  });

  if (!row) {
    return { ok: false, reason: "invalid" };
  }

  if (row.expires < new Date()) {
    await prisma.emailVerificationOtp.deleteMany({ where: { email: emailKey } });
    return { ok: false, reason: "expired" };
  }

  if (!otpCodesEqual(row.code, digits)) {
    return { ok: false, reason: "invalid" };
  }

  await prisma.emailVerificationOtp.deleteMany({ where: { email: emailKey } });

  const expiresAt = new Date(Date.now() + REGISTRATION_VERIFIED_TTL_MINUTES * 60 * 1000);
  await prisma.registrationVerification.upsert({
    where: { email: emailKey },
    create: { email: emailKey, expiresAt },
    update: { expiresAt },
  });

  return { ok: true };
}

export async function verifyEmailWithOtp({
  email,
  code,
}: {
  email: string;
  code: string;
}): Promise<{ ok: true } | { ok: false; reason: "invalid" | "expired" }> {
  const emailKey = normalizeEmailKey(email);
  const digits = code.replace(/\D/g, "").slice(0, 6);
  if (digits.length !== 6) {
    return { ok: false, reason: "invalid" };
  }

  const row = await prisma.emailVerificationOtp.findUnique({
    where: { email: emailKey },
  });

  if (!row) {
    return { ok: false, reason: "invalid" };
  }

  if (row.expires < new Date()) {
    await prisma.emailVerificationOtp.deleteMany({ where: { email: emailKey } });
    return { ok: false, reason: "expired" };
  }

  if (!otpCodesEqual(row.code, digits)) {
    return { ok: false, reason: "invalid" };
  }

  await prisma.user.updateMany({
    where: { email: { equals: emailKey, mode: "insensitive" } },
    data: { emailVerified: new Date() },
  });

  await prisma.emailVerificationOtp.deleteMany({ where: { email: emailKey } });
  await prisma.verificationToken.deleteMany({
    where: { identifier: emailKey },
  });

  return { ok: true };
}
