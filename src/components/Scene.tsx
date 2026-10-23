import { useId, useState } from 'react';
import { usePreferences } from '../context/Preferences';

export function WindowMark({ small = false }: { small?: boolean }) {
  return <span className={`window-mark ${small ? 'small' : ''}`} aria-hidden="true"><span /></span>;
}

export function Mascot() {
  return <svg viewBox="0 0 170 195" className="mascot-art" aria-hidden="true">
    <path d="M39 83Q25 30 61 17Q105-4 132 31Q147 55 135 101Z" fill="#51443f" />
    <path d="M70 99h28v29H70z" fill="#edc3a4" />
    <path d="M42 126Q40 110 63 107h43q22 2 24 22l7 57H34Z" fill="#7895a2" />
    <path d="M107 110q18 4 19 24l7 52h-21Z" fill="#637f8e" />
    <ellipse cx="85" cy="65" rx="45" ry="46" fill="#f5d8bc" />
    <ellipse cx="41" cy="70" rx="7" ry="12" fill="#f0cbae" />
    <ellipse cx="129" cy="70" rx="7" ry="12" fill="#f0cbae" />
    <path d="M38 49Q35 11 80 12q45-2 52 37l-8 8-11-23q-23 17-53 18l-8 18-8-17Z" fill="#51443f" />
    <path d="M53 27q32-17 58 1" fill="none" stroke="#68564b" strokeWidth="4" strokeLinecap="round" />
    <g className="mascot-eyes" fill="#51443f"><ellipse cx="67" cy="70" rx="2.8" ry="4.3" /><ellipse cx="103" cy="70" rx="2.8" ry="4.3" /></g>
    <g fill="#e8aa96" opacity=".65"><ellipse cx="53" cy="82" rx="10" ry="4.5" /><ellipse cx="117" cy="82" rx="10" ry="4.5" /></g>
    <path d="M78 84q7 7 14 0" stroke="#a27762" fill="none" strokeWidth="2" strokeLinecap="round" />
    <g className="mascot-headphones"><path d="M33 66V47Q32 4 84 5q52 0 53 43v18" fill="none" stroke="#354f63" strokeWidth="7" /><rect x="28" y="52" width="16" height="36" rx="8" fill="#cc9868" stroke="#354f63" strokeWidth="4" /><rect x="126" y="52" width="16" height="36" rx="8" fill="#cc9868" stroke="#354f63" strokeWidth="4" /></g>
    <path d="M57 109q26 12 55 0l-4 16q-26 9-47-2Z" fill="#d5ab7c" /><path d="m94 117 12 3-4 38-16-3Z" fill="#d5ab7c" />
    <path d="m41 128-21 29 17 13 28-26" fill="#7895a2" /><path d="m128 126 21 30-18 14-25-25" fill="#7895a2" />
    <path d="m47 161 37-5 39 6v26l-39-5-37 5Z" fill="#e7dbc2" stroke="#b69c79" strokeWidth="3" strokeLinejoin="round" /><path d="M84 158v25" fill="none" stroke="#b69c79" strokeWidth="2" />
    <path d="m56 167 18-2m-18 8 18-2m20-6 18 3m-18 3 18 3" stroke="#c6b99e" strokeWidth="1.3" strokeLinecap="round" />
    <ellipse cx="43" cy="163" rx="11" ry="8" fill="#f5d8bc" /><ellipse cx="128" cy="164" rx="11" ry="8" fill="#f5d8bc" />
  </svg>;
}

export function StudyScene() {
  const { mascot } = usePreferences();
  const [quote, setQuote] = useState(0);
  const id = useId().replace(/:/g, '');
  const quotes = ['慢慢来，这里不赶时间。', '给今天留一点空白。', '抬头看看窗外，也很好。', '很高兴，在这里遇见你。'];
  return <div className="study-scene" aria-label="窗边书房插画">
    <svg viewBox="0 0 420 370" className="study-background" role="img" aria-label="暮色窗景、暖灯和一只安静的小猫">
      <defs><clipPath id={`${id}-window`}><path d="M65 261V148a137 137 0 0 1 274 0v113Z" /></clipPath><radialGradient id={`${id}-glow`}><stop offset="0" stopColor="#e6c58f" stopOpacity=".3" /><stop offset="1" stopColor="#e6c58f" stopOpacity="0" /></radialGradient></defs>
      <path d="M57 271V148a145 145 0 0 1 290 0v123Z" fill="var(--art-frame)" />
      <g clipPath={`url(#${id}-window)`}><path d="M65 4h274v257H65z" fill="var(--art-sky)" /><circle cx="284" cy="77" r="22" fill="#f1d9a6" /><path d="M45 238q93-88 169-30t153 10v60H45Z" fill="var(--art-hill-far)" /><path d="M110 272q101-105 243-39v65H110Z" fill="var(--art-hill)" /><g fill="#f4e9d3" opacity=".8"><circle cx="118" cy="101" r="2" /><circle cx="169" cy="56" r="1.5" /><circle cx="300" cy="135" r="1.5" /><path d="m135 72 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" /></g></g>
      <path d="M202 10v250M65 155h274" stroke="var(--art-frame)" strokeWidth="7" /><path d="M53 270h298" stroke="var(--art-shadow)" strokeWidth="9" strokeLinecap="round" />
      <ellipse cx="81" cy="254" rx="64" ry="60" fill={`url(#${id}-glow)`} /><path d="m69 226 7 79" stroke="#aa896a" strokeWidth="9" /><path d="M42 230q1-39 39-39 29 1 34 31Z" fill="#d6b388" /><path d="M52 305h48" stroke="#aa896a" strokeWidth="6" strokeLinecap="round" />
      <path d="m112 280 5 27h26l4-27Z" fill="#a2947d" /><path d="M129 281v-42" stroke="#83917b" strokeWidth="3" /><path d="M129 269q-29-2-22-24 24-1 22 24" fill="#9caa8d" /><path d="M130 254q-4-28 18-30 11 21-18 30" fill="#829584" />
      <g className="study-cat"><path d="M302 282q-7-23 12-23l1-12 14 12h12l11-11 4 20q14 26-5 38h-43q-17-9-6-24Z" fill="#d4ae7b" /><path d="M347 297q32 1 23-17" fill="none" stroke="#d4ae7b" strokeWidth="9" strokeLinecap="round" /><path d="m312 280 6 1m19 0 6-1" stroke="#785c46" strokeWidth="2.5" strokeLinecap="round" /><path d="m325 286 3 3 3-3" fill="#b88d63" /></g>
      <rect x="27" y="307" width="365" height="12" rx="6" fill="#b78e70" /><path d="M49 319v27m321-27v27" stroke="#a17e63" strokeWidth="9" />
    </svg>
    {mascot && <><button className="mascot-button" type="button" onClick={() => setQuote(value => (value + 1) % quotes.length)} aria-label="和小安打个招呼"><Mascot /></button><div className="mascot-bubble" aria-live="polite">{quotes[quote]}</div></>}
    <span className="scene-caption">A LITTLE CORNER OF MY WORLD</span>
  </div>;
}

export function Cover({ kind, className = '' }: { kind: string; className?: string }) {
  const id = useId().replace(/:/g, '');
  if (kind === 'code') return <div className={`post-cover cover-code ${className}`} aria-hidden="true"><span className="cover-code-dots"><i /><i /><i /></span><span className="code-bracket">&lt; / &gt;</span><span className="cover-caption">a little more thoughtful.</span></div>;
  if (kind === 'music') return <div className={`post-cover cover-music ${className}`} aria-hidden="true"><div className="cover-record"><span>安</span></div><span className="cover-caption">for a quiet moment.</span></div>;
  if (kind === 'window') return <div className={`post-cover cover-window ${className}`} aria-hidden="true"><WindowMark /><span className="cover-caption">less, but a little better.</span></div>;
  const autumn = kind === 'autumn';
  return <div className={`post-cover ${className}`} aria-hidden="true"><svg viewBox="0 0 500 300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id={`${id}-sky`} x2="1" y2="1"><stop stopColor={autumn ? '#b7bda8' : '#829eae'} /><stop offset="1" stopColor={autumn ? '#e8d1af' : '#d3d1bc'} /></linearGradient></defs><path fill={`url(#${id}-sky)`} d="M0 0h500v300H0z" /><circle cx="375" cy="78" r="25" fill="#f0ddb5" /><path d="M-50 223Q110 80 273 190t280-12v140H-50Z" fill={autumn ? '#afab85' : '#8fa297'} /><path d="M-50 274Q130 120 307 233t248-8v100H-50Z" fill={autumn ? '#969671' : '#718e84'} /><path d="M-10 336Q235 162 533 266v100H-10Z" fill={autumn ? '#707e64' : '#4f7272'} /><path d="M333 185q15-8 30 0m35-30q12-8 25 0" stroke="#5c787a" fill="none" strokeWidth="1.5" />{autumn && <g stroke="#6c7157" strokeWidth="3" fill="#b4a269"><path d="M70 300V146m0 89-21-23m21-3 23-30" /><ellipse cx="62" cy="163" rx="35" ry="53" /></g>}</svg><span className="landscape-caption">{autumn ? '风有来信' : '山水有相逢'}</span></div>;
}
