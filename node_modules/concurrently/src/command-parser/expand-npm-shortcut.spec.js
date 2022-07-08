const ExpandNpmShortcut = require('./expand-npm-shortcut');
const parser = new ExpandNpmShortcut();

it('returns same command if no npm: prefix is present', () => {
    const commandInfo = {
        name: 'echo',
        command: 'echo foo'
    };
    expect(parser.parse(commandInfo)).toBe(commandInfo);
});

for (const npmCmd of ['npm', 'yarn', 'pnpm']) {
    describe(`with ${npmCmd}: prefix`, () => {
        it(`expands to "${npmCmd} run <script> <args>"`, () => {
            const commandInfo = {
                name: 'echo',
                command: `${npmCmd}:foo -- bar`
            };
            expect(parser.parse(commandInfo)).toEqual({
                name: 'echo',
                command: `${npmCmd} run foo -- bar`
            });
        });

        it('sets name to script name if none', () => {
            const commandInfo = {
                command: `${npmCmd}:foo -- bar`
            };
            expect(parser.parse(commandInfo)).toEqual({
                name: 'foo',
                command: `${npmCmd} run foo -- bar`
            });
        });
    });

}
