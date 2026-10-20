import type { UserListItem } from "@/lib/users/api/graphql";

export function userFullName(user: Pick<UserListItem, "profile">): string {
    return [user.profile.first_name, user.profile.last_name].filter(Boolean).join(" ").trim();
}

export function userInitial(user: Pick<UserListItem, "profile" | "email">): string {
    const source = user.profile.first_name || user.profile.last_name || user.email;
    return source.charAt(0).toUpperCase();
}
