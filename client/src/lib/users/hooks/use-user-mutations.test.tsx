import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CREATE_USER_MUTATION, DELETE_USER_MUTATION, UPDATE_PROFILE_MUTATION, UPDATE_USER_MUTATION, USERS_QUERY } from "@/lib/users/api/graphql";

const mutations = new Map<unknown, ReturnType<typeof vi.fn>>();
const refetchQueries = vi.fn();
vi.mock("@apollo/client/react", () => ({
    useMutation: (doc: unknown) => {
        if (!mutations.has(doc)) mutations.set(doc, vi.fn().mockResolvedValue({ data: {} }));
        return [mutations.get(doc)];
    },
    useApolloClient: () => ({ refetchQueries }),
}));

import { useCreateUser, useDeleteUser, useUpdateUser } from "./use-user-mutations";

const fields = { email: " a@b.co ", password: "secret", firstName: " Ann ", lastName: "Lee ", departmentId: "1", positionId: "2", role: "Admin" as const };
const mock = (doc: unknown) => { if (!mutations.has(doc)) mutations.set(doc, vi.fn().mockResolvedValue({ data: {} })); return mutations.get(doc)!; };

beforeEach(() => { mutations.clear(); refetchQueries.mockReset().mockResolvedValue(undefined); });

describe("useCreateUser", () => {
    it("собирает CreateUserInput и обновляет список", async () => {
        const { result } = renderHook(() => useCreateUser());
        await result.current(fields);
        expect(mock(CREATE_USER_MUTATION)).toHaveBeenCalledWith({
            variables: { user: { auth: { email: "a@b.co", password: "secret" }, profile: { first_name: "Ann", last_name: "Lee" }, departmentId: "1", positionId: "2", role: "Admin" } },
        });
        expect(refetchQueries).toHaveBeenCalledWith({ include: [USERS_QUERY] });
    });
    it("ошибка мутации пробрасывается, список не обновляется", async () => {
        const { result } = renderHook(() => useCreateUser());
        mock(CREATE_USER_MUTATION).mockRejectedValue(new Error("boom"));
        await expect(result.current(fields)).rejects.toThrow("boom");
        expect(refetchQueries).not.toHaveBeenCalled();
    });
    it("сбой обновления списка не считается ошибкой создания", async () => {
        refetchQueries.mockRejectedValue(new Error("net"));
        const { result } = renderHook(() => useCreateUser());
        await expect(result.current(fields)).resolves.toBeUndefined();
    });
});

describe("useUpdateUser", () => {
    it("две мутации: updateUser и updateProfile", async () => {
        const { result } = renderHook(() => useUpdateUser());
        await result.current("7", fields);
        expect(mock(UPDATE_USER_MUTATION)).toHaveBeenCalledWith({ variables: { user: { userId: "7", departmentId: "1", positionId: "2", role: "Admin" } } });
        expect(mock(UPDATE_PROFILE_MUTATION)).toHaveBeenCalledWith({ variables: { profile: { userId: "7", first_name: "Ann", last_name: "Lee" } } });
        expect(refetchQueries).toHaveBeenCalledTimes(1);
    });
    it("если упала вторая мутация, список всё равно обновляется, ошибка пробрасывается", async () => {
        const { result } = renderHook(() => useUpdateUser());
        mock(UPDATE_PROFILE_MUTATION).mockRejectedValue(new Error("profile failed"));
        await expect(result.current("7", fields)).rejects.toThrow("profile failed");
        expect(refetchQueries).toHaveBeenCalledTimes(1);
    });
    it("если упала первая, updateProfile не вызывается", async () => {
        const { result } = renderHook(() => useUpdateUser());
        mock(UPDATE_USER_MUTATION).mockRejectedValue(new Error("user failed"));
        await expect(result.current("7", fields)).rejects.toThrow("user failed");
        expect(mock(UPDATE_PROFILE_MUTATION)).not.toHaveBeenCalled();
    });
});

describe("useDeleteUser", () => {
    it("удаляет и обновляет список", async () => {
        const { result } = renderHook(() => useDeleteUser());
        await result.current("9");
        expect(mock(DELETE_USER_MUTATION)).toHaveBeenCalledWith({ variables: { userId: "9" } });
        expect(refetchQueries).toHaveBeenCalled();
    });
});
