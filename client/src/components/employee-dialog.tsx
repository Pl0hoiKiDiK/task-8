"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useApolloClient, useMutation } from "@apollo/client/react";
import {
  CREATE_EMPLOYEE_MUTATION,
  DELETE_EMPLOYEE_MUTATION,
  EMPLOYEES_QUERY,
  EMPLOYEE_OPTIONS_QUERY,
  UPDATE_EMPLOYEE_MUTATION,
  UPDATE_EMPLOYEE_PROFILE_MUTATION,
  type Employee,
  type EmployeeFormValues,
} from "@/lib/employees/api";

export type EmployeeDialogState = { type: "create" } | { type: "update" | "delete"; employee: Employee };

const emptyForm: EmployeeFormValues = {
  email: "", password: "", first_name: "", last_name: "",
  departmentId: "", positionId: "", role: "Employee",
};

const fieldClass = "h-11 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-60";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";
const secondaryButton = "rounded-full border border-[var(--border)] px-6 py-2.5 text-sm font-medium uppercase hover:bg-[var(--sidebar-active)]";
const primaryButton = "rounded-full bg-[var(--red)] px-6 py-2.5 text-sm font-medium uppercase text-white hover:opacity-85 active:opacity-70 disabled:cursor-not-allowed disabled:opacity-50";

function validate(values: EmployeeFormValues, updating: boolean) {
  const errors: Partial<Record<keyof EmployeeFormValues, string>> = {};
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

export function EmployeeDialog({ state, onClose, onSaved }: {
  state: EmployeeDialogState;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const client = useApolloClient();
  const updating = state.type === "update";
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
  const [options, setOptions] = useState<{ departments: { id: string; name: string }[]; positions: { id: string; name: string }[] } | null>(null);
  const [optionsError, setOptionsError] = useState(false);
  const [optionsAttempt, setOptionsAttempt] = useState(0);
  const [requestError, setRequestError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [createUser, { loading: creating }] = useMutation(CREATE_EMPLOYEE_MUTATION);
  const [updateUser, { loading: saving }] = useMutation(UPDATE_EMPLOYEE_MUTATION);
  const [updateProfile, { loading: savingProfile }] = useMutation(UPDATE_EMPLOYEE_PROFILE_MUTATION);
  const [deleteUser, { loading: deleting }] = useMutation(DELETE_EMPLOYEE_MUTATION);
  const pending = creating || saving || savingProfile || deleting;
  const errors = validate(values, updating);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  useEffect(() => {
    if (state.type === "delete") return;
    let active = true;
    async function loadOptions() {
      setOptionsError(false);
      try {
        const departments: { id: string; name: string }[] = [];
        const positions: { id: string; name: string }[] = [];
        let page = 1;
        let pages = 1;
        while (page <= pages) {
          const result = await client.query({
            query: EMPLOYEE_OPTIONS_QUERY,
            variables: { params: { page, limit: 100 } },
            fetchPolicy: "network-only",
          });
          if (!result.data) throw new Error("Could not load options");
          departments.push(...result.data.departments.items);
          positions.push(...result.data.positions.items);
          pages = Math.max(result.data.departments.total_pages, result.data.positions.total_pages);
          page += 1;
        }
        if (active) setOptions({ departments, positions });
      } catch {
        if (active) setOptionsError(true);
      }
    }
    void loadOptions();
    return () => { active = false; };
  }, [client, state.type, optionsAttempt]);

  function setField<K extends keyof EmployeeFormValues>(field: K, value: EmployeeFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setTouched((current) => current.includes(field) ? current : [...current, field]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setRequestError("");
    let profileSaved = false;
    try {
      if (state.type === "delete") {
        const result = await deleteUser({ variables: { userId: state.employee.id } });
        if (!result.data?.deleteUser.affected) throw new Error("User was not deleted");
      } else {
        if (Object.keys(errors).length || !options) return;
        const first_name = values.first_name.trim();
        const last_name = values.last_name.trim();
        if (updating) {
          if (first_name !== state.employee.profile.first_name || last_name !== state.employee.profile.last_name) {
            await updateProfile({ variables: { profile: { userId: state.employee.id, first_name, last_name } } });
            profileSaved = true;
          }
          if (values.departmentId !== state.employee.department?.id || values.positionId !== state.employee.position?.id || values.role !== state.employee.role) {
            await updateUser({ variables: { user: {
              userId: state.employee.id,
              departmentId: values.departmentId, positionId: values.positionId, role: values.role,
            } } });
          }
        } else {
          await createUser({ variables: { user: {
            auth: { email: values.email.trim(), password: values.password },
            profile: { first_name, last_name },
            departmentId: values.departmentId, positionId: values.positionId, role: values.role,
          } } });
        }
      }
      onSaved();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed. Please try again.";
      setRequestError(message.includes("cannotDeleteVerifiedUser") ? "The server does not allow deleting verified users."
        : profileSaved ? `Name was saved, but other changes failed: ${message}` : message);
      if (profileSaved) void client.refetchQueries({ include: [EMPLOYEES_QUERY] });
    }
  }

  const input = (field: keyof EmployeeFormValues, label: string, type = "text", disabled = false) => (
    <label className={labelClass} key={field}>
      {label}
      <input className={fieldClass} type={type} value={field === "password" && updating ? "Password cannot be changed here" : values[field]}
        disabled={disabled} maxLength={field === "first_name" || field === "last_name" ? 100 : undefined}
        aria-invalid={Boolean(touched.includes(field) && errors[field])}
        onChange={(event) => setField(field, event.target.value)}
        onBlur={() => setTouched((current) => current.includes(field) ? current : [...current, field])} />
      {touched.includes(field) && errors[field] && <span className="text-[var(--red)]" role="alert">{errors[field]}</span>}
    </label>
  );

  const select = (field: "departmentId" | "positionId", label: string, items: { id: string; name: string }[]) => (
    <label className={labelClass}>
      {label}
      <select className={fieldClass} value={values[field]} disabled={!options}
        aria-invalid={Boolean(touched.includes(field) && errors[field])}
        onChange={(event) => setField(field, event.target.value)}
        onBlur={() => setTouched((current) => current.includes(field) ? current : [...current, field])}>
        <option value="">Select {label.toLowerCase()}</option>
        {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      {touched.includes(field) && errors[field] && <span className="text-[var(--red)]" role="alert">{errors[field]}</span>}
    </label>
  );

  return <dialog ref={dialogRef} aria-labelledby="employee-dialog-title" onCancel={(event) => { if (pending) event.preventDefault(); else onClose(); }}
    className="m-auto max-h-[90dvh] w-[min(540px,calc(100vw-32px))] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--text)] shadow-xl backdrop:bg-black/60">
    <form onSubmit={submit} noValidate>
      <h2 id="employee-dialog-title" className="mb-5 text-2xl font-medium">{state.type === "create" ? "Create user" : state.type === "update" ? "Update user" : "Delete user"}</h2>
      {state.type === "delete" ? <p>Are you sure you want to delete user {state.employee.profile.first_name} {state.employee.profile.last_name}?</p> : <div className="grid gap-4 sm:grid-cols-2">
        {input("email", "Email", "email", updating)}
        <label className={labelClass}>Password
          <span className="flex gap-2">
            <input className={fieldClass} type={updating || showPassword ? "text" : "password"} value={updating ? "Password cannot be changed here" : values.password}
              disabled={updating} aria-invalid={Boolean(touched.includes("password") && errors.password)}
              onChange={(event) => setField("password", event.target.value)}
              onBlur={() => setTouched((current) => current.includes("password") ? current : [...current, "password"])} />
            {!updating && <button type="button" className="rounded border border-[var(--border)] px-2 text-sm" aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button>}
          </span>
          {touched.includes("password") && errors.password && <span className="text-[var(--red)]" role="alert">{errors.password}</span>}
        </label>
        {input("first_name", "First Name")}
        {input("last_name", "Last Name")}
        {select("departmentId", "Department", options?.departments ?? [])}
        {select("positionId", "Position", options?.positions ?? [])}
        <label className={labelClass}>Role
          <select className={fieldClass} value={values.role} onChange={(event) => setField("role", event.target.value as EmployeeFormValues["role"])}>
            <option value="Employee">Employee</option><option value="Admin">Admin</option>
          </select>
          {touched.includes("role") && errors.role && <span className="text-[var(--red)]" role="alert">{errors.role}</span>}
        </label>
      </div>}
      {state.type !== "delete" && !options && !optionsError && <p className="mt-4" role="status">Loading departments and positions…</p>}
      {state.type !== "delete" && options && (!options.departments.length || !options.positions.length) &&
        <p className="mt-4 text-[var(--muted)]" role="status">No departments or positions are available for assignment. User creation and updates require both.</p>}
      {optionsError && <p className="mt-4 text-[var(--red)]" role="alert">Could not load departments and positions. <button type="button" className="underline" onClick={() => setOptionsAttempt((current) => current + 1)}>Retry</button></p>}
      {requestError && <p className="mt-4 text-[var(--red)]" role="alert">{requestError}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className={secondaryButton} disabled={pending} onClick={onClose}>Cancel</button>
        <button type="submit" className={primaryButton} disabled={pending || (state.type !== "delete" && (!options || Object.keys(errors).length > 0))}>
          {pending ? "Saving…" : state.type === "create" ? "Create" : state.type === "update" ? "Save" : "Confirm"}
        </button>
      </div>
    </form>
  </dialog>;
}
