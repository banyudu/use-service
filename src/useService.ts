/**
 * useService 自定义hook生成器，用于生成与 API 请求相关的 custom hook
 */

import { useCallback, useMemo } from 'react'

import useSWR, { SWRResponse, SWRConfiguration } from 'swr'
import { nanoid } from 'nanoid/index.browser'
import jsonStableStringify from 'json-stable-stringify'

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
const useService = <Result = any, Params = any>(
  fetcher: (p: Params) => Promise<Result>,
  skip?: (p: Params) => boolean
) => (params?: Params, refreshFlag?: string | number): SWRResponse<Result | null> => {
    const stringifyParams = jsonStableStringify(params)
    const key = useMemo(() => {
      if (refreshFlag !== null && refreshFlag !== undefined) {
        return refreshFlag
      }
      return nanoid()
    }, [refreshFlag, stringifyParams])

    const innerFetcher = useCallback(async ([_key, params]: any[]) => {
      if ((skip != null) && !skip(params)) {
        return null
      }
      const res = await fetcher(params)
      return res
    }, [])
    return useSWR([key, params], innerFetcher, defaultSWROptions)
  }

export default useService
