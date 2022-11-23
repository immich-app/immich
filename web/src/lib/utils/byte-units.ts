export function getHumanReadableByteString(bytes: number) {
	const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];

	let magnitude = 0;
	let n = bytes;
	while (n >= 1024 && ++magnitude) {
		n = n / 1024;
	}

	return `${n.toFixed( magnitude == 0 ? 0 : 1 )} ${units[magnitude]}`;
}
