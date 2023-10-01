/**
 * 类似于 useService，但是使用 jotai 缓存
 */

import { SWRResponse } from 'swr'
import { nanoid } from 'nanoid'
import { PrimitiveAtom, useAtom } from 'jotai'
import useService from './useService'

type CachedService<Result = any, Params = any> = (params?: Params) => SWRResponse<Result | null> & { refresh: () => void }

const useCachedService = <Result = any, Params = any> (
  fetcher: (p: Params) => Promise<Result>,
  atom: PrimitiveAtom<string>,
  skip?: (p: Params) => boolean
): CachedService<Result, Params> => {
  const innerHook = useService(fetcher, skip)
  return (params?: Params): SWRResponse<Result | null> & { refresh: () => void } => {
    const [refreshKey, setRefreshKey] = useAtom(atom)

    const result = innerHook(params, refreshKey)
    return {
      ...result,
      refresh: () => setRefreshKey(nanoid())
    }
  }
}

export default useCachedService
