type ColorTextFn = (text: string) => string;

const isColorAllowed = () => !process.env.NO_COLOR;
const colorIfAllowed = (colorFn: ColorTextFn) => (text: string) => (isColorAllowed() ? colorFn(text) : text);

export const LogColor = {
  red: colorIfAllowed((text: string) => `\u001B[31m${text}\u001B[39m`),
  green: colorIfAllowed((text: string) => `\u001B[32m${text}\u001B[39m`),
  yellow: colorIfAllowed((text: string) => `\u001B[33m${text}\u001B[39m`),
  blue: colorIfAllowed((text: string) => `\u001B[34m${text}\u001B[39m`),
  magentaBright: colorIfAllowed((text: string) => `\u001B[95m${text}\u001B[39m`),
  cyanBright: colorIfAllowed((text: string) => `\u001B[96m${text}\u001B[39m`),
};

export const LogStyle = {
  bold: colorIfAllowed((text: string) => `\u001B[1m${text}\u001B[0m`),
};
