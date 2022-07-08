const chalk = require('chalk');
const _ = require('lodash');
const formatDate = require('date-fns/format');

const defaults = require('./defaults');

module.exports = class Logger {
    constructor({ hide, outputStream, prefixFormat, prefixLength, raw, timestampFormat }) {
        // To avoid empty strings from hiding the output of commands that don't have a name,
        // keep in the list of commands to hide only strings with some length.
        // This might happen through the CLI when no `--hide` argument is specified, for example.
        this.hide = _.castArray(hide).filter(name => name || name === 0).map(String);
        this.raw = raw;
        this.outputStream = outputStream;
        this.prefixFormat = prefixFormat;
        this.prefixLength = prefixLength || defaults.prefixLength;
        this.timestampFormat = timestampFormat || defaults.timestampFormat;
    }

    shortenText(text) {
        if (!text || text.length <= this.prefixLength) {
            return text;
        }

        const ellipsis = '..';
        const prefixLength = this.prefixLength - ellipsis.length;
        const endLength = Math.floor(prefixLength / 2);
        const beginningLength = prefixLength - endLength;

        const beginnning = text.substring(0, beginningLength);
        const end = text.substring(text.length - endLength, text.length);
        return beginnning + ellipsis + end;
    }

    getPrefixesFor(command) {
        return {
            none: '',
            pid: command.pid,
            index: command.index,
            name: command.name,
            command: this.shortenText(command.command),
            time: formatDate(Date.now(), this.timestampFormat)
        };
    }

    getPrefix(command) {
        const prefix = this.prefixFormat || (command.name ? 'name' : 'index');
        if (prefix === 'none') {
            return '';
        }

        const prefixes = this.getPrefixesFor(command);
        if (Object.keys(prefixes).includes(prefix)) {
            return `[${prefixes[prefix]}]`;
        }

        return _.reduce(prefixes, (prev, val, key) => {
            const keyRegex = new RegExp(_.escapeRegExp(`{${key}}`), 'g');
            return prev.replace(keyRegex, val);
        }, prefix);
    }

    colorText(command, text) {
        let color;
        if (command.prefixColor && command.prefixColor.startsWith('#')) {
            color = chalk.hex(command.prefixColor);
        } else {
            const defaultColor = _.get(chalk, defaults.prefixColors, chalk.reset);
            color = _.get(chalk, command.prefixColor, defaultColor);
        }
        return color(text);
    }

    logCommandEvent(text, command) {
        if (this.raw) {
            return;
        }

        this.logCommandText(chalk.reset(text) + '\n', command);
    }

    logCommandText(text, command) {
        if (this.hide.includes(String(command.index)) || this.hide.includes(command.name)) {
            return;
        }

        const prefix = this.colorText(command, this.getPrefix(command));
        return this.log(prefix + (prefix ? ' ' : ''), text);
    }

    logGlobalEvent(text) {
        if (this.raw) {
            return;
        }

        this.log(chalk.reset('-->') + ' ', chalk.reset(text) + '\n');
    }

    logTable(tableContents) {
        // For now, can only print array tables with some content.
        if (this.raw || !Array.isArray(tableContents) || !tableContents.length) {
            return;
        }

        let nextColIndex = 0;
        const headers = {};
        const contentRows = tableContents.map(row => {
            const rowContents = [];
            Object.keys(row).forEach((col) => {
                if (!headers[col]) {
                    headers[col] = {
                        index: nextColIndex++,
                        //
                        length: col.length,
                    };
                }

                const colIndex = headers[col].index;
                const formattedValue = String(row[col] == null ? '' : row[col]);
                // Update the column length in case this rows value is longer than the previous length for the column.
                headers[col].length = Math.max(formattedValue.length, headers[col].length);
                rowContents[colIndex] = formattedValue;
                return rowContents;
            });
            return rowContents;
        });

        const headersFormatted = Object
            .keys(headers)
            .map(header => header.padEnd(headers[header].length, ' '));

        if (!headersFormatted.length) {
            // No columns exist.
            return;
        }

        const borderRowFormatted = headersFormatted.map(header => '─'.padEnd(header.length, '─'));

        this.logGlobalEvent(`┌─${borderRowFormatted.join('─┬─')}─┐`);
        this.logGlobalEvent(`│ ${headersFormatted.join(' │ ')} │`);
        this.logGlobalEvent(`├─${borderRowFormatted.join('─┼─')}─┤`);

        contentRows.forEach(contentRow => {
            const contentRowFormatted = headersFormatted.map((header, colIndex) => {
                // If the table was expanded after this row was processed, it won't have this column.
                // Use an empty string in this case.
                const col = contentRow[colIndex] || '';
                return col.padEnd(header.length, ' ');
            });
            this.logGlobalEvent(`│ ${contentRowFormatted.join(' │ ')} │`);
        });

        this.logGlobalEvent(`└─${borderRowFormatted.join('─┴─')}─┘`);
    }

    log(prefix, text) {
        if (this.raw) {
            return this.outputStream.write(text);
        }

        // #70 - replace some ANSI code that would impact clearing lines
        text = text.replace(/\u2026/g, '...');

        const lines = text.split('\n').map((line, index, lines) => {
            // First line will write prefix only if we finished the last write with a LF.
            // Last line won't write prefix because it should be empty.
            if (index === 0 || index === lines.length - 1) {
                return line;
            }
            return prefix + line;
        });

        if (!this.lastChar || this.lastChar === '\n') {
            this.outputStream.write(prefix);
        }

        this.lastChar = text[text.length - 1];
        this.outputStream.write(lines.join('\n'));
    }
};
