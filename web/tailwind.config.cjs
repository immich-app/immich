module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				// Light Theme
				'immich-primary': '#4250af',
				'immich-bg': 'white',
				'immich-fg': 'black',
				'immich-gray': '#F6F6F4',

				// Dark Theme
				'immich-dark-primary': '#adcbfa',
				'immich-dark-bg': 'black',
				'immich-dark-fg': '#e5e7eb',
				'immich-dark-gray': '#212121'
			},
			fontFamily: {
				'immich-title': ['Snowburst One', 'cursive']
			},
			screens: {
				'3xl': '1700px',
				'4xl': '1900px',
				'5xl': '2100px'
			}
		}
	},
	plugins: []
};
