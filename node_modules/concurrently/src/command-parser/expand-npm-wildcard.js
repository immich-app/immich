const _ = require('lodash');
const fs = require('fs');

module.exports = class ExpandNpmWildcard {
    static readPackage() {
        try {
            const json = fs.readFileSync('package.json', { encoding: 'utf-8' });
            return JSON.parse(json);
        } catch (e) {
            return {};
        }
    }

    constructor(readPackage = ExpandNpmWildcard.readPackage) {
        this.readPackage = readPackage;
    }

    parse(commandInfo) {
        const [, npmCmd, cmdName, args] = commandInfo.command.match(/(npm|yarn|pnpm) run (\S+)([^&]*)/) || [];
        const wildcardPosition = (cmdName || '').indexOf('*');

        // If the regex didn't match an npm script, or it has no wildcard,
        // then we have nothing to do here
        if (!cmdName || wildcardPosition === -1) {
            return commandInfo;
        }

        if (!this.scripts) {
            this.scripts = Object.keys(this.readPackage().scripts || {});
        }

        const preWildcard = _.escapeRegExp(cmdName.substr(0, wildcardPosition));
        const postWildcard = _.escapeRegExp(cmdName.substr(wildcardPosition + 1));
        const wildcardRegex = new RegExp(`^${preWildcard}(.*?)${postWildcard}$`);
        const currentName = commandInfo.name || '';

        return this.scripts
            .map(script => {
                const match = script.match(wildcardRegex);

                if (match) {
                    return Object.assign({}, commandInfo, {
                        command: `${npmCmd} run ${script}${args}`,
                        // Will use an empty command name if command has no name and the wildcard match is empty,
                        // e.g. if `npm:watch-*` matches `npm run watch-`.
                        name: currentName + match[1],
                    });
                }
            })
            .filter(Boolean);
    }
};
