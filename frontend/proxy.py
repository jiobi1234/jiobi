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
            segments = base.lstrip('/').split('/')
            q = ('?' + self.path.split('?')[1]) if '?' in self.path else ''

            # 동적 장소 상세 페이지(hk/[id]) fallback 처리
            # - 정적 export에서는 id=0만 미리 렌더링됨 (예: /ko/hk/0/index.html)
            # - /ko/hk/123456 처럼 "숫자 id"로 접근할 때만 /ko/hk/0 HTML을 대신 서빙
            #   (fs, admin 등 문자열 경로는 건드리지 않기 위해 isdigit() 체크)
            if len(segments) == 3 and segments[1] == 'hk' and segments[2].isdigit():
                locale = segments[0]
                template_base = f'/{locale}/hk/0'
                template_dir = self.translate_path(template_base)
                index_html = os.path.join(template_dir, 'index.html')

                if os.path.exists(index_html):
                    self.path = f'{template_base}/index.html' + q
                    super().do_GET()
                    return

                template_html = self.translate_path(template_base + '.html')
                if os.path.exists(template_html):
                    self.path = template_base + '.html' + q
                    super().do_GET()
                    return

            # 계획 상세 페이지(hk/plan/[id]) fallback 처리
            # - 정적 export에서는 planId=0만 미리 렌더링됨 (예: /ko/hk/plan/0/index.html)
            # - /ko/hk/plan/123 처럼 숫자 id로 접근할 때 /ko/hk/plan/0 HTML을 대신 서빙
            if len(segments) == 4 and segments[1] == 'hk' and segments[2] == 'plan' and segments[3].isdigit():
                locale = segments[0]
                template_base = f'/{locale}/hk/plan/0'
                template_dir = self.translate_path(template_base)
                index_html = os.path.join(template_dir, 'index.html')

                if os.path.exists(index_html):
                    self.path = f'{template_base}/index.html' + q
                    super().do_GET()
                    return

                template_html = self.translate_path(template_base + '.html')
                if os.path.exists(template_html):
                    self.path = template_base + '.html' + q
                    super().do_GET()
                    return

            # 경로 보기 페이지(hk/plan/[id]/route) fallback 처리
            # - 정적 export에서는 planId=0만 미리 렌더링됨 (예: /ko/hk/plan/0/route/index.html)
            # - /ko/hk/plan/123/route 요청 시 /ko/hk/plan/0/route HTML을 대신 서빙
            if len(segments) == 5 and segments[1] == 'hk' and segments[2] == 'plan' and segments[4] == 'route':
                locale = segments[0]
                template_base = f'/{locale}/hk/plan/0/route'
                template_dir = self.translate_path(template_base)
                index_html = os.path.join(template_dir, 'index.html')

                if os.path.exists(index_html):
                    self.path = f'{template_base}/index.html' + q
                    super().do_GET()
                    return

                template_html = self.translate_path(template_base + '.html')
                if os.path.exists(template_html):
                    self.path = template_base + '.html' + q
                    super().do_GET()
                    return

            html_path = self.translate_path(base + '.html')
            if os.path.exists(html_path):
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
