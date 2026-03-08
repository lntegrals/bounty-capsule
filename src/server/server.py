#!/usr/bin/env python3
import json
import http.server
import socketserver
import uuid
from datetime import datetime

PORT = 3002

challenges = {}
submissions = {}
wallets = {}

class Handler(http.server.BaseHTTPRequestHandler):
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        if self.path == '/api/challenges':
            self.send_json({'challenges': list(challenges.values())})
        elif self.path.startswith('/api/challenge/'):
            parts = self.path.split('/')
            if len(parts) >= 4:
                cid = parts[3]
                challenge = next((c for c in challenges.values() if c.get('id') == cid), None)
                if challenge:
                    self.send_json({'challenge': challenge})
                else:
                    self.send_json({'error': 'Challenge not found'}, 404)
            else:
                self.send_json({'error': 'Invalid path'}, 404)
        elif self.path.startswith('/api/') and '/submissions' in self.path:
            parts = self.path.split('/')
            if len(parts) >= 4:
                cid = parts[2]
                subs = [s for s in submissions.values() if s.get('challengeId') == cid]
                self.send_json({'submissions': subs})
            else:
                self.send_json({'submissions': []})
        else:
            self.send_json({'error': 'Not found'}, 404)
    
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        try:
            data = json.loads(body) if body else {}
        except:
            data = {}
        
        if self.path == '/api/wallet/create':
            addr = f"r{uuid.uuid4().hex[:33]}"
            seed = f"s{uuid.uuid4().hex[:28]}"
            wallets[addr] = {'address': addr, 'seed': seed}
            self.send_json({'address': addr, 'seed': seed, 'balance': '1000'})
        
        elif self.path == '/api/wallet/from-seed':
            seed = data.get('seed', '')
            addr = f"r{uuid.uuid4().hex[:33]}"
            wallets[addr] = {'address': addr, 'seed': seed}
            self.send_json({'address': addr, 'seed': seed})
        
        elif self.path == '/api/challenge/create':
            cid = f"challenge_{uuid.uuid4().hex[:12]}"
            challenge = {
                'id': cid,
                'title': data.get('title', ''),
                'description': data.get('description', ''),
                'issuer': data.get('issuerSeed', '')[:20] + '...',
                'bountyAmount': data.get('bountyAmount', '0'),
                'recipient': data.get('recipient', ''),
                'cid': f"Qm{uuid.uuid4().hex[:44]}",
                'escrowSequence': str(uuid.uuid4().int % 100000),
                'escrowTxHash': f"0x{uuid.uuid4().hex}",
                'status': 'active',
                'createdAt': datetime.now().isoformat()
            }
            challenges[cid] = challenge
            self.send_json({
                'challenge': challenge,
                'escrow': {'txHash': challenge['escrowTxHash'], 'escrowSequence': challenge['escrowSequence']},
                'gatewayUrl': f"https://gateway.pinata.cloud/ipfs/{challenge['cid']}"
            })
        
        elif self.path == '/api/submission/create':
            sid = f"submission_{uuid.uuid4().hex[:12]}"
            submission = {
                'id': sid,
                'challengeId': data.get('challengeId', ''),
                'solver': data.get('solverName', 'Anonymous'),
                'solverName': data.get('solverName', 'Anonymous'),
                'description': data.get('description', ''),
                'cid': f"Qm{uuid.uuid4().hex[:44]}",
                'submittedAt': datetime.now().isoformat(),
                'status': 'submitted'
            }
            submissions[sid] = submission
            self.send_json({
                'submission': submission,
                'gatewayUrl': f"https://gateway.pinata.cloud/ipfs/{submission['cid']}"
            })
        
        elif self.path == '/api/payout':
            self.send_json({'success': True, 'txHash': f"0x{uuid.uuid4().hex}"})
        
        else:
            self.send_json({'error': 'Not found'}, 404)

print(f"Server running on port {PORT}")
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
