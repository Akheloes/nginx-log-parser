import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { Parser } from './parser';
import { Log } from './i-log';

export class Main {

    constructor(generateParsedLogsFile: boolean) {

        const filePath = path.resolve('./access.log');
        // const filePath = path.resolve('./access_big.log');

        const parser = new Parser(filePath);
        const timerStart = performance.now();
        parser.parse().subscribe(
            (logs: Partial<Log>[]) => {
                let timerEnd = performance.now();
                let executionDuration = Math.floor((timerEnd - timerStart)/1000) + 1;
                let linePerSecond = Math.floor(logs.length/executionDuration) + 1;
                console.log(`\nExecution time was: ${executionDuration} s.\n`);
                console.log(`\Log lines parsed per second (in average) : ${linePerSecond} lps.\n`);

                // writing the logs into a .json file
                if (generateParsedLogsFile) {
                    fs.writeFile('./lib/persed-logs.json', JSON.stringify(logs), 'utf8', (err) => {
                        if (!err) console.log('\nFinished writing parsed-logs.json file.\n');
                    });
                }
            }
        );
    }

}

new Main(false);
// if you wish to produce the parsed logs .json file (whihc will be at ./lib/parsed-log.json), create a big file and uncomment the following line
// new Main(true);