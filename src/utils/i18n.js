// ============================================================
// 🌐 English ↔ தமிழ் language switch (no page needs editing)
// - Choice is saved in the browser (localStorage "vg_lang").
// - In Tamil mode a small translator watches the page and replaces known English
//   words/phrases (text, placeholders, titles) using the dictionary below.
// - Unknown text (user names, bios, admin-typed text) stays as it is.
// - To translate more: just add  "english text": "தமிழ்",  to TA below (keys are lowercase).
// ============================================================
const KEY = "vg_lang";

export function getLang() {
  try { return localStorage.getItem(KEY) === "ta" ? "ta" : "en"; } catch { return "en"; }
}

export function setLang(lang) {
  try { localStorage.setItem(KEY, lang === "ta" ? "ta" : "en"); } catch {}
  try { window.location.reload(); } catch {}
}

const TA = {
  // ---- common ----
  "loading": "ஏற்றுகிறது", "loading...": "ஏற்றுகிறது...", "loading profiles...": "சுயவிவரங்கள் ஏற்றப்படுகின்றன...",
  "loading messages...": "செய்திகள் ஏற்றப்படுகின்றன...", "loading photos...": "புகைப்படங்கள் ஏற்றப்படுகின்றன...",
  "loading profile...": "சுயவிவரம் ஏற்றப்படுகிறது...", "loading dashboard...": "டாஷ்போர்டு ஏற்றப்படுகிறது...",
  "loading settings...": "அமைப்புகள் ஏற்றப்படுகின்றன...", "loading your matches...": "உங்கள் பொருத்தங்கள் ஏற்றப்படுகின்றன...",
  "loading conversations...": "உரையாடல்கள் ஏற்றப்படுகின்றன...", "loading contact requests...": "தொடர்பு கோரிக்கைகள் ஏற்றப்படுகின்றன...",
  "loading photo requests...": "புகைப்பட கோரிக்கைகள் ஏற்றப்படுகின்றன...",
  "not provided": "வழங்கப்படவில்லை", "not set": "அமைக்கப்படவில்லை", "cancel": "ரத்து செய்", "close": "மூடு", "back": "பின்செல்",
  "continue": "தொடர்க", "save": "சேமி", "submit": "சமர்ப்பி", "search": "தேடு", "select": "தேர்ந்தெடு", "skip": "தவிர்", "dismiss": "மூடு",
  "menu": "பட்டி", "any": "எதுவும்", "min": "குறைந்தபட்சம்", "max": "அதிகபட்சம்", "clear": "அழி", "add": "சேர்", "edit": "திருத்து",
  "delete": "நீக்கு", "view": "பார்", "status": "நிலை", "plan": "திட்டம்", "note:": "குறிப்பு:", "tip:": "உதவிக்குறிப்பு:", "live": "நேரலை",
  "see all": "அனைத்தையும் பார்", "view all →": "அனைத்தையும் பார் →", "read more": "மேலும் படிக்க", "go home": "முகப்புக்குச் செல்",
  "something went wrong:": "ஏதோ தவறு நடந்தது:", "access denied": "அணுகல் மறுக்கப்பட்டது",
  "you do not have permission to view this page.": "இந்தப் பக்கத்தைப் பார்க்க உங்களுக்கு அனுமதி இல்லை.",
  "page not found": "பக்கம் கிடைக்கவில்லை",
  "the page you are looking for does not exist or has been moved.": "நீங்கள் தேடும் பக்கம் இல்லை அல்லது இடம் மாற்றப்பட்டுள்ளது.",
  // ---- navigation ----
  "home": "முகப்பு", "login": "உள்நுழை", "register": "பதிவு செய்", "register free": "இலவசமாகப் பதிவு செய்", "logout": "வெளியேறு",
  "matches": "பொருத்தங்கள்", "explore": "ஆராய்க", "account": "கணக்கு", "discover": "கண்டறி", "browse profiles": "சுயவிவரங்களைப் பார்",
  "interests": "விருப்பங்கள்", "messages": "செய்திகள்", "notifications": "அறிவிப்புகள்", "settings": "அமைப்புகள்",
  "my dashboard": "என் டாஷ்போர்டு", "dashboard": "டாஷ்போர்டு", "my profile": "என் சுயவிவரம்", "my matches": "என் பொருத்தங்கள்",
  "shortlist": "குறுக்குப்பட்டியல்", "shortlisted": "குறுக்குப்பட்டியலில்", "shortlisted profiles": "குறுக்குப்பட்டியல் சுயவிவரங்கள்",
  "interests received": "பெற்ற விருப்பங்கள்", "interests sent": "அனுப்பிய விருப்பங்கள்", "who viewed me": "என்னைப் பார்த்தவர்கள்",
  "upgrade": "மேம்படுத்து", "install": "நிறுவு", "install app": "செயலியை நிறுவு", "add to home screen": "முகப்புத் திரையில் சேர்",
  "go to login": "உள்நுழைவுக்குச் செல்", "← dashboard": "← டாஷ்போர்டு", "← back to login": "← உள்நுழைவுக்குத் திரும்பு",
  "back to discover": "கண்டறிதலுக்குத் திரும்பு",
  // ---- footer ----
  "about us": "எங்களைப் பற்றி", "contact us": "தொடர்புகொள்ள", "careers": "வேலைவாய்ப்புகள்", "blog": "வலைப்பதிவு", "help center": "உதவி மையம்",
  "legal": "சட்டம்", "terms": "விதிமுறைகள்", "terms of service": "சேவை விதிமுறைகள்", "privacy": "தனியுரிமை", "privacy policy": "தனியுரிமைக் கொள்கை",
  "cookie policy": "குக்கீ கொள்கை", "refund policy": "பணத்திருப்பக் கொள்கை", "refund": "பணத்திருப்பம்", "report abuse": "முறைகேட்டைப் புகாரளி",
  "get in touch": "தொடர்பில் இருங்கள்", "sitemap": "தளவரைபடம்",
  "india's most trusted matrimony platform for finding meaningful,": "அர்த்தமுள்ள, நிலைத்த உறவைக் கண்டறிய இந்தியாவின் நம்பகமான திருமணத் தளம்,",
  "a private, family-friendly matrimony platform for the tamil community": "தமிழ் சமூகத்திற்கான தனிப்பட்ட, குடும்பத்திற்கு ஏற்ற திருமணத் தளம்",
  // ---- home ----
  "find your perfect life partner": "உங்கள் சரியான வாழ்க்கைத் துணையைக் கண்டறியுங்கள்", "find your life partner": "உங்கள் வாழ்க்கைத் துணையைக் கண்டறியுங்கள்",
  "find your soulmate": "உங்கள் ஆத்ம துணையைக் கண்டறியுங்கள்", "trusted matrimony platform": "நம்பகமான திருமணத் தளம்",
  "looking for": "தேடுவது", "bride": "மணமகள்", "groom": "மணமகன்", "age": "வயது", "location": "இடம்", "community": "சமூகம்",
  "any location": "எந்த இடமும்", "any community": "எந்த சமூகமும்", "search profiles": "சுயவிவரங்களைத் தேடு", "view profile": "சுயவிவரம் பார்",
  "verified profiles": "சரிபார்க்கப்பட்ட சுயவிவரங்கள்", "smart matching": "புத்திசாலித்தன பொருத்தம்", "privacy first": "தனியுரிமை முதலில்",
  "all communities": "அனைத்து சமூகங்கள்", "dedicated support": "பிரத்யேக ஆதரவு", "mobile friendly": "மொபைலுக்கு ஏற்றது",
  "real people, genuine profiles for your peace of mind": "உண்மையான மனிதர்கள், மன அமைதிக்கான உண்மை சுயவிவரங்கள்",
  "match score for better compatibility": "சிறந்த பொருத்தத்திற்கான பொருத்த மதிப்பெண்",
  "you decide who sees your photo and contact": "உங்கள் புகைப்படம், தொடர்பை யார் பார்க்கலாம் என்பதை நீங்கள் தீர்மானிக்கிறீர்கள்",
  "open to all tamil communities": "அனைத்து தமிழ் சமூகங்களுக்கும் திறந்தது", "we are here to help you": "உங்களுக்கு உதவ நாங்கள் இருக்கிறோம்",
  "find your match anytime, anywhere": "எப்போது, எங்கிருந்தும் உங்கள் துணையைத் தேடுங்கள்",
  "real people…": "உண்மை மனிதர்கள்…", "real connections…": "உண்மை உறவுகள்…", "lasting relationships…": "நிலைத்த பந்தங்கள்…",
  "find your match with confidence": "நம்பிக்கையுடன் உங்கள் துணையைக் கண்டறியுங்கள்", "simple. secure. trusted.": "எளிது. பாதுகாப்பு. நம்பிக்கை.",
  "admin-checked profiles": "நிர்வாகியால் சரிபார்க்கப்பட்ட சுயவிவரங்கள்", "safe & secure": "பாதுகாப்பானது", "wide community": "பரந்த சமூகம்",
  "we are here": "நாங்கள் உங்களுடன் இருக்கிறோம்", "member": "உறுப்பினர்",
  "bringing together like-minded hearts for a better tomorrow.": "சிறந்த நாளைக்காக ஒத்த மனம் கொண்டவர்களை இணைக்கிறோம்.",
  "create your profile →": "உங்கள் சுயவிவரத்தை உருவாக்குங்கள் →", "browse profiles →": "சுயவிவரங்களைப் பாருங்கள் →",
  "⭐ featured profiles": "⭐ சிறப்பு சுயவிவரங்கள்", "featured profiles": "சிறப்பு சுயவிவரங்கள்", "success stories": "வெற்றிக் கதைகள்",
  "how it works": "இது எப்படி செயல்படுகிறது", "be the first to register!": "முதலில் பதிவு செய்யுங்கள்!",
  "browse by community": "சமூகம் வாரியாகப் பாருங்கள்", "find matches from your own community": "உங்கள் சொந்த சமூகத்தில் பொருத்தங்களைக் கண்டறியுங்கள்",
  "see how your profile is performing": "உங்கள் சுயவிவரம் எப்படி செயல்படுகிறது என்று பாருங்கள்",
  // ---- auth ----
  "email address": "மின்னஞ்சல் முகவரி", "password": "கடவுச்சொல்", "welcome back": "மீண்டும் வருக", "login to continue your journey.": "உங்கள் பயணத்தைத் தொடர உள்நுழையுங்கள்.",
  "remember me": "என்னை நினைவில் கொள்", "don't have an account?": "கணக்கு இல்லையா?", "register now": "இப்போதே பதிவு செய்", "forgot password?": "கடவுச்சொல் மறந்துவிட்டதா?",
  "resend verification email": "சரிபார்ப்பு மின்னஞ்சலை மீண்டும் அனுப்பு", "✅ email verified! please login.": "✅ மின்னஞ்சல் சரிபார்க்கப்பட்டது! உள்நுழையுங்கள்.",
  "create your account": "உங்கள் கணக்கை உருவாக்குங்கள்", "join thousands of people looking for their life partner.": "வாழ்க்கைத் துணையைத் தேடும் ஆயிரக்கணக்கானோருடன் இணையுங்கள்.",
  "full name": "முழு பெயர்", "mobile": "மொபைல்", "male": "ஆண்", "female": "பெண்", "gender": "பாலினம்", "date of birth": "பிறந்த தேதி",
  "confirm password": "கடவுச்சொல்லை உறுதிசெய்", "show passwords": "கடவுச்சொற்களைக் காட்டு", "already have an account?": "ஏற்கனவே கணக்கு உள்ளதா?",
  "your name": "உங்கள் பெயர்", "10 digit number": "10 இலக்க எண்", "min 8 chars (letter + number)": "குறைந்தது 8 எழுத்துகள் (எழுத்து + எண்)", "re-enter": "மீண்டும் உள்ளிடு",
  "registration closed": "பதிவு மூடப்பட்டுள்ளது", "new registrations are currently paused.": "புதிய பதிவுகள் தற்போது நிறுத்தப்பட்டுள்ளன.", "verify your email": "உங்கள் மின்னஞ்சலைச் சரிபார்க்கவும்",
  // ---- profile fields ----
  "education": "கல்வி", "occupation": "தொழில்", "company": "நிறுவனம்", "city": "நகரம்", "height": "உயரம்", "income": "வருமானம்", "religion": "மதம்",
  "caste": "சாதி", "sub-caste": "உட்சாதி", "sub caste": "உட்சாதி", "gothram": "கோத்திரம்", "rasi": "ராசி", "rashi": "ராசி", "nakshatra": "நட்சத்திரம்", "nakshatram": "நட்சத்திரம்",
  "dosham": "தோஷம்", "birth time": "பிறந்த நேரம்", "birth place": "பிறந்த இடம்", "horoscope": "ஜாதகம்", "work location": "பணியிடம்", "family type": "குடும்ப வகை",
  "age range": "வயது வரம்பு", "marital status": "திருமண நிலை", "college": "கல்லூரி", "father's occ.": "தந்தை தொழில்", "mother's occ.": "தாய் தொழில்",
  "brothers": "சகோதரர்கள்", "sisters": "சகோதரிகள்", "food pref.": "உணவு விருப்பம்", "food preference": "உணவு விருப்பம்", "quick info": "சுருக்கத் தகவல்",
  "about": "பற்றி", "basic details": "அடிப்படை விவரங்கள்", "mother tongue": "தாய்மொழி", "education & career": "கல்வி & தொழில்", "annual income": "ஆண்டு வருமானம்",
  "native place": "சொந்த ஊர்", "state": "மாநிலம்", "country": "நாடு", "family": "குடும்பம்", "father": "தந்தை", "mother": "தாய்", "siblings": "உடன்பிறப்புகள்",
  "family status": "குடும்ப நிலை", "about family": "குடும்பம் பற்றி", "photos": "புகைப்படங்கள்", "your photos": "உங்கள் புகைப்படங்கள்",
  "profile completeness": "சுயவிவர முழுமை", "progress": "முன்னேற்றம்", "complete your profile": "உங்கள் சுயவிவரத்தை நிறைவு செய்யுங்கள்", "profile complete!": "சுயவிவரம் முழுமை!",
  "skip for now": "இப்போது தவிர்", "profile not available": "சுயவிவரம் கிடைக்கவில்லை", "✓ verified": "✓ சரிபார்க்கப்பட்டது", "verified": "சரிபார்க்கப்பட்டது", "✓ paid": "✓ கட்டணம்",
  "★ paid": "★ கட்டண உறுப்பினர்", "👑 paid member": "👑 கட்டண உறுப்பினர்", "✏️ edit profile": "✏️ சுயவிவரத்தைத் திருத்து", "✏️ manage photos": "✏️ புகைப்படங்களை நிர்வகி",
  "📊 dashboard": "📊 டாஷ்போர்டு", "💬 message": "💬 செய்தி", "⚐ report": "⚐ புகாரளி", "📱 mobile": "📱 மொபைல்",
  "this user has restricted who can see their profile.": "இந்தப் பயனர் தங்கள் சுயவிவரத்தை யார் பார்க்கலாம் என்பதைக் கட்டுப்படுத்தியுள்ளார்.",
  "no fields configured for this section.": "இந்தப் பகுதிக்கு புலங்கள் அமைக்கப்படவில்லை.",
  // ---- privacy / locks ----
  "🔒 upgrade to view": "🔒 பார்க்க மேம்படுத்துங்கள்", "⭐ upgrade to view mobile": "⭐ மொபைல் பார்க்க மேம்படுத்துங்கள்", "🔒 upgrade to view income": "🔒 வருமானம் பார்க்க மேம்படுத்துங்கள்",
  "🚫 profile hidden": "🚫 சுயவிவரம் மறைக்கப்பட்டது", "🔒 photo is protected": "🔒 புகைப்படம் பாதுகாக்கப்பட்டுள்ளது", "🔒 private gallery": "🔒 தனிப்பட்ட தொகுப்பு",
  "only approved members can see private photos": "அனுமதி பெற்ற உறுப்பினர்கள் மட்டுமே தனிப்பட்ட புகைப்படங்களைப் பார்க்கலாம்",
  "✅ access approved — refresh": "✅ அணுகல் அனுமதிக்கப்பட்டது — புதுப்பிக்கவும்", "⏳ request pending": "⏳ கோரிக்கை நிலுவையில்", "❌ request denied": "❌ கோரிக்கை மறுக்கப்பட்டது",
  "🔒 hidden by user": "🔒 பயனரால் மறைக்கப்பட்டது", "protected": "பாதுகாக்கப்பட்டது", "premium feature": "பிரீமியம் வசதி", "user deleted": "பயனர் நீக்கப்பட்டார்",
  // ---- interests / swipe ----
  "send interest": "விருப்பம் அனுப்பு", "it's a match!": "பொருத்தம் கிடைத்தது!", "like": "விரும்பு", "super like": "சூப்பர் லைக்", "accept": "ஏற்கிறேன்", "decline": "மறுக்கிறேன்",
  "pending": "நிலுவையில்", "accepted": "ஏற்கப்பட்டது", "⏳ pending": "⏳ நிலுவையில்", "❌ denied": "❌ மறுக்கப்பட்டது", "✅ approved": "✅ அனுமதிக்கப்பட்டது",
  "💕 accepted": "💕 ஏற்கப்பட்டது", "✖️ declined": "✖️ மறுக்கப்பட்டது", "🚨 new": "🚨 புதியது", "your interests": "உங்கள் விருப்பங்கள்",
  "manage connections and shortlisted profiles": "தொடர்புகளையும் குறுக்குப்பட்டியல் சுயவிவரங்களையும் நிர்வகிக்கவும்",
  "no interests yet": "இன்னும் விருப்பங்கள் இல்லை", "when someone sends you an interest, it'll appear here.": "யாராவது உங்களுக்கு விருப்பம் அனுப்பினால் இங்கே தெரியும்.",
  "no interests sent": "விருப்பங்கள் எதுவும் அனுப்பவில்லை", "browse profiles and send interests from the search page.": "தேடல் பக்கத்தில் சுயவிவரங்களைப் பார்த்து விருப்பங்களை அனுப்புங்கள்.",
  "no shortlisted profiles": "குறுக்குப்பட்டியலில் சுயவிவரங்கள் இல்லை", "tap the heart icon on any profile to save it here.": "எந்த சுயவிவரத்திலும் இதய ஐகானைத் தட்டினால் இங்கே சேமிக்கப்படும்.",
  "no more pending interests to review.": "பரிசீலிக்க நிலுவை விருப்பங்கள் இல்லை.", "no more profiles to swipe right now.": "இப்போது ஸ்வைப் செய்ய சுயவிவரங்கள் இல்லை.",
  "no pending requests": "நிலுவை கோரிக்கைகள் இல்லை", "all caught up!": "அனைத்தும் முடிந்தது!", "tap to view · swipe to match": "பார்க்கத் தட்டுங்கள் · பொருத்த ஸ்வைப் செய்யுங்கள்",
  "you've reviewed all profiles. check back later for new matches.": "அனைத்து சுயவிவரங்களையும் பார்த்துவிட்டீர்கள். புதிய பொருத்தங்களுக்கு பின்னர் வாருங்கள்.",
  "🔥 discover": "🔥 கண்டறி", "💕 matches only": "💕 பொருத்தங்கள் மட்டும்",
  // ---- matches / search ----
  "no matches found": "பொருத்தங்கள் இல்லை", "no matches yet": "இன்னும் பொருத்தங்கள் இல்லை", "try loosening your filters.": "வடிகட்டிகளைக் குறைத்துப் பாருங்கள்.",
  "💫 recommended for you": "💫 உங்களுக்காகப் பரிந்துரை", "5 recommendations": "5 பரிந்துரைகள்", "personalized matches based on your profile": "உங்கள் சுயவிவரத்தின் அடிப்படையில் தனிப்பயன் பொருத்தங்கள்",
  "no recommendations yet": "இன்னும் பரிந்துரைகள் இல்லை", "complete your profile to get better matches.": "சிறந்த பொருத்தங்களுக்கு உங்கள் சுயவிவரத்தை நிறைவு செய்யுங்கள்.",
  "🔍 search profiles": "🔍 சுயவிவரங்களைத் தேடு", "find your perfect match": "உங்கள் சரியான துணையைக் கண்டறியுங்கள்", "⚙️ search filters": "⚙️ தேடல் வடிகட்டிகள்", "⚙️ filters": "⚙️ வடிகட்டிகள்",
  "filters": "வடிகட்டிகள்", "no filters applied": "வடிகட்டிகள் இல்லை", "✏️ edit": "✏️ திருத்து", "✏️ edit filters": "✏️ வடிகட்டிகளைத் திருத்து", "show all communities": "அனைத்து சமூகங்களையும் காட்டு",
  "🔍 advanced search": "🔍 மேம்பட்ட தேடல்", "basic filters": "அடிப்படை வடிகட்டிகள்", "age from": "வயது முதல்", "age to": "வயது வரை", "⭐ upgrade": "⭐ மேம்படுத்து", "gold": "தங்கம்", "platinum": "பிளாட்டினம்",
  "any education": "எந்த கல்வியும்", "income range": "வருமான வரம்பு", "any income": "எந்த வருமானமும்", "has horoscope details": "ஜாதக விவரங்கள் உள்ளவர்", "verified profiles only": "சரிபார்க்கப்பட்ட சுயவிவரங்கள் மட்டும்",
  "start your search": "தேடலைத் தொடங்குங்கள்", "adjust filters and click search to find matches.": "வடிகட்டிகளை மாற்றி தேடு என்பதை அழுத்தி பொருத்தங்களைக் காணுங்கள்.",
  "select community": "சமூகத்தைத் தேர்ந்தெடு", "🌐 all communities": "🌐 அனைத்து சமூகங்கள்", "🏷️ community": "🏷️ சமூகம்", "📍 location": "📍 இடம்", "🎓 education": "🎓 கல்வி", "💼 occupation": "💼 தொழில்", "💰 income": "💰 வருமானம்",
  "🔒 privacy": "🔒 தனியுரிமை", "scroll left": "இடப்புறம் உருட்டு", "scroll right": "வலப்புறம் உருட்டு", "e.g. b.tech, mba": "எ.கா. B.Tech, MBA", "e.g. 5-10 lakh": "எ.கா. 5-10 லட்சம்",
  "e.g. never married": "எ.கா. திருமணம் ஆகாதவர்", "e.g. vegetarian": "எ.கா. சைவம்", "you@example.com": "you@example.com",
  // ---- messages ----
  "💬 messages": "💬 செய்திகள்", "no messages yet": "இன்னும் செய்திகள் இல்லை", "scroll to new messages": "புதிய செய்திகளுக்கு உருட்டு", "attach": "இணை", "type a message...": "செய்தியை எழுதுங்கள்...",
  "checking connection...": "இணைப்பைச் சரிபார்க்கிறது...", "search conversations...": "உரையாடல்களைத் தேடு...", "clear search": "தேடலை அழி", "search...": "தேடு...", "no conversations yet": "இன்னும் உரையாடல்கள் இல்லை",
  "no conversations yet.": "இன்னும் உரையாடல்கள் இல்லை.", "start a chat from the matches page!": "பொருத்தங்கள் பக்கத்தில் இருந்து அரட்டையைத் தொடங்குங்கள்!",
  "select a conversation to start chatting": "அரட்டையைத் தொடங்க ஒரு உரையாடலைத் தேர்ந்தெடுக்கவும்", "or start a new chat from the matches page": "அல்லது பொருத்தங்கள் பக்கத்தில் புதிய அரட்டையைத் தொடங்குங்கள்",
  "when you accept an interest or send one, you can start chatting here.": "விருப்பத்தை ஏற்றாலோ அனுப்பினாலோ இங்கே அரட்டையைத் தொடங்கலாம்.", "🟢 online": "🟢 ஆன்லைனில்", "offline": "ஆஃப்லைன்",
  "mark all read": "அனைத்தையும் படித்ததாகக் குறி", "no notifications yet": "இன்னும் அறிவிப்புகள் இல்லை", "new matches": "புதிய பொருத்தங்கள்", "unread messages": "படிக்காத செய்திகள்",
  // ---- visitors / requests ----
  "no visitors yet": "இன்னும் பார்வையாளர்கள் இல்லை", "see who recently visited your profile.": "உங்கள் சுயவிவரத்தை சமீபத்தில் யார் பார்த்தார்கள் என்று பாருங்கள்.",
  "complete your profile and add photos to get more views!": "அதிக பார்வைகளுக்கு சுயவிவரத்தை நிறைவு செய்து புகைப்படங்களைச் சேர்க்கவும்!",
  "approve or deny requests from members who want to view your photos": "உங்கள் புகைப்படங்களைப் பார்க்க விரும்பும் உறுப்பினர்களின் கோரிக்கைகளை அனுமதி/மறு",
  "when someone requests to view your photos, they'll appear here.": "யாராவது புகைப்படம் பார்க்கக் கோரினால் இங்கே தெரியும்.",
  "when someone requests your contact details, they'll appear here.": "யாராவது தொடர்பு விவரங்களைக் கோரினால் இங்கே தெரியும்.",
  // ---- plans ----
  "⭐ choose your plan": "⭐ உங்கள் திட்டத்தைத் தேர்ந்தெடுங்கள்", "⭐ most popular": "⭐ மிகவும் பிரபலம்", "unlock premium features and find your perfect match faster": "பிரீமியம் வசதிகளைத் திறந்து உங்கள் துணையை விரைவாகக் கண்டறியுங்கள்",
  "⭐ my subscription": "⭐ என் சந்தா", "✨ your premium features": "✨ உங்கள் பிரீமியம் வசதிகள்", "unlimited profile views": "வரம்பற்ற சுயவிவரப் பார்வைகள்", "unlimited messages": "வரம்பற்ற செய்திகள்",
  "see who viewed your profile": "உங்கள் சுயவிவரத்தைப் பார்த்தவர்களைக் காணலாம்", "advanced search filters": "மேம்பட்ட தேடல் வடிகட்டிகள்", "priority customer support": "முன்னுரிமை வாடிக்கையாளர் ஆதரவு",
  "everything in gold": "தங்கத்தில் உள்ள அனைத்தும்", "verified badge": "சரிபார்ப்பு பேட்ஜ்", "profile boost weekly": "வாராந்திர சுயவிவர பூஸ்ட்", "direct contact details access": "நேரடி தொடர்பு விவர அணுகல்",
  "dedicated relationship manager": "பிரத்யேக உறவு மேலாளர்", "amount paid": "செலுத்திய தொகை", "started on": "தொடங்கிய தேதி", "expires on": "முடியும் தேதி", "days remaining": "மீதமுள்ள நாட்கள்",
  "no subscription found.": "சந்தா எதுவும் இல்லை.", "view plans": "திட்டங்களைப் பார்", "current plan": "தற்போதைய திட்டம்", "you're on the": "நீங்கள் உள்ள திட்டம்",
  "🚀 profile boost": "🚀 சுயவிவர பூஸ்ட்", "get up to 10x more profile views": "10 மடங்கு வரை அதிக சுயவிவரப் பார்வைகள்", "boost is active!": "பூஸ்ட் செயலில் உள்ளது!", "boost your profile": "உங்கள் சுயவிவரத்தை பூஸ்ட் செய்யுங்கள்",
  "top of search results": "தேடல் முடிவுகளில் முதலிடம்", "featured profile badge": "சிறப்பு சுயவிவர பேட்ஜ்", "up to 10x more views": "10 மடங்கு வரை அதிக பார்வைகள்",
  "get instant alerts on telegram": "டெலிகிராமில் உடனடி அறிவிப்புகளைப் பெறுங்கள்", "connect": "இணை",
  // ---- success stories ----
  "real couples · real love": "உண்மை ஜோடிகள் · உண்மை காதல்", "success stories ": "வெற்றிக் கதைகள்", "share your love story 💑": "உங்கள் காதல் கதையைப் பகிருங்கள் 💑", "bride's name *": "மணமகள் பெயர் *", "groom's name *": "மணமகன் பெயர் *",
  "your story *": "உங்கள் கதை *", "e.g. priya": "எ.கா. பிரியா", "e.g. karthik": "எ.கா. கார்த்திக்", "e.g. chennai, tamil nadu": "எ.கா. சென்னை, தமிழ்நாடு",
  "share your love story with us and inspire other families": "உங்கள் காதல் கதையைப் பகிர்ந்து மற்ற குடும்பங்களுக்கு ஊக்கமளியுங்கள்", "ready to write your own story?": "உங்கள் சொந்தக் கதையை எழுதத் தயாரா?", "your story could be next.": "அடுத்த கதை உங்களுடையதாக இருக்கலாம்.",
  // ---- settings ----
  "manage your account, preferences, and privacy": "உங்கள் கணக்கு, விருப்பங்கள், தனியுரிமையை நிர்வகிக்கவும்", "👤 account": "👤 கணக்கு", "🔔 notifications": "🔔 அறிவிப்புகள்", "⚠️ danger": "⚠️ ஆபத்து",
  "account information": "கணக்கு தகவல்", "your login email and password": "உங்கள் உள்நுழைவு மின்னஞ்சல் மற்றும் கடவுச்சொல்", "email cannot be changed. contact support if needed.": "மின்னஞ்சலை மாற்ற முடியாது. தேவைப்பட்டால் ஆதரவைத் தொடர்புகொள்ளவும்.",
  "change password": "கடவுச்சொல்லை மாற்று", "current password *": "தற்போதைய கடவுச்சொல் *", "new password *": "புதிய கடவுச்சொல் *", "confirm new password *": "புதிய கடவுச்சொல்லை உறுதிசெய் *",
  "email notifications": "மின்னஞ்சல் அறிவிப்புகள்", "choose which events should trigger an email": "எந்த நிகழ்வுகளுக்கு மின்னஞ்சல் வர வேண்டும் என்பதைத் தேர்ந்தெடுக்கவும்", "new interest received": "புதிய விருப்பம் பெறப்பட்டது",
  "when someone sends you an interest": "யாராவது விருப்பம் அனுப்பும்போது", "new message": "புதிய செய்தி", "when you receive a chat message": "அரட்டைச் செய்தி வரும்போது", "new match": "புதிய பொருத்தம்", "when you get a new mutual match": "புதிய பரஸ்பர பொருத்தம் கிடைக்கும்போது",
  "telegram notifications": "டெலிகிராம் அறிவிப்புகள்", "privacy settings": "தனியுரிமை அமைப்புகள்", "control who can see your profile, photos, and contact information": "உங்கள் சுயவிவரம், புகைப்படம், தொடர்புத் தகவலை யார் பார்க்கலாம் என்பதைக் கட்டுப்படுத்துங்கள்",
  "who can see my profile?": "என் சுயவிவரத்தை யார் பார்க்கலாம்?", "🌍 everyone": "🌍 அனைவரும்", "🌍 public - everyone can see": "🌍 பொது - அனைவரும் பார்க்கலாம்", "✅ verified users only": "✅ சரிபார்க்கப்பட்ட பயனர்கள் மட்டும்", "💎 paid members only": "💎 கட்டண உறுப்பினர்கள் மட்டும்",
  "control who can see your full profile.": "உங்கள் முழு சுயவிவரத்தை யார் பார்க்கலாம் என்பதைக் கட்டுப்படுத்துங்கள்.", "who can see my photos?": "என் புகைப்படங்களை யார் பார்க்கலாம்?", "who can see my contact info?": "என் தொடர்புத் தகவலை யார் பார்க்கலாம்?",
  "🔒 private - hidden": "🔒 தனிப்பட்டது - மறைக்கப்பட்டது", "hides your mobile number from other members.": "உங்கள் மொபைல் எண்ணை மற்றவர்களிடமிருந்து மறைக்கும்.", "other privacy options": "பிற தனியுரிமை விருப்பங்கள்",
  "profile visible to all": "சுயவிவரம் அனைவருக்கும் தெரியும்", "show online status": "ஆன்லைன் நிலையைக் காட்டு", "show a green dot when you're active": "நீங்கள் செயலில் இருக்கும்போது பச்சை புள்ளியைக் காட்டு",
  "📦 download my data": "📦 என் தரவைப் பதிவிறக்கு", "⚠️ danger zone": "⚠️ ஆபத்து மண்டலம்", "these actions are permanent and cannot be undone.": "இந்த செயல்கள் நிரந்தரமானவை; மீட்க முடியாது.", "delete account": "கணக்கை நீக்கு",
  "type \"delete\" to confirm": "உறுதிசெய்ய \"DELETE\" என்று தட்டச்சு செய்யுங்கள்", "your current password": "உங்கள் தற்போதைய கடவுச்சொல்", "at least 8 characters": "குறைந்தது 8 எழுத்துகள்", "re-enter password": "கடவுச்சொல்லை மீண்டும் உள்ளிடு",
  // ---- reports ----
  "reason for reporting:": "புகாருக்கான காரணம்:", "describe what happened...": "என்ன நடந்தது என்று விவரிக்கவும்...", "report submitted": "புகார் சமர்ப்பிக்கப்பட்டது", "thank you. our admin team will review this report shortly.": "நன்றி. எங்கள் நிர்வாகக் குழு விரைவில் இதை ஆய்வு செய்யும்.",
  "traditional values": "பாரம்பரிய மதிப்புகள்", "modern matching": "நவீன பொருத்தம்", "a better tomorrow": "சிறந்த நாளை", "🔒 100% secure": "🔒 100% பாதுகாப்பு", "✅ verified profiles": "✅ சரிபார்க்கப்பட்ட சுயவிவரங்கள்",
  "5x more interests": "5 மடங்கு அதிக விருப்பங்கள்", "3x more matches": "3 மடங்கு அதிக பொருத்தங்கள்", "profiles with photos & complete details get": "புகைப்படங்களும் முழு விவரங்களும் உள்ள சுயவிவரங்கள் பெறுவது",
  "tap the share button": "பகிர் பொத்தானைத் தட்டுங்கள்",
};

// Words inside sentences/labels that are translated only as a whole phrase above; below are extra
// phrase patterns with numbers/names.
const PATTERNS = [
  [/^find your special someone with (.+)\.$/i, (m) => `${m[1]} மூலம் உங்கள் சிறப்பு துணையைக் கண்டறியுங்கள்.`],
  [/^(\d+)\s+profiles?$/i, (m) => `${m[1]} சுயவிவரங்கள்`],
  [/^(\d+)\s+yrs?$/i, (m) => `${m[1]} வயது`],
  [/^(\d+)\s+years?$/i, (m) => `${m[1]} ஆண்டுகள்`],
  [/^(\d+)\s+days?$/i, (m) => `${m[1]} நாட்கள்`],
  [/^(\d+)%\s+complete$/i, (m) => `${m[1]}% முழுமை`],
  [/^(\d+)\s+new$/i, (m) => `${m[1]} புதியது`],
];

const SPLIT = /^([^A-Za-z0-9]*)([\s\S]*?)([^A-Za-z0-9.?!)'"]*)$/;

export function translate(text) {
  if (!text || typeof text !== "string") return text;
  const raw = text.trim();
  if (!raw || raw.length > 160) return text;
  const lead = text.match(/^\s*/)[0];
  const tail = text.match(/\s*$/)[0];
  const norm = raw.replace(/\s+/g, " ");
  const low = norm.toLowerCase();
  let out = TA[low];
  if (!out) {
    for (const [re, fn] of PATTERNS) {
      const m = norm.match(re);
      if (m) { out = fn(m); break; }
    }
  }
  if (!out) {
    // try again without leading/trailing symbols or emoji, then put them back
    const m = norm.match(SPLIT);
    if (m && m[2] && (m[1] || m[3])) {
      const core = TA[m[2].toLowerCase()];
      if (core) out = m[1] + core + m[3];
    }
  }
  if (!out) {
    // sentence ending with ":" or "*"
    const m2 = low.match(/^(.*?)([:*\s]+)$/);
    if (m2 && TA[m2[1]]) out = TA[m2[1]] + norm.slice(m2[1].length);
  }
  return out ? lead + out + tail : text;
}

const ATTRS = ["placeholder", "title", "aria-label", "alt"];
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "NOSCRIPT", "CODE"]);
const done = new WeakMap(); // text node -> value we wrote
const doneAttr = new WeakMap(); // element -> { attr: value we wrote }

function skip(el) {
  return !el || SKIP.has(el.tagName) || (el.closest && el.closest("[data-no-translate],[contenteditable='true']"));
}

function doText(node) {
  const el = node.parentElement;
  if (skip(el)) return;
  const v = node.nodeValue;
  if (!v || done.get(node) === v) return;
  const t = translate(v);
  if (t !== v) { done.set(node, t); node.nodeValue = t; }
}

function doAttrs(el) {
  if (!el.getAttribute || skip(el)) return;
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (!v) continue;
    const mine = doneAttr.get(el);
    if (mine && mine[a] === v) continue;
    const t = translate(v);
    if (t !== v) {
      el.setAttribute(a, t);
      const rec = mine || {};
      rec[a] = t;
      doneAttr.set(el, rec);
    }
  }
}

function walk(root) {
  if (!root) return;
  if (root.nodeType === 3) { doText(root); return; }
  if (root.nodeType !== 1 || skip(root)) return;
  doAttrs(root);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = tw.nextNode())) doText(n);
  if (root.querySelectorAll) {
    root.querySelectorAll("[placeholder],[title],[aria-label],[alt]").forEach(doAttrs);
  }
}

let started = false;
export function startTranslator() {
  if (started || typeof document === "undefined") return;
  if (getLang() !== "ta") return;
  started = true;
  try { document.documentElement.setAttribute("lang", "ta"); } catch {}
  let queue = new Set();
  let scheduled = false;
  const flush = () => {
    scheduled = false;
    const items = Array.from(queue);
    queue = new Set();
    items.forEach((n) => { try { walk(n); } catch {} });
  };
  const schedule = (n) => {
    queue.add(n);
    if (!scheduled) { scheduled = true; setTimeout(flush, 30); }
  };
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "childList") m.addedNodes.forEach((n) => schedule(n));
      else if (m.type === "characterData") schedule(m.target);
      else if (m.type === "attributes") schedule(m.target);
    }
  });
  const begin = () => {
    walk(document.body);
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  };
  if (document.body) begin();
  else document.addEventListener("DOMContentLoaded", begin);
}
