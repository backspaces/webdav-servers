# 📁 webdav-server

A lightweight, CORS-enabled WebDAV server built using [Deno Deploy](https://deno.com/deploy) and `Deno.openKv()` for persistent file and folder storage.

---

## ✅ Supported HTTP Methods

| Method     | Description                         | Status                             |
| ---------- | ----------------------------------- | ---------------------------------- |
| `OPTIONS`  | Reports supported methods, for CORS | ✅ Implemented                     |
| `GET`      | Download a file                     | ✅ Implemented                     |
| `PUT`      | Upload or update a file             | ✅ Implemented                     |
| `DELETE`   | Delete a file or directory          | ✅ Implemented                     |
| `PROPFIND` | List files and metadata             | ✅ Implemented (Depth 0, 1)        |
| `MKCOL`    | Create a directory                  | ✅ Implemented (with parent check) |
| `COPY`     | Copy a file or folder               | ✅ Implemented                     |
| `MOVE`     | Rename or move a file/folder        | ✅ Implemented                     |

---

## ❌ Unsupported Methods

These methods are **gracefully rejected** with `403 Forbidden`:

| Method      | Description                |
| ----------- | -------------------------- |
| `LOCK`      | Advisory write-lock        |
| `UNLOCK`    | Releases a lock            |
| `PROPPATCH` | Set/remove custom metadata |

---

## 🌐 CORS Support

-   All responses include appropriate CORS headers
-   `OPTIONS` preflight includes:
    -   `Access-Control-Allow-Methods: OPTIONS, GET, PUT, DELETE, PROPFIND, MKCOL, COPY, MOVE`
    -   `Access-Control-Allow-Headers: Content-Type, Depth, Destination, Overwrite`
-   Allows access from any origin: `Access-Control-Allow-Origin: *`

---

## 🗂️ WebDAV Compliance

| Feature        | Status                                      |
| -------------- | ------------------------------------------- |
| WebDAV Class 1 | ✅ Full support                             |
| WebDAV Class 2 | ❌ No `LOCK`/`UNLOCK` (explicitly rejected) |
| `DAV` Header   | `DAV: 1, 2` (advertised)                    |

> ⚠️ Note: Although the server advertises `DAV: 1, 2`, it does not support locking and will return `403` for `LOCK` and `UNLOCK`.

---

## 📎 Storage Backend

-   Uses `Deno.openKv()` for persistent server-side key-value storage
-   KV structure:
    -   Files: `{ isDir: false, body: Uint8Array }`
    -   Directories: `{ isDir: true }`
-   Keys are formatted as: `['file', '/path/to/resource']`
-   Root `/` is automatically created on `RESET` or first deploy

---
