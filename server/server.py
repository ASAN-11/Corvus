#!/usr/bin/env python3
"""Corvus launcher: static files + allow-listed proxy to Ollama. Loopback only. No dependencies."""
import json, os, urllib.request, urllib.error, webbrowser
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
OLLAMA = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
PORT = int(os.environ.get("PORT", "8734"))
ALLOWED = {("GET", "/api/tags"), ("GET", "/api/version"), ("POST", "/api/chat")}

class H(SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=str(ROOT), **k)
    def log_message(s, *a): pass  # never log conversation content
    def end_headers(s):
        s.send_header("Cache-Control", "no-cache"); s.send_header("X-Content-Type-Options", "nosniff"); super().end_headers()
    def js(s, c, o):
        b = json.dumps(o).encode(); s.send_response(c); s.send_header("Content-Type", "application/json")
        s.send_header("Content-Length", str(len(b))); s.end_headers(); s.wfile.write(b)
    def host_ok(s): return s.headers.get("Host", "").split(":")[0] in ("localhost", "127.0.0.1")
    def do_GET(s):
        p = s.path.split("?")[0]
        if not s.host_ok(): return s.js(403, {"error": "bad host"})
        if p == "/health": return s.js(200, {"ok": True, "ollama": OLLAMA})
        if p.startswith("/api/"): return s.proxy("GET", p)
        super().do_GET()
    def do_POST(s):
        p = s.path.split("?")[0]
        if not s.host_ok(): return s.js(403, {"error": "bad host"})
        if p.startswith("/api/"): return s.proxy("POST", p)
        s.js(404, {"error": "not found"})
    def proxy(s, m, p):
        if (m, p) not in ALLOWED: return s.js(404, {"error": "route not allowed"})
        body = None
        if m == "POST":
            n = int(s.headers.get("Content-Length", 0))
            if n > 5_000_000: return s.js(413, {"error": "payload too large"})
            body = s.rfile.read(n)
            try: json.loads(body)
            except ValueError: return s.js(400, {"error": "invalid JSON"})
        req = urllib.request.Request(OLLAMA + p, data=body, method=m, headers={"Content-Type": "application/json"})
        try: r = urllib.request.urlopen(req, timeout=600)
        except urllib.error.HTTPError as e: return s.js(e.code, {"error": e.read().decode(errors="replace")[:500]})
        except Exception as e: return s.js(502, {"error": f"Cannot reach Ollama at {OLLAMA}: {e}"})
        s.send_response(r.status); s.send_header("Content-Type", r.headers.get("Content-Type", "application/json")); s.end_headers()
        try:
            for line in r:  # newline-delimited JSON, forwarded as it arrives
                s.wfile.write(line); s.wfile.flush()
        except (BrokenPipeError, ConnectionResetError): pass
        finally: r.close()

if __name__ == "__main__":
    url = f"http://127.0.0.1:{PORT}"
    print(f"Corvus on {url}  (Ollama: {OLLAMA})  Ctrl+C to stop")
    try: webbrowser.open(url)
    except Exception: pass
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
