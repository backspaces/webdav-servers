# WebDAV Servers

This repository contains multiple WebDAV server implementations for experimentation and deployment across various platforms:

## 📁 Contents

-   `deno-cli-server.js` — Deno CLI-based WebDAV server for local or hosted environments like Render
-   `deno-server.js` — Deno Deploy version using `Deno.openKv()`
-   `cpanel-server-1.js` — WebDAV server designed for cPanel with WebDAV filesystem
-   `cpanel-server-2.js` — Alternative cPanel version with added support
-   `glitch-server.js` — Glitch-compatible WebDAV server
-   `webdav-client.html` — Simple client UI for browsing and testing WebDAV endpoints
-   `curl.sh` — Example curl commands for testing WebDAV operations
-   `notes.txt` — Design notes and miscellaneous info
-   `Attic/` — Archived experiments or old versions

## 🚀 Deployment Options

### Deno CLI via Render (recommended)

This version supports:

-   File system-based storage via `.data/`
-   All core WebDAV methods: `GET`, `PUT`, `DELETE`, `PROPFIND`, `MKCOL`

To deploy:

1. Create a Docker-based web service on [Render](https://render.com)
2. Use this start command:
    ```bash
    deno run -A webdav/deno-cli-server.js
    ```
