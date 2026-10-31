// utils/brand.js — ONE place for the site's brand name & contact details.
// Admin changes "Site Name" in Admin → Settings and every page that uses
// useBrand() updates automatically (no code change needed).
import { useState, useEffect } from "react";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const DEFAULTS = {
  site_name: "Vivaha Matrimony",
  site_short_name: "",
  contact_email: "support@vivahamatrimony.com",
  contact_phone: "",
  contact_address: "Chennai, Tamil Nadu, India",
  grievance_officer: "",
};

let cache = null;
let inflight = null;
const listeners = new Set();

function derive(s) {
  const name = (s.site_name || DEFAULTS.site_name).trim();
  const short =
    (s.site_short_name || "").trim() || name.replace(/\s*matrimony\s*$/i, "").trim() || name;
  return {
    name,
    short,
    email: s.contact_email || DEFAULTS.contact_email,
    phone: s.contact_phone || "",
    address: s.contact_address || DEFAULTS.contact_address,
    grievanceOfficer: s.grievance_officer || "",
  };
}

let current = derive(DEFAULTS);

function load() {
  if (cache || inflight) return;
  inflight = fetch(`${BACKEND_URL}/settings`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d && d.settings) {
        cache = d.settings;
        current = derive({ ...DEFAULTS, ...cache });
        listeners.forEach((fn) => fn(current));
      }
    })
    .catch(() => {})
    .finally(() => { inflight = null; });
}

export function useBrand() {
  const [brand, setBrand] = useState(current);
  useEffect(() => {
    listeners.add(setBrand);
    setBrand(current);
    load();
    return () => listeners.delete(setBrand);
  }, []);
  return brand;
}
