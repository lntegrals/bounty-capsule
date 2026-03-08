#!/usr/bin/env python3
import os
import http.server
import socketserver

PORT = 5174
DIR = '/home/carter/bounty-capsule/src/client'

os.chdir(DIR)
Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
})

print(f"Client server running on port {PORT}")
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
