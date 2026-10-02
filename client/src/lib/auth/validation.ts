export const PASSWORD_MIN_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function checkPassword(password: string): string | undefined {
    if (!password) return "Password is required";
    if (password.length < PASSWORD_MIN_LENGTH) { return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`; }
}

export type SignupValues = {
    email: string;
    password: string;
    confirmPassword: string;
};

export type SignupErrors = Partial<Record<keyof SignupValues, string>>;

export function validateSignup(values: SignupValues): SignupErrors {
    const errors: SignupErrors = {};
    const email = values.email.trim();

    if (!email) errors.email = "Email is required";
    else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email";

    const passwordError = checkPassword(values.password);
    if (passwordError) errors.password = passwordError;

    if (!values.confirmPassword) errors.confirmPassword = "Confirm your password";
    else if (values.confirmPassword !== values.password) {
        errors.confirmPassword = "Passwords do not match";
    }

    return errors;
}

export type LoginValues = {
    email: string;
    password: string;
};

export type LoginErrors = Partial<Record<keyof LoginValues, string>>;

export function validateLogin(values: LoginValues): LoginErrors {
    const errors: LoginErrors = {};
    const email = values.email.trim();

    if (!email) errors.email = "Email is required";
    else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email";

    const passwordError = checkPassword(values.password);
    if (passwordError) errors.password = passwordError;

    return errors;
}