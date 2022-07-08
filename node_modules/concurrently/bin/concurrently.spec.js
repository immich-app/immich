const readline = require('readline');
const _ = require('lodash');
const Rx = require('rxjs');
const { buffer, map } = require('rxjs/operators');
const spawn = require('spawn-command');

const isWindows = process.platform === 'win32';
const createKillMessage = prefix => new RegExp(
    _.escapeRegExp(prefix) +
    ' exited with code ' +
    (isWindows ? 1 : '(SIGTERM|143)')
);

const run = args => {
    const child = spawn('node ./concurrently.js ' + args, {
        cwd: __dirname,
        env: Object.assign({}, process.env, {
            // When upgrading from jest 23 -> 24, colors started printing in the test output.
            // They are forcibly disabled here
            FORCE_COLOR: 0
        }),
    });

    const stdout = readline.createInterface({
        input: child.stdout,
        output: null
    });

    const stderr = readline.createInterface({
        input: child.stderr,
        output: null
    });

    const close = Rx.fromEvent(child, 'close');
    const log = Rx.merge(
        Rx.fromEvent(stdout, 'line'),
        Rx.fromEvent(stderr, 'line')
    ).pipe(map(data => data.toString()));

    return {
        close,
        log,
        stdin: child.stdin,
        pid: child.pid
    };
};

it('has help command', done => {
    run('--help').close.subscribe(event => {
        expect(event[0]).toBe(0);
        done();
    }, done);
});

it('has version command', done => {
    Rx.combineLatest(
        run('--version').close,
        run('-V').close,
        run('-v').close
    ).subscribe(events => {
        expect(events[0][0]).toBe(0);
        expect(events[1][0]).toBe(0);
        expect(events[2][0]).toBe(0);
        done();
    }, done);
});

describe('exiting conditions', () => {
    it('is of success by default when running successful commands', done => {
        run('"echo foo" "echo bar"')
            .close
            .subscribe(exit => {
                expect(exit[0]).toBe(0);
                done();
            }, done);
    });

    it('is of failure by default when one of the command fails', done => {
        run('"echo foo" "exit 1"')
            .close
            .subscribe(exit => {
                expect(exit[0]).toBeGreaterThan(0);
                done();
            }, done);
    });

    it('is of success when --success=first and first command to exit succeeds', done => {
        run('--success=first "echo foo" "sleep 0.5 && exit 1"')
            .close
            .subscribe(exit => {
                expect(exit[0]).toBe(0);
                done();
            }, done);
    });

    it('is of failure when --success=first and first command to exit fails', done => {
        run('--success=first "exit 1" "sleep 0.5 && echo foo"')
            .close
            .subscribe(exit => {
                expect(exit[0]).toBeGreaterThan(0);
                done();
            }, done);
    });

    it('is of success when --success=last and last command to exit succeeds', done => {
        run('--success=last "exit 1" "sleep 0.5 && echo foo"')
            .close
            .subscribe(exit => {
                expect(exit[0]).toBe(0);
                done();
            }, done);
    });

    it('is of failure when --success=last and last command to exit fails', done => {
        run('--success=last "echo foo" "sleep 0.5 && exit 1"')
            .close
            .subscribe(exit => {
                expect(exit[0]).toBeGreaterThan(0);
                done();
            }, done);
    });

    it.skip('is of success when a SIGINT is sent', done => {
        const child = run('"node fixtures/read-echo.js"');
        child.close.subscribe(exit => {
            // TODO This is null within Node, but should be 0 outside (eg from real terminal)
            expect(exit[0]).toBe(0);
            done();
        }, done);

        process.kill(child.pid, 'SIGINT');
    });

    it('is aliased to -s', done => {
        run('-s last "exit 1" "sleep 0.5 && echo foo"')
            .close
            .subscribe(exit => {
                expect(exit[0]).toBe(0);
                done();
            }, done);
    });
});

describe('--raw', () => {
    it('is aliased to -r', done => {
        const child = run('-r "echo foo" "echo bar"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expect(lines).toHaveLength(2);
            expect(lines).toContainEqual(expect.stringContaining('foo'));
            expect(lines).toContainEqual(expect.stringContaining('bar'));
            done();
        }, done);
    });

    it('does not log any extra output', done => {
        const child = run('--raw "echo foo" "echo bar"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expect(lines).toHaveLength(2);
            expect(lines).toContainEqual(expect.stringContaining('foo'));
            expect(lines).toContainEqual(expect.stringContaining('bar'));
            done();
        }, done);
    });
});

describe('--hide', () => {
    it('hides the output of a process by its index', done => {
        const child = run('--hide 1 "echo foo" "echo bar"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expect(lines).toContainEqual(expect.stringContaining('foo'));
            expect(lines).not.toContainEqual(expect.stringContaining('bar'));
            done();
        }, done);
    });

    it('hides the output of a process by its name', done => {
        const child = run('-n foo,bar --hide bar "echo foo" "echo bar"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expect(lines).toContainEqual(expect.stringContaining('foo'));
            expect(lines).not.toContainEqual(expect.stringContaining('bar'));
            done();
        }, done);
    });
});

describe('--names', () => {
    it('is aliased to -n', done => {
        const child = run('-n foo,bar "echo foo" "echo bar"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expect(lines).toContainEqual(expect.stringContaining('[foo] foo'));
            expect(lines).toContainEqual(expect.stringContaining('[bar] bar'));
            done();
        }, done);
    });

    it('prefixes with names', done => {
        const child = run('--names foo,bar "echo foo" "echo bar"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expect(lines).toContainEqual(expect.stringContaining('[foo] foo'));
            expect(lines).toContainEqual(expect.stringContaining('[bar] bar'));
            done();
        }, done);
    });

    it('is split using --name-separator arg', done => {
        const child = run('--names "foo|bar" --name-separator "|" "echo foo" "echo bar"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expect(lines).toContainEqual(expect.stringContaining('[foo] foo'));
            expect(lines).toContainEqual(expect.stringContaining('[bar] bar'));
            done();
        }, done);
    });
});

describe('--prefix', () => {
    it('is aliased to -p', done => {
        const child = run('-p command "echo foo" "echo bar"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expect(lines).toContainEqual(expect.stringContaining('[echo foo] foo'));
            expect(lines).toContainEqual(expect.stringContaining('[echo bar] bar'));
            done();
        }, done);
    });

    it('specifies custom prefix', done => {
        const child = run('--prefix command "echo foo" "echo bar"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expect(lines).toContainEqual(expect.stringContaining('[echo foo] foo'));
            expect(lines).toContainEqual(expect.stringContaining('[echo bar] bar'));
            done();
        }, done);
    });
});

describe('--prefix-length', () => {
    it('is aliased to -l', done => {
        const child = run('-p command -l 5 "echo foo" "echo bar"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expect(lines).toContainEqual(expect.stringContaining('[ec..o] foo'));
            expect(lines).toContainEqual(expect.stringContaining('[ec..r] bar'));
            done();
        }, done);
    });

    it('specifies custom prefix length', done => {
        const child = run('--prefix command --prefix-length 5 "echo foo" "echo bar"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expect(lines).toContainEqual(expect.stringContaining('[ec..o] foo'));
            expect(lines).toContainEqual(expect.stringContaining('[ec..r] bar'));
            done();
        }, done);
    });
});

describe('--restart-tries', () => {
    it('changes how many times a command will restart', done => {
        const child = run('--restart-tries 1 "exit 1"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expect(lines).toEqual([
                expect.stringContaining('[0] exit 1 exited with code 1'),
                expect.stringContaining('[0] exit 1 restarted'),
                expect.stringContaining('[0] exit 1 exited with code 1'),
            ]);
            done();
        }, done);
    });
});

describe('--kill-others', () => {
    it('is aliased to -k', done => {
        const child = run('-k "sleep 10" "exit 0"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expect(lines).toContainEqual(expect.stringContaining('[1] exit 0 exited with code 0'));
            expect(lines).toContainEqual(expect.stringContaining('Sending SIGTERM to other processes'));
            expect(lines).toContainEqual(expect.stringMatching(createKillMessage('[0] sleep 10')));
            done();
        }, done);
    });

    it('kills on success', done => {
        const child = run('--kill-others "sleep 10" "exit 0"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expect(lines).toContainEqual(expect.stringContaining('[1] exit 0 exited with code 0'));
            expect(lines).toContainEqual(expect.stringContaining('Sending SIGTERM to other processes'));
            expect(lines).toContainEqual(expect.stringMatching(createKillMessage('[0] sleep 10')));
            done();
        }, done);
    });

    it('kills on failure', done => {
        const child = run('--kill-others "sleep 10" "exit 1"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expect(lines).toContainEqual(expect.stringContaining('[1] exit 1 exited with code 1'));
            expect(lines).toContainEqual(expect.stringContaining('Sending SIGTERM to other processes'));
            expect(lines).toContainEqual(expect.stringMatching(createKillMessage('[0] sleep 10')));
            done();
        }, done);
    });
});

describe('--kill-others-on-fail', () => {
    it('does not kill on success', done => {
        const child = run('--kill-others-on-fail "sleep 0.5" "exit 0"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expect(lines).toContainEqual(expect.stringContaining('[1] exit 0 exited with code 0'));
            expect(lines).toContainEqual(expect.stringContaining('[0] sleep 0.5 exited with code 0'));
            done();
        }, done);
    });

    it('kills on failure', done => {
        const child = run('--kill-others-on-fail "sleep 10" "exit 1"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expect(lines).toContainEqual(expect.stringContaining('[1] exit 1 exited with code 1'));
            expect(lines).toContainEqual(expect.stringContaining('Sending SIGTERM to other processes'));
            expect(lines).toContainEqual(expect.stringMatching(createKillMessage('[0] sleep 10')));
            done();
        }, done);
    });
});

describe('--handle-input', () => {
    it('is aliased to -i', done => {
        const child = run('-i "node fixtures/read-echo.js"');
        child.log.subscribe(line => {
            if (/READING/.test(line)) {
                child.stdin.write('stop\n');
            }

            if (/\[0\] stop/.test(line)) {
                done();
            }
        }, done);
    });

    it('forwards input to first process by default', done => {
        const child = run('--handle-input "node fixtures/read-echo.js"');
        child.log.subscribe(line => {
            if (/READING/.test(line)) {
                child.stdin.write('stop\n');
            }

            if (/\[0\] stop/.test(line)) {
                done();
            }
        }, done);
    });

    it('forwards input to process --default-input-target', done => {
        const lines = [];
        const child = run('-ki --default-input-target 1 "node fixtures/read-echo.js" "node fixtures/read-echo.js"');
        child.log.subscribe(line => {
            lines.push(line);
            if (/\[1\] READING/.test(line)) {
                child.stdin.write('stop\n');
            }
        }, done);

        child.close.subscribe(exit => {
            expect(exit[0]).toBeGreaterThan(0);
            expect(lines).toContainEqual(expect.stringContaining('[1] stop'));
            expect(lines).toContainEqual(expect.stringMatching(createKillMessage('[0] node fixtures/read-echo.js')));
            done();
        }, done);
    });

    it('forwards input to specified process', done => {
        const lines = [];
        const child = run('-ki "node fixtures/read-echo.js" "node fixtures/read-echo.js"');
        child.log.subscribe(line => {
            lines.push(line);
            if (/\[1\] READING/.test(line)) {
                child.stdin.write('1:stop\n');
            }
        }, done);

        child.close.subscribe(exit => {
            expect(exit[0]).toBeGreaterThan(0);
            expect(lines).toContainEqual(expect.stringContaining('[1] stop'));
            expect(lines).toContainEqual(expect.stringMatching(createKillMessage('[0] node fixtures/read-echo.js')));
            done();
        }, done);
    });
});

describe('--timings', () => {
    const defaultTimestampFormatRegex = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{3}/;
    const processStartedMessageRegex = (index, command) => {
        return new RegExp( `^\\[${ index }] ${ command } started at ${ defaultTimestampFormatRegex.source }$` );
    };
    const processStoppedMessageRegex = (index, command) => {
        return new RegExp( `^\\[${ index }] ${ command } stopped at ${ defaultTimestampFormatRegex.source } after (\\d|,)+ms$` );
    };
    const expectLinesForProcessStartAndStop = (lines, index, command) => {
        const escapedCommand = _.escapeRegExp(command);
        expect(lines).toContainEqual(expect.stringMatching(processStartedMessageRegex(index, escapedCommand)));
        expect(lines).toContainEqual(expect.stringMatching(processStoppedMessageRegex(index, escapedCommand)));
    };

    const expectLinesForTimingsTable = (lines) => {
        const tableTopBorderRegex = /┌[─┬]+┐/g;
        expect(lines).toContainEqual(expect.stringMatching(tableTopBorderRegex));
        const tableHeaderRowRegex = /(\W+(name|duration|exit code|killed|command)\W+){5}/g;
        expect(lines).toContainEqual(expect.stringMatching(tableHeaderRowRegex));
        const tableBottomBorderRegex = /└[─┴]+┘/g;
        expect(lines).toContainEqual(expect.stringMatching(tableBottomBorderRegex));
    };

    it('shows timings on success', done => {
        const child = run('--timings "sleep 0.5" "exit 0"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expectLinesForProcessStartAndStop(lines, 0, 'sleep 0.5');
            expectLinesForProcessStartAndStop(lines, 1, 'exit 0');
            expectLinesForTimingsTable(lines);
            done();
        }, done);
    });

    it('shows timings on failure', done => {
        const child = run('--timings "sleep 0.75" "exit 1"');
        child.log.pipe(buffer(child.close)).subscribe(lines => {
            expectLinesForProcessStartAndStop(lines, 0, 'sleep 0.75');
            expectLinesForProcessStartAndStop(lines, 1, 'exit 1');
            expectLinesForTimingsTable(lines);
            done();
        }, done);
    });
});
