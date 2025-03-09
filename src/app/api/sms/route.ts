import { NextRequest, NextResponse } from "next/server";

const validatePhoneNumber = (phone: string) => {
  const phoneRegex = /^[0-9]{10,15}$/;
  return phoneRegex.test(phone);
};

export async function GET(req: NextRequest) {
  const sms_receiver = req.nextUrl.searchParams.get("sms_receiver");
  const sms_text = req.nextUrl.searchParams.get("sms_text");
  const user_id = req.nextUrl.searchParams.get("user_id");
  const user_password = req.nextUrl.searchParams.get("user_password");
  console.log(
    "sms_receiver:",
    sms_receiver,
    "sms_text:",
    sms_text,
    "user_id:",
    user_id,
    "user_password:",
    user_password
  );

  if (!sms_receiver || !sms_text || !user_id || !user_password) {
    return NextResponse.json(
      {
        error:
          "Missing required parameters (sms_receiver, sms_text, user_id, user_password)",
      },
      { status: 400 }
    );
  }

  if (!validatePhoneNumber(sms_receiver)) {
    return NextResponse.json(
      { error: "Invalid phone number format" },
      { status: 400 }
    );
  }

  console.log(
    "sms_receiver:",
    sms_receiver,
    "sms_text:",
    sms_text,
    "user_id:",
    user_id,
    "user_password:",
    user_password
  );

  return NextResponse.json({
    success: true,
    message: "Parameters received and validated successfully",
    data: { sms_receiver, sms_text, user_id },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { routeId, messages, refOrderNo, responseType } = await req.json();

    if (!routeId || !messages || !refOrderNo || !responseType) {
      return NextResponse.json(
        {
          error:
            "Missing required parameters (routeId, messages, refOrderNo, responseType)",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format: messages must be an array" },
        { status: 400 }
      );
    }

    messages.forEach((message) => {
      if (message) {
        console.log(
          `I am from backend. Sending SMS from: ${message.from} to: ${message.to} with text: ${message.text}`
        );
      }
    });

    return NextResponse.json({ status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
