// Purple's To-do list: zero-dependency Node.js server (REST API + static files)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const DB_FILE = path.join(__dirname, 'data.json');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };

const iso = d => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const seed = () => [
  ['Plan this week\'s priorities', 'Work', 'high', 0, false],
  ['Reply to pending emails', 'Work', 'med', -1, false],
  ['Morning workout', 'Health', 'med', 0, true],
  ['Drink 8 glasses of water', 'Health', 'low', 0, false],
  ['Read 20 pages of a book', 'Learning', 'low', 1, false],
  ['Grocery shopping', 'Personal', 'med', 2, false],
  ['Call a friend', 'Fun', 'low', 3, false],
  ['Finish online course lesson', 'Learning', 'high', 4, false],
].map(([text, category, priority, d, done], i) => ({ id: Date.now() + i, text, category, priority, due: iso(d), done }));

let tasks;
try { tasks = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch { tasks = seed(); }
const save = () => fs.writeFileSync(DB_FILE, JSON.stringify(tasks, null, 2));
save();

const send = (res, code, data) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};
const readBody = req => new Promise((resolve, reject) => {
  let raw = '';
  req.on('data', c => { raw += c; if (raw.length > 1e5) req.destroy(); });
  req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); } });
});

async function api(req, res, url) {
  const id = Number(url.pathname.split('/')[3]);
  try {
    if (req.method === 'GET' && !id) return send(res, 200, tasks);
    if (req.method === 'POST' && !id) {
      const b = await readBody(req);
      if (!String(b.text || '').trim()) return send(res, 400, { error: 'text is required' });
      const t = { id: Date.now(), text: String(b.text).trim().slice(0, 200), category: b.category || 'Personal',
                  priority: ['high', 'med', 'low'].includes(b.priority) ? b.priority : 'med', due: b.due || '', done: false };
      tasks.unshift(t); save();
      return send(res, 201, t);
    }
    if (req.method === 'PATCH' && id) {
      const t = tasks.find(x => x.id === id);
      if (!t) return send(res, 404, { error: 'not found' });
      const b = await readBody(req);
      if (typeof b.done === 'boolean') t.done = b.done;
      if (typeof b.text === 'string' && b.text.trim()) t.text = b.text.trim().slice(0, 200);
      save();
      return send(res, 200, t);
    }
    if (req.method === 'DELETE' && id) {
      tasks = tasks.filter(x => x.id !== id); save();
      return send(res, 200, { ok: true });
    }
    if (req.method === 'DELETE' && url.searchParams.get('completed') === 'true') {
      tasks = tasks.filter(x => !x.done); save();
      return send(res, 200, tasks);
    }
    send(res, 405, { error: 'method not allowed' });
  } catch {
    send(res, 400, { error: 'bad request' });
  }
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/tasks')) return api(req, res, url);

  const rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname);
  const file = path.join(PUBLIC, path.normalize(rel));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Purple's To-do list running at http://localhost:${PORT}`));
