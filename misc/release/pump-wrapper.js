import { pump } from './pump.js';

const [versionRaw, type] = process.argv.slice(2);
const { message, exitCode } = pump(versionRaw, type);

console.log(message);
process.exit(exitCode);
