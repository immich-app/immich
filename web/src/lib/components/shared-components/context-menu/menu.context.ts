import { createContext } from '$lib/utils/context';

const { get: triggerMenuContext, set: registerMenuContext } = createContext<() => void>();

export { registerMenuContext, triggerMenuContext };
