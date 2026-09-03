
import { withSupabase } from "npm:@supabase/server@^1";

const RESEND_API_URL = "https://api.resend.com/emails";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

interface Enquiry {
  name?: string;
  email?: string;
  company?: string;
  enquiry_type?: string;
  quantity?: number | string | null;
  budget?: string;
  timeline?: string;
  phone?: string;
  message?: string;
}

function clean(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function escapeHtml(value: unknown): string {
  return clean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
}

Deno.serve(async (req) => {

  /* =======================================================
     CORS
  ======================================================= */

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }


  /* =======================================================
     METHOD
  ======================================================= */

  if (req.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed.",
      },
      405
    );
  }


  try {

    /* =====================================================
       ENVIRONMENT
    ===================================================== */

    const resendApiKey =
      Deno.env.get("RESEND_API_KEY");

    const emailFrom =
      Deno.env.get("ENQUIRY_FROM_EMAIL") ||
      "The Gesture Co. <hello@thegestureco.co.uk>";

    const emailTo =
      Deno.env.get("ENQUIRY_TO_EMAIL") ||
      "hello@thegestureco.co.uk";


    if (!resendApiKey) {

      console.error(
        "RESEND_API_KEY is not configured."
      );

      return jsonResponse(
        {
          error:
            "Email service is not configured.",
        },
        500
      );

    }


    /* =====================================================
       READ REQUEST
    ===================================================== */

    let body: Enquiry;

    try {

      body = await req.json();

    } catch {

      return jsonResponse(
        {
          error:
            "Invalid request body.",
        },
        400
      );

    }


    /* =====================================================
       CLEAN DATA
    ===================================================== */

    const name =
      clean(body.name);

    const email =
      clean(body.email).toLowerCase();

    const company =
      clean(body.company);

    const enquiryType =
      clean(body.enquiry_type);

    const budget =
      clean(body.budget);

    const timeline =
      clean(body.timeline);

    const phone =
      clean(body.phone);

    const message =
      clean(body.message);


    let quantity:
      number | null = null;


    if (
      body.quantity !== null &&
      body.quantity !== undefined &&
      body.quantity !== ""
    ) {

      const parsedQuantity =
        Number(body.quantity);

      if (
        !Number.isInteger(parsedQuantity) ||
        parsedQuantity < 1
      ) {

        return jsonResponse(
          {
            error:
              "Quantity must be a valid positive number.",
          },
          400
        );

      }

      quantity =
        parsedQuantity;

    }


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!name) {

      return jsonResponse(
        {
          error:
            "Please provide your name.",
        },
        400
      );

    }


    if (!email) {

      return jsonResponse(
        {
          error:
            "Please provide your email address.",
        },
        400
      );

    }


    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailPattern.test(email)) {

      return jsonResponse(
        {
          error:
            "Please provide a valid email address.",
        },
        400
      );

    }


    /* =====================================================
       SUPABASE
    ===================================================== */

    const {
      supabaseAdmin
    } = await withSupabase({
      auth: "none",
    });


    /* =====================================================
       SAVE ENQUIRY
    ===================================================== */

    const {
      data: enquiry,
      error: enquiryError
    } =
      await supabaseAdmin
        .from("enquiries")
        .insert({
          name,
          email,
          company:
            company || null,
          enquiry_type:
            enquiryType || null,
          quantity,
          budget:
            budget || null,
          timeline:
            timeline || null,
          phone:
            phone || null,
          message:
            message || null,
          status:
            "new",
        })
        .select("id")
        .single();


    if (enquiryError) {

      console.error(
        "Enquiry database error:",
        enquiryError
      );

      return jsonResponse(
        {
          error:
            "We couldn't save your enquiry. Please try again.",
        },
        500
      );

    }


    /* =====================================================
       EMAIL
    ===================================================== */

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; color: #1c2430;">

        <div style="padding: 28px 0; border-bottom: 1px solid #ddd;">
          <h1 style="margin: 0; font-size: 28px;">
            New Website Enquiry
          </h1>

          <p style="margin: 8px 0 0; color: #666;">
            The Gesture Co.
          </p>
        </div>


        <div style="padding: 28px 0;">

          <h2 style="font-size: 20px;">
            Customer details
          </h2>

          <table style="width: 100%; border-collapse: collapse;">

            <tr>
              <td style="padding: 10px 0; font-weight: bold; width: 180px;">
                Name
              </td>

              <td style="padding: 10px 0;">
                ${escapeHtml(name)}
              </td>
            </tr>


            <tr>
              <td style="padding: 10px 0; font-weight: bold;">
                Email
              </td>

              <td style="padding: 10px 0;">
                <a href="mailto:${escapeHtml(email)}">
                  ${escapeHtml(email)}
                </a>
              </td>
            </tr>


            <tr>
              <td style="padding: 10px 0; font-weight: bold;">
                Company
              </td>

              <td style="padding: 10px 0;">
                ${escapeHtml(company || "Not provided")}
              </td>
            </tr>


            <tr>
              <td style="padding: 10px 0; font-weight: bold;">
                Phone
              </td>

              <td style="padding: 10px 0;">
                ${escapeHtml(phone || "Not provided")}
              </td>
            </tr>

          </table>


          <h2 style="font-size: 20px; margin-top: 32px;">
            Enquiry
          </h2>


          <table style="width: 100%; border-collapse: collapse;">

            <tr>
              <td style="padding: 10px 0; font-weight: bold; width: 180px;">
                Enquiry type
              </td>

              <td style="padding: 10px 0;">
                ${escapeHtml(enquiryType || "Not provided")}
              </td>
            </tr>


            <tr>
              <td style="padding: 10px 0; font-weight: bold;">
                Quantity
              </td>

              <td style="padding: 10px 0;">
                ${quantity ?? "Not provided"}
              </td>
            </tr>


            <tr>
              <td style="padding: 10px 0; font-weight: bold;">
                Budget
              </td>

              <td style="padding: 10px 0;">
                ${escapeHtml(budget || "Not provided")}
              </td>
            </tr>


            <tr>
              <td style="padding: 10px 0; font-weight: bold;">
                Timeline
              </td>

              <td style="padding: 10px 0;">
                ${escapeHtml(timeline || "Not provided")}
              </td>
            </tr>

          </table>


          <h2 style="font-size: 20px; margin-top: 32px;">
            Message
          </h2>


          <div style="
            background: #f6f6f4;
            padding: 20px;
            border-radius: 6px;
            white-space: pre-wrap;
          ">
            ${escapeHtml(message || "No message provided.")}
          </div>


          <p style="margin-top: 32px; color: #777; font-size: 13px;">
            Enquiry ID: ${escapeHtml(enquiry?.id)}
          </p>

        </div>

      </div>
    `;


    const emailResponse =
      await fetch(
        RESEND_API_URL,
        {
          method: "POST",

          headers: {
            "Authorization":
              `Bearer ${resendApiKey}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({

            from:
              emailFrom,

            to: [
              emailTo
            ],

            reply_to:
              email,

            subject:
              `New enquiry from ${name}${company ? ` — ${company}` : ""}`,

            html:
              emailHtml,

          }),

        }
      );


    const emailResult =
      await emailResponse.json();


    if (!emailResponse.ok) {

      console.error(
        "Resend error:",
        emailResult
      );

      /*
       * IMPORTANT:
       * The enquiry has already been saved.
       * We therefore don't tell the customer that
       * the enquiry itself failed.
       */

      return jsonResponse(
        {
          success: true,
          saved: true,
          email_sent: false,
          enquiry_id:
            enquiry?.id,
          message:
            "Your enquiry has been received.",
        },
        200
      );

    }


    /* =====================================================
       SUCCESS
    ===================================================== */

    console.log(
      "Enquiry submitted successfully:",
      enquiry?.id
    );


    return jsonResponse(
      {
        success: true,
        saved: true,
        email_sent: true,
        enquiry_id:
          enquiry?.id,
        message:
          "Your enquiry has been received.",
      },
      200
    );


  } catch (error) {

    console.error(
      "Submit enquiry error:",
      error
    );


    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while submitting your enquiry.",
      },
      500
    );

  }

});
