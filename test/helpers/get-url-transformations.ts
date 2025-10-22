function getUrlTransformations(urlType: 'ABSOLUTE' | 'RELATIVE') {

    const relativeUrlMutations = [
        (url: URL) => url.pathname = '/newpath/',
        (url: URL) => url.pathname = 'otherpath', // without '/'
        (url: URL) => url.search = '?newquery=1',
        (url: URL) => url.search = 'otherquery=2', // without '?'
        (url: URL) => url.hash = '#section2',
        (url: URL) => url.hash = 'section3', // without '#'
        (url: URL) => url.href = 'http://www.somewhere.zz/some/path?hello=world#cake',
        (url: URL) => url.href = 'http://www.somewhere.zz', // no tail
    ]

    if (urlType === 'RELATIVE') return relativeUrlMutations

    const baseOnlyMutations = [
        (url: URL) => url.protocol = 'http:',
        (url: URL) => url.protocol = 'ftp', // without ':'
        (url: URL) => url.username = 'jo:hn',
        (url: URL) => url.password = 'doe@doe',
        (url: URL) => url.host = 'other.example.com:8032',
        (url: URL) => url.hostname = 'something.com',
        (url: URL) => url.port = '8080',
        (url: URL) => url.href = 'tel:+9876543210', // with tel: protocol
        (url: URL) => url.href = 'mailto:me@myhouse.tree', // with mailto: protocol
    ]
    return [...baseOnlyMutations, ...relativeUrlMutations]
}

export { 
    getUrlTransformations 
}
