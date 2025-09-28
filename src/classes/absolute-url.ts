import type  { Dict_T } from 'sniffly'

import { buildPathFromUrlPieces, purifyBaseUrlPieces, purifyRelativeUrlPieces } from '../utils/shortcuts.js'
import UrlRepr from './url-repr.js'


class AbsoluteURL extends URL {
    #as: UrlRepr | undefined

    static fromPieces(kwargs: {
        url: AbsoluteURL.UrlPieces_T, 
        purifyOpts?: AbsoluteURL.PurifyOptions_T
    }): AbsoluteURL | null {

        const {
            purify = false,
            ...purificationOpts
        } = kwargs.purifyOpts ?? {}

        let urlPieces = kwargs.url

        if (purify) {
            const purifiedBasePieces = purifyBaseUrlPieces(
                {
                    protocol: urlPieces.protocol,
                    host: urlPieces.host,
                }, 
                purificationOpts
            )
            if (!purifiedBasePieces) return null

            const purifiedRelativePieces = purifyRelativeUrlPieces({
                pathname: urlPieces.pathname,
                search: urlPieces.search,
                hash: urlPieces.hash,
            })
            if (!purifiedRelativePieces) return null

            urlPieces = {
                ...purifiedBasePieces,
                ...purifiedRelativePieces,
            }
        }

        const path = buildPathFromUrlPieces(urlPieces)

        try {
            const url = new this(path)
            return url
        } catch (_err) {
            return null
        }
    }

    /** Returns an instance of UrlRepr allowing to get different representations of the URL */
    get as(): UrlRepr {
        if (!this.#as) this.#as = new UrlRepr(this)
        return this.#as
    }
}

namespace AbsoluteURL {
    export type PurifyOptions_T = {
        purify: boolean,
        allowedProtocols?: string[],
        allowedHosts?: string[],
    }
    
    export type UrlPieces_T = {
        protocol: string,
        host: string,
        pathname?: string[],
        search?: Dict_T<string> | URLSearchParams,
        hash?: string,
    }
}

export default AbsoluteURL