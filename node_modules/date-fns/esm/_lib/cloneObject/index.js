import assign from "../assign/index.js";
export default function cloneObject(dirtyObject) {
  return assign({}, dirtyObject);
}