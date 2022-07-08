import { EMPTY } from './empty';
import { onErrorResumeNext as onErrorResumeNextWith } from '../operators/onErrorResumeNext';
import { argsOrArgArray } from '../util/argsOrArgArray';
export function onErrorResumeNext(...sources) {
    return onErrorResumeNextWith(argsOrArgArray(sources))(EMPTY);
}
//# sourceMappingURL=onErrorResumeNext.js.map