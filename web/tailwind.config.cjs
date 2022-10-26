module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				'immich-primary': '#4250af',
				'immich-bg': 'white',
				'immich-fg': 'black',
				'immich-gray': '#F6F6F4'
				// 'immich-bg': '#121212',
				// 'immich-fg': '#D0D0D0',
			},
			fontFamily: {
				'immich-title': ['Snowburst One', 'cursive']
			}
		}
	},
	plugins: []
};
