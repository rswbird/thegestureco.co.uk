import { Resend } from "resend";
import type { FormSubmittedEvent } from "@netlify/functions";

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const value = (data: Record<string, string>, key: string) => escapeHtml(data[key] || "Not provided");

export default {
  async formSubmitted(event: FormSubmittedEvent) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is not configured.");
      return;
    }

    const data = (event.data || {}) as Record<string, string>;
    const customerEmail = data.email?.trim();

    if (!customerEmail) {
      console.error("Corporate enquiry has no customer email address.");
      return;
    }

    const resend = new Resend(apiKey);
    const from = process.env.EMAIL_FROM || "The Gesture Co. <hello@thegestureco.co.uk>";
    const notifyEmail = process.env.ENQUIRY_NOTIFY_EMAIL || "hello@thegestureco.co.uk";

    const details = `
      <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif">
        <tr><td style="padding:10px;border-bottom:1px solid #e6e0d6;font-weight:bold">Name</td><td style="padding:10px;border-bottom:1px solid #e6e0d6">${value(data,"name")}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e6e0d6;font-weight:bold">Email</td><td style="padding:10px;border-bottom:1px solid #e6e0d6">${value(data,"email")}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e6e0d6;font-weight:bold">Company</td><td style="padding:10px;border-bottom:1px solid #e6e0d6">${value(data,"company")}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e6e0d6;font-weight:bold">Phone</td><td style="padding:10px;border-bottom:1px solid #e6e0d6">${value(data,"phone")}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e6e0d6;font-weight:bold">Gifting type</td><td style="padding:10px;border-bottom:1px solid #e6e0d6">${value(data,"enquiry_type")}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e6e0d6;font-weight:bold">Number of gifts</td><td style="padding:10px;border-bottom:1px solid #e6e0d6">${value(data,"quantity")}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e6e0d6;font-weight:bold">Budget per gift</td><td style="padding:10px;border-bottom:1px solid #e6e0d6">${value(data,"budget")}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e6e0d6;font-weight:bold">Delivery date</td><td style="padding:10px;border-bottom:1px solid #e6e0d6">${value(data,"timeline")}</td></tr>
        <tr><td style="padding:10px;font-weight:bold;vertical-align:top">Message</td><td style="padding:10px;white-space:pre-wrap">${value(data,"message")}</td></tr>
      </table>`;

    const internal = await resend.emails.send({
      from,
      to: [notifyEmail],
      replyTo: customerEmail,
      subject: `New corporate enquiry from ${data.name || "website visitor"}`,
      html: `<div style="background:#f5f1e9;padding:32px"><div style="max-width:680px;margin:auto;background:#fff;padding:32px"><div style="font-family:Georgia,serif;color:#101c30;font-size:24px;letter-spacing:3px">THE GESTURE CO.</div><p style="font-family:Arial,sans-serif;color:#b68a4a;font-size:11px;letter-spacing:2px;font-weight:bold">NEW CORPORATE ENQUIRY</p>${details}</div></div>`
    });

    if (internal.error) {
      console.error("Resend internal notification failed:", internal.error);
    }

    const confirmation = await resend.emails.send({
      from,
      to: [customerEmail],
      subject: "Thank you for contacting The Gesture Co.",
      html: `<div style="background:#f5f1e9;padding:40px 20px;font-family:Arial,sans-serif;color:#17243a"><div style="max-width:600px;margin:auto;background:#fff;padding:40px"><div style="font-family:Georgia,serif;color:#101c30;font-size:24px;letter-spacing:3px">THE GESTURE CO.</div><p style="color:#b68a4a;font-size:11px;letter-spacing:2px;font-weight:bold">THOUGHTFUL GIFTING · STRONGER CONNECTIONS</p><h1 style="font-family:Georgia,serif;font-weight:400;color:#101c30">Thank you for getting in touch.</h1><p>Thank you for contacting The Gesture Co. We've received your enquiry and will be in touch shortly.</p><p style="color:#687286">We look forward to helping you create something memorable.</p></div></div>`
    });

    if (confirmation.error) {
      console.error("Resend customer confirmation failed:", confirmation.error);
    }
  }
};
