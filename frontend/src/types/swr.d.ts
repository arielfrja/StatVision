declare module 'swr' {
  import type { ReactNode, ComponentType } from 'react';

  export interface SWRConfiguration<Data = any, Error = any> {
    fallbackData?: Data;
    revalidateOnMount?: boolean;
    revalidateOnFocus?: boolean;
    refreshInterval?: number | ((data: Data) => number);
    refreshWhenHidden?: boolean;
    refreshWhenOffline?: boolean;
    onSuccess?: (data: Data, key: string) => void;
    onError?: (error: Error, key: string) => void;
    shouldRetryOnError?: boolean;
    errorRetryCount?: number;
    errorRetryInterval?: number;
    loadingTimeout?: number;
    isPaused?: () => boolean;
    fetcher?: (...args: any[]) => any;
    fallback?: Record<string, any>;
    suspense?: boolean;
    revalidateIfStale?: boolean;
    revalidateOnReconnect?: boolean;
    dedupingInterval?: number;
    focusThrottleInterval?: number;
    keepPreviousData?: boolean;
  }

  export interface SWRResponse<Data = any, Error = any> {
    data: Data | undefined;
    error: Error | undefined;
    isValidating: boolean;
    isLoading: boolean;
    mutate: (
      data?: Data | Promise<Data> | ((currentData: Data) => Data),
      opts?: boolean
    ) => Promise<Data | undefined>;
  }

  type Fetcher<Data = any> = (...args: any[]) => Data | Promise<Data>;
  type Key = string | any[] | null | undefined | (() => string | any[] | null);

  export function useSWR<Data = any, Error = any>(
    key: Key,
    config?: SWRConfiguration<Data, Error> | null
  ): SWRResponse<Data, Error>;

  export function useSWR<Data = any, Error = any>(
    key: Key,
    fetcher: Fetcher<Data> | null,
    config?: SWRConfiguration<Data, Error>
  ): SWRResponse<Data, Error>;

  export const SWRConfig: ComponentType<{
    value?: SWRConfiguration;
    children?: ReactNode;
  }>;

  export default useSWR;
}
