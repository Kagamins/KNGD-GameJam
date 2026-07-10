#!/usr/bin/env python3
"""
play.py — one-double-click launcher for your game.

Starts a tiny local web server in this folder and opens the game in your
browser. Running on a real server (http://localhost) means EVERYTHING works —
3D models, sprite atlases, tilemaps, split JavaScript modules, any file in
assets/ — none of the file:// limitations you hit by opening index.html directly.

You normally don't run this by hand: double-click **play.command** (Mac) or
**play.bat** (Windows). To stop the server, close that window (or press Ctrl+C).
No third-party dependencies. Python 3.7+.
"""
import http.server
import os
import socket
import sys
import threading
import webbrowser

# Serve the folder this launcher lives in, wherever it's run from.
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    # Always serve fresh files, so a plain refresh shows your latest change
    # (no need to remember hard-refresh).
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        super().end_headers()

    def log_message(self, format, *args):  # noqa: A002 - match base signature
        pass  # keep the window quiet


def free_port(start=8000, tries=50):
    for port in range(start, start + tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            if probe.connect_ex(("127.0.0.1", port)) != 0:
                return port
    return start


def main():
    if not os.path.isfile("index.html"):
        print("Hmm — I can't find index.html next to this launcher.")
        print("Keep play.command / play.bat / play.py in the same folder as your game.")
        input("\nPress Enter to close...")
        return 1

    port = free_port()
    url = f"http://localhost:{port}/index.html"
    threading.Timer(0.7, lambda: webbrowser.open(url)).start()

    print("\n  ▶  Your game is playing at:  " + url)
    print("     (a browser tab should open on its own)\n")
    print("  Leave this window open while you play.")
    print("  To stop: close this window, or press Ctrl+C.\n")

    with http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Stopped. Have fun!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
