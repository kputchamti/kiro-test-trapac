import BulkUpload from "@/components/appointments/BulkUpload";

export default function BulkUploadPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Bulk Appointment Upload
      </h1>
      <BulkUpload />
    </div>
  );
}
