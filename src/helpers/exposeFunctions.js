// src/helpers/exposeFunctions.js


export default function exposeFunctions( cel ) {

	var exposed = {
		__ctx__: cel.__ctx__.bind(cel),
		init: cel.init.bind(cel),
		getName: cel.getName.bind(cel)
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
				for ( let i = 0, numExpo = cel.exposed.length; i < numExpo; i++ ) {
					if ( cel.methods.hasOwnProperty( cel.exposed[i] ) ) {
						exposed[ cel.exposed[i] ] = cel.methods[ cel.exposed[i] ].bind( cel );
					}
				}
			}
		} else {
			console.warn('['+cel.name+']: Please ensure the \'exposed\' property is an array of strings.');
		}
	}

	return exposed;
}
