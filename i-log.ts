/**
 * Type for log's template.
 */
export interface Log {
    remote_addr: string,
    remote_user: string,
    time_local: string,
    request: string,
    status: number,
    body_bytes_sent: number,
    http_referer: string,
    http_user_agent: string,
    http_x_forwarded_for: string
}
/**
 * Meaningful separating space are those between $remote_addr, -, $remote_user, [$time_local] etc.
 * Works only for the default format, found in conf/nginx.conf's log_format (latest version, a.k.a: 1.19.9);
 */
// '$remote_addr - $remote_user [$time_local] "$request" '$status $body_bytes_sent "$http_referer" '"$http_user_agent" "$http_x_forwarded_for"'
export const separatingSpaces = /(((?<=\")|(?<=\])|(?<=\-)|(?<=\d))\s((?=\")|(?=\-)|(?=\[)|(?=\d)))|((?<=\-)\s(?=\w))|((?<=\w)\s(?=\[))/g;
