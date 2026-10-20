"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { getApiErrorMessage } from "@/lib/common/graphql-errors";
import type { Option, UserListItem } from "@/lib/users/api/graphql";
import { userFullName } from "@/lib/users/models/display";
import { emptyUserForm, validateUserForm, type UserFormFields } from "@/lib/users/models/user-form";

const controlClass =
    "h-12 w-full border border-(--border) bg-transparent px-3 text-base text-(--text) outline-offset-1 placeholder:text-(--placeholder) " +
    "disabled:cursor-not-allowed disabled:bg-(--sidebar-active) disabled:text-(--muted) aria-invalid:border-(--red)";
const errorClass = "absolute left-1 top-full mt-0.5 text-xs leading-4 text-(--red)";
const systemErrorClass = "text-sm text-(--red)";
const cancelClass =
    "h-12 w-40 rounded-full border border-(--text) bg-transparent text-sm font-medium uppercase tracking-wider text-(--text) disabled:opacity-50";
const submitClass =
    "h-12 w-40 rounded-full bg-(--red) text-sm font-medium uppercase tracking-wider text-[#f5f5f7] shadow-md disabled:opacity-50";

function UserDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
    const ref = useRef<HTMLDialogElement>(null);
    const opener = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        opener.current = document.activeElement as HTMLElement;
        dialog.showModal();
        dialog.querySelector<HTMLElement>("input:not(:disabled), select:not(:disabled), [data-autofocus]")?.focus();
        return () => {
            dialog.close();
            opener.current?.focus();
        };
    }, []);

    return (
        <dialog
            ref={ref}
            aria-label={title}
            onCancel={(event) => { event.preventDefault(); onClose(); }}
            className="m-auto max-h-[calc(100dvh-32px)] w-[min(620px,calc(100vw-32px))] max-w-none overflow-y-auto border-0 bg-(--surface) p-6 text-(--text) shadow-2xl backdrop:bg-black/50 lg:w-215"
        >
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-medium leading-8">{title}</h2>
                <button type="button" aria-label={`Close ${title}`} onClick={onClose} className="grid size-8 place-items-center text-2xl leading-none text-(--text)">×</button>
            </div>
            {children}
        </dialog>
    );
}

type UserFormDialogProps = {
    mode: "create" | "update";
    user?: UserListItem;
    departments: Option[];
    positions: Option[];
    optionsLoading?: boolean;
    optionsError?: boolean;
    onRetryOptions?: () => void;
    onClose: () => void;
    onSubmit: (fields: UserFormFields) => Promise<void>;
};

function fieldsFromUser(user: UserListItem): UserFormFields {
    return {
        email: user.email,
        password: "",
        firstName: user.profile.first_name ?? "",
        lastName: user.profile.last_name ?? "",
        departmentId: user.department?.id ?? "",
        positionId: user.position?.id ?? "",
        role: user.role,
    };
}

function Chevron() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-6 size-6 -translate-y-1/2 text-(--muted)" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}

export function UserFormDialog({
    mode, user, departments, positions, optionsLoading = false, optionsError = false, onRetryOptions, onClose, onSubmit,
}: UserFormDialogProps) {
    const [fields, setFields] = useState<UserFormFields>(() => (user ? fieldsFromUser(user) : emptyUserForm));
    const [touched, setTouched] = useState<Partial<Record<keyof UserFormFields, boolean>>>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const errors = validateUserForm(fields, mode);
    const valid = Object.keys(errors).length === 0;
    const update = mode === "update";

    function change<K extends keyof UserFormFields>(key: K, value: UserFormFields[K]) {
        setFields((current) => ({ ...current, [key]: value }));
        setTouched((current) => ({ ...current, [key]: true }));
        setError("");
    }

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;
        if (!valid) {
            setTouched({ email: true, password: true, firstName: true, lastName: true, departmentId: true, positionId: true, role: true });
            return;
        }
        setSaving(true);
        setError("");
        try {
            await onSubmit(fields);
            onClose();
        } catch (caught) {
            //ДОБАВИТЬ
            setError(getApiErrorMessage(caught));
        } finally {
            setSaving(false);
        }
    }

    function message(key: keyof UserFormFields) {
        return touched[key] ? errors[key] : undefined;
    }

    const blur = (key: keyof UserFormFields) => () => setTouched((current) => ({ ...current, [key]: true }));

    function textField(key: "email" | "firstName" | "lastName", label: string, type: "text" | "email" = "text", disabled = false) {
        return (
            <AuthField name={`user-dialog-${key}`} label={label} type={type} placeholder={label} autoComplete="off"
                value={fields[key]} disabled={disabled || saving} error={message(key)}
                onChange={(event) => change(key, event.target.value)} onBlur={blur(key)} />
        );
    }

    function selectField(key: "departmentId" | "positionId" | "role", label: string, options: { id: string; name: string }[]) {
        const text = message(key);
        const id = `user-dialog-${key}`;
        return (
            <div className="relative">
                <select id={id} aria-label={label} className={`${controlClass} appearance-none pr-10 ${fields[key] ? "" : "text-(--placeholder)"}`} value={fields[key]} disabled={saving || (key !== "role" && optionsLoading)}
                    aria-invalid={Boolean(text)} aria-describedby={text ? `${id}-error` : undefined}
                    onChange={(event) => change(key, event.target.value as UserFormFields[typeof key])} onBlur={blur(key)}>
                    <option value="">{label}</option>
                    {options.map((option) => <option key={option.id} value={option.id} className="text-(--text)">{option.name}</option>)}
                </select>
                <Chevron />
                {text && <span id={`${id}-error`} className={errorClass}>{text}</span>}
            </div>
        );
    }

    const passwordText = message("password");

    return (
        <UserDialog title={update ? "Update user" : "Create user"} onClose={onClose}>
            <form className="grid grid-cols-1 gap-x-3 gap-y-9 lg:grid-cols-2" onSubmit={save} noValidate>
                {textField("email", "Email", "email", update)}
                <AuthField name="user-dialog-password" label="Password" type="password" placeholder="Password" autoComplete="new-password"
                    value={update ? "••••••" : fields.password} disabled={update || saving} error={passwordText}
                    onChange={(event) => change("password", event.target.value)} onBlur={blur("password")} />
                {textField("firstName", "First Name")}
                {textField("lastName", "Last Name")}
                {selectField("departmentId", "Department", departments)}
                {selectField("positionId", "Position", positions)}
                {selectField("role", "Role", [{ id: "Admin", name: "Admin" }, { id: "Employee", name: "Employee" }])}
                {optionsError && (
                    <p className={`${systemErrorClass} lg:col-span-2`} role="alert">
                        Failed to load departments and positions.{" "}
                        {onRetryOptions && <button type="button" className="underline" onClick={onRetryOptions}>Retry</button>}
                    </p>
                )}
                {error && <p className={`${systemErrorClass} lg:col-span-2`} role="alert">{error}</p>}
                <div className="flex justify-end gap-4 lg:col-span-2">
                    <button type="button" className={cancelClass} onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" className={submitClass} disabled={!valid || saving}>
                        {saving ? "Saving..." : update ? "Update" : "Create"}
                    </button>
                </div>
            </form>
        </UserDialog>
    );
}

export function UserDeleteDialog({ user, onClose, onConfirm }: {
    user: UserListItem;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}) {
    const [removing, setRemoving] = useState(false);
    const [error, setError] = useState("");
    const name = userFullName(user) || user.email;

    async function confirm() {
        if (removing) return;
        setRemoving(true);
        setError("");
        try {
            await onConfirm();
            onClose();
        } catch (caught) {
            setError(getApiErrorMessage(caught));
        } finally {
            setRemoving(false);
        }
    }

    return (
        <UserDialog title="Delete user" onClose={onClose}>
            <p className="text-base">Are you sure you want to delete user <strong>{name}</strong>?</p>
            {error && <p className={`${systemErrorClass} mt-4`} role="alert">{error}</p>}
            <div className="mt-8 flex justify-end gap-4">
                <button type="button" data-autofocus className={cancelClass} disabled={removing} onClick={onClose}>Cancel</button>
                <button type="button" className={submitClass} disabled={removing} onClick={confirm}>{removing ? "Deleting..." : "Confirm"}</button>
            </div>
        </UserDialog>
    );
}
