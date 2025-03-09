import { callSmsScheduleMultipleTimes } from "@/app/services/smsScheduler";

export async function GET() {
  callSmsScheduleMultipleTimes();

  return Response.json({ status: 200 });
}
