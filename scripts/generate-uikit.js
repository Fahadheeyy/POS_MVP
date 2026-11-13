import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jsPDF } from 'jspdf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const uiKitDir = path.join(rootDir, 'ui-kit');

if (!fs.existsSync(uiKitDir)) {
  fs.mkdirSync(uiKitDir, { recursive: true });
}

// 1. Write tokens.json
const tokens = {
  name: "QSR POS India Design System Tokens",
  version: "1.0.0",
  source: "PNG Single Source of Truth (image 3021, 3022, 3025, 3026, 3027, 3028, 3030, 3031, 3033, 3034)",
  typography: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    scale: {
      H1: { size: "72px", line: "88px", weight: "Bold / Semibold" },
      H2: { size: "64px", line: "78px", weight: "Bold / Semibold" },
      H3: { size: "50px", line: "62px", weight: "Bold / Semibold" },
      H4: { size: "36px", line: "44px", weight: "Bold / Semibold" },
      H5: { size: "30px", line: "36px", weight: "Bold / Semibold" },
      H6: { size: "24px", line: "32px", weight: "Bold / Semibold" },
      Body: { size: "16px", line: "22px", weight: "Regular / Medium" },
      Small: { size: "14px", line: "20px", weight: "Regular / Medium" },
      Tiny: { size: "12px", line: "18px", weight: "Regular / Bold" }
    }
  },
  colors: {
    neutrals: {
      "gray-50": "#f0f0f2",
      "gray-100": "#d0d2d8",
      "gray-200": "#b9bcc5",
      "gray-300": "#989daa",
      "gray-400": "#858a99",
      "gray-500": "#666d80",
      "gray-600": "#5d6374",
      "gray-700": "#484d5b",
      "gray-800": "#383c46",
      "gray-900": "#2b2e36"
    },
    primary: {
      "primary-50": "#ffedee",
      "primary-100": "#ffc6c9",
      "primary-200": "#ffaaaf",
      "primary-300": "#ff848a",
      "primary-400": "#ff6c73",
      "primary-500": "#ff4750",
      "primary-600": "#e84149",
      "primary-700": "#b53239",
      "primary-800": "#8c272c",
      "primary-900": "#6b1e22"
    },
    accentYellow: {
      "yellow-50": "#fff9e6",
      "yellow-100": "#ffeeb0",
      "yellow-200": "#ffe38a",
      "yellow-300": "#ffd655",
      "yellow-400": "#ffce34",
      "yellow-500": "#ffc201",
      "yellow-600": "#e8b101",
      "yellow-700": "#b58a01",
      "yellow-800": "#8c6b01",
      "yellow-900": "#6b5100"
    },
    secondaryGreen: {
      "green-50": "#ecf9f7",
      "green-100": "#c4ede5",
      "green-200": "#a7e4d8",
      "green-300": "#7fd7c6",
      "green-400": "#66d0bb",
      "green-500": "#40c4aa",
      "green-600": "#3ab29b",
      "green-700": "#2d8b79",
      "green-800": "#236c5e",
      "green-900": "#1b5247"
    },
    secondaryRed: {
      "red-50": "#feeceb",
      "red-100": "#fbc5c1",
      "red-200": "#f9a9a3",
      "red-300": "#f68279",
      "red-400": "#f4695f",
      "red-500": "#f14437",
      "red-600": "#db3e32",
      "red-700": "#ab3027",
      "red-800": "#85251e",
      "red-900": "#651d17"
    }
  },
  radii: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "20px",
    full: "9999px"
  },
  shadows: {
    subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
    card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
    modal: "0 20px 25px -5px rgba(0, 0, 0, 0.08)"
  }
};

fs.writeFileSync(path.join(uiKitDir, 'tokens.json'), JSON.stringify(tokens, null, 2));

// 2. Generate PDF using jsPDF
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

// Cover / Title Page
doc.setFillColor(30, 41, 59); // Slate-800
doc.rect(0, 0, 210, 297, 'F');

doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(28);
doc.text('QSR POS PLATFORM', 20, 45);

doc.setFontSize(16);
doc.setTextColor(255, 71, 80); // Coral
doc.text('UI KIT & DESIGN SYSTEM SPECIFICATION', 20, 55);

doc.setFontSize(11);
doc.setTextColor(203, 213, 225); // Slate-300
doc.setFont('helvetica', 'normal');
doc.text('Pixel-Faithful Tokens Derived from PNG Single Source of Truth', 20, 65);
doc.text('India Quick Service Restaurant (QSR) MVP Edition', 20, 72);

doc.setDrawColor(71, 85, 105);
doc.line(20, 80, 190, 80);

doc.setFontSize(12);
doc.setFont('helvetica', 'bold');
doc.setTextColor(255, 255, 255);
doc.text('DESIGN SYSTEM ATOMS & MOLECULES:', 20, 95);

const items = [
  '1. Neutral Cool Gray & Slate Palette (image 3022)',
  '2. Primary Action Coral & Status Color Palette (image 3022)',
  '3. Inter Sans Typographic Hierarchy & Scales (image 3021)',
  '4. Molecule Components: Buttons, Inputs, Status Badges (image 3025, 3026, 3027)',
  '5. Organisms: 4-Digit Keypad, Cards, Popups, Drawer & Cart (image 3028, 3030, 3033)',
  '6. KDS Ticket Anatomy & 80mm Printable Thermal Receipt (Receipt printed.png)'
];

doc.setFontSize(10);
doc.setFont('helvetica', 'normal');
doc.setTextColor(226, 232, 240);
let y = 105;
items.forEach(it => {
  doc.text(`•  ${it}`, 24, y);
  y += 9;
});

doc.setFontSize(9);
doc.setTextColor(148, 163, 184);
doc.text('Document Generated Automatically · All Tokens Enforced Globally', 20, 275);
doc.text('Masala Box Express · Indiranagar, Bengaluru · November 2026', 20, 282);

// Page 2: Colors and Typography
doc.addPage();
doc.setFillColor(248, 250, 252);
doc.rect(0, 0, 210, 297, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(18);
doc.setTextColor(15, 23, 42);
doc.text('1. Design Tokens: Color Palettes (image 3022)', 20, 25);

doc.setFontSize(10);
doc.setFont('helvetica', 'normal');
doc.setTextColor(100, 116, 139);
doc.text('Cool slate neutrals provide the canvas; warm coral and status tones provide hierarchy.', 20, 32);

// Swatch drawer helper
function drawSwatch(x, y, label, hex, r, g, b, isDark = false) {
  doc.setFillColor(r, g, b);
  doc.roundedRect(x, y, 32, 14, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, 32, 14, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isDark ? 255 : 15, isDark ? 255 : 23, isDark ? 255 : 42);
  doc.text(label, x + 3, y + 6);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(hex, x + 3, y + 11);
}

// Draw Grays
doc.setFontSize(11);
doc.setFont('helvetica', 'bold');
doc.setTextColor(15, 23, 42);
doc.text('Gray Neutrals:', 20, 45);

drawSwatch(20, 50, 'gray-50', '#f0f0f2', 240, 240, 242, false);
drawSwatch(55, 50, 'gray-100', '#d0d2d8', 208, 210, 216, false);
drawSwatch(90, 50, 'gray-300', '#989daa', 152, 157, 170, false);
drawSwatch(125, 50, 'gray-500', '#666d80', 102, 109, 128, true);
drawSwatch(160, 50, 'gray-900', '#2b2e36', 43, 46, 54, true);

// Draw Primary
doc.text('Primary Brand Accent (Coral / Red):', 20, 75);
drawSwatch(20, 80, 'primary-50', '#ffedee', 255, 237, 238, false);
drawSwatch(55, 80, 'primary-200', '#ffaaaf', 255, 170, 175, false);
drawSwatch(90, 80, 'primary-500', '#ff4750', 255, 71, 80, true);
drawSwatch(125, 80, 'primary-600', '#e84149', 232, 65, 73, true);
drawSwatch(160, 80, 'primary-900', '#6b1e22', 107, 30, 34, true);

// Draw Accent & Secondary
doc.text('Secondary Status Colors (Yellow, Green, Red):', 20, 105);
drawSwatch(20, 110, 'yellow-500', '#ffc201', 255, 194, 1, false);
drawSwatch(55, 110, 'green-500', '#40c4aa', 64, 196, 170, true);
drawSwatch(90, 110, 'green-700', '#2d8b79', 45, 139, 121, true);
drawSwatch(125, 110, 'red-500', '#f14437', 241, 68, 55, true);
drawSwatch(160, 110, 'red-700', '#ab3027', 171, 48, 39, true);

// Typography Section
doc.setDrawColor(226, 232, 240);
doc.line(20, 135, 190, 135);

doc.setFontSize(16);
doc.setFont('helvetica', 'bold');
doc.setTextColor(15, 23, 42);
doc.text('2. Typographic Scale (image 3021)', 20, 148);

doc.setFontSize(9);
doc.setFont('helvetica', 'normal');
doc.setTextColor(100, 116, 139);
doc.text('Font Family: Inter (loaded via Google Fonts) / System Geometric Sans', 20, 155);

const typeTable = [
  ['H1 Semibold / Bold', '32px / 40px', 'Page Titles (Welcome to the Kitchen, Select Role)'],
  ['H2 Bold', '24px / 32px', 'Modal Titles (Order Details, Display Settings)'],
  ['H3 Bold', '18px / 24px', 'Card Headers, Ticket #332, Dish Titles'],
  ['H4 Bold', '15px / 20px', 'Sidebar Order, Section Labels'],
  ['Body Regular', '14px / 20px', 'Standard Table Rows, Descriptions'],
  ['Small Medium', '12px / 16px', 'Input Fields, Button Labels, Timers'],
  ['Tiny Bold', '10px / 14px', 'Pill Badges, GSTIN, Metadata Tags']
];

let ty = 168;
typeTable.forEach(([name, size, usage]) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(name, 20, ty);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(size, 80, ty);
  doc.text(usage, 120, ty);

  ty += 11;
});

// Page 3: Component Library & Specifications
doc.addPage();
doc.setFillColor(248, 250, 252);
doc.rect(0, 0, 210, 297, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(18);
doc.setTextColor(15, 23, 42);
doc.text('3. Core Components Specifications', 20, 25);

const comps = [
  {
    title: 'A. 4-Digit Staff Keypad (Staff PIN login.png)',
    spec: '3x4 Grid of 56px rounded buttons (Clear, 0, Backspace). 4 dot indicator boxes with filled circle state. Auto error-shake on failure.'
  },
  {
    title: 'B. Product Card & Modifiers Modal (Menu Beast Style details.png)',
    spec: 'Aspect 4:3 image slot with fallback tile. Rounded 16px card. Add-on groups with multi-select checkboxes, qty stepper, and Add to Cart.'
  },
  {
    title: 'C. KDS Ticket Anatomy (All Station.png)',
    spec: 'Ticket #332, reactive elapsed progress bar, rush badge, customer/channel label, item strikethrough on tap, advance/bump buttons.'
  },
  {
    title: 'D. Printable 80mm Thermal Receipt (Receipt printed.png)',
    spec: 'Printer slot hardware header, white slip with serrated perforated bottom, GSTIN/FSSAI headers, CGST+SGST tax lines, WiFi password box.'
  },
  {
    title: 'E. Role-Based Access Control Matrix',
    spec: 'Cashier (POS, Shift, Orders), Kitchen (KDS), Manager (Console, Approvals), Owner (Dashboard, 9 Reports, Settings).'
  }
];

let cy = 40;
comps.forEach(c => {
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(20, cy, 170, 36, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, cy, 170, 36, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(c.title, 26, cy + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const splitText = doc.splitTextToSize(c.spec, 158);
  doc.text(splitText, 26, cy + 18);

  cy += 44;
});

// Save PDF
const pdfPath = path.join(uiKitDir, 'UI_KIT.pdf');
const pdfBytes = doc.output();
fs.writeFileSync(pdfPath, Buffer.from(pdfBytes, 'binary'));

console.log(`UI Kit files generated successfully:`);
console.log(`- ${path.join(uiKitDir, 'tokens.json')}`);
console.log(`- ${path.join(uiKitDir, 'UI_KIT.pdf')}`);

