import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import {
    ensureFile,
    ensureDir,
    exists,
    copy,
    emptyDir,
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

function log(method, path, message = '') {
    const now = new Date().toLocaleString('en-US', { hour12: false })
    console.log(`[${now}] ${method} ${path} ${message && '→ ' + message}`)
}

async function handler(req) {
    try {
        const url = new URL(req.url)
        const method = req.method
        const path = decodeURIComponent(url.pathname.slice(1)) // strip leading "/"
        const filePath = normalize(join(root, path))

        log(method, '/' + path)

        if (method === 'OPTIONS') {
            return new Response(null, {
                status: 200,
                headers: new Headers(baseHeaders),
            })
        }

        if (method === 'GET') {
            try {
                const content = await Deno.readFile(filePath)
                return new Response(content, {
                    status: 200,
                    headers: new Headers({
                        ...baseHeaders,
                        'Content-Length': content.byteLength.toString(),
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
                return new Response('Missing Destination header', {
                    status: 400,
                    headers: new Headers(baseHeaders),
                })
            }
            const to = normalize(join(root, new URL(dest).pathname))
            const overwrite = req.headers.get('Overwrite') !== 'F'

            if (!overwrite && (await exists(to))) {
                return new Response('Destination exists', {
                    status: 412,
                    headers: new Headers(baseHeaders),
                })
            }

            if (await exists(to)) await Deno.remove(to, { recursive: true })
            await copy(filePath, to, { overwrite: true })

            if (method === 'MOVE')
                await Deno.remove(filePath, { recursive: true })

            return new Response(null, {
                status: 204,
                headers: new Headers(baseHeaders),
            })
        }

        if (method === 'PROPFIND') {
            try {
                const depth = req.headers.get('Depth') === '1' ? 1 : 0
                const info = []

                if (!(await exists(filePath))) {
                    return new Response('Not Found', {
                        status: 404,
                        headers: new Headers(baseHeaders),
                    })
                }

                const stat = await Deno.stat(filePath)
                const isDir = stat.isDirectory
                info.push(filePath)

                if (isDir && depth === 1) {
                    for await (const entry of Deno.readDir(filePath)) {
                        info.push(join(filePath, entry.name))
                    }
                }

                const xml = `<?xml version="1.0"?>
<D:multistatus xmlns:D="DAV:">
${await Promise.all(
    info.map(async entry => {
        const s = await Deno.stat(entry)
        const display = entry.slice(root.length)
        const size = s.isFile
            ? `<D:getcontentlength>${s.size}</D:getcontentlength>`
            : ''
        return `<D:response>
  <D:href>${display}</D:href>
  <D:propstat>
    <D:prop>
      <D:resourcetype>${s.isDirectory ? '<D:collection/>' : ''}</D:resourcetype>
      ${size}
    </D:prop>
    <D:status>HTTP/1.1 200 OK</D:status>
  </D:propstat>
</D:response>`
    })
).then(entries => entries.join('\n'))}
</D:multistatus>`

                return new Response(xml, {
                    status: 207,
                    headers: new Headers({
                        ...baseHeaders,
                        'Content-Type': 'application/xml',
                    }),
                })
            } catch (err) {
                return new Response('PROPFIND Error', {
                    status: 500,
                    headers: new Headers(baseHeaders),
                })
            }
        }

        return new Response('Method Not Allowed', {
            status: 405,
            headers: new Headers(baseHeaders),
        })
    } catch (err) {
        console.error('Handler Error:', err)
        return new Response('Internal Server Error', {
            status: 500,
            headers: new Headers(baseHeaders),
        })
    }
}

console.log(
    `Starting WebDAV server on http://localhost:${Deno.env.get('PORT') || 8888}`
)
serve(handler, { port: Number(Deno.env.get('PORT') || 8888) })
