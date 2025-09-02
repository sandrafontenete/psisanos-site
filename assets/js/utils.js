/* === File: assets/js/utils.js === */

// ==========================
// Constants
// ==========================
const DEBUG = false; // Set to false to disable debug logs
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
 * Initialize Cookie Consent Banner logic
 * with Google Tag Manager Consent Mode v2 integration.
 * Defaults to denied consent until user makes a choice.
 * Uses localStorage to persist consent state.
 */
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: "default_consent",
  "gtm.consent": {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_personalization: "denied",
    ad_user_data: "denied",
  },
});
logDebug("Default GTM consent set to denied.");

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
 * Update Consent Mode via dataLayer for GTM
 * @param {boolean} granted True to grant consent, false to deny
 */
function updateConsentMode(granted) {
  const consentSettings = granted
    ? {
        ad_storage: "granted",
        analytics_storage: "granted",
        ad_personalization: "granted",
        ad_user_data: "granted",
      }
    : {
        ad_storage: "denied",
        analytics_storage: "denied",
        ad_personalization: "denied",
        ad_user_data: "denied",
      };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "gtm.consentUpdate",
    "gtm.consent": consentSettings,
  });

  logDebug("GTM consent mode updated ->", consentSettings);
}

/**
 * Load Google Tag Manager script dynamically with Consent Mode v2
 * Ensures script is only loaded once.
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

  // Create the dataLayer array if not present
  window.dataLayer = window.dataLayer || [];

  // Push the GTM start event as in official snippet
  window.dataLayer.push({
    "gtm.start": new Date().getTime(),
    event: "gtm.js",
  });

  // Create GTM script element
  const script = document.createElement("script");
  script.id = "gtm-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);

  logDebug("GTM script loaded dynamically.");
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
  // Load GTM if consent granted
  if (granted) loadTagManager();
  logDebug(`Consent set -> ${consentValue}`);
  logDebug(`ConsentAt set -> ${now.toISOString()}`);
}

/**
 * Initialize cookie consent banner logic and event listeners
 */
function initCookieConsent() {
  if (!banner) return;

  const { consent, timestamp } = getStoredConsent();

  if (!consent || hasConsentExpired(timestamp)) {
    banner.removeAttribute("hidden"); // Show banner
    updateConsentMode(false); // Deny consent by default
    logDebug("Cookie banner shown, consent denied by default.");
  } else {
    banner.setAttribute("hidden", "true"); // Hide banner
    // Set consent mode accordingly
    updateConsentMode(consent === "accepted");
    // Load GTM if consent was accepted
    if (consent === "accepted") {
      loadTagManager();
      logDebug(`Consent already stored -> ${consent}`);
    }
  }

  // Event listeners
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
