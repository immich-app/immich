import { Subject } from '../Subject';
import { from } from '../observable/from';
import { operate } from '../util/lift';
import { fromSubscribable } from '../observable/fromSubscribable';
const DEFAULT_CONFIG = {
    connector: () => new Subject(),
};
export function connect(selector, config = DEFAULT_CONFIG) {
    const { connector } = config;
    return operate((source, subscriber) => {
        const subject = connector();
        from(selector(fromSubscribable(subject))).subscribe(subscriber);
        subscriber.add(source.subscribe(subject));
    });
}
//# sourceMappingURL=connect.js.map