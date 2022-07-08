import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable } from 'rxjs';
/**
 * @deprecated "HttpModule" (from the "@nestjs/common" package) is deprecated and will be removed in the next major release. Please, use the "@nestjs/axios" package instead.
 */
export declare class HttpService {
    private readonly instance;
    private readonly logger;
    constructor(instance?: AxiosInstance);
    request<T = any>(config: AxiosRequestConfig): Observable<AxiosResponse<T>>;
    get<T = any>(url: string, config?: AxiosRequestConfig): Observable<AxiosResponse<T>>;
    delete<T = any>(url: string, config?: AxiosRequestConfig): Observable<AxiosResponse<T>>;
    head<T = any>(url: string, config?: AxiosRequestConfig): Observable<AxiosResponse<T>>;
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Observable<AxiosResponse<T>>;
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Observable<AxiosResponse<T>>;
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Observable<AxiosResponse<T>>;
    get axiosRef(): AxiosInstance;
    private makeObservable;
}
