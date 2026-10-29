/**
 * Vercel Serverless Function: /api/contact
 * Handles contact enquiries with validation, sanitization, spam prevention, and optional SMTP notification.
 */

const crypto = require('crypto');

// Simple sanitizer
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '').slice(0, 3000);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        payload = {};
      }
    } else if (!payload) {
      payload = {};
    }

    // Honeypot spam protection
    if (payload.website_url || payload.company_fax) {
      console.warn('[Vercel SPAM BLOCKED] Honeypot triggered');
      return res.status(200).json({
        success: true,
        message: 'Your enquiry has been received.'
      });
    }

    const name = sanitizeString(payload.name);
    const email = sanitizeString(payload.email).toLowerCase();
    const phone = sanitizeString(payload.phone);
    const projectType = sanitizeString(payload.projectType || payload.project_type);
    const location = sanitizeString(payload.location);
    const area = sanitizeString(payload.area);
    const budget = sanitizeString(payload.budget);
    const timeline = sanitizeString(payload.timeline);
    const message = sanitizeString(payload.message || payload.description);
    const consent = payload.privacyConsent === true || payload.privacyConsent === 'on' || payload.privacyConsent === 'true';

    // Validation
    const errors = {};
    if (!name || name.length < 2) errors.name = 'Please provide your full name.';
    if (!email || !isValidEmail(email)) errors.email = 'Please provide a valid email address.';
    if (!projectType) errors.projectType = 'Please select a project type.';
    if (!location || location.length < 2) errors.location = 'Please state your project city or location.';
    if (!message || message.length < 10) errors.message = 'Please provide a project description (minimum 10 characters).';
    if (!consent) errors.privacyConsent = 'Consent to our privacy policy is required.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    const referenceId = 'ENQ-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    console.log(`[VERCEL ENQUIRY] ID: ${referenceId} | From: ${name} (${email}) | Type: ${projectType} in ${location}`);

    // Optional Nodemailer dispatch if SMTP environment variables exist on Vercel
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || 'Foresight Associates'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
          to: process.env.STUDIO_RECIPIENT_EMAIL || 'inquiries@foresightassociates.in',
          subject: `[New Project Inquiry] ${name} — ${projectType} (${location})`,
          text: `
New Project Enquiry received on Foresight Associates Website

Reference ID: ${referenceId}
Date: ${new Date().toLocaleString()}

Client Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Project Typology: ${projectType}
Location: ${location}
Approx. Area: ${area || 'Not specified'}
Budget Range: ${budget || 'Not specified'}
Timeline: ${timeline || 'Flexible'}

Project Brief:
${message}
          `.trim()
        });
        console.log(`[VERCEL EMAIL DISPATCHED] ID: ${referenceId}`);
      } catch (mailErr) {
        console.error('[VERCEL EMAIL ERROR]', mailErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      reference: referenceId,
      message: 'Thank you for contacting Foresight Associates. Your enquiry has been received and our design principals will review your project brief.'
    });

  } catch (err) {
    console.error('Vercel API Handler Error:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred. Please try again.'
    });
  }
};

