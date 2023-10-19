/**
 * 类似于 useService，但是使用 jotai 缓存
 */

import { PrimitiveAtom, useAtom } from 'jotai'
import useService, { HookResult } from './useService'
import { random } from './utils'

export interface CachedHookResult<Result = any> extends HookResult<Result> {
  refresh: () => void
}

type CachedService<Result = any, Params = any> = (params?: Params) => CachedHookResult<Result>

const useCachedService = <Result = any, Params = any> (
  fetcher: (p: Params) => Promise<Result>,
  atom: PrimitiveAtom<string>,
  skip?: (p: Params) => boolean
): CachedService<Result, Params> => {
  const innerHook = useService(fetcher, skip)
  return (params?: Params): CachedHookResult => {
    const [refreshKey, setRefreshKey] = useAtom(atom)

    const result = innerHook(params, refreshKey)
    return {
      ...result,
      refresh: () => setRefreshKey(random())
    }
  }
}

export default useCachedService
