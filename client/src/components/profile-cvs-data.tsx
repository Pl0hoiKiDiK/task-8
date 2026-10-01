"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type CvRecord = {
  id: string;
  name: string;
  education: string;
  employee: string;
  description: string;
};

export type CvFields = Pick<CvRecord, "name" | "education" | "description">;

const employee = "thorn_pear@icloud.com";

const initialCvs: CvRecord[] = [
  {
    id: "preview-cv-1",
    name: "Software Engineer with 5+ years of experience",
    education: "Computer Systems Design",
    employee,
    description: "Highly motivated and experienced Software Engineer with 5+ years of proven success in leading and developing robust and scalable applications. Adept at leveraging React, Node.js, Three.js, and WebGL to create innovative and visually appealing user interfaces. Possesses strong leadership and mentoring skills, effectively guiding junior developers and fostering a collaborative team environment. Adept at architecting complex systems, ensuring efficient performance, and adhering to best practices. Passionate about delivering high-quality solutions and contributing to the success of dynamic projects.",
  },
  {
    id: "preview-cv-2",
    name: "Software Engineer with 5+ years of experience",
    education: "Computer Systems Design",
    employee,
    description: "Highly motivated and experienced Software Engineer with 5+ years of proven success in designing and developing complex software solutions. Adept at utilizing cutting-edge technologies such as React and Node.js to create user-friendly and scalable applications. Possesses a strong understanding of Computer Systems Design principles and methodologies. A results-oriented individual with a passion for delivering high-quality work and exceeding expectations. A strong team leader and mentor with a proven ability to guide and motivate others to achieve shared goals. Seeking a challenging and rewarding Software Engineer position where I can leverage my skills and experience to contribute to the success of a dynamic and innovative organization.",
  },
];

type CvPreviewContextValue = {
  cvs: CvRecord[];
  createCv: (fields: CvFields) => void;
  updateCv: (id: string, fields: CvFields) => void;
  deleteCv: (id: string) => void;
};

const CvPreviewContext = createContext<CvPreviewContextValue | null>(null);

export function CvPreviewProvider({ children }: { children: ReactNode }) {
  const [cvs, setCvs] = useState(initialCvs);

  const createCv = (fields: CvFields) => {
    setCvs((current) => [...current, { ...fields, id: crypto.randomUUID(), employee }]);
  };

  const updateCv = (id: string, fields: CvFields) => {
    setCvs((current) => current.map((cv) => cv.id === id ? { ...cv, ...fields } : cv));
  };

  const deleteCv = (id: string) => {
    setCvs((current) => current.filter((cv) => cv.id !== id));
  };

  return (
    <CvPreviewContext.Provider value={{ cvs, createCv, updateCv, deleteCv }}>
      {children}
    </CvPreviewContext.Provider>
  );
}

export function useCvPreviewData() {
  const context = useContext(CvPreviewContext);
  if (!context) throw new Error("CV preview data is unavailable outside the admin profile");
  return context;
}
