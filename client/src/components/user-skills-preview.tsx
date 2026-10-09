"use client";

import { useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { availableOwnerSkills, masteryDisplay, masteryFromLevel, previewOwnerSkills, type CvSkill, type SkillMastery } from "@/components/cv-skills-data";
import { ProfileProficiencyItem, type ProficiencyTone } from "@/components/profile-proficiency-item";
import { useCvPreviewData } from "@/components/profile-cvs-data";
import { SkillFormDialog, SkillRemoveDialog } from "@/components/skill-dialogs";

export type Skill = { name: string; tone: ProficiencyTone; level: number };
export type SkillGroup = { title: string; skills: Skill[] };

export const previewSkillGroups: SkillGroup[] = [
  {
    title: "Programming languages",
    skills: [
      { name: "TypeScript", tone: "yellow", level: 80 },
      { name: "JavaScript", tone: "red", level: 100 },
    ],
  },
  {
    title: "Frontend",
    skills: [
      { name: "React", tone: "red", level: 100 },
      { name: "CSS3", tone: "yellow", level: 80 },
      { name: "Storybook", tone: "gray", level: 20 },
      { name: "SCSS", tone: "yellow", level: 80 },
      { name: "React Query", tone: "yellow", level: 80 },
      { name: "Redux", tone: "yellow", level: 80 },
    ],
  },
  {
    title: "Backend",
    skills: [
      { name: "Keycloak", tone: "blue", level: 40 },
      { name: "Node.js", tone: "green", level: 60 },
      { name: "NestJS", tone: "green", level: 60 },
    ],
  },
  {
    title: "Source control systems",
    skills: [{ name: "Git", tone: "red", level: 100 }],
  },
];

export function UserSkillsPreview({ skillGroups, canEdit = false, shared = false }: { skillGroups: SkillGroup[]; canEdit?: boolean; shared?: boolean }) {
  const { userSkills, addUserSkill, updateUserSkill, removeUserSkills } = useCvPreviewData();
  const [localSkills, setLocalSkills] = useState<CvSkill[]>(() => skillGroups.flatMap(({ title, skills: groupSkills }) =>
    groupSkills.map(({ name, level }) => ({ name, category: title, mastery: masteryFromLevel(level) })),
  ));
  const skills = shared ? userSkills : localSkills;
  const [dialog, setDialog] = useState<"add" | "update" | "remove" | null>(null);
  const [editing, setEditing] = useState<CvSkill | undefined>();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const categories = [...new Set(skills.map((skill) => skill.category))];
  const available = availableOwnerSkills(previewOwnerSkills, skills);
  const hasSkills = skills.length > 0;

  function cancelSelection() {
    setSelecting(false);
    setSelected([]);
  }

  function saveSkill(name: string, mastery: SkillMastery) {
    if (shared) {
      if (dialog === "add") addUserSkill(name, mastery);
      else updateUserSkill(name, mastery);
      return;
    }
    if (dialog === "add") {
      const found = available.find((skill) => skill.name === name);
      if (!found) throw new Error("Skill is unavailable");
      setLocalSkills((current) => [...current, { ...found, mastery }]);
    } else {
      setLocalSkills((current) => current.map((skill) => skill.name === name ? { ...skill, mastery } : skill));
    }
  }

  return (
    <div className={`user-skills-page${canEdit ? " user-skills-page--editable" : ""}`}>
      <div className={`user-skills-content${hasSkills ? "" : " admin-profile-content--empty"}`}>
        {hasSkills ? categories.map((category) => (
          <section className="user-skills-group" key={category} aria-label={category}>
            <h1>{category}</h1>
            <div className="user-skills-grid">
              {skills.filter((skill) => skill.category === category).map((skill) => {
                const { tone, level } = masteryDisplay[skill.mastery];
                const isSelected = selected.includes(skill.name);
                return canEdit ? (
                  <button type="button" key={skill.name}
                    className={`user-skill user-skill--button${isSelected ? " user-skill--selected" : ""}`}
                    aria-label={`${skill.name}, ${skill.mastery}${selecting ? isSelected ? ", selected" : ", not selected" : ", update skill"}`}
                    aria-pressed={selecting ? isSelected : undefined}
                    onClick={() => {
                      if (selecting) setSelected((current) => current.includes(skill.name) ? current.filter((item) => item !== skill.name) : [...current, skill.name]);
                      else { setEditing(skill); setDialog("update"); }
                    }}>
                    <span className={`user-skill-bar user-skill-bar--${tone}`} aria-hidden="true"><span style={{ width: `${level}%` }} /></span>
                    <span>{skill.name}</span>
                  </button>
                ) : <ProfileProficiencyItem key={skill.name} name={skill.name} tone={tone} level={level} />;
              })}
            </div>
          </section>
        )) : <h1 className="admin-profile-empty">No skills here</h1>}
        {canEdit && <div className="admin-profile-actions profile-skills-actions">
          {selecting ? <>
            <button type="button" className="profile-skills-cancel" onClick={cancelSelection}>Cancel</button>
            <button type="button" className="profile-skills-remove" disabled={!selected.length} onClick={() => setDialog("remove")}>Remove <span className="cv-skills-count">{selected.length}</span></button>
          </> : <>
            <button type="button" onClick={() => { setEditing(undefined); setDialog("add"); }}><AppIcon name="add-profile-item" />Add skill</button>
            <button type="button" disabled={!hasSkills} onClick={() => setSelecting(true)}><AppIcon name="delete" />Remove skills</button>
          </>}
        </div>}
      </div>
      {(dialog === "add" || dialog === "update") && <SkillFormDialog kind={dialog} skill={dialog === "update" ? editing : undefined} available={available}
        onClose={() => setDialog(null)} onSave={saveSkill} />}
      {dialog === "remove" && <SkillRemoveDialog title={shared ? "Remove skill" : "Remove skills"} count={selected.length} error="" onClose={() => setDialog(null)} onSuccess={cancelSelection}
        onConfirm={() => {
          if (shared) removeUserSkills(selected);
          else { const removing = new Set(selected); setLocalSkills((current) => current.filter((skill) => !removing.has(skill.name))); }
        }} />}
    </div>
  );
}
