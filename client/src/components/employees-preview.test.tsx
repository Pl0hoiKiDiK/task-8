// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
    default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

const list = {
    searchInput: "", setSearchInput: vi.fn(), sort: null as null | { by: string; order: string }, toggleSort: vi.fn(),
    page: 1, setPage: vi.fn(), users: [] as unknown[], total: 0, totalPages: 0, loading: false, error: undefined as unknown, refetch: vi.fn(),
};
const options = { departments: [{ id: "1", name: "React" }], positions: [{ id: "2", name: "Engineer" }], loading: false, error: undefined as unknown, refetch: vi.fn() };
const createUser = vi.fn(); const updateUser = vi.fn(); const deleteUser = vi.fn();

vi.mock("@/lib/users/hooks/use-user-list", () => ({
    useUsersList: () => list,
    SORTABLE_BY_SERVER: { first_name: true, last_name: true, department: false, position: false },
}));
vi.mock("@/lib/users/hooks/use-user-options", () => ({ useUserOptions: () => options }));
vi.mock("@/lib/users/hooks/use-user-mutations", () => ({
    useCreateUser: () => createUser, useUpdateUser: () => updateUser, useDeleteUser: () => deleteUser,
}));

import { EmployeesPreview } from "./employees-preview";

const person = (id: string, first: string | null, last: string | null, email: string, dep = "React", pos: string | null = "Engineer") => ({
    id, created_at: "", email, role: "Employee", is_verified: false,
    profile: { first_name: first, last_name: last, avatar: null },
    department: dep ? { id: "1", name: dep } : null, position: pos ? { id: "2", name: pos } : null,
});

beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(list, { searchInput: "", sort: null, page: 1, users: [person("5", "Ann", "Lee", "ann@x.co"), person("6", null, null, "zed@x.co", "", null)], total: 2, totalPages: 1, loading: false, error: undefined });
    createUser.mockResolvedValue(undefined); updateUser.mockResolvedValue(undefined); deleteUser.mockResolvedValue(undefined);
});

describe("EmployeesPreview — список", () => {
    it("показывает данные из БД; без имени — инициал из email, пустые отдел/должность не ломают строку", () => {
        render(<EmployeesPreview />);
        expect(screen.getByText("ann@x.co")).toBeTruthy();
        expect(screen.getByText("A")).toBeTruthy();
        expect(screen.getByText("Z")).toBeTruthy();
    });

    it("сотрудник: стрелка ведёт на /employees/{id}, меню действий и CREATE USER нет", () => {
        render(<EmployeesPreview />);
        expect(screen.getByRole("link", { name: "Open Ann Lee" }).getAttribute("href")).toBe("/employees/5");
        expect(screen.queryByRole("button", { name: /create user/i })).toBeNull();
        expect(screen.queryByRole("button", { name: /actions for/i })).toBeNull();
    });

    it("админ: меню View / Update / Delete, View ведёт на /admin/employees/{id}", async () => {
        const user = userEvent.setup({ delay: null });
        render(<EmployeesPreview admin />);
        await user.click(screen.getByRole("button", { name: "Actions for Ann Lee" }));
        const menu = screen.getByRole("menu");
        expect(within(menu).getByRole("menuitem", { name: "View" }).getAttribute("href")).toBe("/admin/employees/5");
        expect(within(menu).getByRole("menuitem", { name: "Update" })).toBeTruthy();
        expect(within(menu).getByRole("menuitem", { name: "Delete" })).toBeTruthy();
    });

    it("одновременно открыто только одно меню; Escape и клик снаружи закрывают", async () => {
        const user = userEvent.setup({ delay: null });
        render(<EmployeesPreview admin />);
        await user.click(screen.getByRole("button", { name: "Actions for Ann Lee" }));
        await user.click(screen.getByRole("button", { name: "Actions for zed@x.co" }));
        expect(screen.getAllByRole("menu")).toHaveLength(1);
        await user.keyboard("{Escape}");
        expect(screen.queryByRole("menu")).toBeNull();
        await user.click(screen.getByRole("button", { name: "Actions for Ann Lee" }));
        await user.click(document.body);
        expect(screen.queryByRole("menu")).toBeNull();
    });

    it("поиск и сортировка делегируются хуку", async () => {
        const user = userEvent.setup({ delay: null });
        render(<EmployeesPreview />);
        await user.type(screen.getByRole("searchbox"), "a");
        expect(list.setSearchInput).toHaveBeenCalledWith("a");
        await user.click(screen.getByRole("button", { name: /Last Name/ }));
        expect(list.toggleSort).toHaveBeenCalledWith("last_name");
        await user.click(screen.getByRole("button", { name: /First Name/ }));
        expect(list.toggleSort).toHaveBeenCalledWith("first_name");
    });

    it("aria-sort отражает активную сортировку", () => {
        list.sort = { by: "last_name", order: "desc" };
        render(<EmployeesPreview />);
        expect(screen.getByRole("columnheader", { name: /Last Name/ }).getAttribute("aria-sort")).toBe("descending");
        expect(screen.getByRole("columnheader", { name: /First Name/ }).getAttribute("aria-sort")).toBe("none");
    });

    it("Department и Position не сортируются, пока бэкенд не умеет сортировать по названию", () => {
        render(<EmployeesPreview />);
        expect(screen.queryByRole("button", { name: /Department/ })).toBeNull();
        expect(screen.queryByRole("button", { name: /Position/ })).toBeNull();
        expect(screen.getByRole("columnheader", { name: "Department" })).toBeTruthy();
    });

    it("пагинация показывается только при нескольких страницах и переключает страницу", async () => {
        const user = userEvent.setup({ delay: null });
        const { rerender } = render(<EmployeesPreview />);
        expect(screen.queryByRole("navigation", { name: "Employee pages" })).toBeNull();
        list.totalPages = 3;
        rerender(<EmployeesPreview />);
        expect(screen.queryByRole("button", { name: "Page 2" })).toBeNull(); // номеров страниц в макете нет
        expect((screen.getByRole("button", { name: "Previous page" }) as HTMLButtonElement).disabled).toBe(true);
        await user.click(screen.getByRole("button", { name: "Next page" }));
        expect(list.setPage).toHaveBeenCalledWith(2);
    });
});

describe("EmployeesPreview — состояния", () => {
    it("loading: таблица остаётся, есть индикатор", () => {
        list.loading = true;
        render(<EmployeesPreview />);
        expect(screen.getByText("Loading...")).toBeTruthy();
        expect(screen.getByText("ann@x.co")).toBeTruthy();
    });
    it("empty: No users found", () => {
        list.users = [];
        render(<EmployeesPreview />);
        expect(screen.getByText("No users found")).toBeTruthy();
    });
    it("error: сообщение и Retry", async () => {
        const user = userEvent.setup({ delay: null });
        list.error = new Error("x"); list.users = [];
        render(<EmployeesPreview />);
        expect(screen.getByRole("alert").textContent).toMatch(/Failed to load employees/);
        expect(screen.queryByText("No users found")).toBeNull();
        await user.click(screen.getByRole("button", { name: "Retry" }));
        expect(list.refetch).toHaveBeenCalled();
    });
});

describe("EmployeesPreview — диалоги (admin)", () => {
    async function fillCreate(user: ReturnType<typeof userEvent.setup>) {
        await user.type(screen.getByLabelText("Email"), "new@x.co");
        await user.type(screen.getByLabelText("Password"), "secret1");
        await user.type(screen.getByLabelText("First Name"), "New");
        await user.type(screen.getByLabelText("Last Name"), "User");
        await user.selectOptions(screen.getByLabelText("Department"), "1");
        await user.selectOptions(screen.getByLabelText("Position"), "2");
        await user.selectOptions(screen.getByLabelText("Role"), "Employee");
    }

    it("CREATE заблокирован, пока форма невалидна, и активируется после заполнения", async () => {
        const user = userEvent.setup({ delay: null });
        render(<EmployeesPreview admin />);
        await user.click(screen.getByRole("button", { name: "Create user" }));
        const submit = screen.getByRole("button", { name: "Create" });
        expect((submit as HTMLButtonElement).disabled).toBe(true);
        await fillCreate(user);
        expect((submit as HTMLButtonElement).disabled).toBe(false);
    });

    it("успешное создание: вызов хука с полями и закрытие модалки", async () => {
        const user = userEvent.setup({ delay: null });
        render(<EmployeesPreview admin />);
        await user.click(screen.getByRole("button", { name: "Create user" }));
        await fillCreate(user);
        await user.click(screen.getByRole("button", { name: "Create" }));
        expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ email: "new@x.co", password: "secret1", departmentId: "1", positionId: "2", role: "Employee" }));
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("ошибка создания: системное сообщение, значения не очищаются, модалка открыта", async () => {
        const user = userEvent.setup({ delay: null });
        const { CombinedGraphQLErrors } = await import("@apollo/client");
        createUser.mockRejectedValue(new CombinedGraphQLErrors({ data: null, errors: [{ message: "userAlreadyExists" }] }));
        render(<EmployeesPreview admin />);
        await user.click(screen.getByRole("button", { name: "Create user" }));
        await fillCreate(user);
        await user.click(screen.getByRole("button", { name: "Create" }));
        expect((await screen.findByRole("alert")).textContent).toMatch(/already exists/);
        expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("new@x.co");
        expect(screen.getByRole("dialog")).toBeTruthy();
    });

    it("inline-ошибка после blur", async () => {
        const user = userEvent.setup({ delay: null });
        render(<EmployeesPreview admin />);
        await user.click(screen.getByRole("button", { name: "Create user" }));
        await user.type(screen.getByLabelText("Email"), "bad");
        await user.tab();
        expect(screen.getByText("Invalid email address")).toBeTruthy();
    });

    it("Update: поля предзаполнены, email и пароль отключены, сохраняется по id", async () => {
        const user = userEvent.setup({ delay: null });
        render(<EmployeesPreview admin />);
        await user.click(screen.getByRole("button", { name: "Actions for Ann Lee" }));
        await user.click(screen.getByRole("menuitem", { name: "Update" }));
        expect((screen.getByLabelText("Email") as HTMLInputElement).disabled).toBe(true);
        expect((screen.getByLabelText("Password") as HTMLInputElement).disabled).toBe(true);
        expect((screen.getByLabelText("First Name") as HTMLInputElement).value).toBe("Ann");
        expect((screen.getByLabelText("Department") as HTMLSelectElement).value).toBe("1");
        await user.selectOptions(screen.getByLabelText("Role"), "Admin");
        await user.click(screen.getByRole("button", { name: "Update" }));
        expect(updateUser).toHaveBeenCalledWith("5", expect.objectContaining({ firstName: "Ann", role: "Admin" }));
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("Update пользователя без должности: Update заблокирован, пока не выбрана", async () => {
        const user = userEvent.setup({ delay: null });
        render(<EmployeesPreview admin />);
        await user.click(screen.getByRole("button", { name: "Actions for zed@x.co" }));
        await user.click(screen.getByRole("menuitem", { name: "Update" }));
        expect((screen.getByRole("button", { name: "Update" }) as HTMLButtonElement).disabled).toBe(true);
    });

    it("Delete: текст из спеки, CONFIRM удаляет по id", async () => {
        const user = userEvent.setup({ delay: null });
        render(<EmployeesPreview admin />);
        await user.click(screen.getByRole("button", { name: "Actions for Ann Lee" }));
        await user.click(screen.getByRole("menuitem", { name: "Delete" }));
        expect(screen.getByText(/Are you sure you want to delete user/).textContent).toContain("Ann Lee");
        await user.click(screen.getByRole("button", { name: "Confirm" }));
        expect(deleteUser).toHaveBeenCalledWith("5");
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("Delete: Cancel ничего не удаляет; ошибка сервера показывается в модалке", async () => {
        const user = userEvent.setup({ delay: null });
        const { CombinedGraphQLErrors } = await import("@apollo/client");
        render(<EmployeesPreview admin />);
        await user.click(screen.getByRole("button", { name: "Actions for Ann Lee" }));
        await user.click(screen.getByRole("menuitem", { name: "Delete" }));
        await user.click(screen.getByRole("button", { name: "Cancel" }));
        expect(deleteUser).not.toHaveBeenCalled();

        deleteUser.mockRejectedValue(new CombinedGraphQLErrors({ data: null, errors: [{ message: "cannotDeleteVerifiedUser" }] }));
        await user.click(screen.getByRole("button", { name: "Actions for Ann Lee" }));
        await user.click(screen.getByRole("menuitem", { name: "Delete" }));
        await user.click(screen.getByRole("button", { name: "Confirm" }));
        expect((await screen.findByRole("alert")).textContent).toBe("Verified users cannot be deleted");
        expect(screen.getByRole("dialog")).toBeTruthy();
    });
});
