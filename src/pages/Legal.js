import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useBrand } from "../utils/brand";

const UPDATED = "1 November 2026";

function buildDocs(b) {
  const contact = `${b.email}${b.phone ? ` · ${b.phone}` : ""}`;
  return {
    terms: {
      title: "Terms of Service",
      ta: "சுருக்கம்: இந்த சேவையை பயன்படுத்த நீங்கள் திருமண வயதை அடைந்த, உண்மையான தகவல்களை தரும் நபராக இருக்க வேண்டும். போலி profile, தொந்தரவு, மோசடி தடை. பொருத்தம் அல்லது திருமணத்துக்கு நாங்கள் உத்தரவாதம் தருவதில்லை; சந்திக்கும் முன் நீங்களே சரிபார்த்துக் கொள்ளுங்கள்.",
      sections: [
        ["1. About these Terms", `These Terms govern your use of ${b.name} (the "Service"), a private online matrimonial platform. By creating an account or using the Service you agree to these Terms and to our Privacy Policy and Refund Policy. If you do not agree, please do not use the Service.`],
        ["2. Who we are", `${b.name} is an independent private service. We are not affiliated with, endorsed by, or an official service of any community, caste association, religious body or organisation, even where a community name appears on the site to help members find suitable matches.`],
        ["3. Eligibility", "You must be legally eligible to marry under the laws of India (at least 18 years for women and 21 years for men), be unmarried / legally free to marry (or clearly state your marital status), and register for yourself or on behalf of a family member with that person's knowledge and consent. We may refuse or remove any account at our discretion."],
        ["4. Your account", "Keep your password confidential. You are responsible for all activity under your account. Provide accurate, current and complete information. Do not create more than one profile for the same person, and do not impersonate anyone."],
        ["5. Acceptable use", "You must not: post false, misleading or someone else's information or photos; harass, threaten or abuse other members; ask for money, gifts or financial help; use the Service for commercial solicitation, escort or any unlawful purpose; scrape or copy data; try to bypass privacy or plan restrictions; upload malware or attempt to break the Service. We may suspend or delete accounts that violate these rules, without refund where the violation is serious."],
        ["6. Privacy controls and member contact", "Members can control who sees their photos and contact details (for example private, matches only, or on request). Photos and contact details of paid members may be limited by plan. Never share another member's details without their permission."],
        ["7. Safety and verification", "We offer tools such as report, block and optional verification badges, but we do not conduct background, criminal, financial or horoscope verification of members. We cannot guarantee the identity, intentions or claims of any member. Please verify details independently, involve your family, meet in public places, and never transfer money to someone you met online. Report suspicious profiles using the Report option."],
        ["8. Paid plans, boosts and payments", "Some features need a paid plan or a boost. Prices, duration and features are shown before payment. Payments are processed by Cashfree Payments; we do not store your card or UPI credentials. Plans activate after we receive confirmation of payment. Refunds are governed by the Refund Policy."],
        ["9. No guarantee of results", "We provide a platform to meet prospective matches. We do not guarantee that you will find a match, receive responses or get married, and we are not a party to any arrangement between members."],
        ["10. Your content", "You keep ownership of the information and photos you upload, but you give us a non-exclusive, worldwide, royalty-free licence to host, display and use them to run the Service (for example, showing your profile to other members according to your privacy settings). You confirm you have the right to upload them. Success stories are published only with consent."],
        ["11. Suspension and termination", "You may delete your account at any time from Settings. We may suspend or terminate accounts that breach these Terms, are reported for misuse, or are inactive for a long period. Some records may be retained as required by law or to resolve disputes."],
        ["12. Disclaimer and limitation of liability", "The Service is provided \"as is\". To the maximum extent permitted by law, we are not liable for any loss arising from your dealings with other members, information supplied by members, interruptions of the Service, or indirect or consequential loss. Our total liability for any claim is limited to the amount you paid us in the 6 months before the claim."],
        ["13. Changes to the Service and Terms", "We may update features, plans or these Terms. Significant changes will be notified on the site or by email / in-app message. Continued use after the change means you accept it."],
        ["14. Governing law", "These Terms are governed by the laws of India. Courts at Chennai, Tamil Nadu, will have jurisdiction, subject to any consumer rights you have under law."],
        ["15. Contact and grievances", `Questions or complaints: ${contact}. ${b.grievanceOfficer ? `Grievance Officer: ${b.grievanceOfficer}.` : "Grievance Officer details will be published here."} We aim to acknowledge complaints within 48 hours and resolve them within 15 days.`],
      ],
    },
    privacy: {
      title: "Privacy Policy",
      ta: "சுருக்கம்: உங்கள் தகவல்களை (பெயர், புகைப்படம், சமூகம், ஜாதகம், தொடர்பு எண் போன்றவை) திருமணப் பொருத்தம் வழங்க மட்டுமே பயன்படுத்துகிறோம். விற்பனை செய்வதில்லை. புகைப்படம்/தொடர்பு யார் பார்க்கலாம் என்பதை நீங்கள் கட்டுப்படுத்தலாம். உங்கள் தகவலை பதிவிறக்கவோ நீக்கவோ Settings-ல் வசதி உண்டு.",
      sections: [
        ["1. Who we are", `${b.name} ("we", "us") operates this matrimonial platform. This policy explains what personal data we collect, why, and the choices you have, in line with the Digital Personal Data Protection Act, 2023 and other applicable Indian law.`],
        ["2. Data we collect", "Account data: name, email, mobile number, password (stored securely by our authentication provider, never in plain text), gender, date of birth. Profile data you choose to give: community / caste, religion, mother tongue, education, occupation, income, family details, horoscope details (rasi, nakshatra, gothram), height, location, bio, partner preferences and photos. Activity data: interests, shortlists, messages, requests for photos or contact details, profile views, reports and blocks. Payment data: order and subscription records (amounts, plan, payment reference). Card / UPI details are handled by Cashfree and are not stored by us. Technical data: device and browser information, IP address and logs for security. If you link Telegram: your Telegram chat ID."],
        ["3. Sensitive information", "Details such as community / caste, religion and horoscope are sensitive and are collected only because they are central to matrimonial matching. You can leave optional fields blank. We process them only to provide the Service and with your consent given at registration."],
        ["4. How we use your data", "To create and show your profile, suggest and search matches, enable interests and chat, enforce your privacy settings, process payments and activate plans, send service notifications (in-app and, if you link it, Telegram), prevent fraud, abuse and fake profiles, provide support, and meet legal obligations. We do not sell your personal data."],
        ["5. Who can see your data", "Other members can see your profile according to your settings: photos and contact details can be set to private, matches-only or on-request, and some details may be hidden by plan rules. Your mobile number and email are not shown to members unless your privacy settings and plan rules allow. Admins can access data when needed to run and protect the Service."],
        ["6. Service providers we use", "We share data only as needed with: Supabase (database, authentication and file storage), Cashfree Payments (payments), Telegram (optional notifications, only if you link it), Cloudflare Turnstile (bot protection at signup), and our hosting providers (Render and Vercel). They process data on our behalf under their own security and privacy commitments. We may disclose data if required by law or to protect rights and safety."],
        ["7. Cookies and local storage", "We use browser storage (such as local storage and session tokens) to keep you signed in, remember settings and make the site faster, and a service worker to cache static files for the app experience. We do not use advertising cookies. Cloudflare Turnstile may set technical cookies to detect bots."],
        ["8. How long we keep data", "We keep your data while your account is active. When you delete your account, your profile, photos, messages and related records are removed, except limited records we must retain for legal, tax, fraud-prevention or dispute purposes (such as payment records). Backups are overwritten on a regular cycle."],
        ["9. Security", "We use encrypted connections (HTTPS), access controls, row-level security in the database, rate limiting and bot protection. No system is completely secure, so please use a strong, unique password and never share your OTPs or password."],
        ["10. Your rights", `You may: access and download your data (Settings → Download my data), correct your profile, withdraw consent and delete your account (Settings → Delete account), nominate a person to exercise rights on your behalf, and complain to us. To exercise any right, use Settings or write to ${contact}. If you are not satisfied you may approach the Data Protection Board of India once it is operational.`],
        ["11. Children", "The Service is only for adults who are legally eligible to marry. We do not knowingly collect data of anyone below that age; such accounts will be removed."],
        ["12. Changes", `We may update this policy. The date at the top shows the latest version. For major changes we will notify you in the app or by email.`],
        ["13. Contact and grievance officer", `${contact}. ${b.grievanceOfficer ? `Grievance Officer: ${b.grievanceOfficer}.` : "Grievance Officer details will be published here."}`],
      ],
    },
    refund: {
      title: "Refund & Cancellation Policy",
      ta: "சுருக்கம்: பிரீமியம் plan மற்றும் Boost டிஜிட்டல் சேவைகள்; செயல்படுத்தப்பட்ட பிறகு பொதுவாக refund இல்லை. இரட்டை பணம் எடுக்கப்பட்டாலோ, பணம் எடுத்தும் plan செயல்படாவிட்டாலோ 7 வேலை நாட்களில் சரி செய்வோம்.",
      sections: [
        ["1. Nature of our services", "Premium plans and profile boosts are digital services that start working as soon as payment is confirmed. For this reason, amounts paid are generally non-refundable once the plan or boost has been activated."],
        ["2. When we will refund or fix", "We will refund (or activate the service you paid for, at your choice) in these cases: (a) you were charged more than once for the same order; (b) money was debited but the plan or boost was not activated and we cannot activate it within 48 hours; (c) a technical error on our side prevented you from using the paid service for a significant period."],
        ["3. When refunds are not given", "Change of mind, not finding a suitable match, not receiving responses from members, account suspension or removal for breaking the Terms of Service, or unused time remaining on a plan or boost."],
        ["4. How to request", `Write to ${contact} within 7 days of the payment with your registered email, the payment / order ID and a short description. Please do not raise a bank chargeback before contacting us; we will try to resolve it first.`],
        ["5. Timeline", "We acknowledge requests within 48 hours. Approved refunds are sent to the original payment method within 7 working days; your bank or payment provider may take additional time to show the credit."],
        ["6. Cancellation", "Plans do not renew automatically. A plan simply ends on its expiry date and you can choose whether to buy again. You can delete your account at any time, but this does not entitle you to a refund for the remaining plan period."],
        ["7. Contact", contact],
      ],
    },
  };
}

function Legal({ doc }) {
  const brand = useBrand();
  const { pathname } = useLocation();
  const docs = buildDocs(brand);
  const d = docs[doc] || docs.terms;

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  const link = { color: "var(--vg-accent)", fontWeight: 700, textDecoration: "none" };

  return (
    <div style={{ padding: "20px 14px 50px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 22, padding: "26px 20px", boxSizing: "border-box", color: "var(--vg-text)" }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, marginBottom: 10 }}>
          <Link to="/terms" style={link}>Terms</Link>
          <Link to="/privacy" style={link}>Privacy</Link>
          <Link to="/refund" style={link}>Refund</Link>
        </div>
        <h1 style={{ margin: "4px 0", color: "var(--vg-accent)", fontSize: 26 }}>{d.title}</h1>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 14 }}>{brand.name} · Last updated: {UPDATED}</div>

        <div style={{ background: "var(--vg-accent-soft)", borderRadius: 14, padding: "12px 14px", fontSize: 14, lineHeight: 1.7, marginBottom: 18 }}>
          {d.ta}
        </div>

        {d.sections.map(([h, t]) => (
          <div key={h} style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, margin: "0 0 4px" }}>{h}</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, opacity: 0.92 }}>{t}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Legal;
