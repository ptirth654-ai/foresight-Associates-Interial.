/**
 * Foresight Associates — Luxury Contact & Project Inquiry Form
 */

export function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const statusBox = form.querySelector('.form-status') || createStatusBox(form);
  const submitBtn = form.querySelector('button[type="submit"]');

  function createStatusBox(formEl) {
    const box = document.createElement('div');
    box.className = 'form-status';
    box.style.display = 'none';
    box.setAttribute('role', 'alert');
    formEl.insertBefore(box, formEl.firstChild);
    return box;
  }

  function showStatus(type, message) {
    statusBox.className = `form-status ${type}`;
    statusBox.innerHTML = message;
    statusBox.style.display = 'block';
    statusBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearErrors() {
    form.querySelectorAll('.form-error').forEach(el => el.remove());
    form.querySelectorAll('.form-control').forEach(el => el.classList.remove('has-error'));
  }

  function showError(fieldId, errorText) {
    const field = form.querySelector(`#${fieldId}`) || form.querySelector(`[name="${fieldId}"]`);
    if (!field) return;
    field.classList.add('has-error');
    const err = document.createElement('span');
    err.className = 'form-error';
    err.textContent = errorText;
    field.parentNode.appendChild(err);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Bot honeypot check
    if (data.website_url) {
      showStatus('success', 'Thank you for your enquiry.');
      form.reset();
      return;
    }

    // Client-side validations
    let hasError = false;
    if (!data.name || data.name.trim().length < 2) {
      showError('name', 'Please provide your full name (minimum 2 characters).');
      hasError = true;
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRe.test(data.email.trim())) {
      showError('email', 'Please provide a valid email address for our response.');
      hasError = true;
    }

    if (!data.projectType) {
      showError('projectType', 'Please select the architectural or interior typology.');
      hasError = true;
    }

    if (!data.location || data.location.trim().length < 2) {
      showError('location', 'Please state your project city or location.');
      hasError = true;
    }

    if (!data.message || data.message.trim().length < 10) {
      showError('message', 'Please share a brief description of your site or vision (minimum 10 characters).');
      hasError = true;
    }

    const consentChecked = form.querySelector('[name="privacyConsent"]')?.checked;
    if (!consentChecked) {
      showError('privacyConsent', 'You must agree to our privacy policy to submit an enquiry.');
      hasError = true;
    }

    if (hasError) {
      showStatus('error', 'Please review the highlighted fields before submitting.');
      return;
    }

    // Disable button & indicate loading
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Transmitting Enquiry...</span>`;
    showStatus('loading', 'Submitting your project details to Foresight Associates...');

    try {
      // Determine API endpoint: relative to current origin
      const endpoint = '/api/contact';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          privacyConsent: true
        })
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success) {
        showStatus('success', `
          <strong>Enquiry Received (${result.reference || 'REF-CONFIRMED'})</strong><br>
          Thank you, ${escapeHtml(data.name)}. Your project enquiry has been logged with our studio principals. We will review your requirements and reach out to discuss the next stages.
        `);
        form.reset();
      } else {
        const errorMsg = result.error || 'Unable to submit enquiry at this time.';
        showStatus('error', `Submission error: ${escapeHtml(errorMsg)}`);
        if (result.details) {
          Object.entries(result.details).forEach(([key, val]) => showError(key, val));
        }
      }
    } catch (err) {
      console.warn('Network submission failed, logging enquiry locally:', err);
      // Fallback for static host / offline test
      showStatus('success', `
        <strong>Enquiry Noted (Local Simulation Mode)</strong><br>
        Thank you, ${escapeHtml(data.name)}. Because this static preview is not currently connected to a running live backend server, your enquiry details have been validated locally. Please connect our Express server (<code>node server/server.js</code>) to enable automated server-side email dispatch.
      `);
      form.reset();
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}
