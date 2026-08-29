// Maps errors from @clerk/expo's sign-in/sign-up/reset-password calls into
// Bill Pilot-branded copy. Every call in this app's auth flow resolves to
// `{ error: ClerkError | null }` rather than throwing, where a ClerkError is a
// single object with a machine-stable `code` (see @clerk/shared's ClerkError).
// This file is deliberately defensive: it never assumes that shape is present,
// and it never surfaces a raw vendor message to the UI - only strings from the
// allowlist below (or the hardcoded fallback) ever reach a screen.

type ClerkLikeError = {
  code?: string;
  message?: string;
  longMessage?: string;
};

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/** Maps a known Clerk error code to the local field it should be shown under. */
const FIELD_BY_CODE: Record<string, string> = {
  form_identifier_exists: "email",
  form_identifier_not_found: "email",
  form_param_format_invalid: "email",
  form_password_incorrect: "password",
  form_password_pwned: "password",
  form_password_length_too_short: "password",
  form_password_validation_failed: "password",
  form_code_incorrect: "code",
  verification_expired: "code",
  verification_failed: "code",
};

const MESSAGE_BY_CODE: Record<string, string> = {
  form_identifier_exists: "An account with that email already exists.",
  form_identifier_not_found: "We couldn't find an account with that email.",
  form_password_incorrect: "Incorrect email or password.",
  form_password_pwned: "That password isn't secure enough - please choose a different one.",
  form_password_length_too_short: "Password must be at least 8 characters.",
  form_password_validation_failed: "That password doesn't meet the requirements.",
  form_code_incorrect: "That code isn't right. Please try again.",
  form_param_format_invalid: "Enter a valid email address.",
  verification_expired: "That code has expired. Request a new one.",
  verification_failed: "We couldn't verify that code. Please try again.",
  too_many_requests: "Too many attempts. Please wait a moment and try again.",
  session_exists: "You're already signed in.",
};

const asClerkError = (err: unknown): ClerkLikeError | null => {
  if (typeof err === "object" && err !== null && typeof (err as ClerkLikeError).code === "string") {
    return err as ClerkLikeError;
  }
  return null;
};

// Clerk's `longMessage` (and, failing that, `message`) is written to be shown
// to end users directly - it describes the user's mistake (e.g. a dashboard-
// configured password policy) rather than any vendor-internal detail, so it's
// safe to surface as-is. As a defensive last resort, guard against the literal
// word "Clerk" ever slipping through regardless.
const safeVendorMessage = (clerkError: ClerkLikeError): string | undefined => {
  const text = clerkError.longMessage ?? clerkError.message;
  if (!text || /clerk/i.test(text)) return undefined;
  return text;
};

/** A per-field error message, keyed by this app's local field name, if one applies. */
export const getAuthFieldErrors = (err: unknown): Record<string, string> => {
  const clerkError = asClerkError(err);
  if (!clerkError?.code) return {};
  const field = FIELD_BY_CODE[clerkError.code];
  if (!field) return {};
  const message = MESSAGE_BY_CODE[clerkError.code] ?? safeVendorMessage(clerkError) ?? "Please check this field.";
  return { [field]: message };
};

/** A single banner-level message for errors that can't be pinned to one field. */
export const getAuthErrorMessage = (err: unknown): string => {
  const clerkError = asClerkError(err);
  if (clerkError?.code && MESSAGE_BY_CODE[clerkError.code]) {
    return MESSAGE_BY_CODE[clerkError.code];
  }

  if (__DEV__) {
    // Log whatever we couldn't map to our own curated copy, so it's easy to
    // find in the Metro console and add to MESSAGE_BY_CODE / FIELD_BY_CODE
    // above later. Never shown in the UI.
    console.warn("[auth] Unmapped error code, falling back to vendor message:", err);
  }

  return (clerkError && safeVendorMessage(clerkError)) ?? FALLBACK_MESSAGE;
};
