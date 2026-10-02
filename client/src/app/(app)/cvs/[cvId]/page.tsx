import { CvDetailsPage } from "@/components/cv-details-page";

export default async function EmployeeCvDetailsPage({ params }: { params: Promise<{ cvId: string }> }) {
  const { cvId } = await params;
  return <CvDetailsPage cvId={cvId} role="employee" />;
}
