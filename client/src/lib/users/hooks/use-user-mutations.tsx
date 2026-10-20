import { useApolloClient, useMutation } from "@apollo/client/react";
import {
    CREATE_USER_MUTATION,
    DELETE_USER_MUTATION,
    UPDATE_PROFILE_MUTATION,
    UPDATE_USER_MUTATION,
    USERS_QUERY,
} from "@/lib/users/api/graphql";
import type { UserFormFields } from "@/lib/users/models/user-form";
import type { UserRole } from "@/lib/auth/api/graphql";

/** Список пользователей перезапрашивается после любой мутации. */
function useRefetchUsers() {
    const client = useApolloClient();
    return async () => {
        try {
            await client.refetchQueries({ include: [USERS_QUERY] });
        } catch {
            // Сама мутация уже прошла; ошибку обновления списка покажет таблица.
        }
    };
}

export function useCreateUser() {
    const [mutate] = useMutation(CREATE_USER_MUTATION);
    const refetchUsers = useRefetchUsers();

    return async (fields: UserFormFields) => {
        await mutate({
            variables: {
                user: {
                    auth: { email: fields.email.trim(), password: fields.password },
                    profile: { first_name: fields.firstName.trim(), last_name: fields.lastName.trim() },
                    departmentId: fields.departmentId,
                    positionId: fields.positionId,
                    role: fields.role as UserRole,
                },
            },
        });
        await refetchUsers();
    };
}

/**
 * Имя и фамилия лежат в profile (updateProfile), отдел/должность/роль — в user (updateUser):
 * на сервере это две разные мутации.
 */
export function useUpdateUser() {
    const [updateUser] = useMutation(UPDATE_USER_MUTATION);
    const [updateProfile] = useMutation(UPDATE_PROFILE_MUTATION);
    const refetchUsers = useRefetchUsers();

    return async (userId: string, fields: UserFormFields) => {
        try {
            await updateUser({
                variables: {
                    user: {
                        userId,
                        departmentId: fields.departmentId,
                        positionId: fields.positionId,
                        role: fields.role as UserRole,
                    },
                },
            });
            await updateProfile({
                variables: {
                    profile: { userId, first_name: fields.firstName.trim(), last_name: fields.lastName.trim() },
                },
            });
        } finally {
            // Даже если вторая мутация упала, первая уже могла примениться.
            await refetchUsers();
        }
    };
}

export function useDeleteUser() {
    const [mutate] = useMutation(DELETE_USER_MUTATION);
    const refetchUsers = useRefetchUsers();

    return async (userId: string) => {
        await mutate({ variables: { userId } });
        await refetchUsers();
    };
}
