var SUPABASE_URL = "https://ukgegbldcsufgrhlkswd.supabase.co";
var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_uedHcLW_1UvmJkbD9BFVBQ_EMYQYg0r";
var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

var signupModes = {
  wa: {
    label: "Your WhatsApp number",
    placeholder: "9876543210",
    inputType: "tel",
    inputMode: "numeric",
    switchText: "Use Email instead",
    emptyMessage: "Please enter your WhatsApp number.",
    invalidMessage: "Please enter a valid 10-digit WhatsApp number.",
    buttonClass: "cta-wa",
    successMessage: "We'll notify you on WhatsApp when early access opens."
  },
  email: {
    label: "Your email address",
    placeholder: "Your email address",
    inputType: "email",
    inputMode: "email",
    switchText: "Use WhatsApp instead",
    emptyMessage: "Please enter your email address.",
    invalidMessage: "Please enter a valid email address.",
    buttonClass: "cta-email",
    successMessage: "We'll email you when early access opens."
  }
};

var signupContexts = {
  m: {
    titleId: "modalTitle",
    subId: "modalSub",
    defaultTitle: "Join the <em>waitlist.</em>",
    defaultSub: "Be first when we launch. Pick how you'd like us to hear from you."
  },
  s: {
    titleId: "sheetTitle",
    subId: "sheetSub",
    defaultTitle: "Join the <em>waitlist.</em>",
    defaultSub: "Pick how you'd like us to hear from you."
  }
};

function signupHTML(id) {
  return '<form class="signup-form" id="' + id + 'Form" data-mode="email" novalidate>'
    + '<input type="text" name="website_url" id="' + id + 'Honeypot" class="honeypot-field" autocomplete="off" tabindex="-1" />'
    + '<label class="signup-label" id="' + id + 'Label" for="' + id + 'Input">Your email address</label>'
    + '<div class="input-row" id="' + id + 'Row">'
    + '<span class="country-code" id="' + id + 'Prefix" hidden>+91</span>'
    + '<input type="email" inputmode="email" maxlength="254" id="' + id + 'Input" placeholder="Your email address" aria-label="Your email address" aria-describedby="' + id + 'Error ' + id + 'Hint" />'
    + '</div>'
    + '<p class="form-error" id="' + id + 'Error" role="alert" aria-live="polite"></p>'
    + '<button class="cta cta-email" id="' + id + 'Submit" type="submit">Join</button>'
    + '<button class="signup-switch" id="' + id + 'Switch" type="button">Use WhatsApp instead</button>'
    + '<p class="signup-hint" id="' + id + 'Hint">Free &bull; No spam &bull; Takes 5 seconds</p>'
    + '<div class="success-msg" id="' + id + 'Success">'
    + '<div class="success-icon" aria-hidden="true">✓</div>'
    + '<strong id="' + id + 'SuccessTitle">You\'re on the Morfees waitlist.</strong>'
    + '<span id="' + id + 'SuccessText"></span>'
    + '<button class="success-action" type="button" onclick="closeSignupSuccess(\'' + id + '\')">Got it</button></div>'
    + '</form>';
}

["m", "s"].forEach(function(id) {
  var block = document.getElementById(id + "Block");
  if (block) {
    block.innerHTML = signupHTML(id);
  }
});

function clearErrors(id) {
  document.getElementById(id + "Row").classList.remove("error");
  document.getElementById(id + "Error").textContent = "";
  document.getElementById(id + "Error").classList.remove("show");
}

function showError(id, message) {
  document.getElementById(id + "Row").classList.add("error");
  document.getElementById(id + "Error").textContent = message;
  document.getElementById(id + "Error").classList.add("show");

  // ✅ GOOGLE ANALYTICS ERROR TRACKING
  if (typeof gtag === "function") {
    gtag('event', 'form_error', {
      message: message
    });
  }
}


function setContextCopy(id, titleHTML, subText) {
  var context = signupContexts[id];
  if (!context) {
    return;
  }

  document.getElementById(context.titleId).innerHTML = titleHTML;
  document.getElementById(context.subId).textContent = subText;
}

function setMode(id, mode, shouldFocus) {
  var config = signupModes[mode];
  var form = document.getElementById(id + "Form");
  var label = document.getElementById(id + "Label");
  var input = document.getElementById(id + "Input");
  var switchButton = document.getElementById(id + "Switch");
  var submitButton = document.getElementById(id + "Submit");
  var row = document.getElementById(id + "Row");
  var prefix = document.getElementById(id + "Prefix");

  form.dataset.mode = mode;
  label.textContent = config.label;
  input.value = "";
  input.type = config.inputType;
  input.inputMode = config.inputMode;
  input.placeholder = config.placeholder;
  input.maxLength = mode === "wa" ? 10 : 254;
  input.setAttribute("aria-label", config.label);
  switchButton.textContent = config.switchText;
  submitButton.classList.remove("cta-wa", "cta-email");
  submitButton.classList.add(config.buttonClass);
  row.classList.toggle("wa", mode === "wa");
  prefix.hidden = mode !== "wa";
  clearErrors(id);

  if (shouldFocus) {
    input.focus();
  }
}

function toggleMode(id) {
  var form = document.getElementById(id + "Form");
  var nextMode = form.dataset.mode === "wa" ? "email" : "wa";
  setMode(id, nextMode, true);
}

function isValidValue(mode, value) {
  if (mode === "wa") {
    return /^[6-9][0-9]{9}$/.test(value);
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function joinWaitlist(email) {
  var result = await supabaseClient
    .from("waitlist")
    .insert({
      contact_value: email,
      contact_type: "email"
    });

  if (result.error) {
    if (result.error.code === "23505") {
      var duplicateError = new Error("You're already on the waitlist.");
      duplicateError.code = result.error.code;
      duplicateError.userMessage = "You're already on the waitlist.";
      throw duplicateError;
    }

    var waitlistError = new Error("Something went wrong. Please try again.");
    waitlistError.code = result.error.code;
    waitlistError.userMessage = "Something went wrong. Please try again.";
    throw waitlistError;
  }

  return result.data;
}

function getWaitlistErrorMessage(error) {
  if (error && error.userMessage) {
    return error.userMessage;
  }

  return "Something went wrong. Please try again.";
}

async function saveWaitlistContact(contactValue, contactType) {
  if (contactType === "email") {
    return joinWaitlist(contactValue);
  }

  var result = await supabaseClient
    .from("waitlist")
    .insert({
      contact_value: contactValue,
      contact_type: contactType
    });

  if (result.error) {
    throw result.error;
  }

  return result.data;
}

async function handleSignupSubmit(id) {
  var form = document.getElementById(id + "Form");
  var mode = form.dataset.mode;
  var config = signupModes[mode];
  var honeypot = document.getElementById(id + "Honeypot");
  var input = document.getElementById(id + "Input");
  var value = input.value.trim();
  var button = form.querySelector("button[type='submit']");

  if (honeypot && honeypot.value.trim()) {
    console.warn("Bot submission blocked");
    return false;
  }

  clearErrors(id);

  if (!value) {
    showError(id, config.emptyMessage);
    input.focus();
    return;
  }

  if (!isValidValue(mode, value)) {
    showError(id, config.invalidMessage);
    input.focus();
    return;
  }

  button.disabled = true;
  button.textContent = "Joining...";

  try {
    await saveWaitlistContact(mode === "wa" ? "+91" + value : value, mode === "wa" ? "whatsapp" : "email");

    // ✅ GOOGLE ANALYTICS EVENT (ADD THIS)
  if (typeof gtag === 'function') {
  const params = new URLSearchParams(window.location.search);

  gtag('event', 'signup_success', {
    method: mode === "wa" ? "whatsapp" : "email",
    source: params.get('utm_source'),
    medium: params.get('utm_medium'),
    campaign: params.get('utm_campaign')
  });
}
    
    console.log("Waitlist join saved", { id: id, contactType: mode });
    setContextCopy(id, "You're <em>on the waitlist.</em>", config.successMessage);
    form.style.display = "none";
    document.getElementById(id + "SuccessTitle").textContent = "Thanks for joining Morfees.";
    document.getElementById(id + "SuccessText").textContent = config.successMessage;
    document.getElementById(id + "Success").style.display = "block";
  } catch (error) {
    console.error("Failed to join waitlist", error);
    showError(id, getWaitlistErrorMessage(error));
    button.disabled = false;
    button.textContent = "Join";
  }
}

function isDesktopSignup() {
  return window.matchMedia("(min-width: 768px)").matches;
}

function lockScroll() {
  document.body.style.overflow = "hidden";
}

function unlockScroll() {
  document.body.style.overflow = "";
}

function openSheet() {
  resetSignupState("s");
  var overlay = document.getElementById("sheetOverlay");
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  lockScroll();
  focusSignupInput("s");
}

function closeSheet() {
  var overlay = document.getElementById("sheetOverlay");
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  unlockScroll();
}

function sheetOverlayClick(event) {
  if (event.target === document.getElementById("sheetOverlay")) {
    closeSheet();
  }
}

function openModal() {
  if (!isDesktopSignup()) {
    openSheet();
    return;
  }

  resetSignupState("m");
  document.getElementById("modalOverlay").classList.add("open");
  document.getElementById("modalOverlay").setAttribute("aria-hidden", "false");
  lockScroll();
  focusSignupInput("m");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
  document.getElementById("modalOverlay").setAttribute("aria-hidden", "true");
  unlockScroll();
}

function overlayClick(event) {
  if (event.target === document.getElementById("modalOverlay")) {
    closeModal();
  }
}

document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    closeModal();
    closeSheet();
  }
});

document.addEventListener("keydown", function(event) {
  if (event.key !== "Enter") {
    return;
  }

  var active = document.activeElement;
  if (!active || !active.id) {
    return;
  }

  if (active.id === "contactInput") {
    handleContact();
  }
});

function handleContact() {
  var input = document.getElementById("contactInput");
  var val = input.value.trim();

  if (!val) {
    return;
  }

  window.location.href = "mailto:hello@morfees.com?subject=Something on my mind&body=" + encodeURIComponent(val);
  input.value = "";
  input.placeholder = "Opening your email app...";
}

function setLoading(id, isLoading) {
  var input = document.getElementById(id + "Input");
  var submit = document.getElementById(id + "Submit");
  var switchButton = document.getElementById(id + "Switch");

  input.disabled = isLoading;
  submit.disabled = isLoading;
  switchButton.disabled = isLoading;
  submit.textContent = isLoading ? "Joining..." : "Join";
}

function resetSignupState(id) {
  var form = document.getElementById(id + "Form");
  var success = document.getElementById(id + "Success");
  var context = signupContexts[id];

  if (!form || !success || !context) {
    return;
  }

  form.style.display = "flex";
  success.style.display = "none";
  document.getElementById(id + "SuccessTitle").textContent = "You're on the Morfees waitlist.";
  document.getElementById(id + "SuccessText").textContent = "";
  setContextCopy(id, context.defaultTitle, context.defaultSub);
  setMode(id, "email", false);
  setLoading(id, false);
}

function focusSignupInput(id) {
  window.setTimeout(function() {
    var input = document.getElementById(id + "Input");
    if (input && !input.disabled) {
      input.focus();
    }
  }, 40);
}

function closeSignupSuccess(id) {
  if (id === "m") {
    closeModal();
    return;
  }

  closeSheet();
}

// One shared submit and validation system powers the modal and the mobile sheet.
["m", "s"].forEach(function(id) {
  var form = document.getElementById(id + "Form");
  var input = document.getElementById(id + "Input");
  var switchButton = document.getElementById(id + "Switch");

  if (!form || !input || !switchButton) {
    return;
  }

  form.addEventListener("submit", function(event) {
    event.preventDefault();
    handleSignupSubmit(id);
  });

  input.addEventListener("input", function(event) {
    var mode = document.getElementById(id + "Form").dataset.mode;

    if (mode === "wa") {
      event.target.value = event.target.value.replace(/\D/g, "").slice(0, 10);
    }

    clearErrors(id);
  });

  switchButton.addEventListener("click", function() {
    toggleMode(id);
  });

  resetSignupState(id);
});


document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("input").forEach(input => {
    input.addEventListener("focus", () => {
      if (typeof gtag === "function") {
        gtag('event', 'form_start');
      }
    });
  });
});
