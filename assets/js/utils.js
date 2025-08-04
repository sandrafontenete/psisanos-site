/* === File: assets/js/utils.js === */

// Constants
const START_YEAR = 2025;
const MAX_CONSENT_AGE_DAYS = 30;
const GA_MEASUREMENT_ID = "G-XXXXXXX"; // Replace for your GA4 ID

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
 * Initialize Dynamic Year on Copyright
 */
function initDynamicYear() {
  if (!yearElement) return;

  const currentYear = new Date().getFullYear();
  yearElement.textContent =
    currentYear === START_YEAR
      ? `${START_YEAR}`
      : `${START_YEAR}–${currentYear}`;
}

/**
 * Load Google Analytics script only once after consent is given
 */
function loadAnalytics() {
  if (window.gtag) return; // Prevent multiple loads

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
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
    if (consent === "accepted") {
      loadAnalytics();
    }
  }

  // Event listeners
  // Accept button
  acceptBtn?.addEventListener("click", () => {
    localStorage.setItem("cookieConsent", "accepted");
    localStorage.setItem("cookieConsentAt", new Date().toISOString());
    banner.setAttribute("hidden", "true");
    loadAnalytics();
  });

  // Close banner
  closeBtn?.addEventListener("click", () => {
    localStorage.setItem("cookieConsent", "rejected");
    localStorage.setItem("cookieConsentAt", new Date().toISOString());
    banner.setAttribute("hidden", "true");
  });
}

// Initialize all on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  initNavbarCollapse();
  initDynamicYear();
  initCookieConsent();
});
