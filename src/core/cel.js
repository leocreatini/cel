// src/core/cel.js
import Component from './component';
import exposeFunctions from '../helpers/exposeFunctions';
import initAvailableComponents from '../helpers/initAvailableComponents';


const Cel = function( options ) {

	// Make component.
	if ( options != null ) {
		let cel = new Component( options );
		// Exposes specified functions for public use.
		return exposeFunctions( cel );
	}

	// Initialize components
	else if (
		options == null
	) {
		return {
			init: initAvailableComponents
		};
	}

	// Warn of bad config.
	else {
		console.warn('There was bad configurations with a Cel component. You must pass options for a cel component, or "null" and a namespace object for parameters to initialize components.');
	}

};

export default Cel;
