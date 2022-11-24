export function getHumanReadableBytes(bytes: number): string {
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

	return `${remainder.toFixed(magnitude == 0 ? 0 : 1)} ${units[magnitude]}`;
}
