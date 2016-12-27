// src/core/scriptMixin.js


export function scriptMixin(Cel) {

	// From Underscore library
	Cel.prototype._debounce = function( func, wait, immediate ) {
		let timeout;
		return function() {
			let context = this;
			let args = arguments;
			let later = function() {
				timeout = null;
				if (!immediate) {
					func.apply(context, args);
				}
			};
			let callNow = (immediate && !timeout);
			clearTimeout( timeout );
			timeout = setTimeout(later, wait);
			if (callNow) {
				func.apply(context, args);
			}
		};
	};


	// From Underscore library
	Cel.prototype._throttle = function( func, wait, options ) {
		let context, args, result;
		let timeout = null;
		let previous = 0;
		if ( !options ) {
			options = {};
		}
		let later = function() {
			previous = options.leading === false ? 0 : Date.now();
			timeout = null;
			result = func.apply(context, args);
			if ( !timeout ) {
				context = args = null;
			}
		};
		return function() {
			let now = Date.now();
			if ( !previous && options.leading === false ) {
				previous = now;
			}
			let remaining = wait - (now - previous);
			context = this;
			args = arguments;
			if ( remaining <= 0 || remaining > wait ) {
				if (timeout) {
					clearTimeout(timeout);
					timeout = null;
				}
				previous = now;
				result = func.apply(context, args);
				if ( !timeout ) {
					context = args = null;
				}
			} else if ( !timeout && options.trailing !== false ) {
				timeout = setTimeout(later, remaining);
			}
			return result;
		};
	};

	Cel.prototype.fetch = function( url, successCallback, errorCallback ) {
			var req;
			req = new XMLHttpRequest();
			req.onload = function() {
				( req.status === 200 )
					? successCallback( req.responseText )
					: errorCallback( req.statusText );
			}
			req.open('GET', url, true);
			req.send();
	};


	// Set state synchronously.
	Cel.prototype.setState = function( prop, value ) {
		const vm = this;
		try {
			vm.state[ prop ] = value;
		} catch (err) {
			console.warn('['+vm.name+']: Could not set value of "'+prop+'", make sure it exists in your component config.', err);
		}
	};


	// Set state asynchronously.
	Cel.prototype.setStateAsync = function( prop, asyncTask, asyncCallback ) {
		const vm = this;

		// Create promise.
		var p = new Promise(function( resolve, reject ) {
			asyncTask(
				function(data) { resolve( data ); },
				function(err) { reject( err ); }
			);
		});

		// When promise succeeds.
		p.then(function( data ) {
			vm.state[ prop ] = data;

			if ( // Pass data to callback if it exists and is a function.
				asyncCallback != null &&
			 	typeof asyncCallback === 'function'
			) {
				asyncCallback( data );
			}

		});

		// When promise fails.
		p.catch(function( err ) {
			console.log('['+vm.name+']: Error setting state of '+prop+' asynchronously', err);
		});

	};


	Cel.prototype.setHtml = function( targetElem, value ) {
		const vm = this;

		// Filters out an element that matches the event's target.
		var findTargetInElements = function( item, index ) {
			return item.name === targetElem;
		};

		var target = vm.elems.filter( findTargetInElements.bind(vm) )[0];
		if ( target.type === 'jquery' ) {
			target.elem.html( value );
		} else if ( target.type === 'element') {
			target.elem.innerHTML = value;
		}
	};

};



// // Else if it's asynchronous, check that it can be thrown into a Promise.
// if (
// 	(asyncCallback || asyncCallback === 'function') &&
// 	typeof promisable === 'function'
// ) {
//
// 	// Ensure a Promise library exists.
// 	if ( window.Promise != null ) {
//
// 		var promise = new window.Promise( function(resolve, reject) {
// 			console.log('Setting up promise');
// 			try {
// 				resolve( promisable() );
// 			} catch( err ) {
// 				reject( err );
// 			}
// 		});
//
// 		promise
// 			.then(function( data ) {
// 				console.log('Running "then" function with...', data);
// 				vm.state[ prop ] = data;
// 				asyncCallback( data );
// 			})
//
// 			.catch(function( reason ) {
// 				console.log('['+vm.name+']: Async setState() had an error,', reason);
// 			});
//
//
// 	} else {
// 		console.warn('['+vm.name+']: This component is trying to use an async setState() but has no \'Promise\' library. Please include a polyfill.')
// 	} // else
//
// } // if
