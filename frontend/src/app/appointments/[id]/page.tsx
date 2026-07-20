import AppointmentDetailClient from "./AppointmentDetailClient";

export function generateStaticParams() {
  return [];
}

export default function AppointmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <AppointmentDetailClient id={params.id} />;
}
