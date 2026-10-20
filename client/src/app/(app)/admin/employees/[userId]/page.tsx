import { EmployeeDetails } from "@/components/employee-details";

export default async function AdminEmployeeDetailsPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <EmployeeDetails userId={userId} admin />;
}
