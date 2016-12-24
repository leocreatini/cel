import path from 'path';
import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';


export default {
	moduleName: 'Cel',
	entry: path.resolve(__dirname, '../src/index.js'),
	dest: path.resolve(__dirname, '../dist/cel.min.js'),
	format: 'umd',
	plugins: [
		babel({
			exclude: 'node_modules/**'
		}),
		uglify()
	]
};