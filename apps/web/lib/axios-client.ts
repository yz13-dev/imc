import Axios, { type AxiosError, type AxiosRequestConfig } from "axios";

// const isDev = process.env.NODE_ENV === "development";
const API_URL = "http://localhost:8080";

export const AXIOS_INSTANCE = Axios.create({
  baseURL: API_URL,
});

export const axios = async <T>(
  config: AxiosRequestConfig,

  options?: AxiosRequestConfig,
): Promise<{ data: T, error: { data?: T, message?: string } | null }> => {
  const source = Axios.CancelToken.source();

  const configHeaders = config.headers;

  const optionsHeaders = options?.headers;

  const headers = {
    ...configHeaders,
    ...optionsHeaders,
  };

  const cfg: AxiosRequestConfig = {
    ...config,
    baseURL: API_URL
  }

  const promise = AXIOS_INSTANCE({
    ...cfg,
    ...options,
    headers,
    withCredentials: true,
    cancelToken: source.token,
  })
    .then(({ data, status }) => {
      return { data, error: null, status };
    })
    .catch((error: AxiosError<T>) => {
      const data = error.response?.data;
      const status = error.response?.status;
      if (data) {
        return { data, error: { message: error.message }, status }
      }
      // sus
      return { data: null as T, error: { message: error.message }, status: null }
    });

  // @ts-ignore
  promise.cancel = () => {
    source.cancel("Query was cancelled");
  };

  return promise;
};

// In some case with react-query and swr you want to be able to override the return error type so you can also do it here like this

export type BodyType<BodyData> = BodyData;
export type ErrorType<Error> = AxiosError<Error>;
