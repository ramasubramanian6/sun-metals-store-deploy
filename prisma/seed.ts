/* Seed: categories from the Sun Metals Store brief, starter catalog, admin user, banners.
 * Run `npm run db:seed`. Set SEED_DEMO=1 to also create demo customers, orders and analytics
 * events so the admin dashboard has data to show (never do this on production). */
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const db = new PrismaClient();
const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));

type Shape = "pot" | "plate" | "flask" | "kadai" | "tumbler" | "lamp" | "fridge" | "washer" | "ac" | "tv" | "speaker" | "mixer" | "stove" | "fan" | "drum" | "handi" | "box";

const PALETTES: Record<string, [string, string, string]> = {
  steel: ["#e8edf2", "#c5ced8", "#6b7a8c"],
  brass: ["#fbf1d9", "#e9c46a", "#a8741a"],
  silver: ["#f1f3f6", "#d4d9e0", "#8a94a3"],
  aluminium: ["#eef1f4", "#cfd6de", "#7d8896"],
  appliance: ["#eef3fb", "#c9d8ef", "#33507a"],
  tv: ["#ecf0f8", "#c3cde0", "#1f2b44"],
};

function shapeSvg(shape: Shape, fill: string, stroke: string) {
  const s = `fill="${fill}" stroke="${stroke}" stroke-width="10" stroke-linejoin="round"`;
  switch (shape) {
    case "pot": return `<path ${s} d="M250 360h300l-20 230a40 40 0 0 1-40 36H310a40 40 0 0 1-40-36z"/><rect ${s} x="220" y="320" width="360" height="50" rx="20"/><path fill="none" stroke="${stroke}" stroke-width="14" d="M220 400c-60 0-60 70 0 70M580 400c60 0 60 70 0 70"/>`;
    case "plate": return `<ellipse ${s} cx="400" cy="470" rx="250" ry="120"/><ellipse ${s} cx="400" cy="460" rx="160" ry="70"/><ellipse ${s} cx="400" cy="330" rx="120" ry="40"/><path ${s} d="M280 330v40c0 30 240 30 240 0v-40"/>`;
    case "flask": return `<rect ${s} x="320" y="260" width="160" height="380" rx="40"/><rect ${s} x="340" y="200" width="120" height="70" rx="16"/><path fill="none" stroke="${stroke}" stroke-width="8" d="M320 360h160M320 540h160"/>`;
    case "kadai": return `<path ${s} d="M180 380h440c0 150-100 230-220 230S180 530 180 380z"/><path fill="none" stroke="${stroke}" stroke-width="16" d="M180 390c-50-10-60 50-20 60M620 390c50-10 60 50 20 60"/>`;
    case "tumbler": return `<path ${s} d="M300 280h200l-25 340H325z"/><path ${s} d="M450 290h120l-20 300h-80z" opacity="0.8"/>`;
    case "lamp": return `<path ${s} d="M260 520c0-60 280-60 280 0 0 30-280 30-280 0z"/><path ${s} d="M380 520v80h40v-80"/><rect ${s} x="320" y="600" width="160" height="30" rx="10"/><path fill="#f4a261" stroke="${stroke}" stroke-width="6" d="M400 420c-25 30-20 70 0 80 20-10 25-50 0-80z"/>`;
    case "fridge": return `<rect ${s} x="270" y="160" width="260" height="500" rx="24"/><path fill="none" stroke="${stroke}" stroke-width="10" d="M270 340h260M300 220v60M300 390v80"/>`;
    case "washer": return `<rect ${s} x="250" y="200" width="300" height="420" rx="24"/><circle ${s} cx="400" cy="440" r="110"/><circle fill="none" stroke="${stroke}" stroke-width="8" cx="400" cy="440" r="70"/><path fill="none" stroke="${stroke}" stroke-width="8" d="M250 280h300"/>`;
    case "ac": return `<rect ${s} x="150" y="320" width="500" height="160" rx="30"/><path fill="none" stroke="${stroke}" stroke-width="8" d="M190 440h420M190 460h420"/><circle fill="${stroke}" cx="600" cy="360" r="8"/>`;
    case "tv": return `<rect ${s} x="140" y="220" width="520" height="320" rx="16"/><path ${s} d="M340 540l-30 70h180l-30-70"/>`;
    case "speaker": return `<rect ${s} x="130" y="380" width="540" height="110" rx="40"/><rect ${s} x="300" y="200" width="200" height="420" rx="30" opacity="0.9"/><circle ${s} cx="400" cy="300" r="40"/><circle ${s} cx="400" cy="480" r="70"/>`;
    case "mixer": return `<rect ${s} x="290" y="460" width="220" height="170" rx="30"/><path ${s} d="M310 460l30-260h120l30 260z"/><rect ${s} x="330" y="170" width="140" height="40" rx="10"/><circle fill="${stroke}" cx="400" cy="545" r="20"/>`;
    case "stove": return `<rect ${s} x="140" y="420" width="520" height="110" rx="20"/><ellipse ${s} cx="270" cy="400" rx="90" ry="30"/><ellipse ${s} cx="530" cy="400" rx="90" ry="30"/><circle fill="${stroke}" cx="250" cy="480" r="14"/><circle fill="${stroke}" cx="550" cy="480" r="14"/>`;
    case "fan": return `<circle ${s} cx="400" cy="380" r="40"/><path ${s} d="M400 340c-20-100 20-150 60-140 30 40-10 110-60 140zM440 400c90 40 110 100 80 130-50 10-90-60-80-130zM360 400c-70 60-130 60-140 20 10-40 90-50 140-20z"/><path fill="none" stroke="${stroke}" stroke-width="16" d="M400 420v200M330 630h140"/>`;
    case "drum": return `<path ${s} d="M260 230h280v390a30 30 0 0 1-30 30H290a30 30 0 0 1-30-30z"/><ellipse ${s} cx="400" cy="230" rx="140" ry="30"/><rect ${s} x="380" y="520" width="40" height="50" rx="6"/>`;
    case "handi": return `<path ${s} d="M240 360c0-30 320-30 320 0 40 60 30 250-160 260-190-10-200-200-160-260z"/><ellipse ${s} cx="400" cy="340" rx="140" ry="30"/>`;
    default: return `<rect ${s} x="250" y="250" width="300" height="300" rx="30"/>`;
  }
}

async function makeImage(file: string, shape: Shape, palette: keyof typeof PALETTES, label: string, variant = 0) {
  const [bg, fill, stroke] = PALETTES[palette];
  const dir = path.join(UPLOAD_ROOT, "products");
  await mkdir(dir, { recursive: true });
  const rotate = variant ? `rotate(${variant * 8} 400 400)` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${bg}"/></radialGradient></defs>
    <rect width="800" height="800" fill="url(#g)"/>
    <ellipse cx="400" cy="690" rx="230" ry="24" fill="${stroke}" opacity="0.12"/>
    <g transform="${rotate}">${shapeSvg(shape, fill, stroke)}</g>
    <text x="400" y="750" font-family="Georgia, serif" font-size="26" fill="${stroke}" text-anchor="middle" opacity="0.7">${label}</text>
  </svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 85 }).toFile(path.join(dir, file));
  return `/media/products/${file}`;
}

async function makeBanner(file: string, colors: [string, string], shapes: Shape[]) {
  const dir = path.join(UPLOAD_ROOT, "banners");
  await mkdir(dir, { recursive: true });
  const art = shapes
    .map((sh, i) => `<g transform="translate(${760 + i * 300} ${80 + (i % 2) * 40}) scale(0.62)">${shapeSvg(sh, "#ffffff22", "#ffffffcc")}</g>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="600">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient></defs>
    <rect width="1600" height="600" fill="url(#g)"/>
    <circle cx="1400" cy="120" r="260" fill="#ffffff" opacity="0.06"/><circle cx="1150" cy="560" r="200" fill="#ffffff" opacity="0.05"/>${art}</svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 85 }).toFile(path.join(dir, file));
  return `/media/banners/${file}`;
}

type Seed = {
  name: string; cat: string; price: number; mrp: number; cost: number; stock: number; shape: Shape; palette: keyof typeof PALETTES;
  material?: string; brand?: string; gst?: number; hsn?: string; featured?: boolean; engraving?: boolean; emi?: boolean; warranty?: string;
  short: string; specs: [string, string][]; tags: string[];
};

const CATEGORIES = [
  { slug: "stainless-steel", name: "Stainless Steel Essentials", description: "Dinner sets, storage dabbas, saucepans, hot pots, frying pans, water drums and thermal flasks.", sort: 1,
    children: [
      { slug: "dinner-sets", name: "Dinner Sets" },
      { slug: "storage-containers", name: "Storage Dabbas & Containers" },
      { slug: "steel-cookware", name: "Saucepans & Frying Pans" },
      { slug: "flasks-hot-pots", name: "Flasks & Hot Pots" },
      { slug: "water-drums", name: "Water Drums" },
    ] },
  { slug: "traditional-cookware", name: "Brass, Silver & Aluminium", description: "Brass kadais, milk pots and puja items, silver gift vessels, aluminium biryani handis and commercial cookers.", sort: 2,
    children: [
      { slug: "brass", name: "Brass Vessels & Puja Items" },
      { slug: "silver", name: "Silver Articles & Gifts" },
      { slug: "aluminium", name: "Aluminium & Commercial Cookware" },
    ] },
  { slug: "kitchen-appliances", name: "Small Home & Kitchen Appliances", description: "Mixer grinders, wet grinders, induction cooktops, gas stoves, kettles, blenders, fans and irons.", sort: 3, children: [] },
  { slug: "large-appliances", name: "Large Home Appliances", description: "Refrigerators, washing machines, air conditioners and air coolers.", sort: 4, children: [] },
  { slug: "tv-electronics", name: "TVs & Sound Systems", description: "Smart LED, 4K UHD and QLED TVs, home theatres, soundbars and emergency lights.", sort: 5, children: [] },
];

const P: Seed[] = [
  // Stainless steel
  { name: "Stainless Steel Dinner Set – 51 Pieces", cat: "dinner-sets", price: 489900, mrp: 649900, cost: 360000, stock: 24, shape: "plate", palette: "steel", material: "Stainless Steel", gst: 12, hsn: "7323", featured: true, engraving: true,
    short: "Heavy-gauge 18/8 food-grade steel dinner set for 6 with mirror finish.", specs: [["Pieces", "51"], ["Grade", "18/8 (SS 304)"], ["Finish", "Mirror"], ["Serves", "6 people"]], tags: ["dinner set", "gift", "wedding"] },
  { name: "Stainless Steel Dinner Set – 24 Pieces", cat: "dinner-sets", price: 219900, mrp: 279900, cost: 160000, stock: 40, shape: "plate", palette: "steel", material: "Stainless Steel", gst: 12, hsn: "7323", engraving: true,
    short: "Everyday 24-piece set: plates, bowls, glasses and spoons for 4.", specs: [["Pieces", "24"], ["Grade", "SS 202"], ["Serves", "4 people"]], tags: ["dinner set"] },
  { name: "Steel Storage Dabba Set – 9 Pieces", cat: "storage-containers", price: 129900, mrp: 169900, cost: 90000, stock: 60, shape: "box", palette: "steel", material: "Stainless Steel", gst: 12, hsn: "7323",
    short: "Airtight stackable dabbas for rice, dal and masala.", specs: [["Pieces", "9"], ["Capacity", "500 ml to 3 L"], ["Lid", "Airtight steel lid"]], tags: ["dabba", "container", "storage"] },
  { name: "Masala Dabba with 7 Bowls", cat: "storage-containers", price: 69900, mrp: 89900, cost: 45000, stock: 80, shape: "plate", palette: "steel", material: "Stainless Steel", gst: 12, hsn: "7323", engraving: true,
    short: "Classic round spice box with see-through lid and spoon.", specs: [["Bowls", "7"], ["Diameter", "22 cm"]], tags: ["masala", "spice box"] },
  { name: "Tri-Ply Stainless Steel Saucepan 2 L", cat: "steel-cookware", price: 149900, mrp: 199900, cost: 100000, stock: 35, shape: "pot", palette: "steel", material: "Stainless Steel", gst: 12, hsn: "7323", featured: true,
    short: "Induction-ready tri-ply base for even heating, with glass lid.", specs: [["Capacity", "2 L"], ["Base", "Tri-ply, induction compatible"], ["Lid", "Toughened glass"]], tags: ["saucepan", "induction"] },
  { name: "Stainless Steel Frying Pan 26 cm", cat: "steel-cookware", price: 119900, mrp: 159900, cost: 80000, stock: 30, shape: "kadai", palette: "steel", material: "Stainless Steel", gst: 12, hsn: "7323",
    short: "Encapsulated base fry pan, gas and induction compatible.", specs: [["Diameter", "26 cm"], ["Base", "Encapsulated"]], tags: ["frying pan", "induction"] },
  { name: "Vacuum Insulated Thermal Flask 1 L", cat: "flasks-hot-pots", price: 89900, mrp: 129900, cost: 55000, stock: 100, shape: "flask", palette: "steel", material: "Stainless Steel", gst: 18, hsn: "9617", engraving: true,
    short: "Keeps hot for 24 hours and cold for 36 hours. Leak-proof.", specs: [["Capacity", "1 L"], ["Hot retention", "24 hours"], ["Cold retention", "36 hours"]], tags: ["flask", "bottle", "gift"] },
  { name: "Insulated Hot Pot Casserole 2.5 L", cat: "flasks-hot-pots", price: 99900, mrp: 139900, cost: 65000, stock: 45, shape: "pot", palette: "steel", material: "Stainless Steel", gst: 18, hsn: "9617",
    short: "Double-wall casserole keeps chapatis and curries hot for hours.", specs: [["Capacity", "2.5 L"], ["Insulation", "PU foam, double wall"]], tags: ["hot pot", "casserole"] },
  { name: "Stainless Steel Water Drum 50 L with Tap", cat: "water-drums", price: 349900, mrp: 449900, cost: 250000, stock: 12, shape: "drum", palette: "steel", material: "Stainless Steel", gst: 12, hsn: "7323", emi: true,
    short: "Hygienic SS 304 water storage drum with brass tap and lid.", specs: [["Capacity", "50 L"], ["Grade", "SS 304"], ["Tap", "Brass"]], tags: ["water drum", "storage"] },

  // Brass, silver, aluminium
  { name: "Pure Brass Kadai 3 L with Handles", cat: "brass", price: 289900, mrp: 359900, cost: 210000, stock: 18, shape: "kadai", palette: "brass", material: "Brass", gst: 12, hsn: "7418", featured: true, engraving: true,
    short: "Hand-beaten traditional brass kadai with kalai (tin) coating.", specs: [["Capacity", "3 L"], ["Weight", "1.6 kg"], ["Coating", "Kalai (tin) lined"]], tags: ["brass", "kadai", "traditional"] },
  { name: "Brass Milk Pot (Paal Sombu) 1.5 L", cat: "brass", price: 199900, mrp: 249900, cost: 145000, stock: 22, shape: "handi", palette: "brass", material: "Brass", gst: 12, hsn: "7418", engraving: true,
    short: "Traditional brass milk pot, ideal for gifting and housewarming.", specs: [["Capacity", "1.5 L"], ["Finish", "Polished"]], tags: ["brass", "milk pot", "gift", "housewarming"] },
  { name: "Brass Kuthu Vilakku (Puja Lamp) 18 inch", cat: "brass", price: 349900, mrp: 429900, cost: 255000, stock: 15, shape: "lamp", palette: "brass", material: "Brass", gst: 12, hsn: "7418", featured: true, engraving: true,
    short: "Five-faced traditional brass lamp for puja and festivals.", specs: [["Height", "18 inch"], ["Faces", "5"], ["Weight", "2.1 kg"]], tags: ["brass", "puja", "lamp", "vilakku"] },
  { name: "Brass Puja Thali Set – 7 Pieces", cat: "brass", price: 149900, mrp: 189900, cost: 100000, stock: 30, shape: "plate", palette: "brass", material: "Brass", gst: 12, hsn: "7418", engraving: true,
    short: "Complete puja thali with diya, bell, kumkum bowl and agarbatti stand.", specs: [["Pieces", "7"], ["Diameter", "10 inch"]], tags: ["brass", "puja", "thali"] },
  { name: "Silver Kumkum Bowl Gift Set (925)", cat: "silver", price: 549900, mrp: 649900, cost: 450000, stock: 8, shape: "plate", palette: "silver", material: "Silver", gst: 3, hsn: "7114", featured: true, engraving: true, emi: true,
    short: "Hallmarked 925 sterling silver kumkum set for weddings and return gifts.", specs: [["Purity", "925 Sterling, hallmarked"], ["Weight", "40 g"]], tags: ["silver", "gift", "wedding", "return gift"] },
  { name: "Silver Plated Tumbler Set of 2", cat: "silver", price: 129900, mrp: 179900, cost: 85000, stock: 25, shape: "tumbler", palette: "silver", material: "Silver Plated", gst: 12, hsn: "7114", engraving: true,
    short: "Elegant silver-plated tumblers — a perfect personalised gift.", specs: [["Pieces", "2"], ["Capacity", "250 ml each"]], tags: ["silver", "gift", "tumbler"] },
  { name: "Aluminium Biryani Handi 10 L", cat: "aluminium", price: 179900, mrp: 229900, cost: 120000, stock: 20, shape: "handi", palette: "aluminium", material: "Aluminium", gst: 12, hsn: "7615",
    short: "Heavy-gauge dum biryani handi with tight-fitting lid.", specs: [["Capacity", "10 L"], ["Thickness", "4 mm"]], tags: ["biryani", "handi", "commercial"] },
  { name: "Commercial Aluminium Pressure Cooker 20 L", cat: "aluminium", price: 549900, mrp: 689900, cost: 420000, stock: 10, shape: "pot", palette: "aluminium", material: "Aluminium", gst: 12, hsn: "7615", emi: true, warranty: "5 years",
    short: "ISI-marked heavy-duty cooker for hotels, caterers and canteens.", specs: [["Capacity", "20 L"], ["Certification", "ISI"], ["Use", "Gas stove / commercial burner"]], tags: ["cooker", "commercial", "hotel"] },
  { name: "Aluminium Milk Boiler 3 L", cat: "aluminium", price: 79900, mrp: 99900, cost: 50000, stock: 50, shape: "flask", palette: "aluminium", material: "Aluminium", gst: 12, hsn: "7615",
    short: "Whistling double-wall milk boiler — no more boil-overs.", specs: [["Capacity", "3 L"]], tags: ["milk boiler"] },

  // Small kitchen appliances
  { name: "Mixer Grinder 750 W with 3 Jars", cat: "kitchen-appliances", price: 379900, mrp: 549900, cost: 290000, stock: 25, shape: "mixer", palette: "appliance", gst: 18, hsn: "8509", featured: true, emi: true, warranty: "2 years",
    short: "Powerful 750 W motor with stainless steel jars for dry, wet and chutney grinding.", specs: [["Power", "750 W"], ["Jars", "3 (1.5 L, 1 L, 0.4 L)"], ["Speed", "3 + pulse"]], tags: ["mixer", "grinder"] },
  { name: "Table Top Wet Grinder 2 L", cat: "kitchen-appliances", price: 649900, mrp: 849900, cost: 500000, stock: 14, shape: "pot", palette: "appliance", gst: 18, hsn: "8509", emi: true, warranty: "2 years",
    short: "Stone-roller wet grinder for soft idli and dosa batter.", specs: [["Capacity", "2 L"], ["Motor", "150 W"], ["Drum", "Stainless steel"]], tags: ["wet grinder", "idli", "dosa"] },
  { name: "Induction Cooktop 2000 W", cat: "kitchen-appliances", price: 249900, mrp: 349900, cost: 180000, stock: 30, shape: "stove", palette: "appliance", gst: 18, hsn: "8516", warranty: "1 year",
    short: "Feather-touch induction with 8 preset Indian menus and auto shut-off.", specs: [["Power", "2000 W"], ["Presets", "8"]], tags: ["induction"] },
  { name: "3 Burner Glass Top Gas Stove", cat: "kitchen-appliances", price: 459900, mrp: 649900, cost: 340000, stock: 16, shape: "stove", palette: "appliance", gst: 18, hsn: "7321", emi: true, warranty: "2 years",
    short: "Toughened glass top with brass burners and auto ignition.", specs: [["Burners", "3 brass"], ["Ignition", "Auto"], ["Top", "Toughened glass"]], tags: ["gas stove", "burner"] },
  { name: "Electric Kettle 1.5 L Stainless Steel", cat: "kitchen-appliances", price: 99900, mrp: 149900, cost: 65000, stock: 60, shape: "flask", palette: "appliance", gst: 18, hsn: "8516", warranty: "1 year",
    short: "Fast boiling 1500 W kettle with auto cut-off and boil-dry protection.", specs: [["Capacity", "1.5 L"], ["Power", "1500 W"]], tags: ["kettle"] },
  { name: "High-Speed Ceiling Fan 1200 mm", cat: "kitchen-appliances", price: 229900, mrp: 299900, cost: 165000, stock: 40, shape: "fan", palette: "appliance", gst: 18, hsn: "8414", warranty: "2 years",
    short: "Energy-efficient 400 RPM ceiling fan with anti-dust coating.", specs: [["Sweep", "1200 mm"], ["Speed", "400 RPM"]], tags: ["fan", "ceiling fan"] },

  // Large appliances
  { name: "Double Door Frost-Free Refrigerator 340 L", cat: "large-appliances", price: 3699000, mrp: 4499000, cost: 3200000, stock: 6, shape: "fridge", palette: "appliance", gst: 18, hsn: "8418", featured: true, emi: true, warranty: "1 year + 10 years compressor",
    short: "3-star inverter compressor, convertible freezer and toughened glass shelves.", specs: [["Capacity", "340 L"], ["Energy rating", "3 Star"], ["Compressor", "Digital inverter"]], tags: ["fridge", "refrigerator"] },
  { name: "Single Door Refrigerator 190 L", cat: "large-appliances", price: 1699000, mrp: 1999000, cost: 1450000, stock: 9, shape: "fridge", palette: "appliance", gst: 18, hsn: "8418", emi: true, warranty: "1 year + 10 years compressor",
    short: "Direct-cool refrigerator with base stand drawer, 4-star rating.", specs: [["Capacity", "190 L"], ["Energy rating", "4 Star"]], tags: ["fridge", "refrigerator"] },
  { name: "Front Load Washing Machine 7 kg", cat: "large-appliances", price: 2999000, mrp: 3799000, cost: 2600000, stock: 5, shape: "washer", palette: "appliance", gst: 18, hsn: "8450", emi: true, warranty: "2 years + 10 years motor",
    short: "Inverter motor, in-built heater and 1200 RPM spin for deep cleaning.", specs: [["Capacity", "7 kg"], ["Spin", "1200 RPM"], ["Motor", "Inverter"]], tags: ["washing machine"] },
  { name: "Semi-Automatic Washing Machine 8 kg", cat: "large-appliances", price: 1249000, mrp: 1599000, cost: 1050000, stock: 8, shape: "washer", palette: "appliance", gst: 18, hsn: "8450", emi: true, warranty: "2 years",
    short: "Twin-tub washer with rust-proof body and lint filter.", specs: [["Capacity", "8 kg"], ["Type", "Twin tub"]], tags: ["washing machine"] },
  { name: "1.5 Ton 5 Star Inverter Split AC", cat: "large-appliances", price: 4299000, mrp: 5999000, cost: 3750000, stock: 7, shape: "ac", palette: "appliance", gst: 28, hsn: "8415", featured: true, emi: true, warranty: "1 year + 10 years compressor",
    short: "Copper condenser, 4-in-1 convertible cooling and PM 2.5 filter.", specs: [["Capacity", "1.5 Ton"], ["Energy rating", "5 Star"], ["Condenser", "100% copper"]], tags: ["ac", "air conditioner", "inverter"] },
  { name: "Desert Air Cooler 70 L", cat: "large-appliances", price: 899000, mrp: 1199000, cost: 700000, stock: 11, shape: "box", palette: "appliance", gst: 18, hsn: "8479", emi: true, warranty: "1 year",
    short: "Honeycomb pads, 50 ft air throw and inverter compatibility.", specs: [["Tank", "70 L"], ["Air throw", "50 ft"]], tags: ["cooler", "air cooler"] },

  // TVs & sound
  { name: "55 inch 4K UHD Smart LED TV", cat: "tv-electronics", price: 3899000, mrp: 5499000, cost: 3400000, stock: 6, shape: "tv", palette: "tv", gst: 18, hsn: "8528", featured: true, emi: true, warranty: "1 year",
    short: "4K HDR, Dolby Audio, built-in streaming apps and voice remote.", specs: [["Screen", "55 inch"], ["Resolution", "4K UHD (3840×2160)"], ["Sound", "30 W Dolby Audio"]], tags: ["tv", "4k", "smart tv"] },
  { name: "43 inch Full HD Smart LED TV", cat: "tv-electronics", price: 2199000, mrp: 2999000, cost: 1900000, stock: 10, shape: "tv", palette: "tv", gst: 18, hsn: "8528", emi: true, warranty: "1 year",
    short: "Full HD smart TV with screen mirroring and 20 W speakers.", specs: [["Screen", "43 inch"], ["Resolution", "Full HD"]], tags: ["tv", "smart tv"] },
  { name: "65 inch QLED 4K Smart TV", cat: "tv-electronics", price: 6999000, mrp: 9999000, cost: 6200000, stock: 3, shape: "tv", palette: "tv", gst: 18, hsn: "8528", emi: true, warranty: "1 year",
    short: "Quantum dot colour, 120 Hz motion and hands-free voice control.", specs: [["Screen", "65 inch"], ["Panel", "QLED"], ["Refresh", "120 Hz"]], tags: ["tv", "qled", "4k"] },
  { name: "5.1 Channel Home Theatre System", cat: "tv-electronics", price: 1499000, mrp: 2199000, cost: 1250000, stock: 8, shape: "speaker", palette: "tv", gst: 18, hsn: "8518", emi: true, warranty: "1 year",
    short: "Cinematic surround sound with Bluetooth, USB and optical input.", specs: [["Channels", "5.1"], ["Output", "500 W"]], tags: ["home theatre", "speaker"] },
  { name: "Soundbar with Wireless Subwoofer 160 W", cat: "tv-electronics", price: 899000, mrp: 1399000, cost: 720000, stock: 12, shape: "speaker", palette: "tv", gst: 18, hsn: "8518", emi: true, warranty: "1 year",
    short: "Slim soundbar with deep bass subwoofer and HDMI ARC.", specs: [["Output", "160 W"], ["Connectivity", "Bluetooth, HDMI ARC, Optical"]], tags: ["soundbar"] },
  { name: "Rechargeable LED Emergency Light", cat: "tv-electronics", price: 69900, mrp: 99900, cost: 42000, stock: 70, shape: "lamp", palette: "tv", gst: 18, hsn: "9405", warranty: "6 months",
    short: "Up to 8 hours backup with 3 brightness modes.", specs: [["Backup", "Up to 8 hours"], ["Modes", "3"]], tags: ["emergency light"] },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  console.log("Seeding categories…");
  const catIds: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const parent = await db.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, name: c.name, description: c.description, sortOrder: c.sort },
      update: { name: c.name, description: c.description, sortOrder: c.sort },
    });
    catIds[c.slug] = parent.id;
    for (const [i, ch] of c.children.entries()) {
      const child = await db.category.upsert({
        where: { slug: ch.slug },
        create: { slug: ch.slug, name: ch.name, parentId: parent.id, sortOrder: i },
        update: { name: ch.name, parentId: parent.id },
      });
      catIds[ch.slug] = child.id;
    }
  }

  console.log("Seeding products…");
  for (const [i, p] of P.entries()) {
    const s = slug(p.name);
    const label = p.material ?? "Sun Metals Store";
    const img1 = await makeImage(`seed-${s}.webp`, p.shape, p.palette, label);
    const img2 = await makeImage(`seed-${s}-2.webp`, p.shape, p.palette, label, i % 2 ? 1 : -1);
    const data = {
      name: p.name, sku: `SM-${String(i + 1).padStart(4, "0")}`, brand: p.brand ?? null, material: p.material ?? null,
      shortDescription: p.short,
      description: `${p.short}\n\nSold and shipped by Sun Metals Store, Cheyyur. GST invoice provided with every order. ${p.engraving ? "Personalise this product with our high-precision fiber laser engraving — add a name, date or logo at checkout." : ""}`.trim(),
      categoryId: catIds[p.cat], price: p.price, mrp: p.mrp, costPrice: p.cost, gstRate: p.gst ?? 18, hsnCode: p.hsn ?? null,
      stock: p.stock, specs: p.specs.map(([label, value]) => ({ label, value })), tags: p.tags,
      isFeatured: Boolean(p.featured), engravingAvailable: Boolean(p.engraving), emiEligible: p.emi ?? p.price >= 300000,
      warranty: p.warranty ?? null,
    };
    const product = await db.product.upsert({ where: { slug: s }, create: { slug: s, ...data }, update: data });
    await db.productImage.deleteMany({ where: { productId: product.id } });
    await db.productImage.createMany({ data: [{ productId: product.id, url: img1, alt: p.name, sortOrder: 0 }, { productId: product.id, url: img2, alt: p.name, sortOrder: 1 }] });
  }

  console.log("Seeding banners, settings, coupons…");
  if ((await db.banner.count()) === 0) {
    await db.banner.createMany({
      data: [
        { title: "Pure Brass & Silver for Every Occasion", subtitle: "Traditional vessels, puja items and wedding return gifts — engraved with your name.", image: await makeBanner("hero-brass.webp", ["#7a2e12", "#c2741f"], ["lamp", "kadai"]), ctaLabel: "Shop Brass & Silver", ctaHref: "/category/traditional-cookware", sortOrder: 0 },
        { title: "Big Appliances, Easy EMIs", subtitle: "No-cost & low-cost EMI on cards, Bajaj Finserv and cardless EMI via Razorpay.", image: await makeBanner("hero-emi.webp", ["#12284a", "#2f5f9e"], ["tv", "fridge"]), ctaLabel: "Explore Appliances", ctaHref: "/category/large-appliances", sortOrder: 1 },
        { title: "Hotel & Corporate Supply", subtitle: "Bulk supply and installation of commercial ACs, hospitality TVs and kitchen fittings.", image: await makeBanner("hero-b2b.webp", ["#173b2f", "#2f7a5c"], ["ac", "pot"]), ctaLabel: "Request a B2B Quote", ctaHref: "/b2b", sortOrder: 2 },
      ],
    });
  }
  const settings: Record<string, string> = {
    announcement: "Free shipping on orders above ₹999 · Easy EMI on purchases above ₹3,000 · Custom laser engraving available",
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.siteSetting.upsert({ where: { key }, create: { key, value }, update: {} });
  }
  await db.coupon.upsert({
    where: { code: "WELCOME10" },
    create: { code: "WELCOME10", description: "10% off your first order (max ₹500)", type: "PERCENT", value: 10, maxDiscount: 50000, minOrderAmount: 99900 },
    update: {},
  });

  console.log("Seeding admin user…");
  const email = (process.env.ADMIN_EMAIL || "admin@sunmetals.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) throw new Error("Set ADMIN_PASSWORD (8+ chars) in .env before seeding");
  if (process.env.NODE_ENV === "production") {
    const weak = password.length < 12 || /changeme|password|admin|123456/i.test(password) || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password);
    if (weak) throw new Error("ADMIN_PASSWORD is too weak for production: use 12+ characters with upper/lower case letters and numbers, not a default value.");
  }
  await db.user.upsert({
    where: { email },
    create: { email, name: "Thamin Ansari A", phone: "+919790354931", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
    update: { role: "ADMIN" },
  });

  if (process.env.SEED_DEMO === "1") {
    if (process.env.NODE_ENV === "production") throw new Error("Refusing to create demo orders/customers in production.");
    await seedDemo();
  }
  console.log("Done.");
}

async function seedDemo() {
  console.log("Seeding DEMO customers, orders, reviews and analytics…");
  const products = await db.product.findMany({ include: { images: { take: 1 } } });
  const names = ["Priya Raman", "Karthik S", "Anitha M", "Mohammed Irfan", "Lakshmi N", "Suresh Kumar", "Divya P", "Arun Prakash", "Fathima B", "Vignesh R"];
  const cities = ["Chennai", "Chengalpattu", "Kanchipuram", "Puducherry", "Tindivanam", "Madurantakam"];
  const users = [];
  for (const [i, n] of names.entries()) {
    users.push(await db.user.upsert({
      where: { email: `demo${i}@example.com` },
      create: { email: `demo${i}@example.com`, name: n, phone: `98400000${String(i).padStart(2, "0")}`, passwordHash: await bcrypt.hash("Demo@1234", 10) },
      update: {},
    }));
  }
  const methods: { method: string; details: Prisma.InputJsonValue }[] = [
    { method: "upi", details: { upiHandle: "***@okhdfcbank" } },
    { method: "card", details: { cardNetwork: "Visa", cardType: "credit", cardLast4: "1111" } },
    { method: "emi", details: { emiIssuer: "HDFC", emiTenureMonths: 6, emiRate: "1500" } },
    { method: "cardless_emi", details: { provider: "bajaj" } },
    { method: "netbanking", details: { bank: "SBIN" } },
    { method: "upi", details: { upiHandle: "***@ybl" } },
  ];
  const now = Date.now();
  for (let d = 89; d >= 0; d--) {
    const day = new Date(now - d * 86400000);
    const visitors = 30 + Math.floor(Math.random() * 40) + (89 - d) / 2;
    const events: Prisma.AnalyticsEventCreateManyInput[] = [];
    for (let v = 0; v < visitors; v++) {
      const vid = `demo${d}x${v}`.padEnd(24, "0").slice(0, 24);
      const at = new Date(day.getTime() - Math.floor(Math.random() * 86400000));
      events.push({ type: "PAGE_VIEW", visitorId: vid, path: "/", createdAt: at });
      const p = products[Math.floor(Math.random() * products.length)];
      events.push({ type: "PRODUCT_VIEW", visitorId: vid, productId: p.id, path: `/product/${p.slug}`, createdAt: at });
      if (Math.random() < 0.25) events.push({ type: "ADD_TO_CART", visitorId: vid, productId: p.id, value: p.price, createdAt: at });
      if (Math.random() < 0.08) events.push({ type: "CHECKOUT_START", visitorId: vid, createdAt: at });
    }
    await db.analyticsEvent.createMany({ data: events });

    const ordersToday = Math.floor(Math.random() * 4) + (d % 7 === 0 ? 2 : 0);
    for (let o = 0; o < ordersToday; o++) {
      const u = users[Math.floor(Math.random() * users.length)];
      const picks = [...products].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));
      const items = picks.map((p) => ({ productId: p.id, name: p.name, sku: p.sku, image: p.images[0]?.url, unitPrice: p.price, quantity: 1 + Math.floor(Math.random() * 2), gstRate: p.gstRate }));
      const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
      const at = new Date(day.getTime() - Math.floor(Math.random() * 86400000));
      const pay = subtotal > 1500000 ? methods[2 + Math.floor(Math.random() * 2)] : methods[Math.floor(Math.random() * methods.length)];
      const statusRoll = Math.random();
      const status = d > 7 ? (statusRoll < 0.9 ? "DELIVERED" : "CANCELLED") : statusRoll < 0.4 ? "PAID" : statusRoll < 0.7 ? "PROCESSING" : "SHIPPED";
      const city = cities[Math.floor(Math.random() * cities.length)];
      await db.order.create({
        data: {
          orderNumber: `SMDEMO${d}${o}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          userId: u.id, email: u.email, phone: u.phone ?? "", status: status as never,
          shippingAddress: { name: u.name, phone: u.phone, line1: "12, Main Road", city, state: "Tamil Nadu", pincode: "603302" },
          subtotal, taxTotal: Math.round(subtotal * 0.15), shippingFee: subtotal >= 99900 ? 0 : 7900, total: subtotal + (subtotal >= 99900 ? 0 : 7900),
          paymentMethod: pay.method, paymentDetails: pay.details, paidAt: at, stockCommitted: true, createdAt: at,
          razorpayOrderId: `order_demo_${d}_${o}_${Math.random().toString(36).slice(2, 8)}`,
          items: { create: items },
        },
      });
    }
  }
  for (const p of products.slice(0, 20)) {
    const reviewers = users.slice(0, 2 + Math.floor(Math.random() * 5));
    for (const u of reviewers) {
      await db.review.upsert({
        where: { productId_userId: { productId: p.id, userId: u.id } },
        create: { productId: p.id, userId: u.id, rating: 3 + Math.floor(Math.random() * 3), title: ["Excellent quality", "Value for money", "Good product", "Very sturdy", "Fast delivery"][Math.floor(Math.random() * 5)], body: "Product as described. Packing was good and delivery was quick.", verifiedPurchase: true },
        update: {},
      });
    }
    const agg = await db.review.aggregate({ where: { productId: p.id }, _avg: { rating: true }, _count: true });
    await db.product.update({ where: { id: p.id }, data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count } });
  }
  await db.lead.createMany({
    data: [
      { type: "B2B_QUOTE", name: "Ramesh Kannan", company: "Sea Breeze Resort, Mahabalipuram", phone: "9840012345", email: "purchase@seabreeze.example", city: "Mahabalipuram", message: "Need 24 hospitality TVs (43 inch) and 18 cassette ACs with installation.", details: { requirement: "Commercial Air Conditioning, Hospitality TVs", quantity: "42 units", timeline: "Within 1 month" } },
      { type: "ENGRAVING", name: "Sangeetha", phone: "9876500000", message: "200 brass kumkum bowls engraved with 'Arjun weds Meera, 12 Dec'", details: { product: "Brass kumkum bowl", quantity: "200", text: "Arjun weds Meera · 12.12" } },
      { type: "CONTACT", name: "Joseph", phone: "9123456780", message: "Do you deliver wet grinders to Puducherry?" },
    ],
  });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
