/**
 * useService custom hook generator for creating hooks related to API requests
 */

import { useCallback, useEffect, useMemo, useRef } from 'react'

import useSWR, { SWRResponse, SWRConfiguration } from 'swr'
import jsonStableStringify from 'json-stable-stringify'
import { random } from './utils'

export const defaultSWROptions: SWRConfiguration = {
  shouldRetryOnError: false,
  errorRetryCount: 0,
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 0
}

/**
 * useService custom hook generator for creating hooks related to API requests
 * @param fetcher Request function, automatically infers its parameter types and return result types
 * @param validate Function to determine whether to skip the request, returns false to skip the request, typically used to avoid sending invalid requests to the backend when parameters are not satisfied
 * @returns Custom hook
 *
 *  Custom hook usage example:
 *
 *  const fetcher = async (params: XxxxReq): Promise<XxxxResp> => {
 *    return axios.post('/api/xxxx', params)
 *  }
 *
 *  const useXxxx = useService(fetcher, params => Boolean(params.id))
 *
 *  export default useXxxx
 *
 *  // Business page
 *
 *  const { data: xxxxRes, isValidating: xxxxLoading } = useXxxx({ id: 1 })
 *
 *  @remark By default, useXxxx will automatically initiate requests based on parameter changes. If manual request triggering is needed, you can pass a refreshFlag parameter, like:
 *  const [refreshFlag, setRefreshFlag] = useState(Math.random())
 *
 *  // When you need to re-request, setRefreshFlag(Math.random())
 *  // Math.random can also be replaced with nanoid / uuid or other functions that generate unique values
 *  const { data: xxxxRes, isValidating: xxxxLoading } = useXxxx({ id: 1 }, refreshFlag)
 */

export interface HookResult<Result = any> extends SWRResponse<Result | null> {
  wait: (options?: { interval?: number }) => Promise<Result | null>
}

const delimiter = '#^_^#'

const useService = <Result = any, Params = any>(
  fetcher: (p: Params) => Promise<Result>,
  validate?: (p: Params) => boolean,
  swrOptions?: SWRConfiguration
) => <RealResult = Result>(params?: Params, refreshFlag?: string | number): HookResult<RealResult> => {
  const stringifyParams = useMemo(() => jsonStableStringify(params), [params])

  // caution: validate may be a react hook
  const shouldSkip = validate?.(params as any) === false

  const key = useMemo(() => {
    if (refreshFlag !== null && refreshFlag !== undefined) {
      return [refreshFlag, shouldSkip].join(delimiter)
    }
    return random()
  }, [refreshFlag, stringifyParams, shouldSkip])

  const innerFetcher = useCallback(async ([_key, params]: any[]) => {
    if (shouldSkip) {
      return null
    }
    const res = await fetcher(params)
    return res as RealResult
  }, [shouldSkip])

  const result = useSWR<RealResult | null>([key, params], innerFetcher, { ...defaultSWROptions, ...swrOptions })
  const loadingRef = useRef(result.isValidating)
  useEffect(() => {
    loadingRef.current = result.isValidating
  }, [result.isValidating])

  const dataRef = useRef(result.data)
  useEffect(() => {
    dataRef.current = result.data
  }, [result.data])

  const wait = useCallback(async (options?: { interval?: number }) => {
    return await new Promise<RealResult | null>((resolve) => {
      const interval = options?.interval ?? 50
      const timer = setInterval(() => {
        if (!loadingRef.current) {
          clearInterval(timer)
          resolve(dataRef.current ?? null)
        }
      }, interval)
    })
  }, [loadingRef])

  return {
    ...result,
    wait
  }
}

export default useService
