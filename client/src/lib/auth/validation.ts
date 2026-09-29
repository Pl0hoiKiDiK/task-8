export type SignupValues = {
    email: string;
    password: string;
    confirmPassword: string;
};

export type SignupErrors = Partial<Record<keyof SignupValues, string>>;

export const PASSWORD_MIN_LENGTH = 5;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignup(values: SignupValues): SignupErrors {
    const errors: SignupErrors = {};
    const email = values.email.trim();

    if (!email) errors.email = "Email is required";
    else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email";

    if (!values.password) errors.password = "Password is required";
    else if (values.password.length < PASSWORD_MIN_LENGTH) {
        errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    }

    if (!values.confirmPassword) errors.confirmPassword = "Confirm your password";
    else if (values.confirmPassword !== values.password) {
        errors.confirmPassword = "Passwords do not match";
    }

    return errors;
}