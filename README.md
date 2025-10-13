# 📬 URL Toolbox

Collection of classes and utils to deal with URLs.


## `XUrl`

```js
import { XUrl } from 'url-toolbox'
```

Class extending `URL` adding:
- Optionnal restrictions
- Representation utils



### setRestrictions

- `allowedProtocols`
- `allowedHosts`
- `allowCredentials`

### `BrokenUrlRestrictionError`

Error type thrown if a restriction was broken in a XUrl instance (see restrictions options for the XUrl instances)



## `RelativeUrl`

```js
import { RelativeUrl } from 'url-toolbox'
```

Class allowing to easily represent relative http urls.



## `UrlRepr`

Class defining representation utils for a URL instance

### Creating an instance

The instance needs to be linked with a URL intance

```js
import { UrlRepr } from 'url-toolbox'

const url = new URL('http://my-domain.com/path?query1=value1&query2=value2')

const urlRepr = new UrlRepr(url)
```

### `filteringOpts` object

Key/value object used for `filtered` and `normalised` methods, allowing to filter the url parts included in a URL, all keys are optionnal with default values.

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


### method : `filtered( filteringOpts )`

The `filtered` method allows to get a url representation with 

### method : `normalised( filteringOpts? )`

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

#### `normalised` with filtering

we can modify the parts included in the normalised representation by providing a `filteringOpts` object.
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
