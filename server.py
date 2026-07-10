import http.server
import socketserver
import webbrowser

PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

class MyTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

print(f"Starting server on port {PORT}...")
webbrowser.open(f"http://localhost:{PORT}")

with MyTCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
        httpd.server_close()
