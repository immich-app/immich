import { EMPTY } from './empty';
import { onErrorResumeNext as onErrorResumeNextWith } from '../operators/onErrorResumeNext';
import { argsOrArgArray } from '../util/argsOrArgArray';
export function onErrorResumeNext() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    return onErrorResumeNextWith(argsOrArgArray(sources))(EMPTY);
}
//# sourceMappingURL=onErrorResumeNext.js.map