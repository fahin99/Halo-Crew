"""Private, free Chatterbox service. Reference audio never leaves this computer."""
import io, json, os, pathlib, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = pathlib.Path(os.environ.get('HALO_VOICE_REFERENCES', '.voice-references')).resolve()
MODEL = None
LOCK = threading.Lock()

def references():
    # Creating this file records permission to use the matching reference voice.
    try:
        consent = json.loads((ROOT / 'consent.json').read_text())
    except (OSError, ValueError):
        consent = {}
    return {f'family-{i}': ROOT / f'family-{i}.wav' for i in range(3)
            if consent.get(f'family-{i}') is True and (ROOT / f'family-{i}.wav').is_file()}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass
    def respond(self, status, data, content='application/json'):
        self.send_response(status); self.send_header('Content-Type', content)
        self.send_header('Cache-Control', 'no-store'); self.end_headers()
        self.wfile.write(data if isinstance(data, bytes) else json.dumps(data).encode())
    def do_GET(self):
        if self.path != '/status': return self.respond(404, {'error':'Unknown route'})
        self.respond(200, {'voices':list(references()), 'engine':'chatterbox', 'loaded':MODEL is not None})
    def do_POST(self):
        global MODEL
        if self.path != '/speech': return self.respond(404, {'error':'Unknown route'})
        if self.headers.get('Origin'): return self.respond(403, {'error':'Server access only'})
        try:
            size=int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 20000: return self.respond(400, {'error':'Invalid request size'})
            data=json.loads(self.rfile.read(size)); text=data.get('text'); ref=references().get(data.get('channel'))
            if not isinstance(text,str) or not text.strip() or len(text)>1200 or ref is None:
                return self.respond(400, {'error':'Consented voice reference and short text required'})
            with LOCK:
                import torch, torchaudio
                from chatterbox.tts import ChatterboxTTS
                if MODEL is None:
                    # CPU is portable and avoids CUDA checkpoint placement on Apple Silicon.
                    MODEL=ChatterboxTTS.from_pretrained(device='cpu')
                wav=MODEL.generate(text, audio_prompt_path=str(ref))
                result=io.BytesIO(); torchaudio.save(result,wav.cpu(),MODEL.sr,format='wav')
            self.respond(200,result.getvalue(),'audio/wav')
        except Exception:
            self.respond(503, {'error':'Voice model unavailable; check local service installation'})

if __name__ == '__main__':
    print('HALO free voice service listening on 127.0.0.1:11435',flush=True)
    ThreadingHTTPServer(('127.0.0.1',11435),Handler).serve_forever()
