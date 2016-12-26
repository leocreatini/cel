// src/helpers/exposeFunctions.js


export default function exposeFunctions( cel ) {
	var exposed = {
		init: cel.init.bind(cel)
	};

	// Null-check for exposed functions
	if ( cel.exposed != null ) {
		if ( // Ensure exposed is an array.
			Array.isArray( cel.exposed ) &&
			cel.exposed.length > 0
		) {
			// Ensure user did not try to pass 'init' in the exposed list.
			// She/he should use a different function name.
			if ( cel.exposed.indexOf('init') > 0 ) {
				console.warn('['+cel.name+']: The \'init\' property is already taken by Cel, please use a different name for your function.');
			} else {
				// Attach all exposed functions to the 'exposed' object.
				for (
					let i = 0, numExposed = cel.exposed.length;
					i < numExposed;
					i = i + 1
				) {
					if ( cel.methods.hasOwnProperty( cel.exposed[i] ) ) {
						exposed[ cel.exposed[i] ] = cel.methods[ cel.exposed[i] ].bind(cel);
					}
				}
			}
		} else {
			console.warn('['+cel.name+']: Please ensure the \'exposed\' property is an array of strings.');
		}
	}

	return exposed;
}