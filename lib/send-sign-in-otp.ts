import { authClient } from "@/lib/auth-client";

/**
 * Trims the typed email and returns it, or null if it is clearly not an email.
 * Full validation happens server-side in better-auth.
 */
export function normalizeEmail(raw: string): string | null {
  const email = raw.trim();
  return email && email.includes("@") ? email : null;
}

type SendSignInOtpCallbacks = {
  onSuccess: () => void;
  onError: (message: string) => void;
};

/**
 * Asks better-auth to email a sign-in code.
 *
 * This must be `emailOtp.sendVerificationOtp`. `signIn.emailOtp` is the
 * VERIFY call: it requires an `otp` field and returns 400 when used to send
 * (the bug in the old fix-auth-otp-github branch, finding C4).
 */
export async function sendSignInOtp(
  email: string,
  { onSuccess, onError }: SendSignInOtpCallbacks
) {
  await authClient.emailOtp.sendVerificationOtp({
    email,
    type: "sign-in",
    fetchOptions: {
      onSuccess,
      onError: (ctx) => {
        onError(ctx.error.message || "Error sending email. Please try again.");
      },
    },
  });
}
