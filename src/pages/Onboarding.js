import React, { useState, useRef } from "react";

const slides = [
  {
    icon: "🚀",
    title: "வணக்கம்!",
    text: "உங்கள் வியாபாரத்தை எளிமையாக, வேகமாக நிர்வகிக்க இங்கே தொடங்குங்கள்.",
  },
  {
    icon: "💬",
    title: "எளிய ஆர்டர்கள்",
    text: "வாடிக்கையாளர்கள் சில தொடுதல்களில் ஆர்டர் செய்யலாம். நீங்கள் எல்லாவற்றையும் ஒரே இடத்தில் பார்க்கலாம்.",
  },
  {
    icon: "📊",
    title: "நேரடி அறிக்கைகள்",
    text: "விற்பனை, ஸ்டாக், லாபம் அனைத்தையும் உடனடியாக தெரிந்துகொள்ளுங்கள்.",
  },
  {
    icon: "🔒",
    title: "பாதுகாப்பான தரவு",
    text: "உங்கள் தகவல்கள் பாதுகாப்பாக சேமிக்கப்படும். இப்போது தொடங்கலாமா?",
  },
];

export default function Onboarding({ onFinish }) {
  const [step, setStep] = useState(0);
  const touchX = useRef(null);
  const last = step === slides.length - 1;

  const next = () => (last ? onFinish && onFinish() : setStep((s) => s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const onTouchStart = (e) => (touchX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (dx < -50) next();
    if (dx > 50) prev();
    touchX.current = null;
  };

  const s = slides[step];

  return (
    <div className="ob-page" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <style>{css}</style>

      <div className="ob-orb ob-orb1" />
      <div className="ob-orb ob-orb2" />
      <div className="ob-orb ob-orb3" />

      <button className="ob-skip" onClick={() => onFinish && onFinish()}>
        தவிர்
      </button>

      <div className="ob-card" key={step}>
        <div className="ob-icon">{s.icon}</div>
        <h1>{s.title}</h1>
        <p>{s.text}</p>
      </div>

      <div className="ob-bottom">
        <div className="ob-dots">
          {slides.map((_, i) => (
            <span key={i} className={i === step ? "ob-dot active" : "ob-dot"} />
          ))}
        </div>

        <div className="ob-actions">
          {step > 0 && (
            <button className="ob-btn ob-ghost" onClick={prev}>
              பின்
            </button>
          )}
          <button className="ob-btn ob-primary" onClick={next}>
            {last ? "தொடங்கு" : "அடுத்து"}
          </button>
        </div>
      </div>
    </div>
  );
}

const css = `
.ob-page{
  position:fixed; inset:0; width:100%; height:100%;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:24px; overflow:hidden;
  background:linear-gradient(135deg,#1a1040 0%,#3b1f7a 40%,#0f6a8f 100%);
  font-family:system-ui,-apple-system,"Noto Sans Tamil","Segoe UI",sans-serif;
  color:#fff; box-sizing:border-box;
}
.ob-page *{box-sizing:border-box}

.ob-orb{position:absolute; border-radius:50%; filter:blur(60px); opacity:.75; animation:ob-float 9s ease-in-out infinite}
.ob-orb1{width:260px;height:260px;background:#ff5fa2;top:-60px;left:-70px}
.ob-orb2{width:300px;height:300px;background:#4f8cff;bottom:-90px;right:-80px;animation-delay:-3s}
.ob-orb3{width:180px;height:180px;background:#34e0c3;top:45%;left:55%;animation-delay:-6s}
@keyframes ob-float{
  0%,100%{transform:translate(0,0) scale(1)}
  50%{transform:translate(25px,-30px) scale(1.12)}
}

.ob-skip{
  position:absolute; top:max(18px,env(safe-area-inset-top)); right:20px; z-index:3;
  background:rgba(255,255,255,.12); color:#fff;
  border:1px solid rgba(255,255,255,.25); border-radius:999px;
  padding:8px 16px; font-size:14px; cursor:pointer;
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
}

.ob-card{
  position:relative; z-index:2; width:100%; max-width:380px;
  padding:40px 28px; text-align:center;
  background:rgba(255,255,255,.14);
  border:1px solid rgba(255,255,255,.3);
  border-radius:28px;
  backdrop-filter:blur(24px) saturate(160%);
  -webkit-backdrop-filter:blur(24px) saturate(160%);
  box-shadow:0 8px 32px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.4);
  animation:ob-in .45s ease both;
}
@keyframes ob-in{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}}

.ob-icon{
  width:84px;height:84px;margin:0 auto 22px;
  display:flex;align-items:center;justify-content:center;
  font-size:40px; border-radius:24px;
  background:rgba(255,255,255,.18);
  border:1px solid rgba(255,255,255,.35);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.5);
}
.ob-card h1{margin:0 0 12px;font-size:26px;font-weight:700}
.ob-card p{margin:0;font-size:16px;line-height:1.7;color:rgba(255,255,255,.88)}

.ob-bottom{
  position:relative; z-index:2; width:100%; max-width:380px;
  margin-top:28px; display:flex; flex-direction:column; align-items:center; gap:20px;
  padding-bottom:env(safe-area-inset-bottom);
}
.ob-dots{display:flex;gap:8px}
.ob-dot{width:8px;height:8px;border-radius:99px;background:rgba(255,255,255,.35);transition:all .3s}
.ob-dot.active{width:26px;background:#fff}

.ob-actions{display:flex;gap:12px;width:100%}
.ob-btn{
  flex:1; padding:15px; font-size:16px; font-weight:600;
  border-radius:16px; cursor:pointer; color:#fff;
  border:1px solid rgba(255,255,255,.35);
  backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
  transition:transform .15s, background .2s;
}
.ob-btn:active{transform:scale(.97)}
.ob-ghost{background:rgba(255,255,255,.1)}
.ob-primary{
  background:rgba(255,255,255,.28);
  box-shadow:0 4px 18px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.5);
}
`;
