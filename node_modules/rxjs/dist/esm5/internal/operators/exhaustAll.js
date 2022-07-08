import { operate } from '../util/lift';
import { innerFrom } from '../observable/innerFrom';
import { createOperatorSubscriber } from './OperatorSubscriber';
export function exhaustAll() {
    return operate(function (source, subscriber) {
        var isComplete = false;
        var innerSub = null;
        source.subscribe(createOperatorSubscriber(subscriber, function (inner) {
            if (!innerSub) {
                innerSub = innerFrom(inner).subscribe(createOperatorSubscriber(subscriber, undefined, function () {
                    innerSub = null;
                    isComplete && subscriber.complete();
                }));
            }
        }, function () {
            isComplete = true;
            !innerSub && subscriber.complete();
        }));
    });
}
//# sourceMappingURL=exhaustAll.js.map