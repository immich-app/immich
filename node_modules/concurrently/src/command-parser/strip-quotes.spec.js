const StripQuotes = require('./strip-quotes');
const parser = new StripQuotes();

it('returns command as is if no single/double quote at the beginning', () => {
    expect(parser.parse({ command: 'echo foo' })).toEqual({ command: 'echo foo' });
});

it('strips single quotes', () => {
    expect(parser.parse({ command: '\'echo foo\'' })).toEqual({ command: 'echo foo' });
});

it('strips double quotes', () => {
    expect(parser.parse({ command: '"echo foo"' })).toEqual({ command: 'echo foo' });
});

it('does not remove quotes if they are impaired', () => {
    expect(parser.parse({ command: '"echo foo' })).toEqual({ command: '"echo foo' });
    expect(parser.parse({ command: 'echo foo\'' })).toEqual({ command: 'echo foo\'' });
    expect(parser.parse({ command: '"echo foo\'' })).toEqual({ command: '"echo foo\'' });
});
