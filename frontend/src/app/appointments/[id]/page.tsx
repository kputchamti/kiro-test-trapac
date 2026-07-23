import AppointmentDetailClient from "./AppointmentDetailClient";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function AppointmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <AppointmentDetailClient id={params.id} />;
}
