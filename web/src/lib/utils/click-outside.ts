export function clickOutside(node: Node) {
	const handleClick = (event: Event) => {
		const targetNode = event.target as Node | null;
		if (!node.contains(targetNode)) {
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
