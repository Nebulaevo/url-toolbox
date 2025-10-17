# 📬 URL Toolbox
**A tiny, powerful layer on top of the `URL` standard**

Collection of classes to extend or complete the `URL` class.

## Table of Contents

- [URL subclass : `XUrl`](#url-subclass--xurl)
- [URL subclass : `RelativeUrl`](#url-subclass--relativeurl)
- [`XUrl` & `RelativeUrl` : common utils](#xurl--relativeurl--common-utils)
- [Representation helper class : `UrlRepr`](#representation-helper-class--urlrepr)
- [Additional types](#types)

## URL subclass : `XUrl`

Class extending `URL` with representation utils, setter shortcuts, and the abililty to limit the allowed protocols and hosts, or to ignore credentials.

ℹ️ Setter shortcuts an representation utils are common between `XUrl` & `RelativeUrl` and are detailed here : [`XUrl` & `RelativeUrl` common utils](#xurl--relativeurl--common-utils)

### Restrictions

Restrictions are declared as a key/value object.\
They are defined at instance creation, if no value is given for a key, the default value is used.

| Key | Description | Default |
| - | - | - |
| `allowedProtocols` | *String array (optionnal)*<br>Defines whitelisted protocols.<br>(it's not possible to allow all protocols, if no allowed protocols are listed the default list is used)<br><br>Any attempt to use a non allowed protocol will throw a `BrokenUrlRestrictionError` | http:, https:, ftp:, sftp:, ws:, wss:, blob:, about:, mailto:, tel:, sms: |
| `allowedHosts` | *String array (optionnal)*<br>Defines whitelisted hosts.<br>(should include eventual subdomain, and eventual port number, if applicable)<br><br>If defined and non empty, any attempt to use a non allowed host will throw a `BrokenUrlRestrictionError` | Not restricted |
| `ignoreCredentials` | *Boolean (optionnal)*<br><br>If true, username and password values are erased and cannot be modified. Any attempt to set credentials anyway will be ignored but will not throw any error. | Allow credentials |


#### `BrokenUrlRestrictionError`

Type of error thrown if a protocol or host restriction is about to be broken in a XUrl instance.

#### Creating and Modifying an Instance

Restrictions are set at instance creation (available both with `new` or `XUrl.canParse`)

```js
import { XUrl } from 'url-toolbox'

const restrictions = {
    allowedProtocols: [ 'http:', 'https:' ],
    allowedHosts: [ 'domain.com' ]
}

// Creating XUrl instances

const urlA = new XUrl(
    '/test/path/', 
    'https://domain.com', 
    restrictions
)

const urlB = XUrl.parse(
    '/test/path/', 
    'https://domain.com', 
    restrictions
)

urlA.href = 'http://wrong-domain.com/path' // -> throws an error (wrong host)

urlA.protocol = 'ftp:' // -> throws an error (wrong protocol)
```

If given url doesn't respect protocol or host restrictions at intance creation, operation will also fail with `BrokenUrlRestrictionError`

```js
const restrictions = {
    allowedProtocols: [ 'http:', 'https:' ],
    allowedHosts: [ 'domain.com' ]
}

const urlA = new XUrl(
    'ftp://wrong-domain.com/test/path/', 
    undefined, 
    restrictions
) // -> throws an error (wrong protocol & host)

const urlB = new XUrl('javascript:alert("XSS")') 
// -> throws an error (javascript: is not in the default list of allowed protocols and '' is not an allowed host)

```

If credentials are ignored, any attempt to set username or password will be ignored

```js
// None of theese methods will succeed at setting the credentials
const url = XUrl.parse(
    'https://user:password123@domain.com//test/path/',
    undefined,
    { ignoreCredentials: true }
)
url.username = 'user'
url.password = 'password123'
url.href = 'https://user:password123@domain.com//test/path/'

url.toString() // -> 'https://domain.com//test/path/'
```


#### Check URL String Validity with `XUrl.canParse`

`XUrl.canParse` will also check the url string against provided (or default) restrictions

```js
import { XUrl } from 'url-toolbox'

const restrictions = {
    allowedProtocols: [ 'http', 'https' ],
    allowedHosts: [ 'domain.com', ]
}

XUrl.canParse('https://domain.com/test/path/', undefined, restrictions) // -> true

XUrl.canParse('/test/path/', 'https://wrong-domain.com', restrictions) // -> false (wrong host)

XUrl.canParse('javascript:alert("XSS")') // -> false (javascript: is not in the default list of allowed protocols and '' is not an allowed host) 
```


## URL subclass : `RelativeUrl`

Class extending `URL` to handle relative http url (includes the same representation utils and setter shortcuts as `XUrl`).

An instance of `RelativeUrl` will always ignore all values from the url base (protcol, username, password, host, hostname, port).

ℹ️ Setter shortcuts an representation utils are common between `XUrl` & `RelativeUrl` and are detailed here : [`XUrl` & `RelativeUrl` common utils](#xurl--relativeurl--common-utils)

### Instance Creation

Instances can be created with `new` or `RelativeUrl.parse`

```js
import { RelativeUrl } from 'url-toolbox'

const urlA = new RelativeUrl('/my/path/?query=banana')
const urlB = RelativeUrl.parse('/my/path/?query=banana')
const urlC = RelativeUrl.parse('https://domain.com/my/path/?query=banana')

urlA.toString() // -> /my/path/?query=banana
urlB.toString() // -> /my/path/?query=banana
urlC.toString() // -> /my/path/?query=banana

urlA.href = '/articles/'
urlA.toString() // -> /articles/

// url base will always be ignored
urlB.href = 'https://domain.com/my/path/?query=banana'
urlB.toString() // -> /my/path/?query=banana
```

### `RelativeUrl.canParse`

`canParse` static method is modified to allow relative urls

```js
import { RelativeUrl } from 'url-toolbox'

RelativeUrl.canParse('/my/path/?query=banana') // -> true
RelativeUrl.canParse('https://domain.com/my/path/?query=banana') // -> true
```


## `XUrl` & `RelativeUrl` : Common Utils

### Representation Utils : `as`

Each `XUrl` and `RelativeUrl` instance have an `as` key, that encapsulates representation utils for that instance.

Under the hood, `as` returns a `UrlRepr` instance, that defines the representation methods linked to the current url instance.

See [`UrlRepr documentation`](#representation-helper-class--urlrepr)

```js
import { XUrl, RelativeUrl } from 'url-toolbox'

const url = new XUrl('http://my-domain.com/path?query2=value2&query1=value1')
const relativeUrl = new RelativeUrl('/somewhere?query2=value2&query1=value1')

url.as.normalised() // -> http://my-domain.com/path/?query1=value1&query2=value2
relativeUrl.as.normalised() // -> /somewhere/?query1=value1&query2=value2

url.as.filtered({
    search: false
}) // -> http://my-domain.com/path

relativeUrl.as.filtered({
    search: false
}) // -> /somewhere/
```

### Setter Shortcut : `setPathnameSegments( segments )`

Available for both `XUrl` and `RelativeUrl`, it's a shortcut method allowing to set the url's pathname from an array of strings.

Accepts a string array, defining all the segments of the pathname.\
Each item is encoded before being assemble to set the pathname value.


```js
import { XUrl } from 'url-toolbox'

const url = new XUrl('https:/site.com/test/')

url.setPathnameSegments(['articles', 'best tomato/pasta',])

url.toString() // -> https://site.com/articles/best%20tomato%2Fpasta/
```

## Representation helper class : `UrlRepr`

Class defining representation utils for a URL instance

ℹ️ For `XUrl` and `RelativeUrl` instances, an instance of `UrlRepr` is accessible under the `as` attribute.

### Creating an instance

A `UrlRepr` instance needs to be linked with a `URL` instance

```js
import { UrlRepr } from 'url-toolbox'

const url = new URL('http://my-domain.com/path?query1=value1&query2=value2')

const urlRepr = new UrlRepr(url)
```

### Getting a Normalised Representation

The `normalised` method allows to get a url representation that is easy to compare with another url. 
The path and search params order is normalised to insure that most equivalent urls can be efficiently compared.


```js
import { UrlRepr } from 'url-toolbox'

// defining equivalent urls having non matching hrefs
const urlA = new URL('http://my-domain.com/path?query1=value1&query2=value2')
// -> the second URL, has search params in a different order 
// and a slash at the end of the path
const urlB = new URL('http://my-domain.com/path/?query2=value2&query1=value1')

const reprA = new UrlRepr(urlA)
const reprB = new UrlRepr(urlB)


urlA.href === urlB.href // false
reprA.normalised() === reprB.normalised() // true
```

There are also shortcut attributes allowing to get only the normalised path or normalised search :\
`normalisedPathname` and `normalisedSearch`
```js
import { UrlRepr } from 'url-toolbox'

const url = new URL('http://my-domain.com/path?query2=value2&query1=value1')
const repr = new UrlRepr(url)


repr.normalisedPathname // -> /path/ (added slash)
repr.normalisedSearch // -> ?query1=value1&query2=value2 (ordered keys)
```


### Getting a Filtered Representation

It's possible to filter the url parts in the representation by using the `filtered` method, or by providing filtering options to the `normalised` method.

The filtering options argument is a key/value object allowing to filter the url parts included in a url representation (all keys are optional with default values).

| Key | Description | Default |
| --- | ----------- | ------- |
| `baseMode` | *Literal string (optional)*<br>Modifies what's included in the url base : <br><ul><li>`"ALL"` : includes protocol, credentials and host in the result</li><li>`"NO_PROTOCOL"` : includes only credentials and host in the result</li><li>`"NO_CREDENTIALS"` : includes only protocol and host in the result</li><li>`"HOST_ONLY"` : includes only host in the result</li><li>`"NO_BASE"` : does not include any part of the url base</li></ul> | `"NO_CREDENTIALS"` |
| `pathname` | *Boolean (optional)*<br>Indicates whether or not we should include the pathname in the result | included |
| `search` | *Boolean (optional)*<br>Indicates whether or not we should include the search in the result | included |
| `hash` | *Boolean (optional)*<br>Indicates whether or not we should include the hash in the result | included |



```js
import { UrlRepr } from 'url-toolbox'

const url = new URL('http://my-domain.com/path?query2=value2&query1=value1#somewhere')
const repr = new UrlRepr(url)


repr.filtered({
    baseMode: 'HOST_ONLY',
    search: false
}) // -> my-domain.com/path#somewhere

repr.normalised({
    baseMode: 'NO_BASE',
    hash: false
}) // -> /path/?query1=value1&query2=value2
```

## Types

`ExtendedUrl_T` : instance of `XUrl` or `RelativeUrl`
