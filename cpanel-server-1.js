import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import {
    ensureFile,
    ensureDir,
    exists,
    copy,
} from 'https://deno.land/std@0.224.0/fs/mod.ts'
import { join, normalize } from 'https://deno.land/std@0.224.0/path/mod.ts'

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

const root = '.data'

function log(method, path, msg = '') {
    const ts = new Date().toLocaleString('en-US', { hour12: false })
    console.log(`[${ts}] ${method} ${path}${msg ? ' → ' + msg : ''}`)
}

async function handler(req) {
    try {
        const url = new URL(req.url)
        const method = req.method
        const path = decodeURIComponent(url.pathname)
        const filePath = normalize(join(root, path))

        log(method, path)

        if (method === 'OPTIONS') {
            return new Response(null, {
                status: 200,
                headers: new Headers(baseHeaders),
            })
        }

        if (method === 'GET') {
            try {
                const data = await Deno.readFile(filePath)
                return new Response(data, {
                    status: 200,
                    headers: new Headers({
                        ...baseHeaders,
                        'Content-Length': data.byteLength.toString(),
                    }),
                })
            } catch {
                return new Response('Not Found', {
                    status: 404,
                    headers: new Headers(baseHeaders),
                })
            }
        }

        if (method === 'PUT') {
            await ensureFile(filePath)
            const body = req.body ? await req.arrayBuffer() : new ArrayBuffer(0)
            await Deno.writeFile(filePath, new Uint8Array(body))
            return new Response(null, {
                status: 204,
                headers: new Headers(baseHeaders),
            })
        }

        if (method === 'DELETE') {
            if (await exists(filePath)) {
                await Deno.remove(filePath, { recursive: true })
                return new Response(null, {
                    status: 204,
                    headers: new Headers(baseHeaders),
                })
            }
            return new Response('Not Found', {
                status: 404,
                headers: new Headers(baseHeaders),
            })
        }

        if (method === 'MKCOL') {
            await ensureDir(filePath)
            return new Response(null, {
                status: 201,
                headers: new Headers(baseHeaders),
            })
        }

        if (method === 'COPY' || method === 'MOVE') {
            const dest = req.headers.get('Destination')
            if (!dest) {
                return new Response('Missing Destination', {
                    status: 400,
                    headers: new Headers(baseHeaders),
                })
            }
            const destPath = normalize(join(root, new URL(dest).pathname))
            const overwrite = req.headers.get('Overwrite') !== 'F'

            if (!overwrite && (await exists(destPath))) {
                return new Response('Destination Exists', {
                    status: 412,
                    headers: new Headers(baseHeaders),
                })
            }

            if (await exists(destPath))
                await Deno.remove(destPath, { recursive: true })
            await copy(filePath, destPath, { overwrite: true })

            if (method === 'MOVE')
                await Deno.remove(filePath, { recursive: true })

            return new Response(null, {
                status: 204,
                headers: new Headers(baseHeaders),
            })
        }

        if (method === 'PROPFIND') {
            if (!(await exists(filePath))) {
                return new Response('Not Found', {
                    status: 404,
                    headers: new Headers(baseHeaders),
                })
            }

            const depth = req.headers.get('Depth') === '1' ? 1 : 0
            const paths = [filePath]
            const stat = await Deno.stat(filePath)

            if (stat.isDirectory && depth === 1) {
                for await (const entry of Deno.readDir(filePath)) {
                    paths.push(join(filePath, entry.name))
                }
            }

            const xml = `<?xml version="1.0"?>
<D:multistatus xmlns:D="DAV:">
${await Promise.all(
    paths.map(async p => {
        const s = await Deno.stat(p)
        const rel = p.slice(root.length)
        const size = s.isFile
            ? `<D:getcontentlength>${s.size}</D:getcontentlength>`
            : ''
        return `<D:response>
  <D:href>${rel}</D:href>
  <D:propstat>
    <D:prop>
      <D:resourcetype>${s.isDirectory ? '<D:collection/>' : ''}</D:resourcetype>
      ${size}
    </D:prop>
    <D:status>HTTP/1.1 200 OK</D:status>
  </D:propstat>
</D:response>`
    })
).then(r => r.join('\n'))}
</D:multistatus>`

            return new Response(xml, {
                status: 207,
                headers: new Headers({
                    ...baseHeaders,
                    'Content-Type': 'application/xml',
                }),
            })
        }

        return new Response('Method Not Allowed', {
            status: 405,
            headers: new Headers(baseHeaders),
        })
    } catch (err) {
        console.error('Error:', err)
        return new Response('Server Error', {
            status: 500,
            headers: new Headers(baseHeaders),
        })
    }
}

console.log(
    `Starting WebDAV server on http://localhost:${Deno.env.get('PORT') || 8888}`
)
serve(handler, { port: Number(Deno.env.get('PORT') || 8888) })
