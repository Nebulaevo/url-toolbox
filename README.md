# 📬 url-toolbox

Collection of classes and utils to deal with URLs.

## URL Classes

### `AbsoluteURL`

```js
import { AbsoluteURL } from 'url-toolbox'
```

### `RelativeURL`

```js
import { RelativeURL } from 'url-toolbox'
```

## Utility Classes

### `URLInstancePurifier`

```js
import { URLInstancePurifier } from 'url-toolbox'
```

### `UrlRepr`

```js
import { UrlRepr } from 'url-toolbox'
```

## Utility Functions

### `assembleUrlParts()`

```js
import { assembleUrlParts } from 'url-toolbox'
```

### `assemblePathnameSections()`

```js
import { assemblePathnameSections } from 'url-toolbox'
```

### `urlPurifyTools`

Collection of specialized functions to purify sections of a url

```js
import { urlPurifyTools } from 'url-toolbox'
```

#### - `purifyUriComponent( uriComponent )`


#### - `purifyPathSections( pathSections )`


#### - `purifySearchParams( searchParams )`


#### - `purifyHash( hash )`


#### - `purifyBaseParts( urlBaseParts, purifyOpts? )`


#### - `purifyTailParts( urlTailParts )`


#### - `purifyParts( urlParts )`


## Types

`EnhancedURL_T` : 

`AbsoluteURL.UrlParts_T` :

`RelativeURL.UrlParts_T` :

...