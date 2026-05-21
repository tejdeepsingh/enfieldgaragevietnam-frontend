const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/')) return api(request, env, url);
      if (url.pathname.startsWith('/uploads/')) return serveImage(request, env, url);
      return env.ASSETS.fetch(request);
    } catch (err) {
      return json({ ok: false, error: err.message || 'Server error' }, 500);
    }
  }
};

async function api(request, env, url) {
  const { pathname } = url;
  if (pathname === '/api/health') return json({ ok: true, service: env.SITE_NAME || 'Enfield Garage Vietnam' });
  if (pathname === '/api/public/products') return listPublicProducts(env);
  if (pathname === '/api/public/settings') return publicSettings(env);
  if (pathname === '/api/inquiries' && request.method === 'POST') return createInquiry(request, env);
  if (pathname === '/api/admin/login' && request.method === 'POST') return login(request, env);
  if (pathname === '/api/admin/logout' && request.method === 'POST') return logout();

  if (pathname.startsWith('/api/admin/')) {
    const authed = await requireAdmin(request, env);
    if (!authed.ok) return json({ ok: false, error: 'Unauthorized' }, 401);
    if (pathname === '/api/admin/me') return json({ ok: true, user: env.ADMIN_USER || 'admin' });
    if (pathname === '/api/admin/products' && request.method === 'GET') return listAdminProducts(env);
    if (pathname === '/api/admin/products' && request.method === 'POST') return upsertProduct(request, env);
    if (pathname.match(/^\/api\/admin\/products\/[^/]+$/) && request.method === 'DELETE') return deleteProduct(url.pathname.split('/').pop(), env);
    if (pathname === '/api/admin/inventory' && request.method === 'POST') return updateInventory(request, env);
    if (pathname === '/api/admin/orders' && request.method === 'GET') return listOrders(env);
    if (pathname === '/api/admin/orders' && request.method === 'POST') return updateOrder(request, env);
    if (pathname === '/api/admin/upload' && request.method === 'POST') return uploadImage(request, env);
    if (pathname === '/api/admin/export' && request.method === 'GET') return exportAll(env);
  }
  return json({ ok: false, error: 'Not found' }, 404);
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { ...JSON_HEADERS, ...extraHeaders } });
}

async function listPublicProducts(env) {
  const { results } = await env.DB.prepare(`
    SELECT p.*, COALESCE(i.stock,0) AS stock, COALESCE(i.reserved,0) AS reserved, COALESCE(i.location,'Vietnam') AS location
    FROM products p LEFT JOIN inventory i ON i.product_id=p.id
    ORDER BY p.featured DESC, p.updated_at DESC
  `).all();
  return json({ ok: true, products: results.map(normalizeProduct) });
}

async function listAdminProducts(env) { return listPublicProducts(env); }

async function publicSettings(env) {
  const { results } = await env.DB.prepare('SELECT key,value FROM settings').all();
  return json({ ok: true, settings: Object.fromEntries(results.map(r => [r.key, r.value])) });
}

function normalizeProduct(p) {
  return { ...p, compatibility: safeParse(p.compatibility, []), featured: !!p.featured, stock: Number(p.stock || 0), reserved: Number(p.reserved || 0) };
}
function safeParse(v, fallback) { try { return JSON.parse(v || ''); } catch { return fallback; } }
function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80); }

async function createInquiry(request, env) {
  const body = await request.json();
  const id = `inq_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const items = Array.isArray(body.items) ? body.items : [];
  await env.DB.prepare(`INSERT INTO orders (id,customer_name,phone,email,channel,address,notes,currency,total_amount,items) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .bind(id, body.customer_name || 'Customer', body.phone || '', body.email || '', body.channel || 'inquiry', body.address || '', body.notes || '', body.currency || 'VND', Number(body.total_amount || 0), JSON.stringify(items))
    .run();
  return json({ ok: true, order_id: id, message: 'Inquiry saved. Owner will confirm stock and payment.' });
}

async function upsertProduct(request, env) {
  const p = await request.json();
  const id = p.id || slug(p.sku || p.name_en || crypto.randomUUID());
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO products (id, sku, category, name_en, name_vi, description_en, description_vi, condition, compatibility, price_vnd, price_usd, price_inr, status, featured, image_url, image_key, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      sku=excluded.sku, category=excluded.category, name_en=excluded.name_en, name_vi=excluded.name_vi,
      description_en=excluded.description_en, description_vi=excluded.description_vi, condition=excluded.condition,
      compatibility=excluded.compatibility, price_vnd=excluded.price_vnd, price_usd=excluded.price_usd,
      price_inr=excluded.price_inr, status=excluded.status, featured=excluded.featured, image_url=excluded.image_url,
      image_key=excluded.image_key, updated_at=excluded.updated_at
  `).bind(id, p.sku || id, p.category || 'Parts', p.name_en || '', p.name_vi || p.name_en || '', p.description_en || '', p.description_vi || '', p.condition || 'new', JSON.stringify(p.compatibility || []), Number(p.price_vnd || 0), Number(p.price_usd || 0), Number(p.price_inr || 0), p.status || 'available', p.featured ? 1 : 0, p.image_url || '', p.image_key || '', now).run();
  await env.DB.prepare(`INSERT INTO inventory (product_id, stock, reserved, location, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(product_id) DO UPDATE SET stock=excluded.stock, reserved=excluded.reserved, location=excluded.location, updated_at=excluded.updated_at`)
    .bind(id, Number(p.stock || 0), Number(p.reserved || 0), p.location || 'Vietnam', now).run();
  return json({ ok: true, id });
}

async function deleteProduct(id, env) {
  await env.DB.prepare('DELETE FROM products WHERE id=?').bind(id).run();
  return json({ ok: true });
}

async function updateInventory(request, env) {
  const b = await request.json();
  await env.DB.prepare(`INSERT INTO inventory (product_id,stock,reserved,location,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(product_id) DO UPDATE SET stock=excluded.stock,reserved=excluded.reserved,location=excluded.location,updated_at=excluded.updated_at`)
    .bind(b.product_id, Number(b.stock || 0), Number(b.reserved || 0), b.location || 'Vietnam', new Date().toISOString()).run();
  return json({ ok: true });
}

async function listOrders(env) {
  const { results } = await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100').all();
  return json({ ok: true, orders: results.map(o => ({ ...o, items: safeParse(o.items, []) })) });
}

async function updateOrder(request, env) {
  const b = await request.json();
  await env.DB.prepare('UPDATE orders SET payment_status=?, order_status=?, provider_ref=?, updated_at=? WHERE id=?')
    .bind(b.payment_status || 'pending', b.order_status || 'new', b.provider_ref || '', new Date().toISOString(), b.id).run();
  return json({ ok: true });
}

async function uploadImage(request, env) {
  if (!env.PART_IMAGES) return json({ ok: false, error: 'R2 bucket not configured' }, 500);
  const form = await request.formData();
  const file = form.get('file');
  if (!file || !file.name) return json({ ok: false, error: 'Upload file field named file' }, 400);
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const key = `parts/${Date.now()}-${slug(file.name)}.${ext}`;
  await env.PART_IMAGES.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || 'application/octet-stream' } });
  return json({ ok: true, key, url: `/uploads/${key}` });
}

async function serveImage(request, env, url) {
  const key = decodeURIComponent(url.pathname.replace('/uploads/', ''));
  const obj = await env.PART_IMAGES.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
}

async function login(request, env) {
  const b = await request.json();
  const userOk = !env.ADMIN_USER || b.username === env.ADMIN_USER;
  const passOk = !!env.ADMIN_PASSWORD && b.password === env.ADMIN_PASSWORD;
  if (!userOk || !passOk) return json({ ok: false, error: 'Invalid login. Set ADMIN_PASSWORD secret first.' }, 401);
  const token = await signSession(env, b.username || 'admin');
  return json({ ok: true }, 200, { 'Set-Cookie': `egv_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400` });
}
function logout() { return json({ ok: true }, 200, { 'Set-Cookie': 'egv_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0' }); }

async function requireAdmin(request, env) {
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(/(?:^|; )egv_session=([^;]+)/);
  if (!m) return { ok: false };
  return verifySession(env, m[1]);
}
async function signSession(env, user) {
  const exp = Date.now() + 86400_000;
  const payload = btoa(JSON.stringify({ user, exp }));
  const sig = await hmac(env, payload);
  return `${payload}.${sig}`;
}
async function verifySession(env, token) {
  const [payload, sig] = token.split('.');
  if (!payload || !sig || sig !== await hmac(env, payload)) return { ok: false };
  const data = JSON.parse(atob(payload));
  if (Date.now() > data.exp) return { ok: false };
  return { ok: true, user: data.user };
}
async function hmac(env, msg) {
  const secret = env.SESSION_SECRET || env.ADMIN_PASSWORD || 'dev-secret-change-me';
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function exportAll(env) {
  const products = await env.DB.prepare('SELECT * FROM products').all();
  const inventory = await env.DB.prepare('SELECT * FROM inventory').all();
  const orders = await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 500').all();
  return json({ ok: true, products: products.results, inventory: inventory.results, orders: orders.results });
}
