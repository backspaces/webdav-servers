// deno-cli-server.js
// A CLI-based Deno WebDAV server using local filesystem instead of Deno KV

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { ensureDir, exists } from 'https://deno.land/std@0.224.0/fs/mod.ts'
import { extname, join } from 'https://deno.land/std@0.224.0/path/mod.ts'

const baseHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods':
        'OPTIONS, GET, PUT, DELETE, PROPFIND, MKCOL, COPY, MOVE',
    'Access-Control-Allow-Headers':
        'Authorization, Content-Type, Depth, Destination, Overwrite',
    'Access-Control-Expose-Headers': 'Allow, DAV, Content-Length',
    Allow: 'OPTIONS, GET, PUT, DELETE, PROPFIND, MKCOL, COPY, MOVE',
    DAV: '1, 2',
}

const ROOT_DIR = '.data'
await ensureDir(ROOT_DIR)

function log(method, path, extra = '') {
    const now = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Denver',
    })
    console.log(`[${now}] ${method} ${path} ${extra}`.trim())
}

function fullPath(urlPath) {
    return join(ROOT_DIR, decodeURIComponent(urlPath))
}

// function handler(req: Request): Promise<Response> {
function handler(req, res) {
    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method
    const filePath = fullPath(path)

    if (method === 'OPTIONS') {
        log(method, path, '→ Preflight')
        return Promise.resolve(
            new Response(null, {
                status: 200,
                headers: new Headers(baseHeaders),
            })
        )
    }

    if (method === 'PUT') {
        return req.arrayBuffer().then(async bodyBuffer => {
            const body = new Uint8Array(bodyBuffer)
            await ensureDir(join(filePath, '..'))
            await Deno.writeFile(filePath, body)
            log(method, path, `→ Wrote ${body.length} bytes`)
            return new Response('Created', {
                status: 201,
                headers: new Headers(baseHeaders),
            })
        })
    }

    if (method === 'GET') {
        return Deno.stat(filePath)
            .then(async stat => {
                if (stat.isDirectory) throw new Error('Is directory')
                const data = await Deno.readFile(filePath)
                log(method, path, `→ Read ${data.length} bytes`)
                return new Response(data, {
                    status: 200,
                    headers: new Headers(baseHeaders),
                })
            })
            .catch(() => {
                log(method, path, '→ Not Found')
                return new Response('Not Found', {
                    status: 404,
                    headers: new Headers(baseHeaders),
                })
            })
    }

    if (method === 'DELETE') {
        return Deno.remove(filePath, { recursive: true })
            .then(() => {
                log(method, path, '→ Deleted')
                return new Response(null, {
                    status: 204,
                    headers: new Headers(baseHeaders),
                })
            })
            .catch(() => {
                log(method, path, '→ Not Found')
                return new Response('Not Found', {
                    status: 404,
                    headers: new Headers(baseHeaders),
                })
            })
    }

    if (method === 'MKCOL') {
        return ensureDir(filePath)
            .then(() => {
                log(method, path, '→ Collection Created')
                return new Response('Collection created', {
                    status: 201,
                    headers: new Headers(baseHeaders),
                })
            })
            .catch(() => {
                log(method, path, '→ Conflict')
                return new Response('Conflict', {
                    status: 409,
                    headers: new Headers(baseHeaders),
                })
            })
    }

    if (method === 'PROPFIND') {
        const depth = req.headers.get('Depth') || '1'
        const list = []

        async function walk(dir, base = '') {
            for await (const entry of Deno.readDir(dir)) {
                const full = join(dir, entry.name)
                const rel = join(base, entry.name)
                const stat = await Deno.stat(full)
                list.push({
                    href: join(path, rel),
                    isDir: stat.isDirectory,
                    size: stat.size,
                })
                if (depth === 'infinity' && stat.isDirectory)
                    await walk(full, rel)
            }
        }

        return walk(filePath)
            .then(() => {
                const xmlBody = list
                    .map(
                        entry => `
<D:response>
  <D:href>${entry.href}</D:href>
  <D:propstat>
    <D:prop>
      <D:resourcetype>${entry.isDir ? '<D:collection/>' : ''}</D:resourcetype>
      <D:getcontentlength>${entry.size}</D:getcontentlength>
    </D:prop>
    <D:status>HTTP/1.1 200 OK</D:status>
  </D:propstat>
</D:response>`
                    )
                    .join('')

                const xml = `<?xml version=\"1.0\"?><D:multistatus xmlns:D=\"DAV:\">${xmlBody}</D:multistatus>`
                log(method, path, `→ Returned ${list.length} items`)
                return new Response(xml, {
                    status: 207,
                    headers: new Headers({
                        ...baseHeaders,
                        'Content-Type': 'application/xml',
                    }),
                })
            })
            .catch(
                () =>
                    new Response('Not Found', {
                        status: 404,
                        headers: new Headers(baseHeaders),
                    })
            )
    }

    log(method, path, '→ Method Not Allowed')
    return Promise.resolve(
        new Response('Method Not Allowed', {
            status: 405,
            headers: new Headers(baseHeaders),
        })
    )
}

const port = Number(Deno.env.get('PORT')) || 8000
console.log(`Starting WebDAV server on http://localhost:${port}`)
serve(handler, { port })
