from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
print("Nagorik Hub running at http://127.0.0.1:5500")
ThreadingHTTPServer(("127.0.0.1", 5500), SimpleHTTPRequestHandler).serve_forever()
