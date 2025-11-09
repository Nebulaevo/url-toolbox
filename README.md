# 📬 URL Toolbox
**The `URL` class, upgraded.**

Provides a collection of classes to extend or complete the built-in `URL` class.

## Table of Contents

- 🛠️ [Extended `URL` classes](#extended-url-classes--xurl--relativeurl) with enhanced setters and representation helpers :
    - 🔒 [`XUrl`](#xurl--for-absolute-urls) : to create secure restricted `URL` instances with custom whitelisted hosts and protocols
    - 👉 [`RelativeUrl`](#relativeurl-for-relative-httphttps-urls) : to create relative http / https `URL` instances, without any url base
- 📷 [`UrlRepr`](#representation-helper-class--urlrepr) : helper class providing representation methods for a `URL` instance
- 🧮 [Types](#types)


## Extended `URL` classes : `XUrl` & `RelativeUrl`

Both classes extend the native `URL` class with :

➤ **An `as` attribute :**\
Returns a `UrlRepr` instance linked to the current instance, providing multiple representation helpers for the url (see [Representation helper class : `UrlRepr`](#representation-helper-class--urlrepr))

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
}) // -> /somewhere
```
<br>

➤ **A Type-Restricted Constructor :**\
    Constructor arguments are type-checked at execution time and will throw a `TypeError` if invalid, preventing common silent failures.

| Class | Constructor Args & Allowed Types |
| :--- | :----- |
| `XUrl` | **url** : `string` or `URL` <br> **base** : `string`, `URL` or `undefined` <br> **restrictions** : `key-value object` or `undefined` |
| `RelativeUrl` | **url** : `string`, `URL` or `undefined` |

```js
import { XUrl, RelativeUrl } from 'url-toolbox'

const url = new XUrl(
    undefined, // invalid type
    'http://test.com'
) // -> throws TypeError

XUrl.canParse(
    10, // invalid type
    'http://test.com'
) // -> false

XUrl.canParse(
    'http://test.com/test/',
    undefined,
    [1,2,3] // invalid restrictions
) // -> false

const relativeUrl = new RelativeUrl( 
    0 // invalid url
) // -> throws TypeError

RelativeUrl.canParse( 
    [1, 2, 3] // invalid url
) // -> false

RelativeUrl.canParse( 
    undefined // valid for relative url (will default to '/')
) // -> true 
```

<br>

➤ **Extended Attribute Setters :**\
    Attribute setters perform type-checks at execution time, and can throw a `TypeError` for invalid argument types, preventing common silent failures.\
    Additionally, some attributes are extended with alternative setting options (`port`, `pathname` and `search`).

| Attribute | Allowed Setter Values and their Behaviour |
| :--- | :----- |
| `protocol` | *✱ This restriction is only applied for `XUrl` instances as this attribute is ignored by `RelativeUrl` instances*<br><br>➤ **`string`** : calls default URL setter |
| `username` | *✱ This restriction is only applied for `XUrl` instances as this attribute is ignored by `RelativeUrl` instances*<br><br>➤ **`string`** : calls default URL setter|
| `password` | *✱ This restriction is only applied for `XUrl` instances as this attribute is ignored by `RelativeUrl` instances*<br><br>➤ **`string`** : calls default URL setter |
| `host` | *✱ This restriction is only applied for `XUrl` instances as this attribute is ignored by `RelativeUrl` instances*<br><br>➤ **`string`** : calls default URL setter |
| `hostname` | *✱ This restriction is only applied for `XUrl` instances as this attribute is ignored by `RelativeUrl` instances*<br><br>➤ **`string`** : calls default URL setter |
| `port` | *✱ This restriction is only applied for `XUrl` instances as this attribute is ignored by `RelativeUrl` instances*<br><br>➤ **`number` or `string` (representing a positive number)** : checks that the given value can be converted to a valid integer before calling the default URL setter|
| `pathname` | ➤ **`string`** : calls default URL pathname setter<hr> ➤ **`string array`** : assembles a path from the given segments (useful if building paths from dynamic values) |
| `search` | ➤ **`string`** : calls default URL setter<hr> ➤ **`URLSearchParams` or `key-value object with string values`** : converted to a search string before calling the default URL search setter |
| `hash` | ➤ **`string`** : calls default URL setter |
| `href` | ➤ **`string`** : calls default URL setter for `XUrl` instances, or manually sets attribute values for `RelativeUrl` instances |

Here are some examples to illustrate the additional type restrictions on attribute setters :
```js
import { XUrl, RelativeUrl } from 'url-toolbox'

const url = new XUrl('http://my-domain.com/path?query2=value2&query1=value1')
const relativeUrl = new RelativeUrl('/somewhere?query2=value2&query1=value1')


// Attempting to set a non-expected value to an attribute setter
// will throw a TypeError
url.host = undefined // (expected string)
url.port = '-10' // (expected positive number)
url.pathname = [1,2,3] // (expected string or string array)
relativeUrl.pathname = [1,2,3] // (expected string or string array)

// Exception : 
// url base attributes are ignored by RelativeUrl instances, 
// so even if the value has an invalid type, 
// no error is thrown, and the instance is not modified :
relativeUrl.host = undefined // (ignored)
relativeUrl.protocol = undefined // (ignored)
```

Here are some examples on how to use the alternative setter options
```js
import { XUrl, RelativeUrl } from 'url-toolbox'

const url = new XUrl('http://my-domain.com/path?query2=value2&query1=value1')
const relativeUrl = new RelativeUrl('/somewhere?query2=value2&query1=value1')

// port can be directly set with a positive number
// (only available in XUrl instances)
url.port = 8000
url.port // -> '8000'

// pathname can be set from a string array 
// each path segment is encoded before being assembled
url.pathname = ['single/path/segment', 'other']
relativeUrl.pathname = ['this', 'is', 'my path']

url.pathname // /single%2Fpath%2Fsegment/other/
relativeUrl.pathname // /this/is/my%20path/

// search can be set from a URLSearchParams instance
// or from a key-value pair object containing only string values
url.search = new URLSearchParams({
    newQuery: 'rabbits',
    filter: 'white'
})
relativeUrl.search = {
    newQuery: 'rabbits',
    filter: 'white'
}

url.search // ?newQuery=rabbits&filter=white
relativeUrl.search // ?newQuery=rabbits&filter=white

```

### `XUrl` : for Absolute URLs

This class allows to define restrictions on an instance :
- To define the whitelisted protocols (protocols are always restricted, even if no allowed protocols are defined)

- To define the whitelisted hosts

- To ignore credentials (username & password) for the instance

#### 🟆 `BrokenUrlRestrictionError`

Type of error thrown if a protocol or host restriction is about to be broken in a XUrl instance.

```js
import {BrokenUrlRestrictionError} from 'url-toolbox'
```

#### 🟆 Restrictions Object Structure

Restrictions are declared as a key-value object.\
They are defined at instance creation, if no value is given for a key, the default value is used.

| Key | Description | Default |
| - | - | - |
| `allowedProtocols` | *String array (optional)*<br>Defines whitelisted protocols.<br>(it's not possible to allow all protocols, if no allowed protocols are listed the default list is used)<br><br>Any attempt to use a non-allowed protocol will throw a `BrokenUrlRestrictionError` | http:, https:, ftp:, sftp:, ws:, wss:, blob:, about:, mailto:, tel:, sms: |
| `allowedHosts` | *String array (optional)*<br>Defines whitelisted hosts.<br>(should include eventual subdomain and eventual port number, if applicable)<br><br>If defined and non empty, any attempt to use a non-allowed host will throw a `BrokenUrlRestrictionError` | Not restricted |
| `ignoreCredentials` | *Boolean (optional)*<br><br>If true, username and password values are erased and cannot be modified. Any attempt to set credentials anyway will be ignored but will not throw any error. | Allow credentials |

#### 🟆 Creating and Modifying an Instance

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

// These operations will throw an error
urlA.href = 'http://wrong-domain.com/path' // (wrong host)
urlA.protocol = 'ftp:' // (wrong protocol)
```

If the given url doesn't respect protocol or host restrictions at instance creation, operation will also fail with `BrokenUrlRestrictionError`

```js
import { XUrl } from 'url-toolbox'

const restrictions = {
    allowedProtocols: [ 'http:', 'https:' ],
    allowedHosts: [ 'domain.com' ]
}

// Those attempts will fail because the initial value
// breaks host or protocol restrictions
const urlA = new XUrl(
    'ftp://wrong-domain.com/test/path/', 
    undefined, 
    restrictions
) // (wrong protocol & host)

const urlB = new XUrl('javascript:alert("XSS")') 
// -> (javascript: protocol is not in the default list of allowed protocols and '' is not an allowed host)

```

If credentials are ignored, any attempt to set username or password will be ignored, but no error will be thrown.

```js
import { XUrl } from 'url-toolbox'

// None of these methods will succeed at setting the credentials
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


#### 🟆 Check URL String Validity with `XUrl.canParse`

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


### `RelativeUrl`: for Relative Http/Https URLs

This class is built around the idea of ignoring the url base (`protocol`, `username`, `password`, `host`, `hostname`, or `port`).

To maintain coherence with the built-in `URL` API, the base url attribute setters and getters are still accessible but will be ignored.


#### 🟆 Instance Creation

Instances can be created with `new` or `RelativeUrl.parse`, with a relative or an absolute url string.\
If using an absolute url string, the protocol should be http:, or https:, the use of any other protocol will fail with a `TypeError`.


```js
import { RelativeUrl } from 'url-toolbox'

const urlA = new RelativeUrl('/my/path/?query=banana')
const urlB = RelativeUrl.parse('/my/path/?query=banana')
const urlC = RelativeUrl.parse('https://domain.com/my/path/?query=banana')

urlA.toString() // -> /my/path/?query=banana
urlB.toString() // -> /my/path/?query=banana
urlC.toString() // -> /my/path/?query=banana

const urlD = new RelativeUrl('mailto:me@box.house') // -> throws error (only supports http: or https: based urls)
```

#### 🟆 Url base attributes

In a `RelativeUrl` instance, attributes describing the url base are deactivated (`protocol`, `username`, `password`, `host`, `hostname`, or `port`).\
They will always return an empty string, and any attempt to modify their value will be ignored.

```js
// all of those attempts at setting url base related attributes are ignored
const url = RelativeUrl.parse('https://user:password@domain.com:8080/my/path/?query=banana')

url.protocol = 'https:'
url.username = 'user'
url.password = 'password'
url.host = 'domain.com:8080'
url.hostname = 'domain.com'
url.port = '8080'

url.protocol // -> ""
url.username // -> ""
url.password // -> ""
url.host // -> ""
url.hostname // -> ""
url.port // -> ""
```

#### 🟆 `href`

The `href` attribute accepts relative or absolute url strings, but will throw a `TypeError` if given an invalid url or an absolute url with a non-http protocol.

```js
import { RelativeUrl } from 'url-toolbox'

const url = new RelativeUrl('/my/path/?query=banana')

url.href = 'https://domain.com/new-page/'
url.href // -> /new-page/

url.href = '/other/page/?query=fish'
url.href // -> /other/page/?query=fish

url.href = 'ftp://domain.com/path/' // -> throws error (only supports http: or https: based urls)
```

#### 🟆 `RelativeUrl.canParse`

`canParse` static method is modified to allow relative url strings

```js
import { RelativeUrl } from 'url-toolbox'

RelativeUrl.canParse('/my/path/?query=banana') // -> true
RelativeUrl.canParse('https://domain.com/my/path/?query=banana') // -> true

RelativeUrl.canParse('ftp://domain.com/my/path/?query=banana') // -> false (only supports http: or https: based urls)
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
The path and search params order is normalised to ensure that most equivalent urls can be efficiently compared.


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

The filtering options argument is a key-value object allowing to filter the url parts included in a url representation (all keys are optional with default values).

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

ℹ️ Remark : for "host-less" protocols like `mailto:`, or `tel:`, the only available part of the url base is the protocol.
```js
import { UrlRepr } from 'url-toolbox'

const url = new URL('mailto:me@you.us')
const repr = new UrlRepr(url)


repr.normalised({
    baseMode: 'NO_CREDENTIALS'
}) // -> mailto:me@you.us

repr.normalised({
    baseMode: 'NO_PROTOCOL'
}) // -> me@you.us

repr.filtered({
    baseMode: 'HOST_ONLY',
}) // -> me@you.us

repr.filtered({
    baseMode: 'HOST_ONLY',
    pathname: false
}) // -> '' (because "me@you.us" is the pathname)

```

## Types

`ExtendedUrl_T` : instance of `XUrl` or `RelativeUrl`
