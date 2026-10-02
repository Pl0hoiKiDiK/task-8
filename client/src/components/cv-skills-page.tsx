"use client";

import { useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { availableOwnerSkills, masteryDisplay, ownerSkillsFor, type CvSkill } from "@/components/cv-skills-data";
import { useCvPreviewData, type CvRecord } from "@/components/profile-cvs-data";
import { SkillFormDialog, SkillRemoveDialog } from "@/components/skill-dialogs";

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
    <div className="cv-skills-content">
      {skills.length ? categories.map((category) => (
        <section key={category} className="cv-skills-group" aria-label={category}>
          <h2>{category}</h2>
          <div className="cv-skills-grid">
            {skills.filter((skill) => skill.category === category).map((skill) => {
              const { level, tone } = masteryDisplay[skill.mastery];
              const isSelected = selected.includes(skill.name);
              return (
                <button type="button" key={skill.name}
                  className={`cv-skill-item${isSelected ? " cv-skill-item--selected" : ""}`}
                  aria-label={`${skill.name}, ${skill.mastery}${selecting ? isSelected ? ", selected" : ", not selected" : ", update skill"}`}
                  aria-pressed={selecting ? isSelected : undefined}
                  onClick={() => { if (selecting) toggle(skill.name); else { setEditing(skill); setDialog("update"); } }}>
                  <span className={`user-skill-bar user-skill-bar--${tone}`} aria-hidden="true"><span style={{ width: `${level}%` }} /></span>
                  <span className="cv-skill-name">{skill.name}</span>
                  <span className="sr-only">{skill.mastery}</span>
                </button>
              );
            })}
          </div>
        </section>
      )) : <p className="cv-skills-empty">No skills added yet</p>}
      <div className="cv-skills-actions">
        {selecting ? <>
          <button type="button" className="cv-skills-cancel" onClick={cancelSelection}>Cancel</button>
          <button type="button" className="cv-skills-remove" disabled={!selected.length} onClick={() => setDialog("remove")}>Remove <span className="cv-skills-count">{selected.length}</span></button>
        </> : <>
          <button type="button" onClick={() => { setEditing(undefined); setDialog("add"); }}><AppIcon name="add-profile-item" />Add skill</button>
          <button type="button" className="cv-skills-remove-link" disabled={!skills.length} onClick={() => setSelecting(true)}><AppIcon name="delete" />Remove skills</button>
        </>}
      </div>
      {(dialog === "add" || dialog === "update") && <SkillFormDialog kind={dialog} skill={dialog === "update" ? editing : undefined} available={available}
        onClose={() => setDialog(null)}
        onSave={(name, mastery) => dialog === "add" ? addCvSkill(cv.id, name, mastery) : updateCvSkill(cv.id, name, mastery)} />}
      {dialog === "remove" && <SkillRemoveDialog count={selected.length} error="" onClose={() => setDialog(null)}
        onConfirm={() => { removeCvSkills(cv.id, selected); cancelSelection(); }} />}
    </div>
  );
}
