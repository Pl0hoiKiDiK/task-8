import { AppIcon } from "@/components/app-icon";

export function AdminProfileActions({ item }: { item: "language" | "skill" }) {
  const label = item === "language" ? "language" : "skill";

  return (
    <div className="admin-profile-actions">
      <button type="button" disabled title={`${label} editing is not connected yet`}>
        <AppIcon name="add-profile-item" />Add {label}
      </button>
      <button type="button" disabled title={`${label} editing is not connected yet`}>
        <AppIcon name="delete" />Remove {label}s
      </button>
    </div>
  );
}
