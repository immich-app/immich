/**
 * Localized number of bytes with a unit.
 *
 * For `1536` bytes:
 * * en: `1.5 KiB`
 * * de: `1,5 KiB`
 *
 * @param bytes number of bytes
 * @param precision maximum number of decimal places, default is `1`
 * @returns localized bytes with unit as string
 */
export function getBytesWithUnit(bytes: number, precision = 1): string {
	const locale = Array.from(navigator.languages);
	const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];

	let magnitude = 0;
	let remainder = bytes;
	while (remainder >= 1024) {
		if (magnitude + 1 < units.length) {
			magnitude++;
			remainder /= 1024;
		} else {
			break;
		}
	}

	remainder = parseFloat(remainder.toFixed(precision));

	return `${remainder.toLocaleString(locale)} ${units[magnitude]}`;
}
