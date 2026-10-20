"use client";

import { useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { availableOwnerSkills, masteryDisplay, ownerSkillsFor, type CvSkill } from "@/components/cv-skills-data";
import { useCvPreviewData, type CvRecord } from "@/components/profile-cvs-data";
import { SkillFormDialog, SkillRemoveDialog } from "@/components/skill-dialogs";
import { proficiencyBarClass } from "@/components/profile-proficiency-item";

type DialogKind = "add" | "update" | "remove";

export function CvSkillsPage({ cv }: { cv: CvRecord }) {
  const { cvSkills, addCvSkill, updateCvSkill, removeCvSkills } = useCvPreviewData();
  const skills = cvSkills[cv.id] ?? [];
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [editing, setEditing] = useState<CvSkill | undefined>();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const categories = [...new Set(skills.map((skill) => skill.category))];
  const available = availableOwnerSkills(ownerSkillsFor(cv.employee), skills);

  function cancelSelection() {
    setSelecting(false);
    setSelected([]);
  }

  function toggle(name: string) {
    setSelected((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  }

  return (
    <div className="mt-8 ml-[min(169px,max(0px,calc((100%_-_852px)/2)))] w-[min(852px,100%)] max-[900px]:ml-[22px] max-[900px]:w-[calc(100%_-_22px)] max-[600px]:ml-0 max-[600px]:w-full">
      {skills.length ? categories.map((category) => (
        <section key={category} className="[&+*]:mt-8 [&>h2]:m-0 [&>h2]:text-base [&>h2]:font-normal [&>h2]:leading-6" aria-label={category}>
          <h2>{category}</h2>
          <div className="mt-4 grid auto-rows-[48px] grid-cols-3 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
            {skills.filter((skill) => skill.category === category).map((skill) => {
              const { level, tone } = masteryDisplay[skill.mastery];
              const isSelected = selected.includes(skill.name);
              return (
                <button type="button" key={skill.name}
                  className={`flex min-w-0 items-center gap-4 border-0 bg-transparent px-4 text-left text-base leading-6 tracking-[.15px] text-[var(--muted)] max-[900px]:gap-[34px] hover:[&>span:last-child]:text-[var(--text)]${isSelected ? " text-[var(--text)] [&>span:last-child]:text-[var(--text)]" : ""}`}
                  aria-label={`${skill.name}, ${skill.mastery}${selecting ? isSelected ? ", selected" : ", not selected" : ", update skill"}`}
                  aria-pressed={selecting ? isSelected : undefined}
                  onClick={() => { if (selecting) toggle(skill.name); else { setEditing(skill); setDialog("update"); } }}>
                  <span className={proficiencyBarClass(tone, isSelected)} aria-hidden="true"><span style={{ width: `${level}%` }} /></span>
                  <span className="truncate">{skill.name}</span>
                  <span className="sr-only">{skill.mastery}</span>
                </button>
              );
            })}
          </div>
        </section>
      )) : <p className="my-12 text-center text-[var(--muted)]">No skills added yet</p>}
      <div className="mt-14 flex items-center justify-end gap-6 pr-6 max-[900px]:pr-0 max-[600px]:gap-2 [&>button]:inline-flex [&>button]:min-h-12 [&>button]:min-w-40 [&>button]:items-center [&>button]:justify-center [&>button]:gap-3 [&>button]:border-0 [&>button]:bg-transparent [&>button]:text-sm [&>button]:font-medium [&>button]:tracking-[.4px] [&>button]:text-[var(--muted)] [&>button]:uppercase [&>button:hover:not(:disabled)]:text-[var(--text)] [&>button:disabled]:cursor-default [&>button:disabled]:opacity-45 max-[600px]:[&>button]:min-w-0 max-[600px]:[&>button]:flex-1">
        {selecting ? <>
          <button type="button" className="rounded-3xl border border-[var(--border)] text-[var(--text)]" onClick={cancelSelection}>Cancel</button>
          <button type="button" className="rounded-3xl bg-[var(--red)] text-[#f5f5f7] hover:text-white" disabled={!selected.length} onClick={() => setDialog("remove")}>Remove <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[#f5f5f7] px-1 text-xs leading-none tracking-normal text-[var(--red)] normal-case">{selected.length}</span></button>
        </> : <>
          <button type="button" onClick={() => { setEditing(undefined); setDialog("add"); }}><AppIcon name="add-profile-item" />Add skill</button>
          <button type="button" className="text-[var(--red)]" disabled={!skills.length} onClick={() => setSelecting(true)}><AppIcon name="delete" />Remove skills</button>
        </>}
      </div>
      {(dialog === "add" || dialog === "update") && <SkillFormDialog kind={dialog} skill={dialog === "update" ? editing : undefined} available={available}
        onClose={() => setDialog(null)}
        onSave={(name, mastery) => dialog === "add" ? addCvSkill(cv.id, name, mastery) : updateCvSkill(cv.id, name, mastery)} />}
      {dialog === "remove" && <SkillRemoveDialog count={selected.length} error="" onClose={() => setDialog(null)}
        onConfirm={() => removeCvSkills(cv.id, selected)} onSuccess={cancelSelection} />}
    </div>
  );
}
