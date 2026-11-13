const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true } });
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data.json');

app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname));

let db = { tables: [], menu: [], orders: [], kot: [], staffUsers: [], posUsers: [] };
try {
  if (fs.existsSync(DB_FILE)) db = { ...db, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
  if (!Array.isArray(db.staffUsers)) db.staffUsers = [];
  if (!Array.isArray(db.posUsers)) db.posUsers = [];
} catch (_) {}

const persist = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
const byOutlet = (arr, out) => (out && out !== 'Head Office') ? arr.filter(x => x.outlet === out) : arr;

app.get('/api/network-info', (req, res) => { const proto = req.headers['x-forwarded-proto'] || req.protocol; const host = req.headers['x-forwarded-host'] || req.get('host'); if (host && !host.includes('127.0.0.1') && !host.includes('localhost')) return res.json({ publicUrl: proto + '://' + host, localIp: host, port: '' });
  let tunnelUrl = '', ip = '127.0.0.1';
  const nets = os.networkInterfaces();
  for (const n of Object.keys(nets)) for (const net of nets[n]) if (net.family === 'IPv4' && !net.internal) ip = net.address;
  try {
    const lf = path.join(__dirname, 'tunnel.log');
    if (fs.existsSync(lf)) {
      const m = fs.readFileSync(lf, 'utf8').match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/g);
      if (m && m.length) tunnelUrl = m[m.length - 1];
    }
  } catch (_) {}
  res.json({ ip, port: PORT, tunnelUrl });
});

app.get('/api/qr-image', async (req, res) => {
  if (!req.query.text) return res.status(400).send('Missing');
  res.setHeader('Content-Type', 'image/png');
  res.send(await QRCode.toBuffer(String(req.query.text), { width: 320, margin: 2 }));
});

app.get('/api/staff-users', (req, res) => res.json(byOutlet(db.staffUsers, String(req.query.outlet || '').trim())));
app.post('/api/staff-users', (req, res) => {
  const { role, phone, password, outlet } = req.body || {};
  if (!phone || !password) return res.status(400).json({ error: 'Number & Password required' });
  if (db.staffUsers.some(u => u.phone === String(phone).trim())) return res.status(409).json({ error: 'Number exists' });
  const u = { id: crypto.randomUUID(), role: role || 'Waiter', phone: String(phone).trim(), password: String(password).trim(), outlet: String(outlet || 'RestaurantPro - Andhra Pradesh').trim() };
  db.staffUsers.push(u); persist(); res.status(201).json(u);
});
app.patch('/api/staff-users/:id', (req, res) => {
  const u = db.staffUsers.find(x => x.id === req.params.id); if (!u) return res.status(404).end();
  if (req.body.role) u.role = req.body.role;
  if (req.body.phone) u.phone = String(req.body.phone).trim();
  if (req.body.password) u.password = String(req.body.password).trim();
  persist(); res.json(u);
});
app.delete('/api/staff-users/:id', (req, res) => { db.staffUsers = db.staffUsers.filter(u => u.id !== req.params.id); persist(); res.json({ ok: true }); });
app.post('/api/staff-login', (req, res) => {
  const u = db.staffUsers.find(x => x.phone === String(req.body.phone || '').trim() && x.password === String(req.body.password || '').trim());
  if (!u) return res.status(401).json({ error: 'Invalid Number or Password' });
  res.json(u);
});
app.get('/api/pos-users', (req, res) => res.json(byOutlet(db.posUsers, String(req.query.outlet || '').trim())));
app.post('/api/pos-users', (req, res) => {
  const { name, phone, password, outlet } = req.body || {};
  if (!name || !phone || !/^\d{4}$/.test(String(password || '').trim())) return res.status(400).json({ error: 'Name, Number & 4-digit PIN required' });
  if (db.posUsers.some(u => u.phone === String(phone).trim())) return res.status(409).json({ error: 'Number exists' });
  const u = { id: crypto.randomUUID(), name: String(name).trim(), phone: String(phone).trim(), password: String(password).trim(), outlet: String(outlet || 'RestaurantPro - Andhra Pradesh').trim() };
  db.posUsers.push(u); persist(); res.status(201).json(u);
});
app.patch('/api/pos-users/:id', (req, res) => {
  const u = db.posUsers.find(x => x.id === req.params.id); if (!u) return res.status(404).end();
  if (req.body.name) u.name = String(req.body.name).trim();
  if (req.body.phone) u.phone = String(req.body.phone).trim();
  if (req.body.password && /^\d{4}$/.test(String(req.body.password).trim())) u.password = String(req.body.password).trim();
  persist(); res.json(u);
});
app.delete('/api/pos-users/:id', (req, res) => { db.posUsers = db.posUsers.filter(u => u.id !== req.params.id); persist(); res.json({ ok: true }); });
app.post('/api/pos-login', (req, res) => {
  const u = db.posUsers.find(x => x.phone === String(req.body.phone || '').trim() && x.password === String(req.body.password || '').trim());
  if (!u) return res.status(401).json({ error: 'Invalid Number or 4-Digit PIN' });
  res.json(u);
});

app.get('/api/tables', (req, res) => res.json(byOutlet(db.tables, String(req.query.outlet || '').trim())));
app.post('/api/tables', (req, res) => {
  const name = String(req.body.name || '').trim(); if (!name) return res.status(400).json({ error: 'Required' });
  const row = { id: crypto.randomUUID(), name, outlet: String(req.body.outlet || 'Main Outlet').trim(), type: req.body.type || 'Dine In', active: true };
  db.tables.push(row); persist(); io.emit('tables:changed', row); res.status(201).json(row);
});
app.patch('/api/tables/:id', (req, res) => {
  const t = db.tables.find(x => x.id === req.params.id); if (!t) return res.status(404).end();
  if (typeof req.body.active === 'boolean') t.active = req.body.active;
  if (req.body.name) t.name = String(req.body.name).trim();
  persist(); io.emit('tables:changed', t); res.json(t);
});

app.get('/api/menu', (req, res) => {
  const out = String(req.query.outlet || '').trim();
  res.json(out && out !== 'Head Office' ? db.menu.filter(m => !m.outlet || m.outlet === out || m.activeAllAreas) : db.menu);
});
app.post('/api/menu/sync', (req, res) => {
  const outlet = String(req.body.outlet || 'Main Outlet').trim();
  const inc = (req.body.items || []).map((x, i) => ({ id: String(x.id ?? `${outlet}-${i+1}`), name: String(x.name || x.itemName || '').trim(), category: String(x.category || 'Other'), price: Number(x.price ?? x.sellingPrice ?? 0), outlet, activeAllAreas: true, available: true })).filter(x => x.name);
  db.menu = db.menu.filter(m => m.outlet !== outlet).concat(inc); persist(); io.emit('menu:changed', { outlet }); res.json({ ok: true, count: inc.length });
});

app.get('/api/orders', (req, res) => res.json(byOutlet(db.orders, String(req.query.outlet || '').trim())));
app.post('/api/orders', (req, res) => {
  const b = req.body || {};
  const isDirect = ['Waiter', 'Captain', 'Manager', 'POS'].includes(b.source);
  const table = b.tableId ? db.tables.find(t => t.id === b.tableId) : null;
  if (!isDirect && !table) return res.status(400).json({ error: 'Table inactive' });
  const items = (b.items || []).map(i => ({ itemId: String(i.itemId), name: String(i.name), qty: Math.max(1, Number(i.qty) || 1), price: Number(i.price) || 0 }));
  if (!items.length) return res.status(400).json({ error: 'Empty cart' });
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const gst = Number((subtotal * 0.05).toFixed(2));
  const total = Number((subtotal + gst).toFixed(2));
  const order = {
    id: crypto.randomUUID(), orderNo: (isDirect ? 'ORD-' : 'QR-') + String(Date.now()).slice(-7),
    source: isDirect ? b.source : 'QR', waiterName: isDirect ? `${b.source} (${b.waiterPhone || ''})` : '',
    type: b.orderType || (table ? table.type : 'Dine In'), tableId: table ? table.id : '',
    tableName: String(b.tableName || (table ? table.name : 'Counter')), outlet: String(b.outlet || (table ? table.outlet : 'Main Outlet')),
    items, subtotal, gst, total, paymentMethod: b.paymentMethod || 'Cash',
    paymentStatus: isDirect ? 'Billed' : 'Pending', status: isDirect ? 'Accepted' : 'Pending Approval',
    createdAt: new Date().toISOString(), customerNote: String(b.customerNote || '')
  };
  if (isDirect) {
    order.kotNo = 'KOT-' + String(Date.now()).slice(-6); order.billNo = 'RP-' + String(Date.now()).slice(-8);
    const tkt = { id: crypto.randomUUID(), kotNo: order.kotNo, billNo: order.billNo, orderId: order.id, orderNo: order.orderNo, tableName: order.tableName, orderType: `${order.type} (${order.source})`, outlet: order.outlet, items: order.items, customerNote: order.customerNote, total: order.total, status: 'New', createdAt: order.createdAt };
    db.kot.unshift(tkt); io.emit('kot:changed', tkt);
  }
  db.orders.unshift(order); persist(); io.emit('orders:changed', order);
  if (!isDirect) io.emit('orders:new_qr', order);
  res.status(201).json(order);
});

app.patch('/api/orders/:id', (req, res) => {
  const o = db.orders.find(x => x.id === req.params.id); if (!o) return res.status(404).end();
  o.status = String(req.body.status || o.status);
  if (o.status === 'Accepted' && !o.kotNo) {
    o.kotNo = 'KOT-' + String(Date.now()).slice(-6); o.billNo = 'RP-' + String(Date.now()).slice(-8);
    const tkt = { id: crypto.randomUUID(), kotNo: o.kotNo, billNo: o.billNo, orderId: o.id, orderNo: o.orderNo, tableName: o.tableName, orderType: o.type, outlet: o.outlet, items: o.items, customerNote: o.customerNote, total: o.total, status: 'New', createdAt: new Date().toISOString() };
    db.kot.unshift(tkt); io.emit('kot:changed', tkt);
  }
  const k = db.kot.find(x => x.orderId === o.id);
  if (k && ['Preparing', 'Ready', 'Completed'].includes(o.status)) k.status = o.status;
  persist(); io.emit('orders:changed', o); if (k) io.emit('kot:changed', k); res.json(o);
});

app.get('/api/kot', (req, res) => res.json(byOutlet(db.kot, String(req.query.outlet || '').trim())));
app.patch('/api/kot/:id', (req, res) => {
  const k = db.kot.find(x => x.id === req.params.id); if (!k) return res.status(404).end();
  k.status = String(req.body.status || 'New');
  const o = db.orders.find(x => x.id === k.orderId); if (o) o.status = k.status === 'New' ? 'Accepted' : k.status;
  persist(); io.emit('kot:changed', k); if (o) io.emit('orders:changed', o); res.json(k);
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
// ================= TRAINING ACADEMY PART 1: 13 ROLE SOPs =================
if (!Array.isArray(db.sops)) db.sops = [
  { id: 'sop-1', role: 'Unit Manager', title: 'Daily Outlet Opening & Closing Audit', time: '08:30 AM - 10:30 PM', steps: ['Check kitchen hygiene & chiller temperatures (below 4°C)', 'Verify POS cash float & staff grooming checklist', 'Review daily sales target & KDS speed with Shift Manager'], mcqs: [{ q: 'Chiller ka ideal temperature kya hona chahiye?', opts: ['15°C', '4°C se kam', '25°C', '10°C'], ans: 1 }] },
  { id: 'sop-2', role: 'Cashier', title: 'POS Billing & Cash Drawer Reconciliation', time: 'Shift Start & End', steps: ['Count opening cash float before first bill', 'Verify UPI payment alert before closing QR order', 'Tally Z-Report with physical cash & card slips'], mcqs: [{ q: 'QR UPI order accept karne se pehle kya check karein?', opts: ['Customer naam', 'Payment verification / UPI receipt', 'Table color', 'Kuch nahi'], ans: 1 }] },
  { id: 'sop-3', role: 'Sweet Boy', title: 'Sweet Counter Display & Hygiene SOP', time: '09:00 AM Daily', steps: ['Wipe glass counter with food-grade sanitizer', 'Arrange fresh trays using FIFO (First-In, First-Out)', 'Always wear gloves & hairnet while packing sweets'], mcqs: [{ q: 'Mithai counter par kaun sa rule follow hota hai?', opts: ['LIFO', 'FIFO (First-In, First-Out)', 'Random', 'Koi nahi'], ans: 1 }] },
  { id: 'sop-4', role: 'Chaat Boy', title: 'Chaat Counter Prep & Crispness SOP', time: '11:00 AM Daily', steps: ['Check freshness & cold temperature of curd and chutneys', 'Keep puris in airtight moisture-free containers', 'Assemble chaat only after KOT arrives so it stays crispy'], mcqs: [{ q: 'Chaat assemble kab karni chahiye?', opts: ['Subah bana kar rakh dein', 'KOT order aane ke turant baad', '2 ghante pehle', 'Kabhi bhi'], ans: 1 }] },
  { id: 'sop-5', role: 'Housekeeping', title: '30-Minute Dining & Washroom Sanitization', time: 'Every 30 Mins', steps: ['Sanitize dining tables immediately after guest leaves', 'Check and clean guest washrooms every 30 minutes', 'Keep wet-floor caution sign during mopping'], mcqs: [{ q: 'Guest washroom ki safai kitni der mein check honi chahiye?', opts: ['Din mein ek baar', 'Har 30 minute mein', 'Sirf raat ko', 'Hafte mein'], ans: 1 }] },
  { id: 'sop-6', role: 'Waiter', title: '3-Minute Guest Greeting & Table Service', time: 'Service Hours', steps: ['Greet guest with smile & serve water within 3 minutes', 'Repeat order clearly before punching or serving', 'Clear empty plates within 2 minutes of meal completion'], mcqs: [{ q: 'Guest baithne ke kitni der mein water & greeting honi chahiye?', opts: ['15 minute', '3 minute ke andar', '30 minute', 'Order ke baad'], ans: 1 }] },
  { id: 'sop-7', role: 'Captain', title: 'Floor Management & Upselling SOP', time: 'Service Hours', steps: ['Assign tables evenly and monitor peak hour waiting', 'Suggest signature dishes, sweets or shakes while taking order', 'Verify KDS ready alerts and ensure hot food delivery'], mcqs: [{ q: 'Order lete samay Captain ko kya suggest karna chahiye?', opts: ['Kuch nahi', 'Signature dishes, shakes ya sweets (Upselling)', 'Sirf paani', 'Bill'], ans: 1 }] },
  { id: 'sop-8', role: 'Shift Manager', title: 'Peak Hour KDS & Floor Handover SOP', time: 'Shift Change', steps: ['Conduct 10-minute pre-shift briefing with all staff', 'Monitor KDS ticket timer (target under 12 mins)', 'Log pending maintenance or stock shortage in handover book'], mcqs: [{ q: 'KDS par average order preparation target kitna hona chahiye?', opts: ['45 mins', '12 mins se kam', '30 mins', '1 ghanta'], ans: 1 }] },
  { id: 'sop-9', role: 'Chef', title: 'Standardized Recipe & Zero-Wastage SOP', time: 'Kitchen Hours', steps: ['Follow exact gram & spoon measurements from Recipe Book', 'Check garnish and plate rim cleanliness before pass', 'Record any spoilage or wastage in kitchen log'], mcqs: [{ q: 'Har outlet par same taste rakhne ke liye kya zaroori hai?', opts: ['Andaze se masale', 'Exact gram aur spoon size follow karna', 'Tez aanch', 'Koi nahi'], ans: 1 }] },
  { id: 'sop-10', role: 'Helper', title: 'Vegetable Prep & Dishwashing Sanitization', time: '08:00 AM - Closing', steps: ['Wash vegetables in food-grade chlorine/salt water', 'Follow 3-sink dishwashing (Wash -> Rinse -> Sanitize)', 'Empty kitchen dustbins whenever 75% full'], mcqs: [{ q: 'Kitchen dustbin kab khali karna chahiye?', opts: ['Overload hone par', '75% bharne par', 'Agle din', 'Hafte mein'], ans: 1 }] },
  { id: 'sop-11', role: 'Admin', title: 'Attendance, Compliance & License Audit', time: 'Daily / Monthly', steps: ['Verify biometric/app punch-in and shift roster daily', 'Track FSSAI, Fire Safety, and Pest Control renewal dates', 'Maintain updated KYC & employee files'], mcqs: [{ q: 'Staff attendance kab verify honi chahiye?', opts: ['Mahine ke ant mein', 'Daily (Rozana)', 'Saal mein ek baar', 'Kabhi nahi'], ans: 1 }] },
  { id: 'sop-12', role: 'Accounts', title: 'Daily Sales & Expense Reconciliation', time: 'Next Day 11:00 AM', steps: ['Match POS net sales with Bank UPI/Card settlements', 'Verify petty cash vouchers with physical bills', 'Generate monthly payroll & advance deductions'], mcqs: [{ q: 'POS UPI/Card sales ko kisse match kiya jata hai?', opts: ['Kitchen KOT se', 'Bank settlement statement se', 'Menu se', 'Table se'], ans: 1 }] },
  { id: 'sop-13', role: 'Raw Store Manager', title: 'FIFO Stock Issue & Expiry Control SOP', time: '09:00 AM - 06:00 PM', steps: ['Weigh and check quality of every incoming vendor delivery', 'Label all dry & cold items with receiving & expiry date', 'Issue older batch stock first (FIFO)'], mcqs: [{ q: 'Vendor se maal aane par sabse pehle kya karein?', opts: ['Seedha store mein rakhein', 'Wajan aur quality check karein', 'Phek dein', 'Bill faad dein'], ans: 1 }] }
];
// ================= TRAINING ACADEMY PART 2: 9 RECIPE CATEGORIES =================
if (!Array.isArray(db.recipes)) db.recipes = [
  { id: 'rec-1', category: 'South Indian', name: 'Masala Dosa', photo: 'https://unsplash.com', prepTime: '6 Mins', yieldQty: '1 Plate', ingredients: [{ item: 'Fermented Dosa Batter', qty: 120, unit: 'ml', spoon: '1 Full Soup Ladle (120ml)' }, { item: 'Spiced Potato Masala', qty: 90, unit: 'gm', spoon: '2 Ice-Cream Scoops' }, { item: 'Pure Desi Ghee', qty: 15, unit: 'ml', spoon: '1 Table Spoon (15ml)' }], steps: ['Heat tawa to 200°C and sprinkle light water.', 'Pour 1 full ladle (120ml) batter and spread thin.', 'Add 1 Table Spoon ghee, 2 scoops masala in center and fold crisp.'], mcqs: [{ q: '1 Masala Dosa ke liye kitna batter ladle use hota hai?', opts: ['50ml', '1 Full Ladle (120ml)', '300ml', '1 Tea Spoon'], ans: 1 }] },
  { id: 'rec-2', category: 'South Indian', name: 'Paneer Dosa', photo: 'https://unsplash.com', prepTime: '7 Mins', yieldQty: '1 Plate', ingredients: [{ item: 'Dosa Batter', qty: 120, unit: 'ml', spoon: '1 Full Ladle (120ml)' }, { item: 'Grated Malai Paneer', qty: 80, unit: 'gm', spoon: '1 Katori / Cup' }, { item: 'Chopped Onion & Capsicum', qty: 40, unit: 'gm', spoon: '2 Table Spoons' }], steps: ['Spread 120ml batter on medium-hot tawa.', 'Top with grated paneer, onion, capsicum and roast golden brown.'], mcqs: [{ q: 'Paneer Dosa mein kitna grated paneer dalta hai?', opts: ['20gm', '80gm (1 Cup)', '250gm', '5gm'], ans: 1 }] },
  { id: 'rec-3', category: 'South Indian', name: 'Pyaz (Onion) Dosa', photo: 'https://unsplash.com', prepTime: '6 Mins', yieldQty: '1 Plate', ingredients: [{ item: 'Dosa Batter', qty: 120, unit: 'ml', spoon: '1 Full Ladle' }, { item: 'Finely Chopped Onion', qty: 50, unit: 'gm', spoon: '3 Table Spoons' }, { item: 'Oil / Ghee', qty: 15, unit: 'ml', spoon: '1 Table Spoon' }], steps: ['Sprinkle chopped onion and coriander on hot tawa.', 'Pour 1 ladle batter over onions and roast crisp.'], mcqs: [{ q: 'Pyaz Dosa mein kitna chopped onion padta hai?', opts: ['5gm', '50gm (3 Table Spoons)', '200gm', '1kg'], ans: 1 }] },
  { id: 'rec-4', category: 'North Indian', name: 'Paneer Butter Masala', photo: 'https://unsplash.com', prepTime: '10 Mins', yieldQty: '1 Full Portion (450gm)', ingredients: [{ item: 'Fresh Paneer Cubes', qty: 200, unit: 'gm', spoon: '12 Equal Cubes' }, { item: 'Makhani Tomato Gravy', qty: 220, unit: 'gm', spoon: '2 Full Serving Ladles' }, { item: 'Amul Butter & Cream', qty: 35, unit: 'gm', spoon: '2 Table Spoons' }], steps: ['Simmer 2 ladles makhani gravy with butter for 3 minutes.', 'Add 12 paneer cubes, kasuri methi and fresh cream.'], mcqs: [{ q: 'Paneer Butter Masala ke 1 full portion mein kitne paneer cubes hote hain?', opts: ['4 cubes', '12 Equal Cubes (200gm)', '25 cubes', '2 cubes'], ans: 1 }] },
  { id: 'rec-5', category: 'Continental', name: 'Margherita Thin Crust Pizza', photo: 'https://unsplash.com', prepTime: '9 Mins', yieldQty: '10 Inch Pizza', ingredients: [{ item: 'Pizza Dough Base', qty: 180, unit: 'gm', spoon: '1 Stretched Ball' }, { item: 'Herb Pizza Sauce', qty: 60, unit: 'gm', spoon: '1 Medium Ladle (60ml)' }, { item: 'Mozzarella Cheese', qty: 110, unit: 'gm', spoon: '1 Full Measuring Cup' }], steps: ['Spread 60gm pizza sauce leaving 1cm border.', 'Top with 110gm mozzarella cheese and bake at 260°C for 6-7 mins.'], mcqs: [{ q: '10-inch Pizza par kitni Mozzarella cheese padti hai?', opts: ['30gm', '110gm (1 Full Cup)', '400gm', '10gm'], ans: 1 }] },
  { id: 'rec-6', category: 'Chaat', name: 'Crisp Aloo Tikki Chaat', photo: 'https://unsplash.com', prepTime: '5 Mins', yieldQty: '2 Tikkis / Plate', ingredients: [{ item: 'Stuffed Potato Tikkis', qty: 160, unit: 'gm', spoon: '2 Pieces (80gm each)' }, { item: 'Sweet Beaten Curd', qty: 60, unit: 'ml', spoon: '1 Small Ladle' }, { item: 'Saunth & Mint Chutney', qty: 40, unit: 'ml', spoon: '2 Table Spoons each' }], steps: ['Crisp fry 2 tikkis on tawa until golden brown.', 'Pour 1 ladle curd, 2 tbsp sweet chutney, 2 tbsp green chutney and sev.'], mcqs: [{ q: '1 Plate Aloo Tikki Chaat mein kitni tikkis hoti hain?', opts: ['1 Tikki', '2 Pieces (80gm each)', '5 Tikkis', '4 Tikkis'], ans: 1 }] },
  { id: 'rec-7', category: 'Shakes', name: 'Thick Cafe Cold Coffee', photo: 'https://unsplash.com', prepTime: '3 Mins', yieldQty: '350 ml Glass', ingredients: [{ item: 'Chilled Full-Cream Milk', qty: 220, unit: 'ml', spoon: '1 Measuring Mug' }, { item: 'Coffee Powder', qty: 8, unit: 'gm', spoon: '1.5 Tea Spoons' }, { item: 'Vanilla Ice Cream', qty: 60, unit: 'gm', spoon: '1 Full Ice-Cream Scoop' }], steps: ['Blend milk, coffee, sugar and ice cubes for 35 seconds until frothy.', 'Top with 1 full scoop vanilla ice cream.'], mcqs: [{ q: 'Thick Cold Coffee mein kitna Vanilla Ice Cream dalta hai?', opts: ['Kuch nahi', '1 Full Scoop (60gm)', '5 Scoops', '1 Tea Spoon'], ans: 1 }] },
  { id: 'rec-8', category: 'Ghee Sweet', name: 'Pure Desi Ghee Motichoor Ladoo', photo: 'https://unsplash.com', prepTime: '25 Mins', yieldQty: '1 Kg (22 Ladoos)', ingredients: [{ item: 'Fine Besan', qty: 350, unit: 'gm', spoon: 'Standard Batch Weight' }, { item: 'Pure Cow Desi Ghee', qty: 400, unit: 'gm', spoon: 'Frying + 2 Tbsp Bind' }, { item: 'Sugar Syrup (1-Thread)', qty: 450, unit: 'gm', spoon: 'Exact Ratio' }], steps: ['Fry micro boondi in pure desi ghee on medium heat.', 'Soak in warm 1-thread sugar syrup and shape 45gm uniform ladoos.'], mcqs: [{ q: '1 Kg mein kitne standard Motichoor Ladoo bante hain?', opts: ['10 Ladoos', '22 Ladoos (approx 45gm each)', '50 Ladoos', '5 Ladoos'], ans: 1 }] },
  { id: 'rec-9', category: 'Chhena Sweet', name: 'Kesar Rasmalai', photo: 'https://unsplash.com', prepTime: '30 Mins', yieldQty: '10 Portions (20 Pcs)', ingredients: [{ item: 'Soft Chhena Patties', qty: 500, unit: 'gm', spoon: '20 Sponge Discs' }, { item: 'Reduced Kesar Rabri', qty: 1000, unit: 'ml', spoon: '100ml per Portion' }], steps: ['Boil chhena discs in light sugar syrup for 12 mins.', 'Soak in chilled kesar-pista rabri for 3 hours before serving.'], mcqs: [{ q: '1 Portion Rasmalai mein kitni rabri aur pieces serve hote hain?', opts: ['1 piece + 20ml', '2 Sponge Discs + 100ml Rabri', '5 pieces', '500ml'], ans: 1 }] },
  { id: 'rec-10', category: 'Khoya Sweet', name: 'Ajmeri Kalakand', photo: 'https://unsplash.com', prepTime: '25 Mins', yieldQty: '1 Kg Tray', ingredients: [{ item: 'Fresh Danedar Khoya / Chhena', qty: 850, unit: 'gm', spoon: 'Batch Weight' }, { item: 'Castor Sugar', qty: 220, unit: 'gm', spoon: 'Gradual Mix' }], steps: ['Roast khoya and moist chhena on low-medium flame.', 'Set in greased tray 1.2-inch thick and cut into squares.'], mcqs: [{ q: 'Kalakand ko tray mein kitna mota (thick) set kiya jata hai?', opts: ['0.2 inch', '1.2 inch thick', '5 inch', 'Paper thin'], ans: 1 }] },
  { id: 'rec-11', category: 'Kaju Sweet', name: 'Royal Kaju Katli', photo: 'https://unsplash.com', prepTime: '20 Mins', yieldQty: '1 Kg (45 Diamonds)', ingredients: [{ item: 'Fine Cashew Powder', qty: 650, unit: 'gm', spoon: 'Sieved Fine Powder' }, { item: 'Sugar + Water Syrup', qty: 350, unit: 'gm', spoon: '1-Thread Chashni' }], steps: ['Cook sieved cashew powder in 1-thread sugar syrup until dough leaves pan.', 'Roll to 4mm uniform thickness and cut into diamond shapes.'], mcqs: [{ q: 'Royal Kaju Katli ko kitna patla roll kiya jata hai?', opts: ['15mm', '4mm uniform thickness', '20mm', '1 inch'], ans: 1 }] }
];
// ================= TRAINING ACADEMY PART 3: APIs & PROMOTION ENGINE =================
if (!Array.isArray(db.trainingStaff)) db.trainingStaff = [];
if (!Array.isArray(db.trainingResults)) db.trainingResults = [];

app.get('/api/training/data', (_req, res) => {
  res.json({ sops: db.sops, recipes: db.recipes, staff: db.trainingStaff, results: db.trainingResults });
});

app.post('/api/training/sops', (req, res) => {
  const b = req.body || {};
  const row = { id: 'sop-' + Date.now(), role: String(b.role || 'Waiter'), title: String(b.title || ''), time: String(b.time || 'Daily'), steps: Array.isArray(b.steps) ? b.steps : [], mcqs: Array.isArray(b.mcqs) ? b.mcqs : [] };
  db.sops.unshift(row); persist(); res.status(201).json(row);
});
app.patch('/api/training/sops/:id', (req, res) => {
  const s = db.sops.find(x => x.id === req.params.id); if (!s) return res.status(404).end();
  Object.assign(s, req.body); persist(); res.json(s);
});
app.delete('/api/training/sops/:id', (req, res) => {
  db.sops = db.sops.filter(x => x.id !== req.params.id); persist(); res.json({ ok: true });
});

app.post('/api/training/recipes', (req, res) => {
  const b = req.body || {};
  const row = { id: 'rec-' + Date.now(), category: String(b.category || 'South Indian'), name: String(b.name || ''), photo: String(b.photo || 'https://unsplash.com'), prepTime: String(b.prepTime || '10 Mins'), yieldQty: String(b.yieldQty || '1 Portion'), ingredients: Array.isArray(b.ingredients) ? b.ingredients : [], steps: Array.isArray(b.steps) ? b.steps : [], mcqs: Array.isArray(b.mcqs) ? b.mcqs : [] };
  db.recipes.unshift(row); persist(); res.status(201).json(row);
});
app.patch('/api/training/recipes/:id', (req, res) => {
  const r = db.recipes.find(x => x.id === req.params.id); if (!r) return res.status(404).end();
  Object.assign(r, req.body); persist(); res.json(r);
});
app.delete('/api/training/recipes/:id', (req, res) => {
  db.recipes = db.recipes.filter(x => x.id !== req.params.id); persist(); res.json({ ok: true });
});

app.post('/api/training/staff', (req, res) => {
  const b = req.body || {};
  if (!b.empId || !b.name || !b.password) return res.status(400).json({ error: 'Employee ID, Name & Password required' });
  if (db.trainingStaff.some(x => x.empId.toLowerCase() === String(b.empId).trim().toLowerCase())) return res.status(409).json({ error: 'Employee ID already exists' });
  const row = { id: crypto.randomUUID(), empId: String(b.empId).trim(), name: String(b.name).trim(), role: String(b.role || 'Waiter'), outlet: String(b.outlet || 'Main Outlet'), password: String(b.password).trim(), recipeCats: Array.isArray(b.recipeCats) ? b.recipeCats : ['All'] };
  db.trainingStaff.push(row); persist(); res.status(201).json(row);
});
app.patch('/api/training/staff/:id', (req, res) => {
  const u = db.trainingStaff.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  const b = req.body || {};
  if (b.empId) u.empId = String(b.empId).trim();
  if (b.name) u.name = String(b.name).trim();
  if (b.role) u.role = String(b.role).trim();
  if (b.outlet) u.outlet = String(b.outlet).trim();
  if (b.password) u.password = String(b.password).trim();
  if (Array.isArray(b.recipeCats)) u.recipeCats = b.recipeCats;
  persist();
  res.json(u);
});
app.delete('/api/training/staff/:id', (req, res) => {
  db.trainingStaff = db.trainingStaff.filter(x => x.id !== req.params.id); persist(); res.json({ ok: true });
});
app.post('/api/training/login', (req, res) => {
  const u = db.trainingStaff.find(x => x.empId.toLowerCase() === String(req.body.empId || '').trim().toLowerCase() && x.password === String(req.body.password || '').trim());
  if (!u) return res.status(401).json({ error: 'Invalid Employee ID or Password' });
  res.json(u);
});

app.post('/api/training/submit-test', (req, res) => {
  const b = req.body || {};
  const scorePct = Math.round(Number(b.scorePct) || 0);
  const stars = scorePct >= 90 ? 5 : scorePct >= 75 ? 4 : scorePct >= 60 ? 3 : 2;
  const promoStatus = scorePct >= 85 ? 'Ready for Promotion' : scorePct >= 60 ? 'Qualified (Good)' : 'Retraining Needed';
  const entry = { id: crypto.randomUUID(), empId: String(b.empId), name: String(b.name), role: String(b.role), outlet: String(b.outlet || ''), moduleTitle: String(b.moduleTitle || ''), scorePct, stars, promoStatus, submittedAt: new Date().toISOString() };
  db.trainingResults.unshift(entry); persist(); res.status(201).json(entry);
});
server.listen(PORT, '0.0.0.0', () => console.log('RestaurantPro Server LIVE on port ' + PORT));
