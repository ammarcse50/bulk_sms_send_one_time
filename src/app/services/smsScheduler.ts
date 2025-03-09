import prisma from "../lib/prisma";

export async function smsSchedule() {
  try {
    const currentDate = new Date();
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const transactedData = await prisma.$transaction(
      async (tx) => {
        const usersData = await tx.sms_schedules.findMany({
          where: {
            is_sms_sent: false,
            send_at: {
              lte: currentDate,
              gte: startOfDay,
            },
            status: "PENDING",
          },
          take: 50,
          orderBy: {
            send_at: "asc",
          },
        });

        if (usersData.length === 0) {
          return [];
        }

        const updatedData = await tx.sms_schedules.updateMany({
          where: {
            id: {
              in: usersData.map((user) => user.id),
            },
          },
          data: {
            status: "PROCESSING",
          },
        });

        return usersData;
      },
      { isolationLevel: "Serializable", timeout: 1000, maxWait: 1000 }
    );

    for (let i = 0; i < transactedData.length; i += 10) {
      const chunk = transactedData.slice(i, i + 10);

      const response = await fetch("http://localhost:3000/api/sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          routeId: process.env.SMS_ROUTE_ID,
          messages: chunk.map((user) => ({
            from: user.sms_sender,
            to: user.sms_reciver,
            text: user.sms_text,
          })),
          refOrderNo: process.env.SMS_REF_ORDER_NO,
          responseType: 1,
        }),
      });

      if (response.status === 200) {
        for (const user of chunk) {
          await prisma.sms_send_status.create({
            data: {
              sms_reciver: user.sms_reciver,
              sms_sender: user.sms_sender,
              sms_text: user.sms_text,
              status: "SENT",
              created_by: user.id,
              updated_by: user.id,
              created_at: new Date(),
              updated_at: new Date(),
              company_id: user.company_id,
              schedule_at: user.schedule_at,
              route_id: user.route_id,
              is_active: true,
              send_at: new Date(),
            },
          });
        }

        await prisma.sms_schedules.updateMany({
          where: {
            id: {
              in: chunk.map((user) => Number(user.id)),
            },
          },
          data: {
            is_sms_sent: true,
            status: "SENT",
          },
        });
      } else {
        for (const user of chunk) {
          await prisma.sms_send_status.create({
            data: {
              sms_reciver: user.sms_reciver,
              sms_sender: user.sms_sender,
              sms_text: user.sms_text,
              status: "FAILED",
              created_by: user.id,
              updated_by: user.id,
              created_at: new Date(),
              updated_at: new Date(),
              company_id: user.company_id,
              schedule_at: user.schedule_at,
              route_id: user.route_id,
              is_active: true,
              response: "Receiver Absent",
              send_at: new Date(),
            },
          });
        }
      }
    }
  } catch (error) {
    console.error("Error in smsSchedule function:", error);
  }
}

export async function callSmsScheduleMultipleTimes() {
  const schedulePromises = [];
  for (let i = 0; i < 5; i++) {
    schedulePromises.push(smsSchedule());
  }
  await Promise.all(schedulePromises);
}
