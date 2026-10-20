"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { AppIcon } from "@/components/app-icon";
import { getApiErrorMessage } from "@/lib/common/graphql-errors";
import {
  CREATE_EMPLOYEE_MUTATION,
  DELETE_EMPLOYEE_MUTATION,
  EMPLOYEES_QUERY,
  type Employee,
  type EmployeeFormValues,
} from "@/lib/employees/api";
import { loadCatalogs, UPDATE_PROFILE_MUTATION, UPDATE_PROFILE_USER_MUTATION, type CatalogItem } from "@/lib/profile/api";

export type EmployeeDialogState = { type: "create" } | { type: "update" | "delete"; employee: Employee };

const emptyForm: EmployeeFormValues = {
  email: "", password: "", first_name: "", last_name: "",
  departmentId: "", positionId: "", role: "Employee",
};

/* Размеры из макета: desktop 860px (2 колонки, поля 400x48, gap 12/36), tablet 620px (1 колонка). */
const controlClass =
  "h-12 w-full border border-(--border) bg-transparent px-3 text-base text-(--text) outline-offset-1 placeholder:text-(--placeholder) " +
  "disabled:cursor-not-allowed disabled:bg-(--sidebar-active) disabled:text-(--muted) aria-invalid:border-(--red)";
const errorClass = "absolute left-1 top-full mt-0.5 text-xs leading-4 text-(--red)";
const systemErrorClass = "text-sm text-(--red)";
const cancelClass =
  "h-12 w-40 rounded-full border border-(--text) bg-transparent text-sm font-medium uppercase tracking-wider text-(--text) disabled:opacity-50";
const submitClass =
  "h-12 w-40 rounded-full bg-(--red) text-sm font-medium uppercase tracking-wider text-[#f5f5f7] shadow-md disabled:opacity-50";

type Errors = Partial<Record<keyof EmployeeFormValues, string>>;

function validate(values: EmployeeFormValues, updating: boolean): Errors {
  const errors: Errors = {};
  if (!updating) {
    if (!values.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Invalid email address";
    if (!values.password) errors.password = "Password is required";
    else if (values.password.length < 6) errors.password = "Password must contain at least 6 characters";
  }
  if (!values.first_name.trim()) errors.first_name = "First name is required";
  else if (values.first_name.trim().length > 100) errors.first_name = "First name must contain at most 100 characters";
  if (!values.last_name.trim()) errors.last_name = "Last name is required";
  else if (values.last_name.trim().length > 100) errors.last_name = "Last name must contain at most 100 characters";
  if (!values.departmentId) errors.departmentId = "Department is required";
  if (!values.positionId) errors.positionId = "Position is required";
  if (!values.role) errors.role = "Role is required";
  return errors;
}

function employeeName(employee: Employee) {
  return [employee.profile.first_name, employee.profile.last_name].filter(Boolean).join(" ") || employee.email;
}

function DialogField({ id, label, type = "text", value, onChange, onBlur, error, disabled, maxLength }: {
  id: string; label: string; type?: "text" | "email" | "password"; value: string;
  onChange: (value: string) => void; onBlur: () => void; error?: string; disabled?: boolean; maxLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="relative">
      <label className="sr-only" htmlFor={id}>{label}</label>
      <input id={id} type={isPassword && visible ? "text" : type} placeholder={label} autoComplete={isPassword ? "new-password" : "off"}
        className={`${controlClass} ${isPassword ? "pr-12" : ""}`} value={value} disabled={disabled} maxLength={maxLength}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)} onBlur={onBlur} />
      {isPassword && <button type="button" disabled={disabled} aria-pressed={visible} aria-label={`${visible ? "Hide" : "Show"} password`}
        className="absolute top-0 right-2 grid h-12 w-10 place-items-center border-0 bg-transparent text-(--muted) hover:text-(--text) disabled:opacity-50"
        onClick={() => setVisible((current) => !current)}><AppIcon name="eye" className="size-6" /></button>}
      {error && <span id={`${id}-error`} role="alert" className={errorClass}>{error}</span>}
    </div>
  );
}

function Chevron() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute top-6 right-3 size-6 -translate-y-1/2 text-(--muted)" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function DialogShell({ title, pending, onClose, children }: { title: string; pending: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    dialog.querySelector<HTMLElement>("input:not(:disabled), select:not(:disabled), [data-autofocus]")?.focus();
    return () => { if (dialog.open) dialog.close(); };
  }, []);
  return (
    <dialog ref={ref} aria-labelledby="employee-dialog-title" onCancel={(event) => { event.preventDefault(); if (!pending) onClose(); }}
      className="m-auto max-h-[calc(100dvh-32px)] w-[min(620px,calc(100vw-32px))] max-w-none overflow-y-auto border-0 bg-(--surface) p-6 text-(--text) shadow-2xl backdrop:bg-black/50 lg:w-215">
      <div className="mb-6 flex items-center justify-between">
        <h2 id="employee-dialog-title" className="text-xl leading-8 font-medium">{title}</h2>
        <button type="button" aria-label={`Close ${title}`} disabled={pending} onClick={onClose} className="grid size-8 place-items-center text-2xl leading-none text-(--text) disabled:opacity-50">×</button>
      </div>
      {children}
    </dialog>
  );
}

export function EmployeeDialog({ state, onClose, onSaved }: {
  state: EmployeeDialogState;
  onClose: () => void;
  onSaved: () => void;
}) {
  const client = useApolloClient();
  const updating = state.type === "update";
  const deleting = state.type === "delete";
  const [values, setValues] = useState<EmployeeFormValues>(() => state.type === "create" ? emptyForm : {
    email: state.employee.email,
    password: "",
    first_name: state.employee.profile.first_name ?? "",
    last_name: state.employee.profile.last_name ?? "",
    departmentId: state.employee.department?.id ?? "",
    positionId: state.employee.position?.id ?? "",
    role: state.employee.role,
  });
  const [touched, setTouched] = useState<(keyof EmployeeFormValues)[]>([]);
  const [options, setOptions] = useState<{ departments: CatalogItem[]; positions: CatalogItem[] } | null>(null);
  const [optionsError, setOptionsError] = useState(false);
  const [optionsAttempt, setOptionsAttempt] = useState(0);
  const [requestError, setRequestError] = useState("");
  const savedName = useRef<{ first: string; last: string } | null>(null);
  const [createUser, { loading: creating }] = useMutation(CREATE_EMPLOYEE_MUTATION);
  const [updateUser, { loading: saving }] = useMutation(UPDATE_PROFILE_USER_MUTATION);
  const [updateProfile, { loading: savingProfile }] = useMutation(UPDATE_PROFILE_MUTATION);
  const [deleteUser, { loading: removing }] = useMutation(DELETE_EMPLOYEE_MUTATION);
  const pending = creating || saving || savingProfile || removing;
  const errors = validate(values, updating);
  const invalid = Object.keys(errors).length > 0;

  useEffect(() => {
    if (state.type === "delete") return;
    let active = true;
    setOptionsError(false);
    loadCatalogs(client)
      .then((loaded) => { if (active) setOptions(loaded); })
      .catch(() => { if (active) setOptionsError(true); });
    return () => { active = false; };
  }, [client, state.type, optionsAttempt]);

  function touch(field: keyof EmployeeFormValues) {
    setTouched((current) => current.includes(field) ? current : [...current, field]);
  }
  function setField<K extends keyof EmployeeFormValues>(field: K, value: EmployeeFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    touch(field);
    setRequestError("");
  }
  const shown = (field: keyof EmployeeFormValues) => touched.includes(field) ? errors[field] : undefined;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!deleting && (invalid || !options)) {
      setTouched(["email", "password", "first_name", "last_name", "departmentId", "positionId", "role"]);
      return;
    }
    setRequestError("");
    let step: "profile" | "user" | "other" = "other";
    try {
      if (state.type === "delete") {
        const result = await deleteUser({ variables: { userId: state.employee.id } });
        if (!result.data?.deleteUser.affected) { setRequestError("The user was not deleted. Please try again."); return; }
      } else {
        const first_name = values.first_name.trim();
        const last_name = values.last_name.trim();
        if (state.type === "update") {
          const known = savedName.current ?? { first: state.employee.profile.first_name ?? "", last: state.employee.profile.last_name ?? "" };
          if (first_name !== known.first || last_name !== known.last) {
            step = "profile";
            await updateProfile({ variables: { profile: { userId: state.employee.id, first_name, last_name } } });
            savedName.current = { first: first_name, last: last_name };
          }
          if (values.departmentId !== state.employee.department?.id || values.positionId !== state.employee.position?.id || values.role !== state.employee.role) {
            step = "user";
            await updateUser({ variables: { user: { userId: state.employee.id, departmentId: values.departmentId, positionId: values.positionId, role: values.role } } });
          }
        } else {
          await createUser({
            variables: {
              user: {
                auth: { email: values.email.trim(), password: values.password },
                profile: { first_name, last_name },
                departmentId: values.departmentId, positionId: values.positionId, role: values.role,
              }
            }
          });
        }
      }
      onSaved();
    } catch (error) {
      const message = getApiErrorMessage(error);
      if (step === "user" && savedName.current) {
        setRequestError(`Name was saved, but department, position or role were not: ${message}`);
        void client.refetchQueries({ include: [EMPLOYEES_QUERY] });
      } else setRequestError(message);
    }
  }

  const title = state.type === "create" ? "Create user" : state.type === "update" ? "Update user" : "Delete user";
  const text = (field: "email" | "first_name" | "last_name", label: string, type: "text" | "email" = "text", disabled = false) => (
    <DialogField id={`employee-dialog-${field}`} label={label} type={type} value={values[field]} disabled={disabled || pending}
      maxLength={field === "email" ? undefined : 100} error={shown(field)} onChange={(value) => setField(field, value)} onBlur={() => touch(field)} />
  );
  const select = (field: "departmentId" | "positionId" | "role", label: string, items: { id: string; name: string }[], allowEmpty = true) => {
    const id = `employee-dialog-${field}`;
    const message = shown(field);
    return (
      <div className="relative">
        <select id={id} aria-label={label} className={`${controlClass} appearance-none pr-10 ${values[field] ? "" : "text-(--placeholder)"}`}
          value={values[field]} disabled={pending || (field !== "role" && !options)} aria-invalid={Boolean(message)} aria-describedby={message ? `${id}-error` : undefined}
          onChange={(event) => setField(field, event.target.value as EmployeeFormValues[typeof field])} onBlur={() => touch(field)}>
          {allowEmpty && <option value="">{label}</option>}
          {items.map((item) => <option key={item.id} value={item.id} className="text-(--text)">{item.name}</option>)}
        </select>
        <Chevron />
        {message && <span id={`${id}-error`} role="alert" className={errorClass}>{message}</span>}
      </div>
    );
  };

  return (
    <DialogShell title={title} pending={pending} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {state.type === "delete"
          ? <p className="text-base">Are you sure you want to delete user <strong>{employeeName(state.employee)}</strong>?</p>
          : <div className="grid grid-cols-1 gap-x-3 gap-y-9 lg:grid-cols-2">
            {text("email", "Email", "email", updating)}
            <DialogField id="employee-dialog-password" label="Password" type="password" value={updating ? "••••••" : values.password}
              disabled={updating || pending} error={shown("password")} onChange={(value) => setField("password", value)} onBlur={() => touch("password")} />
            {text("first_name", "First Name")}
            {text("last_name", "Last Name")}
            {select("departmentId", "Department", options?.departments ?? [])}
            {select("positionId", "Position", options?.positions ?? [])}
            {select("role", "Role", [{ id: "Employee", name: "Employee" }, { id: "Admin", name: "Admin" }], false)}
          </div>}
        {!deleting && !options && !optionsError && <p className="mt-4" role="status">Loading departments and positions…</p>}
        {!deleting && options && (!options.departments.length || !options.positions.length) &&
          <p className="mt-4 text-(--muted)" role="status">No departments or positions are available for assignment. User creation and updates require both.</p>}
        {optionsError && <p className={`${systemErrorClass} mt-4`} role="alert">Could not load departments and positions. <button type="button" className="underline" onClick={() => setOptionsAttempt((current) => current + 1)}>Retry</button></p>}
        {requestError && <p className={`${systemErrorClass} mt-4`} role="alert">{requestError}</p>}
        <div className="mt-8 flex justify-end gap-4">
          <button type="button" data-autofocus={deleting ? "" : undefined} className={cancelClass} disabled={pending} onClick={onClose}>Cancel</button>
          <button type="submit" className={submitClass} disabled={pending || (!deleting && (!options || invalid))}>
            {pending ? (deleting ? "Deleting…" : "Saving…") : state.type === "create" ? "Create" : state.type === "update" ? "Update" : "Confirm"}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}
