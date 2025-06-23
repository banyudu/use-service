/**
 * Works like useService, but use cache by default and provide refresh method
 */

import { useCallback, useMemo } from 'react'
import useService, { HookResult } from './useService'
import { random } from './utils'
import { atom, useAtom } from 'jotai'
import jsonStableStringify from 'json-stable-stringify'
import { SWRConfiguration } from 'swr'

export interface CachedHookResult<Result = any> extends HookResult<Result> {
  refresh: () => void
}

type CachedService<Result = any, Params = any> = (params?: Params) => CachedHookResult<Result>

const useCachedService = <Result = any, Params = any> (
  fetcher: (p: Params) => Promise<Result>,
  validate?: (p: Params) => boolean,
  swrOptions?: SWRConfiguration
): CachedService<Result, Params> => {
  const innerHook = useService(fetcher, validate, swrOptions)
  // const refreshKeyAtom = useMemo(() => atom<string>(random()), [])
  const refreshKeyMapAtom = atom<Record<string, string>>({})
  return (params?: Params): CachedHookResult => {
    // const [refreshKey, setRefreshKey] = useState(random())
    const stringifyParams = useMemo(() => jsonStableStringify(params), [params])

    const [refreshKeyMap, setRefreshKeyMap] = useAtom(refreshKeyMapAtom)

    const refreshKey = useMemo(() => {
      if (refreshKeyMap[stringifyParams] !== undefined && refreshKeyMap[stringifyParams] !== null) {
        return refreshKeyMap[stringifyParams]
      }
      const result = random()
      setRefreshKeyMap(old => ({
        ...old,
        [stringifyParams]: result
      }))
      return result
    }, [refreshKeyMap, setRefreshKeyMap])

    // const [refreshKey, setRefreshKey] = useAtom(refreshKeyMapAtom)

    const refresh = useCallback(() => {
      setRefreshKeyMap(old => ({
        ...old,
        [stringifyParams]: random()
      }))
    }, [stringifyParams, setRefreshKeyMap])

    const result = innerHook(params, refreshKey)
    return {
      ...result,
      refresh
    }
  }
}

export default useCachedService
