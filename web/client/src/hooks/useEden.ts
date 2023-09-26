import {useEffect, useState} from "react";

type UseEdenOpts<Input extends EdenFetchInput, Data, Error extends EdenFetchError, Headers extends Record<string, string>> = {
  onSuccess?: (result: EdenFetchReturn<Data, Error, Headers>) => void;
  onError?: () => void;
  onDone?: () => void;
} & (
  keyof EdenFetchInputSchema<Input> extends never ? {
    input?: Input;
    lazy?: boolean;
  } : {
    input: Input
    lazy: boolean;
  }
)

// TODO: Make opts argument optional if all members are optional (i.e. no extra input)
export function useEden<Input extends EdenFetchInput, Data, Error extends EdenFetchError, Headers extends Record<string, string>>(
  fetch: EdenFetch<Input, Data, Error, Headers>,
  opts: UseEdenOpts<Input, Data, Error, Headers>
) {
  const [loading, setLoading] = useState(!opts.lazy);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [headers, setHeaders] = useState<Headers | null>(null);
  const [response, setResponse] = useState<Response | null>(null);

  const [resultPromise, setResultPromise] = useState(() => {
    if (opts.lazy) return null;

    // TODO: How does TS know that we've narrowed down whether or not fetch requires input?
    // @ts-ignore
    return opts.input ? fetch(opts.input) : fetch();
  });

  useEffect(() => {
    if (!resultPromise) return;

    setLoading(true);

    resultPromise
      .then(result => {
        setData(result.data);
        setError(result.error);
        setResponse(result.response);
        setHeaders(result.headers);
        opts.onSuccess?.(result);
      })
      .catch(() => {
        opts.onError?.();
      })
      .finally(() => {
        setLoading(false);
        opts.onDone?.();
      })
  }, [resultPromise]);

  const dispatch = (input = opts.input) => {
    // TODO: How does TS know that we've narrowed down whether or not fetch requires input?
    // @ts-ignore
    const promise = fetch(input);

    setResultPromise(promise);
  }

  return {
    data,
    loading,
    error,
    headers,
    response,
    dispatch
  }
}

type EdenFetchError<
  Status extends number = number,
  Value = unknown
> = Error & {
  status: Status
  value: Value
}

type EdenFetchInput = {
  $fetch?: RequestInit | undefined
  $query?: Record<string, string> | undefined;
  $headers?: Record<string, unknown> | undefined;
}

type EdenFetchInputSchema<Input extends EdenFetchInput> = Omit<Input, '$fetch' | '$query' | '$headers'>;

type EdenFetch<
  Input extends EdenFetchInput,
  Data,
  Error extends EdenFetchError,
  Headers extends Record<string, string>
> = ((params: Input) => Promise<EdenFetchReturn<Data, Error, Headers>>) | ((params?: Input) => Promise<EdenFetchReturn<Data, Error, Headers>>)

type EdenFetchReturn<Data, Error extends EdenFetchError, Headers extends Record<string, string>> =
  | {
      data: Data,
      error: null
      status: number,
      response: Response,
      headers: Headers
    }
  | {
      data: null,
      error: Error
      status: number,
      response: Response,
      headers: Headers
    }
