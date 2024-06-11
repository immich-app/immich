import { createContext } from '$lib/utils/context';

const { get: getMenuContext, set: setMenuContext } = createContext<() => void>();

export { getMenuContext, setMenuContext };
