import { CombinedGraphQLErrors } from "@apollo/client";

const GENERIC_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_MESSAGE = "Cannot reach the server. Check your connection and try again.";

const API_MESSAGES: Record<string, string> = {
    insufficientPermissions: "You do not have permission to do this",
    notOwnProfile: "You can only change your own profile",
    notOwnUser: "You can only change your own data",
    notOwnCv: "You can only change your own CVs",
    cannotAssignAdminRoleToYourself: "You cannot assign the Admin role to yourself",

    userNotFound: "User not found",
    userAlreadyExists: "A user with this email already exists",
    cannotDeleteVerifiedUser: "Verified users cannot be deleted",

    departmentNotFound: "Department not found",
    positionNotFound: "Position not found",

    profileNotFound: "Profile not found",
    skillHasBeenAdded: "Skill already exists",
    languageHasBeenAdded: "Language already exists",

    cvNotFound: "CV not found",
    projectHasBeenAdded: "Project already added",
};

export function getApiErrorCode(error: unknown): string | null {
    if (!CombinedGraphQLErrors.is(error)) return null;
    return error.errors[0]?.message ?? null;
}

export function getApiErrorMessage(error: unknown, overrides: Record<string, string> = {}): string {
    if (CombinedGraphQLErrors.is(error)) {
        const code = error.errors[0]?.message;
        return (code && (overrides[code] ?? API_MESSAGES[code])) || GENERIC_MESSAGE;
    }
    return NETWORK_MESSAGE;
}
