/**
 * 类似于 useService，但是默认使用缓存，并提供 refresh 方法
 */

import { useAtom, atom } from 'jotai'
import useService, { HookResult } from './useService'
import { random } from './utils'

export interface CachedHookResult<Result = any> extends HookResult<Result> {
  refresh: () => void
}

type CachedService<Result = any, Params = any> = (params?: Params) => CachedHookResult<Result>

const useCachedService = <Result = any, Params = any> (
  fetcher: (p: Params) => Promise<Result>,
  skip?: (p: Params) => boolean
): CachedService<Result, Params> => {
  const innerHook = useService(fetcher, skip)
  const refreshAtom = atom<string>(random())
  return (params?: Params): CachedHookResult => {
    const [refreshKey, setRefreshKey] = useAtom(refreshAtom)

    const result = innerHook(params, refreshKey)
    return {
      ...result,
      refresh: () => setRefreshKey(random())
    }
  }
}

export default useCachedService
