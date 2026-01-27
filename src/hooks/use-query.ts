import { useCallback, useEffect, useState } from 'react';

export interface UseQueryOptions<TData> {
    enabled?: boolean;
    onSuccess?: (data: TData) => void;
    onError?: (error: any) => void;
}

/**
 * 仿 React Query 的 useQuery Hook
 * 用于处理异步数据的查询，包含加载状态、错误处理和自动触发机制
 */
export function useQuery<TData = any>(
    queryKey: any[],
    queryFn: () => Promise<TData>,
    options: UseQueryOptions<TData> = {}
) {
    const { enabled = true, onSuccess, onError } = options;
    const [data, setData] = useState<TData | null>(null);
    const [isLoading, setIsLoading] = useState(enabled);
    const [error, setError] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await queryFn();
            setData(result);
            onSuccess?.(result);
        } catch (err) {
            setError(err);
            onError?.(err);
        } finally {
            setIsLoading(false);
        }
    }, [queryFn, onSuccess, onError]);

    useEffect(() => {
        if (enabled) {
            fetchData();
        }
    }, [...queryKey, enabled]);

    return { data, isLoading, error, refetch: fetchData, setData };
}

export interface UseMutationOptions<TData, TVariables> {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: any, variables: TVariables) => void;
}

/**
 * 仿 React Query 的 useMutation Hook
 * 用于处理异步数据的变更操作（如 POST、PUT 等），提供手动触发函数
 */
export function useMutation<TData = any, TVariables = any>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    options: UseMutationOptions<TData, TVariables> = {}
) {
    const { onSuccess, onError } = options;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    const [data, setData] = useState<TData | null>(null);

    const mutate = useCallback(async (variables: TVariables) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await mutationFn(variables);
            setData(result);
            onSuccess?.(result, variables);
            return result;
        } catch (err) {
            setError(err);
            onError?.(err, variables);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [mutationFn, onSuccess, onError]);

    return { mutate, isLoading, error, data };
}
