import { operate } from '../util/lift';
import { innerFrom } from '../observable/innerFrom';
import { createOperatorSubscriber } from './OperatorSubscriber';
export function exhaustAll() {
    return operate((source, subscriber) => {
        let isComplete = false;
        let innerSub = null;
        source.subscribe(createOperatorSubscriber(subscriber, (inner) => {
            if (!innerSub) {
                innerSub = innerFrom(inner).subscribe(createOperatorSubscriber(subscriber, undefined, () => {
                    innerSub = null;
                    isComplete && subscriber.complete();
                }));
            }
        }, () => {
            isComplete = true;
            !innerSub && subscriber.complete();
        }));
    });
}
//# sourceMappingURL=exhaustAll.js.map