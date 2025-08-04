/* === File: assets/js/utils.js === */

// Constants
const START_YEAR = 2025;
const MAX_CONSENT_AGE_DAYS = 60;
const GTM_ID = "GTM-KWWXZQC6"; // Replace with your GTM container ID

// Cache DOM elements
// Navbar elements
const navLinks = document.querySelectorAll(".navbar-collapse .nav-link");
const navbarCollapse = document.querySelector(".navbar-collapse");
// Year element
const yearElement = document.getElementById("yearCopyright");
// Cookie banner elements
const banner = document.getElementById("cookie-banner");
const acceptBtn = document.getElementById("accept-cookies");
const closeBtn = document.getElementById("close-banner");

/**
 * Initialize Navbar Collapse on Link Click,
 * except when clicking the "Services" dropdown toggle.
 */
function initNavbarCollapse() {
  if (!navbarCollapse || !navLinks.length) return;

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
      }
    });
  });
}

/**
 * Initialize Dynamic Year in Copyright
 */
function initDynamicYear() {
  if (!yearElement) return;

  const currentYear = new Date().getFullYear();
  yearElement.textContent =
    currentYear === START_YEAR
      ? `${START_YEAR}`
      : `${START_YEAR}–${currentYear}`;
}

// ===== Consent Mode default: SEMPRE definir antes do GTM (recomendado) =====
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: "default_consent",
  "gtm.consent": {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  },
});

/**
 * Load Google Tag Manager script dynamically with Consent Mode v2
 * Ensures script is only loaded once.
 */
function loadTagManager() {
  // Avoid loading twice
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
}

/**
 * Get stored cookie consent and timestamp from localStorage
 * @returns {{ consent: 'accepted' | 'rejected' | null, timestamp: string | null }}
 */
function getStoredConsent() {
  const consent = localStorage.getItem("cookieConsent");
  const timestamp = localStorage.getItem("cookieConsentAt");
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
 * Initialize cookie consent banner logic and event listeners
 */
function initCookieConsent() {
  if (!banner) return;

  const { consent, timestamp } = getStoredConsent();

  if (!consent || hasConsentExpired(timestamp)) {
    banner.removeAttribute("hidden"); // Show banner
  } else {
    banner.setAttribute("hidden", "true"); // Hide banner
    // Set consent mode accordingly
    updateConsentMode(consent === "accepted");
    // Load GTM if consent was accepted
    if (consent === "accepted") {
      loadTagManager();
    }
  }

  // Event listeners
  // Accept button
  acceptBtn?.addEventListener("click", () => {
    localStorage.setItem("cookieConsent", "accepted");
    localStorage.setItem("cookieConsentAt", new Date().toISOString());
    banner.setAttribute("hidden", "true");

    // Grant consent and load GTM
    updateConsentMode(true);
    loadTagManager();
  });

  // Close banner
  closeBtn?.addEventListener("click", () => {
    localStorage.setItem("cookieConsent", "rejected");
    localStorage.setItem("cookieConsentAt", new Date().toISOString());
    banner.setAttribute("hidden", "true");

    // Deny all consent explicitly
    updateConsentMode(false);
  });
}

// Initialize all on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  initNavbarCollapse();
  initDynamicYear();
  initCookieConsent();
});
