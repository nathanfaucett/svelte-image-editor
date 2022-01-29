import fs from 'fs';
import path from 'path';
import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

const pkg = JSON.parse(fs.readFileSync(new URL('package.json', import.meta.url), 'utf8'));

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess(),
	kit: {
		adapter: adapter(),
		target: '#svelte',
		appDir: 'internal',
		paths: {
			base: process.env.USE_BASE_PATH ? '/svelte-image-editor' : ''
		},
		vite: {
			define: {
				PACKAGE_JSON: JSON.stringify(pkg)
			},
			resolve: {
				alias: {
					'svelte-image-editor': path.resolve('src/lib')
				}
			}
		}
	}
};

export default config;
