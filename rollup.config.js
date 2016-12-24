import path from 'path';
import babel from 'rollup-plugin-babel';


export default {
	entry: path.resolve(__dirname, './src/index.js'),
	dest: path.resolve(__dirname, './dist/cellular.js'),
	format: 'iife',
	sourceMap: 'inline',
	plugins: [
		babel({
			exclude: 'node_modules/**'
		})
	]
}