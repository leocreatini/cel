// src/core/cel.js
import Component from './component';
import exposeFunctions from '../helpers/exposeFunctions';


const Cel = function( options ) {

	let cel = new Component( options );

	// Exposes specified functions for public use.
	return exposeFunctions( cel );

};

export default Cel;
