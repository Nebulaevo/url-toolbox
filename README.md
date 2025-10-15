# 📬 URL Toolbox

Collection of classes to deal with URLs.


| Class            | Description |
| ---------------- | ----------- |
| [`XUrl`](#url-subclass--xurl) | Extends the `URL` class to add utils and optional restrictions |
| [`RelativeUrl`](#url-subclass--relativeurl) | Extends `URL` to simplify representation of a relative http url. It doesn't have a base, the only accessible url parts are `pathname`, `search`, `searchParams`, and `hash`  |
| [`UrlRepr`](#representation-helper-class--urlrepr) | Defines representation methods for a `URL` instance |


## URL subclass : `XUrl`

Extends the `URL` class adding restrictions, setter shortcuts, and representation utils

### Representation Utils & Setter Shortcuts

For more information see [`XUrl` & `RelativeUrl` common utils](#xurl--relativeurl--common-utils)

### Restrictions

Restrictions can be defined as a key/value object.\
It is defined at instance creation, by default it just defines allowed protocols, but it can also limit the allowed hosts, or prevent use of credentials in the URL.

| Key | Description | Default |
| - | - | - |
| `allowedProtocols` | Optionnal string array defining whitelisted protocols, trying to set a non allowed protocol will throw a `BrokenUrlRestrictionError` (it's not possible to allow all protocols, if no allowed protocols are listed the default list is used) | http:, https:, ftp:, sftp:, ws:, wss:, blob:, about:, mailto:, tel:, sms: |
| `allowedHosts` | Optionnal string array defining whitelisted hosts (should include eventual subdomain, and eventual port number, if applicable), trying to set a non allowed host will throw a `BrokenUrlRestrictionError` | Not restricted |
| `ignoreCredentials` | Optionnal boolean, if true, username and password values are erased and cannot be modified (just ignores credentials, does not raise any error) | Do not ignore |


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

/* Trying to set host or protocol to an invalid value will fail with a BrokenUrlRestrictionError */

const urlC = new XUrl(
    'ftp://domain.com/test/path/', 
    undefined, 
    restrictions
) // -> throws an error (wrong protocol)

urlA.href = 'http://wrong-domain.com/path' // -> throws an error (wrong host)

urlA.protocol = 'ftp:' // -> throws an error (wrong protocol)

const urlD = new XUrl('javascript:alert("XSS")') // -> throws an error (javascript: is not in the default list of allowed protocols)

// If "ignoreCredentials" is true, any attempt to set username or password will be ignored

const urlE = XUrl.parse(
    'https://user:password123@domain.com//test/path/',
    undefined,
    { ignoreCredentials: true }
)

urlE.username = 'user'
urlE.password = 'password123'
urlE.href = 'https://user:password123@domain.com//test/path/'

urlE.toString() // -> 'https://domain.com//test/path/'

```


#### Check URL string validity with `XUrl.canParse`

`XUrl.canParse` will also check the url string against provided (or default) restrictions

```js
import { XUrl } from 'url-toolkit'

const restrictions = {
    allowedProtocols: [ 'https', ],
    allowedHosts: [ 'domain.com', ]
}

XUrl.canParse('https://domain.com/test/path/', undefined, restrictions) // -> true

XUrl.canParse('/test/path/', 'https://wrong-domain.com', restrictions) // -> false (wrong host)

XUrl.canParse('javascript:alert("XSS")') // -> false (javascript: is not in the default list of allowed protocols)
```


## URL subclass : `RelativeUrl`

Extends `URL` to simplify representation of a relative http url.

An instance of `RelativeUrl` will always ignore all values from the url base (protcol, username, password, host, hostname, port)


### Representation Utils & Setter Shortcuts

For more information see [`XUrl` & `RelativeUrl` common utils](#xurl--relativeurl--common-utils)


### Instance Creation

```js
import { RelativeUrl } from 'url-toolbox'

const url = new RelativeUrl('/my/path/?query=banana')
url.toString() // -> /my/path/?query=banana

url.href = '/articles/'
url.toString() // -> /articles/

// url base will be ignored
url.href = 'https://domain.com/my/path/?query=banana'
url.toString() // -> /my/path/?query=banana
```

## `XUrl` & `RelativeUrl` : Common Utils

### Representation Utils : `as`

Each `XUrl` and `RelativeUrl` instance have an `as` key, that encapsulates representation utils for that instance.

Under the hood, `as` returns a  `UrlRepr` instance linked to the current instance, defining representation methods.

see [`UrlRepr doc`](#representation-helper-class--urlrepr)

```js
import { XUrl, RelativeUrl } from 'url-toolkit'

const url = new XUrl('http://my-domain.com/path?query2=value2&query1=value1')
const relativeUrl = new RelativeUrl('/somewhere?query2=value2&query1=value1')

url.as.normalised() // -> http://my-domain.com/path/?query1=value1&query2=value2
relativeUrl.as.normalised() // -> /somewhere/?query1=value1&query2=value2

url.as.filtered({
    search: false
}) // -> http://my-domain.com/path
```

### Method : `setPathnameSegments( segments )`

Available for both `XUrl` and `RelativeUrl`, it's a shortcut method allowing to set URL pathname from an array of strings.

Accepts a string array, defining all the segments of the pathname.\
Each item is encoded before being assemble to set the pathname value.


```js
import { XUrl } from 'url-toolbox'

const url = new XUrl('https:/site.com/test/')

url.setPathnameSegments(['articles', 'best pasta',])

url.toString() // -> https://site.com/articles/best%20pasta/
```

## Representation helper class : `UrlRepr`

Class defining representation utils for a URL instance

### Creating an instance

The instance needs to be linked with a URL intance

```js
import { UrlRepr } from 'url-toolbox'

const url = new URL('http://my-domain.com/path?query1=value1&query2=value2')

const urlRepr = new UrlRepr(url)
```

### Attributes 

#### Attribute : `normalisedPathname` (Read only)


#### Attribute : `normalisedSearch` (Read only)


### Methods

#### common argument structure : `filteringOpts`

Key/value object used for `filtered()` and `normalised()` methods, allowing to filter the url parts included in a URL, all keys are optional with default values.

- `baseMode` (`string`, default: `'NO_CREDENTIALS'`) modifies what's included in the url base :
    - `'ALL'` includes protocol, credentials and host in the result
    - `'NO_PROTOCOL'` : includes only credentials and host in the result
    - `'NO_CREDENTIALS'` : includes only protocol and host in the result
    - `'HOST_ONLY'` : includes only host in the result
    - `'NO_BASE'` : returns an empty string as base

- `pathname` (`boolean`, default: `true`) if true, we include the pathname in the result

- `search` (`boolean`, default `true`) - if true, we include the search in the result

- `hash` (`boolean`, default `true`) - if true, we include the hash in the result


```js
// requests only host and pathname
const filteringOpts = {
    baseMode: 'HOST_ONLY',
    pathname: true,
    search: false,
    hash: false
}
```

#### Method : `filtered( filteringOpts )`

The `filtered` method allows to get a url representation with 


####  Method : `normalised( filteringOpts? )`

The `normalised` method allows to get a url representation that is easy to compare with another url. 
The path and search params order is normalised to insure that most equivalent urls can be efficiently compared

```js
import { UrlRepr } from 'url-toolbox'

// defining equivalent urls having non matching hrefs
const urlA = new URL('http://my-domain.com/path?query1=value1&query2=value2')
// -> the second URL, has search params in a different order 
// and a slash at the end of the path
const urlB = new URL('http://my-domain.com/path/?query2=value2&query1=value1')

const reprA = new UrlRepr(urlA)
const reprB = new UrlRepr(urlB)


urlA === urlB // false
reprA.normalised() === reprB.normalised() // true
```


We can also filter the parts included in the normalised representation by providing a `filteringOpts` object.
(see `filteringOpts` structure)
```js
import { UrlRepr } from 'url-toolbox'

// defining equivalent urls having non matching hrefs
const url = new URL('http://my-domain.com/path?query1=value1&query2=value2')

const repr = new UrlRepr(url)

repr.normalise() // -> 'http://my-domain.com/path/?query1=value1&query2=value2'
repr.normalise({search:false}) // -> 'http://my-domain.com/path/'
```


## Types

`ExtendedUrl_T` : instance of `XUrl` or `RelativeUrl`
