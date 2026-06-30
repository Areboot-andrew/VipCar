const fs = require('fs');

const pagePath = 'd:/Projects/CarCRMWEB/carcrm/src/app/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// Insert parseAccent before Home component
if (!content.includes('const parseAccent')) {
  content = content.replace('export default async function Home() {', 
`const parseAccent = (text: string | undefined, defaultText: string) => {
  const t = text || defaultText;
  if (!t) return '';
  return t.replace(/\\*(.*?)\\*/g, '<span class="text-[#e9c349] font-bold">$1</span>');
};

export default async function Home() {`);
}

// Replace occurrences
// e.g. {c['services_title'] || 'Чому обирають нас?'} -> dangerouslySetInnerHTML={{ __html: parseAccent(c['services_title'], 'Чому обирають нас?') }}
// Wait, we can't do this blindly. We need to be careful with tag closing.
// Let's do it manually for the most important titles.
