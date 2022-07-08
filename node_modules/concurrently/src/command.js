const Rx = require('rxjs');

module.exports = class Command {
    get killable() {
        return !!this.process;
    }

    constructor({ index, name, command, prefixColor, env, killProcess, spawn, spawnOpts }) {
        this.index = index;
        this.name = name;
        this.command = command;
        this.prefixColor = prefixColor;
        this.env = env;
        this.killProcess = killProcess;
        this.spawn = spawn;
        this.spawnOpts = spawnOpts;
        this.killed = false;

        this.error = new Rx.Subject();
        this.timer = new Rx.Subject();
        this.close = new Rx.Subject();
        this.stdout = new Rx.Subject();
        this.stderr = new Rx.Subject();
    }

    start() {
        const child = this.spawn(this.command, this.spawnOpts);
        this.process = child;
        this.pid = child.pid;
        const startDate = new Date(Date.now());
        const highResStartTime = process.hrtime();
        this.timer.next({startDate});

        Rx.fromEvent(child, 'error').subscribe(event => {
            this.process = undefined;
            const endDate = new Date(Date.now());
            this.timer.next({startDate, endDate});
            this.error.next(event);
        });
        Rx.fromEvent(child, 'close').subscribe(([exitCode, signal]) => {
            this.process = undefined;
            const endDate = new Date(Date.now());
            this.timer.next({startDate, endDate});
            const [durationSeconds, durationNanoSeconds] = process.hrtime(highResStartTime);
            this.close.next({
                command: {
                    command: this.command,
                    name: this.name,
                    prefixColor: this.prefixColor,
                    env: this.env,
                },
                index: this.index,
                exitCode: exitCode === null ? signal : exitCode,
                killed: this.killed,
                timings: {
                    startDate,
                    endDate,
                    durationSeconds: durationSeconds + (durationNanoSeconds / 1e9),
                }
            });
        });
        child.stdout && pipeTo(Rx.fromEvent(child.stdout, 'data'), this.stdout);
        child.stderr && pipeTo(Rx.fromEvent(child.stderr, 'data'), this.stderr);
        this.stdin = child.stdin;
    }

    kill(code) {
        if (this.killable) {
            this.killed = true;
            this.killProcess(this.pid, code);
        }
    }
};

function pipeTo(stream, subject) {
    stream.subscribe(event => subject.next(event));
}
