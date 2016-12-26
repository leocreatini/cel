// src/core/cel.js
import Component from './component';


const Cel = function( options ) {

	var cel = new Component( options );

	return {
		init: cel.init.bind(cel)
	};
};

export default Cel;