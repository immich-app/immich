export interface MessageEvent {
    data: string | object;
    id?: string;
    type?: string;
    retry?: number;
}
