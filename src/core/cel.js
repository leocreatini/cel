// src/core/cel.js
import Component from './component';
import exposeFunctions from '../helpers/exposeFunctions';
import initAvailableComponents from '../helpers/initAvailableComponents';

const Cel = function( options ) {
	window.Cel.instances = window.Cel.instances || [];

	// Make component.
	if ( options != null ) {
		let cel = new Component( options );
		// Exposes specified functions for public use.
		cel = exposeFunctions( cel );
		// Adds cel to list of Cel instances.
		window.Cel.instances.push( cel );
		// Return cel component with exposed functions.
		return cel;
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
