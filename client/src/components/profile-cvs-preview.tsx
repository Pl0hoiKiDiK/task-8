import { AppIcon } from "@/components/app-icon";
import { ProfileTabs } from "@/components/profile-navigation";

const cvs = [
  {
    name: "Software Engineer with 5+ years of experience",
    education: "Computer Systems Design",
    employee: "thorn_pear@icloud.com",
    description: "Highly motivated and experienced Software Engineer with 5+ years of proven success in leading and developing robust and scalable applications. Adept at leveraging React, Node.js, Three.js, and WebGL to create innovative and visually appealing user interfaces. Possesses strong leadership and mentoring skills, effectively guiding junior developers and fostering a collaborative team environment. Adept at architecting complex systems, ensuring efficient performance, and adhering to best practices. Passionate about delivering high-quality solutions and contributing to the success of dynamic projects.",
  },
  {
    name: "Software Engineer with 5+ years of experience",
    education: "Computer Systems Design",
    employee: "thorn_pear@icloud.com",
    description: "Highly motivated and experienced Software Engineer with 5+ years of proven success in designing and developing complex software solutions. Adept at utilizing cutting-edge technologies such as React and Node.js to create user-friendly and scalable applications. Possesses a strong understanding of Computer Systems Design principles and methodologies. A results-oriented individual with a passion for delivering high-quality work and exceeding expectations. A strong team leader and mentor with a proven ability to guide and motivate others to achieve shared goals. Seeking a challenging and rewarding Software Engineer position where I can leverage my skills and experience to contribute to the success of a dynamic and innovative organization.",
  },
];

export function ProfileCvsPreview() {
  return (
    <div className="profile-cvs-page">
      <ProfileTabs role="admin" section="CVs" />

      <section className="profile-cvs-list" aria-label="CVs">
        <div className="profile-cvs-toolbar">
          <label className="search-field profile-cvs-search">
            <AppIcon name="search" />
            <span className="sr-only">Search CVs</span>
            <input type="search" placeholder="Search" readOnly title="Search is not connected yet" />
          </label>
          <button className="create-action profile-cvs-create" type="button" disabled title="CV creation is not connected yet" aria-label="Create CV">
            <AppIcon name="plus" /><span>Create CV</span>
          </button>
        </div>

        <div className="profile-cvs-heading" aria-hidden="true">
          <span>Name <AppIcon name="sort" className="sort-indicator" /></span>
          <span>Education</span>
          <span className="profile-cvs-employee">Employee</span>
        </div>

        <div className="profile-cvs-items">
          {cvs.map((cv, index) => (
            <article className="profile-cv" key={index} aria-label={cv.name}>
              <div className="profile-cv-row">
                <h2>{cv.name}</h2>
                <span>{cv.education}</span>
                <span className="profile-cvs-employee">{cv.employee}</span>
                <button type="button" className="profile-cv-more" aria-label={`Actions for CV ${index + 1}`} disabled title="CV actions are not connected yet">
                  <AppIcon name="more" />
                </button>
              </div>
              <p>{cv.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
