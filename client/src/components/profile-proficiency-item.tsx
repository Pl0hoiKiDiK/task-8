export type ProficiencyTone = "yellow" | "red" | "green" | "gray" | "blue";

const toneClasses: Record<ProficiencyTone, string> = {
  yellow: "[--skill-fill:#ffb800] [--skill-track:var(--skill-yellow-track)]",
  red: "[--skill-fill:#c63031] [--skill-track:#c63031]",
  green: "[--skill-fill:var(--skill-green-fill)] [--skill-track:var(--skill-green-track)]",
  gray: "[--skill-fill:#626262] [--skill-track:var(--skill-gray-track)]",
  blue: "[--skill-fill:var(--skill-blue-fill)] [--skill-track:var(--skill-blue-track)]",
};

export function proficiencyBarClass(tone: ProficiencyTone, selected = false) {
  return `h-1 w-[78px] shrink-0 bg-[var(--skill-track)] [&>span]:block [&>span]:h-full [&>span]:bg-[var(--skill-fill)] ${toneClasses[tone]}${selected ? " [--skill-fill:var(--selected-track)] [--skill-track:var(--selected-track)]" : ""}`;
}

export function ProfileProficiencyItem({ name, tone, level }: { name: string; tone: ProficiencyTone; level: number }) {
  return (
    <div className="flex min-w-0 items-center gap-4 pl-4 text-base leading-6 tracking-[.15px] text-[#626262] max-[900px]:gap-[34px] max-[900px]:text-[#767676]">
      <span className={proficiencyBarClass(tone)} aria-hidden="true">
        <span style={{ width: `${level}%` }} />
      </span>
      <span>{name}</span>
    </div>
  );
}
