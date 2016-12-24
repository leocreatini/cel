import path from 'path';
import babel from 'rollup-plugin-babel';


export default {
	moduleName: 'Cel',
	entry: path.resolve(__dirname, '../src/index.js'),
	dest: path.resolve(__dirname, '../dist/cel.js'),
	format: 'umd',
	sourceMap: 'inline',
	plugins: [
		babel({
			exclude: 'node_modules/**'
		})
	]
};