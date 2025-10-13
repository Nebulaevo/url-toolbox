# 📬 URL Toolbox

Collection of classes and utils to deal with URLs.


## URL subclass : `XUrl`

Class extending URL to add optionnal restrictions and representation utils 

```js
import { XUrl } from 'url-toolbox'

const url = new XUrl('https://my-site.com/some/path/')
```

### Representation Utils

Each `XUrl` instance have an `as` key, that encapsulates representation utils for that instance.

Under the hood, `as` returns a [`UrlRepr`](#representation-helper-class--urlrepr) instance liked to the current instance, giving you access to its methods.

```js
const url = new XUrl('http://my-domain.com/path?query2=value2&query1=value1')

url.as.normalised() // -> http://my-domain.com/path/?query1=value1&query2=value2

url.as.filtered({
    search: false
}) // -> http://my-domain.com/path
```

### Methods

#### Method : `setPathnameSegments( segments )`

Shortcut method allowing to set URL pathname from an array of strings.

Accepts a string array, defining all the segments of the pathname.\
Each item is encoded before being assemble to set the pathname value.


```js
import { XUrl } from 'url-toolbox'

const url = new XUrl('https:/site.com/test/')

url.setPathnameSegments(['articles', 'best pasta',])

url.toString() // -> https://site.com/articles/best%20pasta/
```

#### Method : `setRestrictions( restrictions )`

Allows to apply restrictions on the instance.\
If a restriction is about to be broken (by a setter, or when the restrictions are first applied) the instance throws a `BrokenUrlRestrictionError`.

Accepts a key/value object defining the restrictions to apply, accepted keys are :  
- `allowedProtocols` : optional protocols whitelist.\
By default, whitelisted protocols are : **http:**, **https:**, **ftp:**, **sftp:**, **ws:**, **wss:**, **blob:**, **about:**, **mailto:**, **tel:**, **sms:**

- `allowedHosts` : optionnal hosts whitelist.\
(listed hosts have should include eventual subdomain, and eventual port number, if applicable)\
By default, all hosts are accepted

- `allowCredentials` (boolean) : optionnal, if false, usage of username and password is forbidden\
By default : `true`

```js
import { XUrl } from 'url-toolbox'

const url = new XUrl('https:/site.com/test/')

url.setRestrictions({
    allowedProtocols: ['https:'],
    allowedHosts: ['site.com', 'localhost:8000']
})

// Attempting to break a restriction will fail
url.href = 'http://site.com/' // -> throws error (wrong protocol)
url.href = 'http://other-site.com' // -> throws error (wrong host)
url.protocol = 'http:' // -> throws error (wrong protocol)
```

### Static Methods

#### Static Method : `parse`

Behaves exactly like `URL.parse()`, but accepts an additionnal optional `restrictions` argument that can be applied to the created instance

```js
import { XUrl } from 'url-toolbox'

const urlA = XUrl.parse(
    'http://base.com', undefined, {
    allowedHosts: [ 'site.com' ]
}) // -> null

const urlB = XUrl.parse(
    'http://site.com', undefined, {
    allowedHosts: [ 'site.com' ]
}) // -> http://site.com

```

#### Static Method : `canParse`

Behaves exactly like `URL.canParse()`, but accepts an additionnal optional `restrictions` argument to check that the instance complies.

```js
import { XUrl } from 'url-toolbox'

const urlA = XUrl.canPase(
    'http://base.com', undefined, {
    allowedHosts: [ 'site.com' ]
}) // -> false

const urlB = XUrl.canPase(
    'http://site.com', undefined, {
    allowedHosts: [ 'site.com' ]
}) // -> true

```

### `BrokenUrlRestrictionError`

Type of error thrown if a restriction was about to be broken in a XUrl instance (see restrictions options for the XUrl instances)



## URL subclass : `RelativeUrl`

```js
import { RelativeUrl } from 'url-toolbox'
```

Class allowing to easily represent relative http urls.



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

Key/value object used for `filtered()` and `normalised()` methods, allowing to filter the url parts included in a URL, all keys are optionnal with default values.

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
