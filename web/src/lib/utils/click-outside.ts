export function clickOutside(node: Node) {
	const handleClick = (event: any) => {
		if (!node.contains(event.target)) {
			node.dispatchEvent(new CustomEvent('out-click'));
		}
	};

	document.addEventListener('click', handleClick, true);

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}
