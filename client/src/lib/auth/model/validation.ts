export const PASSWORD_MIN_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const OTP_LENGTH = 6;
export const isOtpComplete = (code: string) => new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code);

export type SignupValues = {
    email: string;
    password: string;
    confirmPassword: string;
};

export type SignupErrors = Partial<Record<keyof SignupValues, string>>;

export type LoginValues = {
    email: string;
    password: string;
};

export type LoginErrors = Partial<Record<keyof LoginValues, string>>;

export function checkEmail(email: string): string | undefined {
    const value = email.trim();
    if (!value) return "Email is required";
    if (!EMAIL_PATTERN.test(value)) return "Please enter a valid email address";
}

export function checkPassword(password: string): string | undefined {
    if (!password) return "Password is required";
    if (password.length < PASSWORD_MIN_LENGTH) {
        return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
    }
}

export function checkConfirmPassword(password: string, confirm: string): string | undefined {
    if (!confirm) return "Confirm Password is required";
    if (confirm !== password) return "Passwords do not match";
}

export function validateSignup(values: SignupValues): SignupErrors {
    const errors: SignupErrors = {};
    const email = checkEmail(values.email);
    const password = checkPassword(values.password);
    const confirm = checkConfirmPassword(values.password, values.confirmPassword);
    if (email) errors.email = email;
    if (password) errors.password = password;
    if (confirm) errors.confirmPassword = confirm;
    return errors;
}

export function validateLogin(values: LoginValues): LoginErrors {
    const errors: LoginErrors = {};
    const email = checkEmail(values.email);
    const password = checkPassword(values.password);
    if (email) errors.email = email;
    if (password) errors.password = password;
    return errors;
}

export type ForgotPasswordValues = { email: string };
export type ForgotPasswordErrors = Partial<Record<keyof ForgotPasswordValues, string>>;

export function validateForgotPassword(values: ForgotPasswordValues): ForgotPasswordErrors {
    const email = checkEmail(values.email);
    return email ? { email } : {};
}

export type ResetPasswordValues = { newPassword: string; confirmPassword: string };
export type ResetPasswordErrors = Partial<Record<keyof ResetPasswordValues, string>>;

export function validateResetPassword(values: ResetPasswordValues): ResetPasswordErrors {
    const errors: ResetPasswordErrors = {};
    const password = checkPassword(values.newPassword);
    const confirm = checkConfirmPassword(values.newPassword, values.confirmPassword);
    if (password) errors.newPassword = password;
    if (confirm) errors.confirmPassword = confirm;
    return errors;
}