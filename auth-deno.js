const users = {
    demo: 'secret',
    alice: 'wonderland',
    bob: 'builder',
}

export function checkAuth(req) {
    const auth = req.headers.get('authorization')
    if (!auth) return false

    const [type, encoded] = auth.split(' ')
    if (type !== 'Basic' || !encoded) return false

    const [user, pass] = atob(encoded).split(':')
    if (users[user] && users[user] === pass) {
        return user // ✅ Return username
    }

    return false
}

export function requireAuth() {
    return new Response('Unauthorized', {
        status: 401,
        headers: new Headers({
            'WWW-Authenticate': 'Basic realm="WebDAV"',
        }),
    })
}

// export function checkAuth(req) {
//     const auth = req.headers.get('authorization')
//     if (!auth) return false

//     const [type, encoded] = auth.split(' ')
//     if (type !== 'Basic' || !encoded) return false

//     const [user, pass] = atob(encoded).split(':')
//     return user === 'demo' && pass === 'secret'
// }

// export function requireAuth() {
//     return new Response('Unauthorized', {
//         status: 401,
//         headers: new Headers({
//             'WWW-Authenticate': 'Basic realm="WebDAV"',
//         }),
//     })
// }
