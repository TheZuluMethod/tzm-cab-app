/**
 * SendGrid Service
 * 
 * Handles creating email drafts and sending emails via SendGrid API
 */

const SENDGRID_API_KEY = import.meta.env['VITE_SENDGRID_API_KEY'] || '';
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3';

/**
 * Create a transactional email draft in SendGrid
 */
export const createEmailDraft = async (
  draftName: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<{ success: boolean; draftId?: string; error?: string }> => {
  if (!SENDGRID_API_KEY) {
    return { success: false, error: 'SendGrid API key not configured' };
  }

  try {
    // Create a transactional template draft
    const response = await fetch(`${SENDGRID_API_URL}/templates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: draftName,
        generation: 'dynamic', // Use dynamic templates for better flexibility
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Failed to create template: ${errorText}` };
    }

    const template = await response.json();
    const templateId = template.id;

    // Create a version of the template with the content
    const versionResponse = await fetch(`${SENDGRID_API_URL}/templates/${templateId}/versions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'v1',
        subject: subject,
        html_content: htmlContent,
        plain_content: textContent,
        active: 1, // Set as active version
      }),
    });

    if (!versionResponse.ok) {
      const errorText = await versionResponse.text();
      return { success: false, error: `Failed to create template version: ${errorText}` };
    }

    return { success: true, draftId: templateId };
  } catch (error: any) {
    console.error('Error creating SendGrid draft:', error);
    return { success: false, error: error.message || 'Failed to create email draft' };
  }
};

/**
 * Send referral email via SendGrid
 */
export const sendReferralEmail = async (
  toEmail: string,
  referrerName: string,
  referralLink: string,
  templateId?: string
): Promise<{ success: boolean; error?: string }> => {
  if (!SENDGRID_API_KEY) {
    return { success: false, error: 'SendGrid API key not configured' };
  }

  try {
    // If template ID is provided, use dynamic template
    if (templateId) {
      const response = await fetch(`${SENDGRID_API_URL}/mail/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: {
            email: 'noreply@thezulumethod.com',
            name: 'The Zulu Method',
          },
          personalizations: [{
            to: [{ email: toEmail }],
            dynamic_template_data: {
              referrer_name: referrerName,
              referral_link: referralLink,
            },
          }],
          template_id: templateId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to send email: ${errorText}` };
      }

      return { success: true };
    }

    // Fallback: Send without template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You've Been Referred to The Zulu Method</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #577AFF 0%, #4A6CF7 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">You've Been Referred!</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hi there,
          </p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            <strong>${referrerName}</strong> thinks you'd love The Zulu Method's AI Customer Advisory Board!
          </p>
          <p style="font-size: 16px; margin-bottom: 30px;">
            Get instant feedback from 20 expert AI personas on your products, messaging, pricing, and more. Run your first report free!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${referralLink}" style="background: linear-gradient(135deg, #577AFF 0%, #4A6CF7 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Claim Your Free Report
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            This referral link is exclusive to you. When you sign up and become a paying customer, ${referrerName} will get 1 free month!
          </p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            The Zulu Method AI Customer Advisory Board<br>
            <a href="https://thezulumethod.com" style="color: #577AFF;">thezulumethod.com</a>
          </p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
You've Been Referred to The Zulu Method!

Hi there,

${referrerName} thinks you'd love The Zulu Method's AI Customer Advisory Board!

Get instant feedback from 20 expert AI personas on your products, messaging, pricing, and more. Run your first report free!

Claim Your Free Report: ${referralLink}

This referral link is exclusive to you. When you sign up and become a paying customer, ${referrerName} will get 1 free month!

---
The Zulu Method AI Customer Advisory Board
https://thezulumethod.com
    `;

    const response = await fetch(`${SENDGRID_API_URL}/mail/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: toEmail }],
        }],
        from: {
          email: 'noreply@thezulumethod.com',
          name: 'The Zulu Method',
        },
        subject: `${referrerName} wants you to try The Zulu Method AI Advisory Board`,
        content: [
          {
            type: 'text/plain',
            value: textContent,
          },
          {
            type: 'text/html',
            value: htmlContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Failed to send email: ${errorText}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending referral email:', error);
    return { success: false, error: error.message || 'Failed to send referral email' };
  }
};

