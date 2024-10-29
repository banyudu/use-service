/**
 * useService 自定义hook生成器，用于生成与 API 请求相关的 custom hook
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
 * useService 自定义hook生成器，用于生成与 API 请求相关的 custom hook
 * @param fetcher 请求函数，会自动推导其请求参数类型和返回结果类型
 * @param skip 是否跳过请求的判断函数，返回 true 时跳过请求，一般用于参数不满足时不发起请求，避免无效请求发到后端
 * @returns 自定义hook
 *
 *  自定义hook用法示例：
 *
 *  const fetcher = async (params: XxxxReq): Promise<XxxxResp> => {
 *    return axios.post('/api/xxxx', params)
 *  }
 *
 *  const useXxxx = useService(fetcher, params => Boolean(params.id))
 *
 *  export default useXxxx
 *
 *  // 业务页面
 *
 *  const { data: xxxxRes, isValidating: xxxxLoading } = useXxxx({ id: 1 })
 *
 *  @remark 默认情况下，useXxxx 会根据请求参数的变化自动发起请求，如果需要手动触发请求，可以传入 refreshFlag 参数，如：
 *  const [refreshFlag, setRefreshFlag] = useState(Math.random())
 *
 *  // 当需要重新请求时，setRefreshFlag(Math.random())
 *  // Math.random 也可用 nanoid / uuid 等生成唯一值的函数替换
 *  const { data: xxxxRes, isValidating: xxxxLoading } = useXxxx({ id: 1 }, refreshFlag)
 */

export interface HookResult<Result = any> extends SWRResponse<Result | null> {
  wait: (options?: { interval?: number }) => Promise<Result | null>
}

const useService = <Result = any, Params = any>(
  fetcher: (p: Params) => Promise<Result>,
  skip?: (p: Params) => boolean,
  swrOptions?: SWRConfiguration
) => <RealResult = Result>(params?: Params, refreshFlag?: string | number): HookResult<RealResult> => {
  const stringifyParams = useMemo(() => jsonStableStringify(params), [params])

  const key = useMemo(() => {
    if (refreshFlag !== null && refreshFlag !== undefined) {
      return refreshFlag
    }
    return random()
  }, [refreshFlag, stringifyParams])

  // caution: skip may be a react hook
  const shouldSkip = skip?.(params as any) === false

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
