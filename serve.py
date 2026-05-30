"""Tiny static server for Pagecraft dev.

Sends Cache-Control: no-store on every response so the browser always picks up
the latest edits — Python's built-in http.server doesn't, which causes hours of
"why aren't my changes showing up" pain.
"""
import http.server
import socketserver

PORT = 8123

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js':   'application/javascript',
        '.mjs':  'application/javascript',
        '.css':  'text/css',
        '.html': 'text/html',
        '.json': 'application/json',
        '':      'application/octet-stream',
    }

if __name__ == '__main__':
    with socketserver.TCPServer(('', PORT), NoCacheHandler) as httpd:
        print(f'Pagecraft dev server: http://localhost:{PORT}/')
        httpd.serve_forever()
