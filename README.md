# 📬 URL Toolbox

Collection of classes to extend or complete the `URL` class.


| Class            | Description |
| ---------------- | ----------- |
| `XUrl` | Extends the `URL` class with representation utils, setter shortcuts, and the abililty to limit the allowed protocols and hosts, or to ignore credentials |
| `RelativeUrl` | Class derived from `URL` to handle relative http url. It doesn't have a base, the only accessible url parts are `pathname`, `search`, `searchParams`, and `hash` |
| `UrlRepr` | Defines representation methods for a `URL` instance (filter parts or normalise url parts) |

## Table of Contents

- [URL subclass : `XUrl`](#url-subclass--xurl)
- [URL subclass : `RelativeUrl`](#url-subclass--relativeurl)
- [`XUrl` & `RelativeUrl` common utils](#xurl--relativeurl--common-utils)
- [Representation heler class `UrlRepr`](#representation-helper-class--urlrepr)

## URL subclass : `XUrl`

Extends the `URL` class with representation utils, setter shortcuts, and the abililty to limit the allowed protocols and hosts, or to ignore credentials

ℹ️ Common utils between `XUrl` & `RelativeUrl` (setter shortcuts an representation utils) are detailed here : [`XUrl` & `RelativeUrl` common utils](#xurl--relativeurl--common-utils)

### Restrictions

Restrictions are declared as a key/value object.\
They are defined at instance creation, by default it just sets allowed protocols, but it can also limit the allowed hosts, or prevent use of credentials in the URL.

| Key | Description | Default |
| - | - | - |
| `allowedProtocols` | Optionnal string array defining whitelisted protocols. Trying to set a non allowed protocol will throw a `BrokenUrlRestrictionError` (it's not possible to allow all protocols, if no allowed protocols are listed the default list is used) | http:, https:, ftp:, sftp:, ws:, wss:, blob:, about:, mailto:, tel:, sms: |
| `allowedHosts` | Optionnal string array defining whitelisted hosts (should include eventual subdomain, and eventual port number, if applicable). Trying to set a non allowed host will throw a `BrokenUrlRestrictionError` | Not restricted |
| `ignoreCredentials` | Optionnal boolean, if true, username and password values are erased and cannot be modified. Will just ignore credentials, does not raise any error. | Do not ignore |


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

If given url doesn't respect protocol or host restrictions at intance creation, operation will fail with `BrokenUrlRestrictionError`

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
// -> throws an error (javascript: is not in the default list of allowed protocols)

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
    allowedProtocols: [ 'https', ],
    allowedHosts: [ 'domain.com', ]
}

XUrl.canParse('https://domain.com/test/path/', undefined, restrictions) // -> true

XUrl.canParse('/test/path/', 'https://wrong-domain.com', restrictions) // -> false (wrong host)

XUrl.canParse('javascript:alert("XSS")') // -> false (javascript: is not in the default list of allowed protocols)
```


## URL subclass : `RelativeUrl`

Class derived from `URL` to handle relative http url.

An instance of `RelativeUrl` will always ignore all values from the url base (protcol, username, password, host, hostname, port).

ℹ️ Common utils between `XUrl` & `RelativeUrl` (setter shortcuts an representation utils) are detailed here : [`XUrl` & `RelativeUrl` common utils](#xurl--relativeurl--common-utils)

### Instance Creation

Instances can be created with `new` or `RelativeUrl.parse`

```js
import { RelativeUrl } from 'url-toolbox'

const urlA = new RelativeUrl('/my/path/?query=banana')
const urlB = RelativeUrl.parse('https://domain.com/my/path/?query=banana')

urlA.toString() // -> /my/path/?query=banana
urlB.toString() // -> /my/path/?query=banana

urlA.href = '/articles/'
urlA.toString() // -> /articles/

// url base will be ignored
urlA.href = 'https://domain.com/my/path/?query=banana'
urlA.toString() // -> /my/path/?query=banana
```

### `RelativeUrl.canParse`

Allows relative urls

```js
import { RelativeUrl } from 'url-toolbox'

RelativeUrl.canParse('/my/path/?query=banana') // -> true
RelativeUrl.canParse('https://domain.com/my/path/?query=banana') // -> true
```


## `XUrl` & `RelativeUrl` : Common Utils

### Representation Utils : `as`

Each `XUrl` and `RelativeUrl` instance have an `as` key, that encapsulates representation utils for that instance.

Under the hood, `as` returns a `UrlRepr` instance, that defines the representation methods linked to the current url instance.

see [`UrlRepr doc`](#representation-helper-class--urlrepr)

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

ℹ️ Setup automatically in `XUrl` and `RelativeUrl` instances under the `as` attribute.

### Creating an instance

The instance needs to be linked with a URL instance

```js
import { UrlRepr } from 'url-toolbox'

const url = new URL('http://my-domain.com/path?query1=value1&query2=value2')

const urlRepr = new UrlRepr(url)
```

### Filtering Options

Key/value object used for `filtered()` and `normalised()` methods, allowing to filter the url parts included in a URL, all keys are optional with default values.

| Key | Description | Default |
| --- | ----------- | ------- |
| `baseMode` | string, can be : <br><li><ul>"ALL" includes protocol, credentials and host in the result</ul><ul>"NO_PROTOCOL" : includes only credentials and host in the result</ul><ul>"NO_CREDENTIALS" : includes only protocol and host in the result</ul><ul>"HOST_ONLY" : includes only host in the result</ul><ul>"NO_BASE" : returns an empty string as base</ul></li> | "NO_CREDENTIALS" |
| `pathname` |  |  |
| `search` |  |  |
| `hash` |  |  |


<li><ul>"ALL" includes protocol, credentials and host in the result</ul><ul>"NO_PROTOCOL" : includes only credentials and host in the result</ul><ul>"NO_CREDENTIALS" : includes only protocol and host in the result</ul><ul>"HOST_ONLY" : includes only host in the result</ul><ul>"NO_BASE" : returns an empty string as base</ul></li>

- `baseMode` (`string`, default: `'NO_CREDENTIALS'`) modifies what's included in the url base :
    - <ul>"ALL" includes protocol, credentials and host in the result</ul>
    - <ul>"NO_PROTOCOL" : includes only credentials and host in the result</ul>
    - <ul>"NO_CREDENTIALS" : includes only protocol and host in the result</ul>
    - <ul>"HOST_ONLY" : includes only host in the result</ul>
    - <ul>"NO_BASE" : returns an empty string as base</ul>

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

### Filtered Representation



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
