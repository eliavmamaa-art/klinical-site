// Builds the specialty landing pages, the "moving to us" page, and sitemap.xml.
//
//   node generator/build-pages.mjs
//
// Plain Node, no dependencies, run by hand. Output is committed like any other
// file because GitHub Pages serves the repo as-is. index.html, privacy.html,
// terms.html and robots.txt are never touched.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE, FEATURES, COMMON_FAQ, SPECIALTIES, WHATSAPP_OPENINGS, ANALYTICS } from "./pages-data.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// House rule: plain hyphens only. Anything else is a bug in the data file.
function assertNoEmDash(where, text) {
  const bad = text.match(/[—–]/);
  if (bad) {
    throw new Error(`em-dash or en-dash found in ${where}. Use a plain hyphen.`);
  }
}

// Cookieless pageview + event tracking. Emitted only once a real website id
// is configured, so a half-set-up site does not ship a script that 400s.
function analyticsTag() {
  const id = ANALYTICS.umamiWebsiteId;
  if (!id || id === "PASTE-UMAMI-WEBSITE-ID") return "";
  return `\n  <script defer src="${ANALYTICS.umamiScript}" data-website-id="${id}"></script>`;
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cta(campaign, label = "מתחילים 3 חודשים חינם") {
  const href = `${SITE.app}/signup?utm_source=site&utm_medium=specialty_page&utm_campaign=${campaign}`;
  return `<a class="btn" href="${href}">${label}<span class="btn-sub">ללא כרטיס אשראי</span></a>`;
}

// The soft option next to the signup button. The pre-filled opening line is
// what tells us which page the conversation started from, so this is the only
// place a WhatsApp link is built: pass the page slug and nothing else.
function whatsapp(slug, lead = "יש שאלות נוספות?", label = "תמיד אפשר לפנות אלינו בוואטסאפ ונענה בהקדם") {
  const text = WHATSAPP_OPENINGS[slug];
  if (!text) throw new Error(`no WhatsApp opening line for "${slug}". Add one in pages-data.mjs.`);
  const href = `https://wa.me/${SITE.phoneIntl}?text=${encodeURIComponent(text)}`;
  return `<p class="wa-line">${lead} <a class="wa-alt" href="${href}" target="_blank" rel="noopener" data-umami-event="whatsapp" data-umami-event-page="${slug}">${label}<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.9-1.3A10 10 0 1 0 12 2zm5.8 13.8c-.2.7-1.4 1.3-2 1.4-.5 0-1.2.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3s.8-2.2 1-2.5c.2-.3.6-.4.8-.4h.6c.2 0 .4 0 .7.5.2.6.8 2 .9 2.2.1.1.1.3 0 .5l-.3.5-.5.5c-.2.2-.3.4-.1.6.2.4.9 1.4 1.8 2.2 1.3 1.1 2.3 1.4 2.6 1.6.3.1.4.1.6-.1l.9-1c.2-.3.4-.2.7-.1.3.1 1.7.8 2 1 .3.1.4.2.5.3.1.3 0 .7-.2 1.3z"/></svg></a></p>`;
}

// The shared look, lifted from privacy.html/terms.html (the established
// second-page pattern) plus the few extra rules these pages need.
const STYLE = `
    :root{--cream:#FAF7F2;--ink:#1E2A2C;--muted:#5C6B6C;--teal:#12756B;--teal-dark:#0C554E;--teal-soft:#E7F1EF;--accent:#D98C4A;--line:#E8E2D8;--card:#FFFFFF}
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Heebo',system-ui,sans-serif;background:var(--cream);color:var(--ink);line-height:1.75}
    .top{background:#fff;border-bottom:1px solid var(--line)}
    .wrap{max-width:820px;margin:0 auto;padding:0 24px}
    .top .wrap{display:flex;align-items:center;justify-content:space-between;padding:16px 0}
    .brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit}
    .mark{width:36px;height:36px;border-radius:10px;background:var(--teal);overflow:hidden}
    .mark img{width:100%;height:100%;object-fit:cover;display:block}
    .brand b{font-size:21px;font-weight:800}
    .back{text-decoration:none;color:var(--teal);font-weight:600;font-size:15px}
    main{padding:48px 0 70px}
    h1{font-size:38px;font-weight:800;letter-spacing:-1px;margin-bottom:14px;line-height:1.25}
    .lead{color:var(--muted);font-size:19px;margin-bottom:26px}
    h2{font-size:24px;font-weight:700;margin:38px 0 14px}
    p,li{color:#2c3a3c;font-size:16px;margin-bottom:12px}
    ul{padding-right:22px}
    a{color:var(--teal)}
    .cards{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin:8px 0 4px}
    .card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 20px}
    .card h3{font-size:17px;font-weight:700;margin-bottom:6px}
    .card p{font-size:15px;color:var(--muted);margin:0}
    .btn{display:inline-block;background:var(--teal);color:#fff;text-decoration:none;padding:14px 30px;border-radius:10px;font-weight:700;font-size:17px;text-align:center}
    .btn:hover{background:var(--teal-dark)}
    .btn-sub{display:block;font-weight:400;font-size:13px;opacity:.85;margin-top:2px}
    .cta-box{background:var(--teal-soft);border:1px solid var(--line);border-radius:14px;padding:28px 24px;text-align:center;margin:40px 0 8px}
    .cta-box p{margin-bottom:18px}
    .cta-box .wa-line{margin:16px 0 0;color:var(--muted);font-size:15px}
    .wa-alt{display:inline-flex;align-items:center;gap:7px;color:var(--muted);font-weight:500;text-decoration:none;border-bottom:1px solid var(--line);padding-bottom:2px}
    .wa-alt svg{width:17px;height:17px;color:#25D366;flex:none}
    .wa-alt:hover{color:var(--teal);border-bottom-color:var(--teal)}
    details{border-bottom:1px solid var(--line);padding:14px 0}
    summary{cursor:pointer;font-weight:600;font-size:17px}
    details p{margin:10px 0 0;color:var(--muted)}
    .siblings{margin-top:34px;padding-top:20px;border-top:1px solid var(--line)}
    .siblings h2{font-size:18px;margin:0 0 10px}
    .siblings a{display:inline-block;margin:0 0 8px 14px;font-size:15px}
    .foot{border-top:1px solid var(--line);padding:22px 0;text-align:center;color:var(--muted);font-size:14px}
    .foot a{text-decoration:none}
    .foot-fine{opacity:.75}
    @media(max-width:720px){h1{font-size:30px}.cards{grid-template-columns:1fr}}`;

function shell({ title, description, canonical, jsonLd, body }) {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:locale" content="he_IL" />
  <link rel="icon" type="image/png" href="/logo.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>${analyticsTag()}
  <style>${STYLE}
  </style>
</head>
<body>
  <div class="top"><div class="wrap">
    <a class="brand" href="/index.html">
      <div class="mark"><img src="/logo.png" alt="קליניקל" /></div>
      <b>קליניקל</b>
    </a>
    <a class="back" href="/index.html">→ לאתר קליניקל</a>
  </div></div>

  <main><div class="wrap">
${body}
  </div></main>

  <div class="foot">קליניקל · klinical.co.il · <a href="/index.html">לאתר</a><br /><span class="foot-fine">קליניקל · מוצר של מאמא מערכות · מאמא אליהו אליאב · עוסק 302462874</span></div>
</body>
</html>
`;
}

function faqJsonLd(faq) {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function renderFaq(faq) {
  return faq
    .map((f) => `      <details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`)
    .join("\n");
}

function renderFeatures(spec) {
  return FEATURES.map(
    (f) =>
      `        <div class="card"><h3>${esc(f.title)}</h3><p>${esc(f.body)}</p></div>`,
  ).join("\n");
}

// Three siblings, chosen deterministically so every page links onward and the
// whole set stays crawlable from any entry point.
function siblingsOf(index) {
  const out = [];
  for (let i = 1; i <= 3; i++) out.push(SPECIALTIES[(index + i) % SPECIALTIES.length]);
  return out;
}

function buildSpecialty(spec, index) {
  const canonical = `${SITE.origin}/for/${spec.slug}/`;
  const title = `${spec.keyword} | קליניקל`;
  const description = `${spec.lead} קליניקל היא מערכת לניהול קליניקה ${spec.forName}: יומן, תזכורות אוטומטיות למטופלים, תיק מטופל וקבלות. 3 חודשים חינם.`;
  const faq = [...spec.faq, ...COMMON_FAQ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "קליניקל", item: `${SITE.origin}/` },
          { "@type": "ListItem", position: 2, name: spec.keyword, item: canonical },
        ],
      },
      {
        "@type": "SoftwareApplication",
        name: "קליניקל",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: canonical,
        offers: [
          { "@type": "Offer", name: "קליניקל", price: SITE.priceBasic, priceCurrency: "ILS" },
          { "@type": "Offer", name: "קליניקל מאסטר", price: SITE.pricePro, priceCurrency: "ILS" },
        ],
      },
      faqJsonLd(faq),
    ],
  };

  const body = `    <h1>תוכנה לניהול קליניקה ${esc(spec.forName)}</h1>
    <div class="lead">${esc(spec.lead)}</div>

${spec.intro.map((p) => `    <p>${esc(p)}</p>`).join("\n")}

    <div class="cta-box">
      <p>3 חודשים חינם, בלי כרטיס אשראי. הקמה בדקות.</p>
      ${cta(spec.slug)}
      ${whatsapp(spec.slug)}
    </div>

    <h2>מה קליניקל עושה ${esc(spec.forName)}</h2>
      <div class="cards">
${renderFeatures(spec)}
      </div>

    <h2>שאלות נפוצות</h2>
${renderFaq(faq)}

    <div class="cta-box">
      <p>אפשר להתחיל עכשיו ולראות איך זה מרגיש בקליניקה שלך.</p>
      ${cta(`${spec.slug}_bottom`)}
      ${whatsapp(spec.slug)}
    </div>

    <div class="siblings">
      <h2>תחומים נוספים</h2>
${siblingsOf(index)
  .map((s) => `      <a href="/for/${s.slug}/">${esc(s.name)}</a>`)
  .join("\n")}
      <a href="/switch/">עוברים ממערכת אחרת</a>
    </div>`;

  return shell({ title, description, canonical, jsonLd, body });
}

function buildSwitchPage() {
  const canonical = `${SITE.origin}/switch/`;
  const title = "עוברים לקליניקל ממערכת אחרת | קליניקל";
  const description =
    "כבר עובדים עם מערכת אחרת? אנחנו מעבירים בשבילכם את רשימת המטופלים בלי תוספת תשלום, ואפשר להתנסות 3 חודשים חינם לפני שמחליטים.";

  const faq = [
    {
      q: "מה עולה ההעברה?",
      a: "כלום. אנחנו מעבירים את רשימת המטופלים בשבילכם ללא תוספת תשלום, גם בתקופת הניסיון.",
    },
    {
      q: "מאילו מערכות אפשר לעבור?",
      a: "מכל מערכת שמאפשרת לייצא קובץ, וגם מאקסל או מרשימת אנשי קשר. אם אתם לא בטוחים איך לייצא, שלחו לנו הודעה ונעבור על זה יחד.",
    },
    {
      q: "מה עובר בפועל?",
      a: "רשימת המטופלים עם פרטי הקשר שלהם. תורים עתידיים ותיקים קליניים אפשר להעביר בהתאם למה שהמערכת הקודמת מאפשרת לייצא.",
    },
    {
      q: "כמה זמן זה לוקח?",
      a: "בדרך כלל יום עסקים אחד מרגע שקיבלנו את הקובץ. בינתיים אפשר להמשיך לעבוד רגיל.",
    },
    {
      q: "אפשר לנסות לפני שמעבירים הכל?",
      a: "בהחלט, וזה גם מה שאנחנו ממליצים. פותחים חשבון, מתנסים 3 חודשים חינם, ורק כשנוח לכם מעבירים את הרשימה המלאה.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "קליניקל", item: `${SITE.origin}/` },
          { "@type": "ListItem", position: 2, name: "עוברים לקליניקל", item: canonical },
        ],
      },
      faqJsonLd(faq),
    ],
  };

  const body = `    <h1>עוברים לקליניקל ממערכת אחרת</h1>
    <div class="lead">הדבר שהכי מרתיע במעבר הוא רשימת המטופלים. אז אנחנו מעבירים אותה בשבילכם.</div>

    <p>רוב המטפלים שכבר עובדים עם מערכת נשארים בה לא כי היא טובה, אלא כי המחשבה על ההעברה מעייפת. הנה איך זה עובד אצלנו.</p>

    <h2>שלושה צעדים</h2>
    <ul>
      <li>פותחים חשבון בקליניקל. לוקח דקה, בלי כרטיס אשראי.</li>
      <li>מייצאים מהמערכת הקודמת קובץ עם רשימת המטופלים, או שולחים לנו אקסל שכבר יש לכם.</li>
      <li>אנחנו מקימים את הרשימה בחשבון שלכם ומודיעים כשזה מוכן.</li>
    </ul>

    <p>אפשר גם לעשות את זה לבד: יש בקליניקל ייבוא מקובץ שמראה תצוגה מקדימה מלאה לפני שנכתב משהו, כולל אילו שורות לא ניתן לקרוא ולמה.</p>

    <div class="cta-box">
      <p>3 חודשים חינם, והעברת הרשימה עלינו.</p>
      ${cta("switch")}
      ${whatsapp("switch")}
    </div>

    <h2>שאלות נפוצות על המעבר</h2>
${renderFaq(faq)}

    <div class="siblings">
      <h2>פתרונות לפי תחום</h2>
${SPECIALTIES.slice(0, 6)
  .map((s) => `      <a href="/for/${s.slug}/">${esc(s.name)}</a>`)
  .join("\n")}
    </div>`;

  return shell({ title, description, canonical, jsonLd, body });
}

function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${SITE.origin}/`, freq: "weekly", pri: "1.0" },
    { loc: `${SITE.origin}/switch/`, freq: "monthly", pri: "0.8" },
    ...SPECIALTIES.map((s) => ({
      loc: `${SITE.origin}/for/${s.slug}/`,
      freq: "monthly",
      pri: "0.7",
    })),
    { loc: `${SITE.origin}/privacy.html`, freq: "yearly", pri: "0.3" },
    { loc: `${SITE.origin}/terms.html`, freq: "yearly", pri: "0.3" },
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.pri}</priority>\n  </url>`,
  )
  .join("\n")}
</urlset>
`;
}

function write(relPath, contents) {
  assertNoEmDash(relPath, contents);
  const full = join(ROOT, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents, "utf8");
  console.log(`  ${relPath}`);
}

if (!analyticsTag()) {
  console.log("note: analytics is off. Set ANALYTICS.umamiWebsiteId in pages-data.mjs to turn it on.\n");
}

console.log("building pages:");
SPECIALTIES.forEach((spec, i) => write(`for/${spec.slug}/index.html`, buildSpecialty(spec, i)));
write("switch/index.html", buildSwitchPage());
write("sitemap.xml", buildSitemap());
console.log(`\ndone: ${SPECIALTIES.length} specialty pages + switch page + sitemap`);
