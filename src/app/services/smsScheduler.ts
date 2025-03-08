import prisma from "../lib/prisma";

export async function smsSchedule() {

  const usersData = await prisma.sms_schedules.findMany({
    take: 50,
    where: { is_sms_sent: false },
  });

  const response = await fetch("http://localhost:3000/api/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      routeId: process.env.SMS_ROUTE_ID,
      messages: [
        usersData.slice(0, 10).map((user) => ({
          from: user.sms_sender,
          to: user.sms_reciver,
          text: user.sms_text,
        })),
      ],
      refOrderNo: process.env.SMS_REF_ORDER_NO,
      responseType: 1,
    }),
  });
  if (response.status === 200) {
    console.log(`Successfully sent SMS to users`);

    const changIsSent = await prisma.sms_schedules.updateMany({
      where: {
        id: {
          in: usersData.map((user) => Number(user.id)),
        },
      },
      data: {
        is_sms_sent: true,
      },
    });
  } else {
    console.error(`Failed to send SMS to users`);
  }
}

export async function callSmsScheduleMultipleTimes() {
  const schedulePromises = [];
  for (let i = 0; i < 5; i++) {
    schedulePromises.push(smsSchedule());
  }

  await Promise.all(schedulePromises);
}
