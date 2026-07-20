import EditAppointmentClient from "./EditAppointmentClient";

export function generateStaticParams() {
  return [];
}

export default function EditAppointmentPage({
  params,
}: {
  params: { id: string };
}) {
  return <EditAppointmentClient id={params.id} />;
}
