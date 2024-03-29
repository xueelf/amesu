import { deepAssign, objectToParams, parseBody, parseError } from '@/utils/common';

type Method = 'GET' | 'DELETE' | 'POST' | 'PUT' | 'PATCH';
type Config = Omit<RequestConfig, 'method' | 'url' | 'body'>;

export class RequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestError';
  }
}

export interface RequestConfig extends RequestInit {
  method: Method;
  url: string;
  origin?: string;
}

/** 请求拦截器 */
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
/** 响应拦截器 */
export type ResponseInterceptor<T = unknown> = (result: Result<T>) => Result | Promise<Result>;

/** 结果集 */
export interface Result<T = unknown> {
  data: T;
  /** 请求配置项 */
  config: RequestConfig;
  /** 响应状态码 */
  status: number;
  /** 状态码消息 */
  statusText: string;
  /** 请求头 */
  headers: Headers;
}

export class Request {
  private requestInterceptors: RequestInterceptor[];
  private responseInterceptors: ResponseInterceptor[];

  constructor() {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  /** 添加请求拦截器 */
  public useRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /** 添加响应拦截器 */
  public useResponseInterceptor<T>(interceptor: ResponseInterceptor<T>): void {
    this.responseInterceptors.push(<ResponseInterceptor>interceptor);
  }

  public async basis<T>(config: RequestConfig): Promise<Result<T>> {
    if (typeof config.body === 'string') {
      const defaultConfig: Config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      config = <RequestConfig>deepAssign(defaultConfig, config);
    }

    for (const interceptor of this.requestInterceptors) {
      config = await interceptor(config);
    }
    const url = (config.origin ?? '') + config.url;
    const response = await fetch(url, config);
    const result: Result = {
      data: null,
      status: response.status,
      config,
      statusText: response.statusText,
      headers: response.headers,
    };

    try {
      result.data = await response.json();
    } catch (error) {
      if (!response.ok) {
        throw new RequestError(parseError(error));
      }
      result.data = await response.text();
    }
    for (const interceptor of this.responseInterceptors) {
      deepAssign(result, await interceptor(result));
    }
    return <Result<T>>result;
  }

  public get<T>(url: string, params?: object, config?: Config): Promise<Result<T>> {
    if (params) {
      url += (/\?/.test(url) ? '&' : '?') + objectToParams(params);
    }
    return this.basis<T>({
      url,
      method: 'GET',
      ...config,
    });
  }

  public delete<T>(url: string, params?: object, config: Config = {}): Promise<Result<T>> {
    return this.basis<T>({
      url,
      method: 'DELETE',
      body: parseBody(params),
      ...config,
    });
  }

  public post<T>(url: string, params?: object, config: Config = {}): Promise<Result<T>> {
    return this.basis<T>({
      url,
      method: 'POST',
      body: parseBody(params),
      ...config,
    });
  }

  public put<T>(url: string, params?: object, config: Config = {}): Promise<Result<T>> {
    return this.basis<T>({
      url,
      method: 'PUT',
      body: parseBody(params),
      ...config,
    });
  }

  public patch<T>(url: string, params?: object, config: Config = {}): Promise<Result<T>> {
    return this.basis<T>({
      url,
      method: 'PATCH',
      body: parseBody(params),
      ...config,
    });
  }
}
