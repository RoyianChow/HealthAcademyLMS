/**
 * Unit tests — email OTP sign-in (HA-01, findings C4/C5)
 *
 * The login form must SEND the code with authClient.emailOtp.sendVerificationOtp.
 * Using authClient.signIn.emailOtp here (the old fix branch's bug) requires an
 * otp and returns 400, so no code is ever sent.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailOtp: { sendVerificationOtp: vi.fn() },
    signIn: { emailOtp: vi.fn() },
  },
}));

import { authClient } from "@/lib/auth-client";
import { normalizeEmail, sendSignInOtp } from "@/lib/send-sign-in-otp";

const mockSend = vi.mocked(authClient.emailOtp.sendVerificationOtp);
const mockVerify = vi.mocked(authClient.signIn.emailOtp);

type SendArgs = {
  email: string;
  type: string;
  fetchOptions: {
    onSuccess: () => void;
    onError: (ctx: { error: { message?: string } }) => void;
  };
};

describe("sendSignInOtp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the code with emailOtp.sendVerificationOtp and the typed email", async () => {
    await sendSignInOtp("student@example.com", {
      onSuccess: vi.fn(),
      onError: vi.fn(),
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ email: "student@example.com", type: "sign-in" })
    );
  });

  it("never uses the verify call (signIn.emailOtp) to send", async () => {
    await sendSignInOtp("student@example.com", {
      onSuccess: vi.fn(),
      onError: vi.fn(),
    });

    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("passes success and error results back to the form", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    await sendSignInOtp("student@example.com", { onSuccess, onError });

    const args = mockSend.mock.calls[0][0] as unknown as SendArgs;
    args.fetchOptions.onSuccess();
    args.fetchOptions.onError({ error: { message: "Too many requests" } });
    args.fetchOptions.onError({ error: {} });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenNthCalledWith(1, "Too many requests");
    expect(onError).toHaveBeenNthCalledWith(
      2,
      "Error sending email. Please try again."
    );
  });
});

describe("normalizeEmail", () => {
  it("trims whitespace", () => {
    expect(normalizeEmail("  student@example.com ")).toBe("student@example.com");
  });

  it("rejects empty or obviously invalid input", () => {
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail("   ")).toBeNull();
    expect(normalizeEmail("not-an-email")).toBeNull();
  });
});
