'use strict';

const fs = require('fs');

const projectDir = process.cwd() + '\\';
const end = '\x1b[0m\n';

/**
 * @typedef LogFile
 * @prop {string} path Path to the file.
 * @prop {string} alias Alias used to identify the file.
 * @prop {number} length Current length of the text in the file.
 * @prop {number} maxLength Maximum length of the text in the file.
 * @prop {'stop'|'ignore'|'split'|'rewrite'|'continue'} behaviour The way a log behaves when it reaches its max length.
 * **stop** stops writing and informs you, **ignore** just stops writing, **split** creates new file, **rewrite** removes text from the beginning to make space.
 */

/**
 * Creates a string containing a formatted variable.
 * @param {*} any Variable of any type.
 * @returns {string} The formatted string.
 */
const format = (any) => {
    if (any === null) return '\x1b[35mnull' + end;

    switch (typeof any) {
        case 'string':
            return any + '\n';

        case 'number':
        case 'bigint':
            return `\x1b[33m${any.toString()}` + end;

        case 'undefined':
            return '\x1b[35mundefined' + end;

        case 'boolean':
            return `\x1b[34m${any}` + end;

        case 'function':
            return `[function \x1b[34m${any.name}` + end;

        case 'object':
            return JSON.stringify(any, null, Array.isArray(any) ? null : 4) + '\n';

        case 'symbol':
            return `[symbol \x1b[32m${any.description}` + end;
    }
};

/**
 * Fama class exposes logging methods and
 * keeps track of created log files.
 */
class Fama {

    constructor() {
        /**
         * @type {Array<LogFile>}
         */
        this.logs = [];
    }
    
    /**
     * Prints formatted output to the console.
     * @param {*} output Value to be printed.
     */
    printf(output) {
        process.stdout.write(format(output));
    }

    /**
     * Prints the text to the console.
     * @param {string} output Text to be printed.
     */
    print(output) {
        process.stdout.write(output);
    }

    /**
     * Prints the message to the console as a warning.
     * @param {string} message Warning message.
     */
    warn(message) {
        process.stdout.write(`\x1b[33mWARNING\x1b[0m ${message}\n`);
    }

    /**
     * Prints the message to the console as an error.
     * @param {string} message Error message.
     */
    error(message) {
        process.stdout.write(`\x1b[31mERROR\x1b[0m ${message}\n`);
    }

    /**
     * Prints the message to the console as a debug report.
     * @param {string} message Debug message.
     */
    debug(message) {
        process.stdout.write(`\x1b[32mDEBUG\x1b[0m ${message}\n`);
    }

    /**
     * Prints the message to the console as an info.
     * @param {string} message Info message.
     */
    info(message) {
        process.stdout.write(`\x1b[36mINFO\x1b[0m ${message}\n`);
    }

    /**
     * Adds new log to the register. If the file doesn't exist, it will be created. The directory must exist.
     * @param {string} file Relative file path including file name. For example: *logs/log.txt*
     * @param {string} alias Log identifier.
     * @param {number} maxLength The maximum length of a log.
     * @param {'stop'|'ignore'|'split'|'rewrite'|'continue'} behaviour The way a log behaves when it reaches its max length.
     */
    addLog(file, alias, maxLength = 5000, behaviour = 'stop') {
        file = file.replace(/\//g, '\\');
        let length = 0;
        
        try {
            if (!fs.existsSync(projectDir + file))
                fs.writeFileSync(file);
            else
                length = fs.statSync(projectDir + file).size;
        }
        catch {
            return this.error(`Fama couldn't create a file ${projectDir + file}`);
        }

        if (behaviour !== 'stop' && behaviour !== 'ingore' && behaviour !== 'split' && behaviour !== 'rewrite' && behaviour !== 'continue') {
            this.warn(`'${behaviour}' is not valid behaviour type. Defaulting to stop.`);
            behaviour = 'stop';
        }

        this.logs.push({
            path: file,
            alias: alias,
            length: length,
            maxLength: maxLength,
            behaviour: behaviour
        });
    }

    /**
     * Writes text to a log file. All previous content is overwritten. Ignores log *behaviour*.
     * @param {string} alias The log file alias.
     * @param {string} text
     */
    writeLog(alias, text) {
        const log = this.logs.find(log => log.alias === alias);
        if (log == null) return this.error(`Couldn't write to a log file with alias ${alias}, log file was not found`);

        fs.writeFileSync(log.path, text);
        log.length = text.length;
    }

    /**
     * Appends a line of text to a log file.
     * @param {string} alias The log file alias.
     * @param {string} text
     */
    appendLineLog(alias, text) {
        this.appendLog(alias, text + '\n');
    }

    /**
     * Appends text to a log file.
     * @param {string} alias The log file alias.
     * @param {string} text
     */
    appendLog(alias, text) {
        const log = this.logs.find(log => log.alias === alias);
        if (log == null) return this.error(`Couldn't append to a log file with alias ${alias}, log file was not found`);

        if (log.length + text.length > log.maxLength)
            return overflow(log, text);

        fs.appendFileSync(log.path, text);
        log.length += text.length;
    }

    /**
     * Removes all text from a log file.
     * @param {string} alias The log file alias.
     */
    clearLog(alias) {
        const log = this.logs.find(log => log.alias === alias);
        if (log == null) return this.error(`Couldn't clear a log file with alias ${alias}, log file was not found`);

        fs.writeFileSync(log.path, '');
        log.length = 0;
    }

    /**
     * Deletes a log file.
     * @param {string} alias The log file alias.
     */
    removeLog(alias) {
        let log, index;
        for (let i = 0; i < this.logs.length; i++) {
            if (this.logs[i].alias === alias) {
                log = this.logs[i];
                index = i;
                break;
            }
        }
        if (log == null) return this.error(`Couldn't delete a log file with alias ${alias}, log file was not found`);

        fs.unlinkSync(log.path);
        this.logs.splice(index, 1);
    }
}

/**
 * Handles a situation when a log file has length greater than maxLength.
 * @param {LogFile} log
 * @param {string} text
 */
function overflow(log, text) {
    switch (log.behaviour) {
        case 'stop':
            instance.info(`The ${log.alias} log file has reached its maximum size`);
            break;

        case 'rewrite':
            const readStream = fs.createReadStream(log.path);
            const writeStream = fs.createWriteStream(log.path + '.temp');

            let toDelete = (log.length + text.length) - log.maxLength;
            let pass = false;
            readStream.on('data', function(chunk) {
                if (pass) {
                    writeStream.write(chunk);
                }
                else if (!pass) {
                    const text = chunk.toString();
                    if (toDelete > text.length) {
                        toDelete -= text.length;
                    }
                    else {
                        const texts = text.split('\n');
                        for (let i = 0; i < texts.length; i++) {
                            toDelete -= texts[i].length;
                            if (toDelete <= 0 && i + 1 < texts.length) {
                                writeStream.write(texts.slice(i + 1).join('\n'));
                                break;
                            }
                        }
                        pass = true;
                    }
                }
            });

            readStream.on('close', () => {
                fs.unlinkSync(log.path);
                fs.linkSync(log.path + '.temp', log.path);
                fs.unlinkSync(log.path + '.temp');

                writeStream.write(text);
                writeStream.close();
            });
            break;

        case 'split':
            const fileIndex = ((log.length + text.length) / log.maxLength |0) + 1; // Math Magic
            const fileExtensionIndex = log.path.lastIndexOf('.');
            const nextFilePath = log.path.slice(0, fileExtensionIndex) + fileIndex + log.path.slice(fileExtensionIndex);

            fs.appendFileSync(nextFilePath, text);
            log.length += text.length;
            break;

        case 'continue':
            fs.appendFileSync(log.path, text);
            log.length += text.length;
            break;
    }
}

const instance = new Fama();
module.exports = instance;