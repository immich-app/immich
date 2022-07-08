import { operate } from '../util/lift';
import { innerFrom } from '../observable/innerFrom';
import { argsOrArgArray } from '../util/argsOrArgArray';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { noop } from '../util/noop';
export function onErrorResumeNext(...sources) {
    const nextSources = argsOrArgArray(sources);
    return operate((source, subscriber) => {
        const remaining = [source, ...nextSources];
        const subscribeNext = () => {
            if (!subscriber.closed) {
                if (remaining.length > 0) {
                    let nextSource;
                    try {
                        nextSource = innerFrom(remaining.shift());
                    }
                    catch (err) {
                        subscribeNext();
                        return;
                    }
                    const innerSub = createOperatorSubscriber(subscriber, undefined, noop, noop);
                    nextSource.subscribe(innerSub);
                    innerSub.add(subscribeNext);
                }
                else {
                    subscriber.complete();
                }
            }
        };
        subscribeNext();
    });
}
//# sourceMappingURL=onErrorResumeNext.js.map