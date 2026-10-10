/**
 * Tattva Infotech – contact.js
 * Handles contact form validation and submission
 */

document.addEventListener('DOMContentLoaded', () => {

  const form        = document.getElementById('contactForm');
  const successMsg  = document.getElementById('formSuccess');

  if (!form) return;

  /* ─── Validators ─── */
  const validators = {
    firstName : v => v.trim().length >= 2   ? '' : 'Please enter your first name (min 2 characters).',
    lastName  : v => v.trim().length >= 2   ? '' : 'Please enter your last name (min 2 characters).',
    email     : v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.',
    service   : v => v !== ''               ? '' : 'Please select a service.',
    message   : v => v.trim().length >= 20  ? '' : 'Please describe your project (min 20 characters).',
    privacy   : (_, el) => el.checked       ? '' : 'Please accept the Privacy Policy to continue.',
  };

  /* ─── Show / clear error ─── */
  const setError = (input, msg) => {
    const group = input.closest('.form-group');
    const errorEl = group && group.querySelector('.form-error');
    if (msg) {
      input.classList.add('error');
      if (errorEl) errorEl.textContent = msg;
    } else {
      input.classList.remove('error');
      if (errorEl) errorEl.textContent = '';
    }
    return !msg;
  };

  /* ─── Validate single field ─── */
  const validateField = (input) => {
    const name = input.name;
    if (!validators[name]) return true;
    const msg = validators[name](input.value, input);
    return setError(input, msg);
  };

  /* ─── Live validation on blur ─── */
  const fields = form.querySelectorAll('input, select, textarea');
  fields.forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('error')) validateField(field);
    });
    // Checkbox special
    if (field.type === 'checkbox') {
      field.addEventListener('change', () => validateField(field));
    }
  });

  /* ─── Submit ─── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let allValid = true;
    const validatedNames = Object.keys(validators);

    validatedNames.forEach(name => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el && !validateField(el)) allValid = false;
    });

    if (!allValid) {
      // Scroll to first error
      const firstError = form.querySelector('.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
      return;
    }

    // Simulate async submit
    const submitBtn = form.querySelector('[type="submit"]');
    const btnText   = submitBtn.querySelector('.btn__text');
    const original  = btnText ? btnText.textContent : 'Send Message';

    submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'Sending…';

    await new Promise(resolve => setTimeout(resolve, 1400)); // simulate network

    // Show success
    form.style.display = 'none';
    if (successMsg) {
      successMsg.classList.add('show');
      successMsg.setAttribute('aria-hidden', 'false');
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Reset after delay (optional UX: re-show form after 5s)
    setTimeout(() => {
      form.reset();
      form.style.display = '';
      if (successMsg) {
        successMsg.classList.remove('show');
        successMsg.setAttribute('aria-hidden', 'true');
      }
      submitBtn.disabled = false;
      if (btnText) btnText.textContent = original;
    }, 6000);
  });

});
