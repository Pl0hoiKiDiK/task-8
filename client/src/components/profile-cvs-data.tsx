"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { initialCvSkills, ownerSkillsFor, previewCvSkills, previewOwnerSkills, type CvSkill, type SkillMastery } from "@/components/cv-skills-data";

export type CvRecord = {
  id: string;
  name: string;
  education: string;
  employee: string;
  description: string;
};

export type CvFields = Pick<CvRecord, "name" | "education" | "description">;

export const previewEmployeeEmail = "thorn_pear@icloud.com";

const initialCvs: CvRecord[] = [
  {
    id: "preview-cv-1",
    name: "Software Engineer with 5+ years of experience",
    education: "Computer Systems Design",
    employee: previewEmployeeEmail,
    description: "Highly motivated and experienced Software Engineer with 5+ years of proven success in leading and developing robust and scalable applications. Adept at leveraging React, Node.js, Three.js, and WebGL to create innovative and visually appealing user interfaces. Possesses strong leadership and mentoring skills, effectively guiding junior developers and fostering a collaborative team environment. Adept at architecting complex systems, ensuring efficient performance, and adhering to best practices. Passionate about delivering high-quality solutions and contributing to the success of dynamic projects.",
  },
  {
    id: "preview-cv-2",
    name: "Software Engineer with 5+ years of experience",
    education: "Computer Systems Design",
    employee: previewEmployeeEmail,
    description: "Highly motivated and experienced Software Engineer with 5+ years of proven success in designing and developing complex software solutions. Adept at utilizing cutting-edge technologies such as React and Node.js to create user-friendly and scalable applications. Possesses a strong understanding of Computer Systems Design principles and methodologies. A results-oriented individual with a passion for delivering high-quality work and exceeding expectations. A strong team leader and mentor with a proven ability to guide and motivate others to achieve shared goals. Seeking a challenging and rewarding Software Engineer position where I can leverage my skills and experience to contribute to the success of a dynamic and innovative organization.",
  },
];

export const sidebarCvs: CvRecord[] = [
  ...initialCvs,
  {
    id: "preview-cv-3",
    name: "Frontend Developer Portfolio",
    education: "Computer Science",
    employee: "alex.morgan@example.com",
    description: "Frontend developer focused on accessible, responsive web applications.",
  },
];

type CvPreviewContextValue = {
  cvs: CvRecord[];
  createCv: (fields: CvFields) => void;
  updateCv: (id: string, fields: CvFields) => void;
  deleteCv: (id: string) => void;
  cvSkills: Record<string, CvSkill[]>;
  addCvSkill: (cvId: string, name: string, mastery: SkillMastery) => void;
  updateCvSkill: (cvId: string, name: string, mastery: SkillMastery) => void;
  removeCvSkills: (cvId: string, names: string[]) => void;
  userSkills: CvSkill[];
  addUserSkill: (name: string, mastery: SkillMastery) => void;
  updateUserSkill: (name: string, mastery: SkillMastery) => void;
  removeUserSkills: (names: string[]) => void;
};

const CvPreviewContext = createContext<CvPreviewContextValue | null>(null);

export function CvPreviewProvider({ children, initialRecords = initialCvs }: { children: ReactNode; initialRecords?: CvRecord[] }) {
  const [cvs, setCvs] = useState(initialRecords);
  const [cvSkills, setCvSkills] = useState<Record<string, CvSkill[]>>(initialCvSkills);
  const [userSkills, setUserSkills] = useState<CvSkill[]>(previewCvSkills);

  const createCv = (fields: CvFields) => {
    setCvs((current) => [...current, { ...fields, id: crypto.randomUUID(), employee: previewEmployeeEmail }]);
  };

  const updateCv = (id: string, fields: CvFields) => {
    setCvs((current) => current.map((cv) => cv.id === id ? { ...cv, ...fields } : cv));
  };

  const deleteCv = (id: string) => {
    setCvs((current) => current.filter((cv) => cv.id !== id));
    setCvSkills((current) => Object.fromEntries(Object.entries(current).filter(([cvId]) => cvId !== id)));
  };

  const addCvSkill = (cvId: string, name: string, mastery: SkillMastery) => {
    const cv = cvs.find((item) => item.id === cvId);
    const skill = cv && ownerSkillsFor(cv.employee).find((item) => item.name === name);
    if (!skill || (cvSkills[cvId] ?? []).some((item) => item.name === name)) throw new Error("Skill is unavailable");
    setCvSkills((current) => ({ ...current, [cvId]: [...(current[cvId] ?? []), { ...skill, mastery }] }));
  };

  const updateCvSkill = (cvId: string, name: string, mastery: SkillMastery) => {
    if (!(cvSkills[cvId] ?? []).some((item) => item.name === name)) throw new Error("Skill was not found");
    setCvSkills((current) => ({ ...current, [cvId]: (current[cvId] ?? []).map((item) => item.name === name ? { ...item, mastery } : item) }));
  };

  const removeCvSkills = (cvId: string, names: string[]) => {
    const selected = new Set(names);
    setCvSkills((current) => ({ ...current, [cvId]: (current[cvId] ?? []).filter((item) => !selected.has(item.name)) }));
  };

  const addUserSkill = (name: string, mastery: SkillMastery) => {
    const skill = previewOwnerSkills.find((item) => item.name === name);
    if (!skill || userSkills.some((item) => item.name === name)) throw new Error("Skill already exists");
    setUserSkills((current) => [...current, { ...skill, mastery }]);
  };

  const updateUserSkill = (name: string, mastery: SkillMastery) => {
    if (!userSkills.some((item) => item.name === name)) throw new Error("Skill was not found");
    setUserSkills((current) => current.map((item) => item.name === name ? { ...item, mastery } : item));
  };

  const removeUserSkills = (names: string[]) => {
    const selected = new Set(names);
    setUserSkills((current) => current.filter((item) => !selected.has(item.name)));
  };

  return (
    <CvPreviewContext.Provider value={{ cvs, createCv, updateCv, deleteCv, cvSkills, addCvSkill, updateCvSkill, removeCvSkills, userSkills, addUserSkill, updateUserSkill, removeUserSkills }}>
      {children}
    </CvPreviewContext.Provider>
  );
}

export function useCvPreviewData() {
  const context = useContext(CvPreviewContext);
  if (!context) throw new Error("CV preview data provider is missing");
  return context;
}
