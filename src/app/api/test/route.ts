import { callSmsScheduleMultipleTimes } from "@/app/services/smsScheduler";

export async function GET() {
 await Promise.all([callSmsScheduleMultipleTimes(), callSmsScheduleMultipleTimes()]);
  return Response.json({ status: 200 });
}
