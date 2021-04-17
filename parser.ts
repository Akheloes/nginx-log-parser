import * as fs from 'fs';
import { promisify } from 'util';
import { separatingSpaces, Log } from './i-log';
import { from, Observable } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

/**
 * Parsing nginx logs (access.log);
 * Answers functional requirements (as presented in the https://github.com/MYRE-CORP/ayu3t/tree/master/src/access-logs).
 * Considering the potential use of this class, it would be superior to make theh parse method a static method which takes the absolute path to access.log (no constructor).
 */
export class Parser {

    constructor(private logFileAbsolutePath: string) {}

    /**
     * Parses nginx default logs.
     * @returns Observable with the array of parsed logs.
     */
    public parse(): Observable<Partial<Log>[]> {
        // Resorting to RxJS to make the code easier to read.
        return from(promisify(fs.access)(this.logFileAbsolutePath, fs.constants.R_OK)).pipe(
            switchMap(() => {
                // This reads the file at once before processing it.
                return promisify(fs.readFile)(this.logFileAbsolutePath, 'utf-8');
            }),
            switchMap((logFileContent: string) => {
                // Take the log file content and parse it.
                return Promise.resolve(this._parse(logFileContent));
            }),
            catchError(error => {
                throw 'Access permission for access.log is denied.' + error;
            }),
        );
    }

    /**
     * This private function simply takes the parsing logic outside of the public parse method in order to make it more readable.
     * @param content : string content of the access.log file.
     * @returns the array of parsed logs.
     */
    private _parse(content: string): Partial<Log>[] {

        const logs: Partial<Log>[] = [];

        // First split the file into an array of lines.
        content.trim().split('\r\n').forEach((line, i) => {
            const log: Partial<Log> = {};

            // The idea is to split each line by first finding the separating meaningful spaces in each log line;
            // What is a meaningful space ? Look-up the i-log.ts file.
            // it replaces an older idea which was to recognize each component in a log line (remote_addr, request, etc.)
            const split_line = line.split(separatingSpaces).filter(item => item !== '' && item !== undefined && item !== ' ');

            log.remote_addr = split_line[0]
            log.remote_user = split_line[2]
            log.time_local = this._dropOpenerAndCloser(split_line[3])
            log.request = this._dropOpenerAndCloser(split_line[4])
            log.status = +split_line[5]
            log.body_bytes_sent = +split_line[6]
            log.http_referer = this._dropOpenerAndCloser(split_line[7])
            log.http_user_agent = this._dropOpenerAndCloser(split_line[8])
            log.http_x_forwarded_for = this._dropOpenerAndCloser(split_line[9] ? split_line[9] : '"-"')

            logs.push(log);
        });

        return logs;
    }

    /**
     * Utility function which drops the opening and closing characters, i.e: turns the string '[Patate]' into 'Patate'.
     * @param str input string.
     * @returns returns input string trimmed of opener/closer or '-' if input string was undefined.
     */
    private _dropOpenerAndCloser(str: string) : string {
        return str ? str.substr(1, str.length - 2) : '-';
    }
    
    /**
     * @deprecated was the first instinct, as it seamed reading chunks of the access.log file and immediatly processing them
     * could be less time-costly, a performance test over a 10^6 lines file (190 MB sizewise) 
     * showed it clocked around 50k lines per second (read + parse)
     * whereas the adopted parse method clocks around 68k.   
     * @returns Promise with array of parsed logs.
     */
    public parsePromisified(): Promise<Partial<Log>[]> {

        const file$ = fs.createReadStream(this.logFileAbsolutePath);
        const logs: Partial<Log>[] = [];

        return new Promise(
            (resolve, reject) => {
                file$.on('data', (chunk: Buffer) => {
                    let content = chunk.toString('utf8');
                    content.trim().split('\r\n').forEach((line, i) => {
                        const log: Partial<Log> = {};
            
                        const split_line = line.split(separatingSpaces).filter(item => item !== '' && item !== undefined && item !== ' ');
            
                        log.remote_addr = split_line[0]
                        log.remote_user = split_line[2]
                        log.time_local = this._dropOpenerAndCloser(split_line[3])
                        log.request = this._dropOpenerAndCloser(split_line[4])
                        log.status = +split_line[5]
                        log.body_bytes_sent = +split_line[6]
                        log.http_referer = this._dropOpenerAndCloser(split_line[7])
                        log.http_user_agent = this._dropOpenerAndCloser(split_line[8])
                        log.http_x_forwarded_for = this._dropOpenerAndCloser(split_line[9] ? split_line[9] : '"-"')
            
                        logs.push(log);
                    });
                });

                file$.on('end', () => {
                    file$.close();
                    resolve(logs);
                });
            }
        )
    }
}

