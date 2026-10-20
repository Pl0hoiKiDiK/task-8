import { EmployeeDetails } from "@/components/employee-details";

export default async function EmployeeDetailsPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <EmployeeDetails userId={userId} />;
}
