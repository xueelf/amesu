import type { Logger } from 'log4js';

import { EventEmitter } from 'node:events';
import { Token } from '@/client/token.js';
import { getLogger } from '@/utils/logger.js';
import { deepAssign, objectToString } from '@/utils/common.js';

export type Data = Record<string, unknown>;
export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type Instance = ReturnType<InstanceType<typeof Request>['create']>;
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
export type ResponseInterceptor = (result: Partial<Result>) => Partial<Result> | Promise<Partial<Result>> | undefined;

export interface RequestConfig extends RequestInit {
  baseURL?: string;
  method: Method;
  url: string;
}

export interface Result<T = Data> {
  data: T;
  config: RequestConfig;
  status: number;
  statusText: string;
  headers: Headers;
}

export class RequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestError';
  }
}

export class Request extends EventEmitter {
  private logger: Logger;
  private requestInterceptors: RequestInterceptor[];
  private responseInterceptors: ResponseInterceptor[];

  constructor(public token: Token) {
    super();

    this.logger = getLogger(token.config.appid);
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  public useRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  private useResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  public async base<T>(config: RequestConfig): Promise<Result<T>> {
    const defaultConfig: Omit<RequestConfig, 'method' | 'url'> = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    config = <RequestConfig>deepAssign(defaultConfig, config);

    // 请求拦截器
    for (const interceptor of this.requestInterceptors) {
      config = await interceptor(config);
    }
    this.logger.trace('开始发起网络请求...');

    const response = await fetch((config.baseURL ?? '') + config.url, config);
    const result: Partial<Result> = {
      status: response.status,
      config,
      statusText: response.statusText,
      headers: response.headers,
    };

    this.logger.debug(`Request: ${objectToString(config)}`);

    try {
      result.data = <Data>await response.json();

      // 响应拦截器
      for (const interceptor of this.responseInterceptors) {
        // TODO: ／人◕ ‿‿ ◕人＼ 目前用不到
      }
      this.emit('response', result);
      this.logger.debug(`Response: ${objectToString(result.data)}`);
    } catch (error) {
      if (!response.ok) {
        this.logger.error(error);
        throw error instanceof Error ? error : new RequestError('Request failed');
      }
      result.data = {};
    }
    return <Result<T>>result;
  }

  public create(config: Omit<RequestConfig, 'method' | 'url'>) {
    const that = this;

    return {
      config,
      get<T = Data>(url: string, config?: RequestConfig): Promise<Result<T>> {
        return that.get(url, { ...this.config, ...config });
      },
      post<T = Data>(url: string, data?: Data, config?: RequestConfig): Promise<Result<T>> {
        return that.post<T>(url, data, { ...this.config, ...config });
      },
    };
  }

  public get<T = Data>(url: string, config?: Omit<RequestConfig, 'method' | 'url'>): Promise<Result<T>> {
    return this.base<T>({
      url,
      method: 'GET',
      ...config,
    });
  }

  public post<T = Data>(
    url: string,
    data?: Data,
    config: Omit<RequestConfig, 'method' | 'url'> = {},
  ): Promise<Result<T>> {
    config.body = JSON.stringify(data);

    return this.base<T>({
      url,
      method: 'POST',
      ...config,
    });
  }
}
