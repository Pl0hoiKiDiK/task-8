import { EmployeeDetails, type EmployeeSection } from "@/components/employee-details";

export default async function AdminEmployeeDetailsPage({ params, searchParams }: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const { userId } = await params;
  const requested = (await searchParams).section;
  const section: EmployeeSection = requested === "skills" || requested === "languages" || requested === "cvs" ? requested : "profile";
  return <EmployeeDetails userId={userId} admin section={section} />;
}
