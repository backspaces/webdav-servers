# WebDAV Servers

This repository contains multiple WebDAV server implementations for experimentation, local development, and deployment across various platforms.

## 📁 Contents

-   `deno-cli-server.js` — Deno CLI-based WebDAV server (ideal for local dev or Render deployment)
-   `deno-server.js` — Deno Deploy version using `Deno.openKv()` (edge-only)
-   `cpanel-server-1.js` — WebDAV server tailored for cPanel
-   `cpanel-server-2.js` — Enhanced cPanel version with extra methods
-   `glitch-server.js` — WebDAV server designed for Glitch hosting
-   `webdav-client.html` — Browser-based WebDAV client UI
-   `curl.sh` — Curl-based testing script for WebDAV methods
-   `notes.txt` — Design notes and ideas
-   `Attic/` — Older or archived code versions

## 🚀 Deployment Options

### 🔹 Local Deno CLI

Start the CLI-based server with:

```bash
PORT=8888 deno run -A deno-cli-server.js
```
