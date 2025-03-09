import prisma from "../lib/prisma";

export async function smsSchedule() {
  try {
    const currentDate = new Date();
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);

    console.log(currentDate);
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const transactedData = await prisma.$transaction(
      async (tx) => {
        // Fetch the users data
        const usersData = await tx.sms_schedules.findMany({
          where: {
            is_sms_sent: false,
            send_at: {
              lte: currentDate,
              gte: startOfDay,
            },
            status: {
              equals: "PENDING",
            },
          },
          take: 50,
        });

        // Update the fetched data
        const updatedData = await tx.sms_schedules.updateMany({
          where: {
            id: {
              in: usersData.map((user) => user.id),
            },
          },
          data: {
            is_sms_sent: true,
            status: "PROCESSING",
          },
        });

        return usersData;
      },
      { isolationLevel: "ReadCommitted", timeout: 10000, maxWait: 5000 }
    );

    // Send SMS
    const response = await fetch("http://localhost:3000/api/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        routeId: process.env.SMS_ROUTE_ID,
        messages: transactedData.slice(0, 10).map((user) => ({
          from: user.sms_sender,
          to: user.sms_reciver,
          text: user.sms_text,
        })),
        refOrderNo: process.env.SMS_REF_ORDER_NO,
        responseType: 1,
      }),
    });

    if (response.status === 200) {
      // Create SMS send status for each user
      for (const user of transactedData) {
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

      // Update the SMS schedules
      await prisma.sms_schedules.updateMany({
        where: {
          id: {
            in: transactedData.map((user) => Number(user.id)),
          },
        },
        data: {
          is_sms_sent: true,
        },
      });
    } else {
      // Handle failed SMS sends
      for (const user of transactedData) {
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