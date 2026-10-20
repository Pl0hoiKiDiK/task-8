import { AppIcon } from "@/components/app-icon";

export function AdminProfileActions({ item }: { item: "language" | "skill" }) {
  const label = item === "language" ? "language" : "skill";

  return (
    <div className="mt-4 flex justify-end gap-16 max-[900px]:gap-12 [&>button]:inline-flex [&>button]:min-h-12 [&>button]:items-center [&>button]:justify-center [&>button]:gap-2 [&>button]:border-0 [&>button]:bg-transparent [&>button]:p-0 [&>button]:text-sm [&>button]:font-medium [&>button]:leading-[24.5px] [&>button]:tracking-[.4px] [&>button]:whitespace-nowrap [&>button]:uppercase [&>button]:text-[var(--action-muted)] [&>button:last-child]:text-[var(--red)] [&>button:disabled]:cursor-default [&>button:disabled]:opacity-100">
      <button type="button" disabled title={`${label} editing is not connected yet`}>
        <AppIcon name="add-profile-item" />Add {label}
      </button>
      <button type="button" disabled title={`${label} editing is not connected yet`}>
        <AppIcon name="delete" />Remove {label}s
      </button>
    </div>
  );
}
