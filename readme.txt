THE GESTURE CO. WEBSITE — UPDATED

This package keeps the existing navy, cream and gold design while:
- removing the old Gifted branding;
- using The Gesture Co. consistently;
- keeping the working corporate enquiry form as Netlify Form "corporate-enquiry";
- adding six corporate gifting categories;
- fixing mobile navigation;
- adding SEO/social metadata and Organization schema;
- adding the Netlify form-triggered Resend function at netlify/functions/submission-created.mts.

IMPORTANT:
- Do NOT put the Resend API key in this package.
- RESEND_API_KEY must remain a secret Netlify environment variable with Functions/Runtime scope.
- EMAIL_FROM defaults to The Gesture Co. <hello@thegestureco.co.uk>.
- ENQUIRY_NOTIFY_EMAIL defaults to hello@thegestureco.co.uk.
- The Resend sending domain must be verified before customer emails can be sent.
