export type ProficiencyTone = "yellow" | "red" | "green" | "gray" | "blue";

export function ProfileProficiencyItem({ name, tone, level }: { name: string; tone: ProficiencyTone; level: number }) {
  return (
    <div className="user-skill">
      <span className={`user-skill-bar user-skill-bar--${tone}`} aria-hidden="true">
        <span style={{ width: `${level}%` }} />
      </span>
      <span>{name}</span>
    </div>
  );
}
