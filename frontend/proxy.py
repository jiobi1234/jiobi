#!/usr/bin/env python3
"""
정적 파일 + API 프록시 (jiobi.kr 서버용)
- /api/* → 백엔드(8001)로 전달
- 그 외 → frontend/out/ 정적 파일 서빙
- /ko/hk/plan/ai 등 확장자 없이 요청 시 .html fallback
"""
import http.server
import socketserver
import urllib.parse
import urllib.request
import os
import sys

BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:8001')
FRONTEND_DIR = os.environ.get('FRONTEND_DIR', os.path.join(os.path.dirname(__file__), 'out'))
PORT = int(os.environ.get('PORT', 8080))


class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def translate_path(self, path):
        decoded_path = urllib.parse.unquote(urllib.parse.unquote(path))
        return super().translate_path(decoded_path)

    def do_GET(self):
        if self.path.startswith('/api/'):
            self.proxy_to_backend()
        else:
            self.serve_static_file()

    def do_POST(self):
        if self.path.startswith('/api/'):
            self.proxy_to_backend()
        else:
            self.send_error(404, 'Not Found')

    def do_PUT(self):
        if self.path.startswith('/api/'):
            self.proxy_to_backend()
        else:
            self.send_error(404, 'Not Found')

    def do_DELETE(self):
        if self.path.startswith('/api/'):
            self.proxy_to_backend()
        else:
            self.send_error(404, 'Not Found')

    def do_PATCH(self):
        if self.path.startswith('/api/'):
            self.proxy_to_backend()
        else:
            self.send_error(404, 'Not Found')

    def do_OPTIONS(self):
        if self.path.startswith('/api/'):
            self.proxy_to_backend()
        else:
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', '*')
            self.end_headers()

    def proxy_to_backend(self):
        try:
            backend_url = BACKEND_URL + self.path
            headers = {k: v for k, v in self.headers.items() if k.lower() != 'host'}
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else None
            req = urllib.request.Request(backend_url, data=body, headers=headers, method=self.command)
            with urllib.request.urlopen(req) as response:
                self.send_response(response.status)
                for h, v in response.headers.items():
                    if h.lower() not in ('content-encoding', 'transfer-encoding', 'connection'):
                        self.send_header(h, v)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(response.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            for h, v in e.headers.items():
                if h.lower() not in ('content-encoding', 'transfer-encoding', 'connection'):
                    self.send_header(h, v)
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_error(502, 'Bad Gateway: ' + str(e))

    def serve_static_file(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            idx = os.path.join(path, 'index.html')
            if os.path.exists(idx):
                self.path = self.path.rstrip('/') + '/index.html'
            else:
                base = self.path.rstrip('/').split('?')[0]
                html_path = self.translate_path(base + '.html')
                if os.path.exists(html_path):
                    q = ('?' + self.path.split('?')[1]) if '?' in self.path else ''
                    self.path = base + '.html' + q
                else:
                    self.send_error(404, 'File not found')
                    return
        elif not os.path.exists(path):
            # Next.js trailingSlash: false → /ko/hk/plan/ai 요청 시 ai.html 서빙
            base = self.path.rstrip('/').split('?')[0]
            html_path = self.translate_path(base + '.html')
            if os.path.exists(html_path):
                q = ('?' + self.path.split('?')[1]) if '?' in self.path else ''
                self.path = base + '.html' + q
            else:
                self.send_error(404, 'File not found')
                return
        super().do_GET()


if __name__ == '__main__':
    if not os.path.isdir(FRONTEND_DIR):
        print(f'Error: FRONTEND_DIR not found: {FRONTEND_DIR}', file=sys.stderr)
        sys.exit(1)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', PORT), ProxyHandler) as httpd:
        print(f'Serving {FRONTEND_DIR} on port {PORT}, API -> {BACKEND_URL}')
        httpd.serve_forever()
