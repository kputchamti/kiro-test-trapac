import EditAppointmentClient from "./EditAppointmentClient";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function EditAppointmentPage({
  params,
}: {
  params: { id: string };
}) {
  return <EditAppointmentClient id={params.id} />;
}
