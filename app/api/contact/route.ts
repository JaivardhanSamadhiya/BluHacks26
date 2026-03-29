import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Map subject codes to readable labels
    const subjectLabels: Record<string, string> = {
      feedback: "Feedback",
      bug: "Bug Report",
      feature: "Feature Request",
      other: "Other",
    };

    const subjectLabel = subjectLabels[subject] || subject;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "EmotiArt Contact <onboarding@resend.dev>",
      to: "jaisamadhiya@gmail.com",
      replyTo: email,
      subject: `[EmotiArt ${subjectLabel}] Message from ${name}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #06AED4; margin-bottom: 20px;">New Contact Form Submission</h2>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 0 0 10px;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0;"><strong>Subject:</strong> ${subjectLabel}</p>
          </div>
          
          <div style="background: #ffffff; border: 1px solid #e5e5e5; padding: 20px; border-radius: 8px;">
            <h3 style="margin: 0 0 10px; color: #333;">Message:</h3>
            <p style="margin: 0; white-space: pre-wrap; color: #555;">${message}</p>
          </div>
          
          <p style="margin-top: 20px; font-size: 12px; color: #888;">
            This email was sent from the EmotiArt contact form.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
