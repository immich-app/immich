const ExpandNpmWildcard = require('./expand-npm-wildcard');
const fs = require('fs');

let parser, readPkg;

beforeEach(() => {
    readPkg = jest.fn();
    parser = new ExpandNpmWildcard(readPkg);
});

describe('ExpandNpmWildcard#readPackage', () => {
    it('can read package', () => {
        const expectedPackage = {
            'name': 'concurrently',
            'version': '6.4.0',
        };
        jest.spyOn(fs, 'readFileSync').mockImplementation((path, options) => {
            if (path === 'package.json') {
                return JSON.stringify(expectedPackage);
            }
            return null;
        });

        const actualReadPackage = ExpandNpmWildcard.readPackage();
        expect(actualReadPackage).toEqual(expectedPackage);
    });

    it('can handle errors reading package', () => {
        jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
            throw new Error('Error reading package');
        });

        expect(() => ExpandNpmWildcard.readPackage()).not.toThrow();
        expect(ExpandNpmWildcard.readPackage()).toEqual({});
    });

});

it('returns same command if not an npm run command', () => {
    const commandInfo = {
        command: 'npm test'
    };

    expect(readPkg).not.toHaveBeenCalled();
    expect(parser.parse(commandInfo)).toBe(commandInfo);
});

it('returns same command if no wildcard present', () => {
    const commandInfo = {
        command: 'npm run foo bar'
    };

    expect(readPkg).not.toHaveBeenCalled();
    expect(parser.parse(commandInfo)).toBe(commandInfo);
});

it('expands to nothing if no scripts exist in package.json', () => {
    readPkg.mockReturnValue({});

    expect(parser.parse({ command: 'npm run foo-*-baz qux' })).toEqual([]);
});

for (const npmCmd of ['npm', 'yarn', 'pnpm']) {
    describe(`with an ${npmCmd}: prefix`, () => {
        it('expands to all scripts matching pattern', () => {
            readPkg.mockReturnValue({
                scripts: {
                    'foo-bar-baz': '',
                    'foo--baz': '',
                }
            });

            expect(parser.parse({ command: `${npmCmd} run foo-*-baz qux` })).toEqual([
                { name: 'bar', command: `${npmCmd} run foo-bar-baz qux` },
                { name: '', command: `${npmCmd} run foo--baz qux` },
            ]);
        });

        it('uses existing command name as prefix to the wildcard match', () => {
            readPkg.mockReturnValue({
                scripts: {
                    'watch-js': '',
                    'watch-css': '',
                }
            });

            expect(parser.parse({
                name: 'w:',
                command: `${npmCmd} run watch-*`,
            })).toEqual([
                { name: 'w:js', command: `${npmCmd} run watch-js` },
                { name: 'w:css', command: `${npmCmd} run watch-css` },
            ]);
        });

        it('caches scripts upon calls', () => {
            readPkg.mockReturnValue({});
            parser.parse({ command: `${npmCmd} run foo-*-baz qux` });
            parser.parse({ command: `${npmCmd} run foo-*-baz qux` });

            expect(readPkg).toHaveBeenCalledTimes(1);
        });
    });
}
