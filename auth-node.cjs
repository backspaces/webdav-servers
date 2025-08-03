function checkAuth(req) {
    const auth = req.headers.authorization
    if (!auth) return { ok: false }

    const [type, encoded] = auth.split(' ')
    if (type !== 'Basic' || !encoded) return { ok: false }

    const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':')
    const ok = user === 'demo' && pass === 'secret'
    return { ok, user }
}

function requireAuth(res) {
    res.setHeader('WWW-Authenticate', 'Basic realm="WebDAV"')
    res.status(401).end('Unauthorized')
}

module.exports = { checkAuth, requireAuth }
