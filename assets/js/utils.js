/* === File: assets/js/utils.js === */

// ==========================
// Constants
// ==========================
const DEBUG = true; // Set to false to disable debug logs
const START_YEAR = 2025; // Website launch year
const MAX_CONSENT_AGE_DAYS = 30; // Max days before re-prompting for consent
const GTM_ID = "GTM-KWWXZQC6"; // Google Tag Manager ID

// ==========================
// DOM Elements
// ==========================
/* Navbar elements for Toggler Icon Switch */
const navbarNavElement = document.getElementById("navbarNav");
const navbarToggler = document.querySelector(".navbar-toggler");
// Navbar elements for Navbar Collapse on Link Click
const navLinks = document.querySelectorAll(".navbar-collapse .nav-link");
const navbarCollapse = document.querySelector(".navbar-collapse");
// Year element
const yearElement = document.getElementById("yearCopyright");
// Cookie banner elements
const banner = document.getElementById("cookie-banner");
const acceptBtn = document.getElementById("accept-cookies");
const closeBtn = document.getElementById("close-banner");

// ==========================
// Debug Logger
// ==========================
function logDebug(...args) {
  if (DEBUG) console.debug("DEBUG:", ...args);
}

// ==========================
// Navbar Toggler
// ==========================
/**
 * Initialize Navbar Toggler Icon Switch,
 * switching between hamburger and close icons
 * with appropriate ARIA labels for accessibility.
 * Adds a delay to allow users to notice the change.
 */
function initNavbarToggler() {
  if (!navbarToggler || !navbarNavElement) return;

  if (!window.bootstrap) {
    console.warn(
      "Bootstrap not found. Navbar toggler functionality will not be loaded."
    );
    return;
  }

  // change state: menu open → shows X
  navbarNavElement.addEventListener("shown.bs.collapse", function () {
    navbarToggler.classList.add("show-close");
    navbarToggler.setAttribute("aria-label", "Fechar menu de navegação");
    navbarToggler.setAttribute("aria-expanded", "true");
    logDebug("Navbar toggler opened.");
  });

  // change state: menu closed → shows hamburger
  navbarNavElement.addEventListener("hidden.bs.collapse", function () {
    navbarToggler.classList.remove("show-close");
    navbarToggler.setAttribute("aria-label", "Abrir menu de navegação");
    navbarToggler.setAttribute("aria-expanded", "false");
    logDebug("Navbar toggler closed.");
  });
}

// ==========================
// Navbar Collapse on Link Click
// ==========================
/**
 * Initialize Navbar Collapse on Link Click,
 * except when clicking the "Services" dropdown toggle.
 */
function initNavbarCollapse() {
  if (!navbarCollapse || !navLinks.length) return;

  if (!window.bootstrap) {
    console.warn(
      "Bootstrap not found. Navbar collapse functionality will not be loaded."
    );
    return;
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      // Prevent collapse when clicking the dropdown toggle
      if (link.id === "servicesDropdown") return;

      const isNavbarOpen = navbarCollapse.classList.contains("show");

      if (isNavbarOpen) {
        const collapseInstance =
          bootstrap.Collapse.getInstance(navbarCollapse) ??
          new bootstrap.Collapse(navbarCollapse, { toggle: false });

        collapseInstance.hide();
        logDebug(`Navbar link clicked, menu collapsed. Link ID: ${link.id}`);
      }
    });
  });
}

// ==========================
// Dynamic Year
// ==========================
/**
 * Initialize Dynamic Year in Copyright
 */
function initDynamicYear() {
  if (!yearElement) return;

  const currentYear = new Date().getFullYear();
  yearElement.textContent =
    currentYear === START_YEAR
      ? `${START_YEAR}`
      : `${START_YEAR}–${currentYear}`; // en dash for range
  logDebug(`Year element initialized -> ${yearElement.textContent}`);
}

// ==========================
// Cookie Consent / GTM
// ==========================

/**
 * Safely get and parse item from localStorage
 * handles JSON parsing errors
 * @param {string} key The localStorage key to retrieve
 * @returns {any|null} Parsed value or null if not found or on error
 */
function safeLocalStorageGet(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.warn(`Failed to get ${key} from localStorage.`, e);
    return null; // Explicitly return null on failure
  }
}

/**
 * Safely set item in localStorage
 * handles JSON serialization errors
 * @param {string} key The localStorage key to set
 * @param {any} value The value to store (will be JSON stringified)
 * @returns {void}
 */
function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to set ${key} in localStorage.`, e);
  }
}

/**
 * Get stored cookie consent and timestamp from localStorage
 * @returns {{consent: 'accepted' | 'rejected' | null, timestamp: string|null}}
 */
function getStoredConsent() {
  const consent = safeLocalStorageGet("cookieConsent");
  const timestamp = safeLocalStorageGet("cookieConsentAt");
  return { consent, timestamp };
}

/**
 * Check if the stored consent is expired based on max allowed days
 * @param {string|null} timestamp ISO date string of last consent
 * @returns {boolean} True if expired or missing
 */
function hasConsentExpired(timestamp) {
  if (!timestamp) return true;
  const now = new Date();
  const storedDate = new Date(timestamp);
  const diffInDays = (now - storedDate) / (1000 * 60 * 60 * 24);
  return diffInDays > MAX_CONSENT_AGE_DAYS;
}

/**
 * Load Google Tag Manager script dynamically with Consent Mode V2
 * Initialize Cookie Consent Banner logic
 * with Google Tag Manager Consent Mode V2 integration.
 * Defaults to denied consent until user makes a choice.
 * Uses localStorage to persist consent state.
 * Ensures script is only loaded always.
 */
function loadTagManager() {
  // Check if GTM ID is valid
  // GTM ID should be in the format "GTM-XXXXXX"
  if (
    typeof GTM_ID !== "string" ||
    GTM_ID.trim() === "" ||
    !/^GTM-[A-Z0-9]+$/.test(GTM_ID.trim())
  ) {
    console.warn("Invalid GTM ID. GTM will not be loaded.");
    return;
  }

  // Check if GTM script is already loaded
  if (document.getElementById("gtm-script")) return;

  // Initialize dataLayer if not already defined
  window.dataLayer = window.dataLayer || [];

  // Default Consent Mode V2 initialization
  window.dataLayer.push({
    event: "default_consent",
    "gtm.consent": {
      // Always-granted essential consent (security & functionality)
      security_storage: "granted",
      functionality_storage: "granted",
      // Optional consents controlled by user (ads, analytics, personalization)
      ad_storage: "denied",
      analytics_storage: "denied",
      personalization_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    },
  });
  logDebug("Default GTM Consent Mode initialized.");

  // Push the GTM start event as in official snippet
  window.dataLayer.push({
    "gtm.start": new Date().getTime(),
    event: "gtm.js",
  });

  // Create a comment node
  const comment = document.createComment(" Google Tag Manager ");
  document.head.appendChild(comment);

  // Create GTM script element
  const script = document.createElement("script");
  script.id = "gtm-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);

  logDebug("GTM script loaded dynamically.");
}

function injectNoScript() {
  if (document.getElementById('gtm-noscript')) return;

  // Create GTM script element
  const noscript = document.createElement('noscript');
  noscript.id = 'gtm-noscript';
  noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
  document.body.prepend(noscript);

  logDebug("GTM <noscript> iframe injected dynamically.");
}

/**
 * Update Consent Mode via dataLayer for GTM
 * @param {boolean} granted True to grant consent, false to deny
 */
function updateConsentMode(granted) {
  const consentSettings = granted
    ? {
        // Always-granted essential consent (security & functionality)
        security_storage: "granted",
        functionality_storage: "granted",
        // Optional consents controlled by user (ads, analytics, personalization)
        ad_storage: "granted",
        analytics_storage: "granted",
        personalization_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      }
    : {
        // Always-granted essential consent (security & functionality)
        security_storage: "granted",
        functionality_storage: "granted",
        // Optional consents controlled by user (ads, analytics, personalization)
        ad_storage: "denied",
        analytics_storage: "denied",
        personalization_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      };

  window.dataLayer.push({
    event: "gtm.consentUpdate",
    "gtm.consent": consentSettings,
  });

  logDebug("GTM consent mode updated ->", consentSettings);
}

/**
 *  Set cookie consent and update localStorage and Consent Mode
 *  hides banner and loads GTM if accepted
 *  @param {boolean} granted True if consent granted, false if rejected
 *  @returns {void}
 */
function setConsent(granted) {
  const now = new Date();
  const consentValue = granted ? "accepted" : "rejected";

  safeLocalStorageSet("cookieConsent", consentValue);
  safeLocalStorageSet("cookieConsentAt", now.toISOString());

  banner?.setAttribute("hidden", "true");

  updateConsentMode(granted);

  logDebug(`Consent set -> ${consentValue}`);
  logDebug(`ConsentAt set -> ${now.toISOString()}`);
}

/**
 * Initialize cookie consent banner logic and event listeners
 */
function initCookieConsent() {
  loadTagManager();

  //injectNoScript();

  if (!banner) return;

  const { consent, timestamp } = getStoredConsent();

  if (!consent || hasConsentExpired(timestamp)) {
    banner.removeAttribute("hidden"); // Show banner
    updateConsentMode(false); // Explicit deny by default
    logDebug("Cookie banner shown, consent denied by default.");
  } else {
    banner.setAttribute("hidden", "true"); // Hide banner
    updateConsentMode(consent === "accepted"); // Explicit update
    logDebug(`Consent already stored -> ${consent}`);
  }

  // Attach event listeners to cookie banner buttons
  // Accept button
  acceptBtn?.addEventListener("click", () => setConsent(true));

  // Close banner
  closeBtn?.addEventListener("click", () => setConsent(false));
}

// ==========================
// Initialize all on DOM ready
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  initNavbarToggler();
  initNavbarCollapse();
  initDynamicYear();
  initCookieConsent();
});
