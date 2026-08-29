import { parsePriceInput } from "./utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export const isValidEmail = (value: string): boolean => EMAIL_PATTERN.test(value.trim());

export const validateEmail = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required";
  if (!isValidEmail(trimmed)) return "Enter a valid email address";
  return undefined;
};

export const validateNewPassword = (value: string): string | undefined => {
  if (!value) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters";
  return undefined;
};

export const validatePasswordPresence = (value: string): string | undefined => {
  if (!value) return "Password is required";
  return undefined;
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string | undefined => {
  if (!confirmPassword) return "Please confirm your password";
  if (confirmPassword !== password) return "Passwords don't match";
  return undefined;
};

export const validateCode = (value: string): string | undefined => {
  if (!value.trim()) return "Enter the code we sent you";
  return undefined;
};

export const hasValidationErrors = (
  errors: Record<string, string | undefined>
): boolean => Object.values(errors).some(Boolean);

export type SignInErrors = Partial<Record<"email" | "password", string>>;

export const validateSignIn = (values: { email: string; password: string }): SignInErrors => ({
  email: validateEmail(values.email),
  password: validatePasswordPresence(values.password),
});

export type SignUpErrors = Partial<Record<"email" | "password" | "confirmPassword", string>>;

export const validateSignUp = (values: {
  email: string;
  password: string;
  confirmPassword: string;
}): SignUpErrors => ({
  email: validateEmail(values.email),
  password: validateNewPassword(values.password),
  confirmPassword: validateConfirmPassword(values.password, values.confirmPassword),
});

export type RequestResetErrors = Partial<Record<"email", string>>;

export const validateRequestReset = (values: { email: string }): RequestResetErrors => ({
  email: validateEmail(values.email),
});

export const validateSubscriptionName = (value: string): string | undefined => {
  if (!value.trim()) return "Name is required";
  return undefined;
};

export const validateSubscriptionPrice = (value: string): string | undefined => {
  if (!value.trim()) return "Price is required";
  const parsed = parsePriceInput(value);
  if (!Number.isFinite(parsed)) return "Enter a valid amount";
  if (parsed <= 0) return "Price must be greater than 0";
  return undefined;
};

export type SubscriptionErrors = Partial<Record<"name" | "price", string>>;

export const validateSubscription = (values: {
  name: string;
  price: string;
}): SubscriptionErrors => ({
  name: validateSubscriptionName(values.name),
  price: validateSubscriptionPrice(values.price),
});

export type ResetPasswordErrors = Partial<Record<"code" | "password" | "confirmPassword", string>>;

export const validateResetPassword = (values: {
  code: string;
  password: string;
  confirmPassword: string;
}): ResetPasswordErrors => ({
  code: validateCode(values.code),
  password: validateNewPassword(values.password),
  confirmPassword: validateConfirmPassword(values.password, values.confirmPassword),
});
