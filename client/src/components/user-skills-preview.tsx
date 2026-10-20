"use client";

import { useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { availableOwnerSkills, masteryDisplay, type CvSkill, type SkillMastery } from "@/components/cv-skills-data";
import { ProfileProficiencyItem, proficiencyBarClass, type ProficiencyTone } from "@/components/profile-proficiency-item";
import { useCvPreviewData } from "@/components/profile-cvs-data";
import { SkillFormDialog, SkillRemoveDialog } from "@/components/skill-dialogs";

export type Skill = { name: string; tone: ProficiencyTone; level: number };
export type SkillGroup = { title: string; skills: Skill[] };

export function UserSkillsPreview({ canEdit = false }: { canEdit?: boolean }) {
  const { userSkills: skills, skillCatalog, loadState, reload, addUserSkill, updateUserSkill, removeUserSkills } = useCvPreviewData();
  const [dialog, setDialog] = useState<"add" | "update" | "remove" | null>(null);
  const [editing, setEditing] = useState<CvSkill | undefined>();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const categories = [...new Set(skills.map((skill) => skill.category))];
  const available = availableOwnerSkills(skillCatalog, skills);
  const hasSkills = skills.length > 0;

  function cancelSelection() {
    setSelecting(false);
    setSelected([]);
  }

  async function saveSkill(name: string, mastery: SkillMastery) {
    if (dialog === "add") await addUserSkill(name, mastery);
    else await updateUserSkill(name, mastery);
  }

  if (loadState === "loading") return <p role="status">Loading skills…</p>;
  if (loadState === "error") return <div role="alert">Could not load skills. <button type="button" onClick={() => { void reload().catch(() => undefined); }}>Retry</button></div>;

  return (
    <div>
      <div className={`mt-8 ml-[min(145px,max(0px,calc((100%_-_900px)/2)))] w-[min(900px,100%)] px-6 max-[900px]:mt-[26px] max-[900px]:ml-0 max-[900px]:w-full max-[900px]:px-[22px]${hasSkills ? "" : ` pt-16${canEdit ? " max-[900px]:mt-8" : ""}`}`}>
        {hasSkills ? categories.map((category) => (
          <section className="[&+*]:mt-8 [&>h1]:m-0 [&>h1]:text-base [&>h1]:leading-6 [&>h1]:tracking-[.15px] [&>h1]:text-[var(--text)]" key={category} aria-label={category}>
            <h1>{category}</h1>
            <div className="mt-4 grid auto-rows-[48px] grid-cols-3 max-[900px]:grid-cols-2">
              {skills.filter((skill) => skill.category === category).map((skill) => {
                const { tone, level } = masteryDisplay[skill.mastery];
                const isSelected = selected.includes(skill.name);
                return canEdit ? (
                  <button type="button" key={skill.name}
                    className={`flex min-w-0 items-center gap-4 pl-4 text-base leading-6 tracking-[.15px] text-[#626262] max-[900px]:gap-[34px] max-[900px]:text-[#767676] w-full border-0 bg-transparent text-left hover:text-[var(--text)]${isSelected ? " text-[var(--text)]" : ""}`}
                    aria-label={`${skill.name}, ${skill.mastery}${selecting ? isSelected ? ", selected" : ", not selected" : ", update skill"}`}
                    aria-pressed={selecting ? isSelected : undefined}
                    onClick={() => {
                      if (selecting) setSelected((current) => current.includes(skill.name) ? current.filter((item) => item !== skill.name) : [...current, skill.name]);
                      else { setEditing(skill); setDialog("update"); }
                    }}>
                    <span className={proficiencyBarClass(tone, isSelected)} aria-hidden="true"><span style={{ width: `${level}%` }} /></span>
                    <span>{skill.name}</span>
                  </button>
                ) : <ProfileProficiencyItem key={skill.name} name={skill.name} tone={tone} level={level} />;
              })}
            </div>
          </section>
        )) : <h1 className="m-0 text-center text-base leading-6 tracking-[.15px] text-[var(--text)]">No skills here</h1>}
        {canEdit && <div className={`flex justify-end gap-28 pr-16 max-[900px]:pr-6 [&>button]:inline-flex [&>button]:min-h-12 [&>button]:items-center [&>button]:justify-center [&>button]:gap-2 [&>button]:border-0 [&>button]:bg-transparent [&>button]:p-0 [&>button]:text-sm [&>button]:font-medium [&>button]:leading-[24.5px] [&>button]:tracking-[.4px] [&>button]:whitespace-nowrap [&>button]:uppercase [&>button]:text-[var(--action-muted)] [&>button:last-child]:text-[var(--red)] [&>button:disabled]:cursor-default [&>button:disabled]:opacity-100 [&>button]:h-12 [&>button]:w-40 [&>button]:rounded-3xl ${hasSkills ? "mt-6" : "mt-12"}`}>
          {selecting ? <>
            <button type="button" className="border border-[var(--border)] text-[var(--text)]" onClick={cancelSelection}>Cancel</button>
            <button type="button" className="border-0 bg-[var(--red)] text-[#f5f5f7] disabled:opacity-45" disabled={!selected.length} onClick={() => setDialog("remove")}>Remove <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[#f5f5f7] px-1 text-xs leading-none tracking-normal text-[var(--red)] normal-case">{selected.length}</span></button>
          </> : <>
            <button type="button" onClick={() => { setEditing(undefined); setDialog("add"); }}><AppIcon name="add-profile-item" />Add skill</button>
            <button type="button" disabled={!hasSkills} onClick={() => setSelecting(true)}><AppIcon name="delete" />Remove skills</button>
          </>}
        </div>}
      </div>
      {(dialog === "add" || dialog === "update") && <SkillFormDialog kind={dialog} skill={dialog === "update" ? editing : undefined} available={available}
        onClose={() => setDialog(null)} onSave={saveSkill} />}
      {dialog === "remove" && <SkillRemoveDialog title="Remove skills" count={selected.length} error="" onClose={() => setDialog(null)} onSuccess={cancelSelection}
        onConfirm={() => removeUserSkills(selected)} />}
    </div>
  );
}
