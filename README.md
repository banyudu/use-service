# @banyudu/use-service

useSWR with custom fetcher

useService buid on top of useSWR, with custom fetcher and validate function


## Install

```bash
npm install @banyudu/use-service
```

## Usage

```typescript
// useXxxx.ts
import useService from '@banyudu/use-service'

const fetcher = async (params: XxxxReq): Promise<XxxxResp> => {
  return axios.post('/api/xxxx', params)
}

const useXxxx = useService(fetcher, params => Boolean(params.id)) // fetcher will not be called if params.id is falsy

export default useXxxx
```

```typescript
// app.tsx
import useXxxx from '@hooks/useXxxx'

const App = () => {
  const { data: xxxxRes, isValidating: xxxxLoading, wait: waitXxxx } = useXxxx({ id: 1 })
  return (
    <div>
      {xxxxLoading ? 'loading' : xxxxRes?.data}
    </div>
  )
}
```

useXxxx will automatically send request when params change, if you want to manually trigger request, you can pass refreshFlag as second param, like:

```typescript
const App = () => {
  const [refreshFlag, setRefreshFlag] = useState(Math.random())
  const { data: xxxxRes, isValidating: xxxxLoading } = useXxxx({ id: 1 }, refreshFlag)
}
```
