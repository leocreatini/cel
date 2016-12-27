(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Cel = factory());
}(this, (function () { 'use strict';

// src/core/initMixin.js


function initMixin(Cel) {
	// Finds elements via its selector and caches them under the 'elem' property
	// of that element.
	Cel.prototype._getElementsOnMount = function () {
		var vm = this;
		if (vm.elems != null) {
			for (var i = 0, numElem = vm.elems.length; i < numElem; i++) {

				// If jQuery is available and using the '$elemName' convention,
				// Return a jQuery object.
				if ((jQuery != null || $ != null) && vm.elems[i].name.slice(0, 1) === '$') {
					vm.elems[i].elem = $(vm.elems[i].selector);
					vm.elems[i].type = 'jquery';
				}

				// Else, just use vanilla javascript DOM node.
				else {
						vm.elems[i].elem = document.querySelector(vm.elems[i].selector);
						vm.elems[i].type = 'element';
					}
			} // for
		} // if
	};

	// Binds the component's "this" to the methods.
	// This is done to be able to call 'this.methods.functionName()' from other
	// methods and handlers.
	Cel.prototype._bindThisToMethods = function () {
		var vm = this;
		var methods = Object.keys(vm.methods);
		var numMethods = methods.length;
		if (numMethods > 0) {
			for (var i = 0; i < numMethods; i = i + 1) {
				vm.methods[methods[i]] = vm.methods[methods[i]].bind(vm);
			} // for
		} // if
	};

	// Adds event-listeners to target elements when component initializes.
	Cel.prototype._bindEventsOnMount = function () {
		var vm = this;
		// Ensure events aren't empty
		if (vm.events != null) {
			var numEvents = vm.events.length;

			// Ensure elements aren't empty and there's at least on event.
			if (vm.elems != null && numEvents > 0) {

				// Filters out an element that matches the event's target.
				var findEventTargetInElements = function findEventTargetInElements(elIndex, item, index) {
					return item.name === vm.events[elIndex].target;
				};

				// Binds each event to its designated target
				// And add debounce or throttling if requested.
				for (var i = 0; i < numEvents; i++) {
					var target = vm.elems.filter(findEventTargetInElements.bind(vm, i))[0];
					var bindType = target.type === 'jquery' ? 'on' : 'addEventListener';
					var func = vm.handlers[vm.events[i].handler].bind(vm);

					// Prevent using Debounce and Throttle for same event.
					if (vm.events[i].debounce != null && typeof vm.events[i].debounce === 'number' && vm.events[i].throttle != null && typeof vm.events[i].throttle === 'number') {
						console.warn('[' + vm.name + ']: Cannot set both \'debounce\' and \'throttle\' configurations on the same event. Please use only one.');
					} // if

					// Add debouncing to function if setting is correct.
					else if (vm.events[i].debounce != null) {
							if (typeof vm.events[i].debounce === 'number' && vm.events[i].debounce > 0) {
								// Setting is correct, adding debouncing.
								func = vm._debounce(func, vm.events[i].debounce);
							} else {
								console.warn('[' + vm.name + ']: Ensure your \'debounce\' setting is a number greater than 0.');
							}
						} // else if

						// Add throttling to function if setting is correct.
						else if (vm.events[i].throttle != null) {
								if (typeof vm.events[i].throttle === 'number' && vm.events[i].throttle > 0) {
									// Setting is correct, adding throttling.
									func = vm._throttle(func, vm.events[i].throttle);
								} else {
									console.warn('[' + vm.name + ']: Ensure your \'throttle\' setting is a number greater than 0.');
								}
							} // else if

					// Binding callback event to target.
					target.elem[bindType](vm.events[i].type, func);
				} // for numEvents
			} // if elems.length
		} // if vm.events
	};

	// Ensuring the settings are correct.
	Cel.prototype._checkComponentSettings = function () {
		var vm = this;
		if (vm.name === null || vm.name === '' || vm.name === 'NamelessComponent') {
			console.warn('Please ensure that you named all your components with a \'name\' property. At least one is missing right now.');
		}
	};

	// Publically accessible initialize function to bootstrap the component.
	Cel.prototype.init = function () {
		var vm = this;
		vm._checkComponentSettings();
		vm._getElementsOnMount();
		vm._bindThisToMethods();
		vm._bindEventsOnMount();
	};
}

// src/core/scriptMixin.js


function scriptMixin(Cel) {

	// From Underscore library
	Cel.prototype._debounce = function (func, wait, immediate) {
		var timeout = void 0;
		return function () {
			var context = this;
			var args = arguments;
			var later = function later() {
				timeout = null;
				if (!immediate) {
					func.apply(context, args);
				}
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) {
				func.apply(context, args);
			}
		};
	};

	// From Underscore library
	Cel.prototype._throttle = function (func, wait, options) {
		var context = void 0,
		    args = void 0,
		    result = void 0;
		var timeout = null;
		var previous = 0;
		if (!options) {
			options = {};
		}
		var later = function later() {
			previous = options.leading === false ? 0 : Date.now();
			timeout = null;
			result = func.apply(context, args);
			if (!timeout) {
				context = args = null;
			}
		};
		return function () {
			var now = Date.now();
			if (!previous && options.leading === false) {
				previous = now;
			}
			var remaining = wait - (now - previous);
			context = this;
			args = arguments;
			if (remaining <= 0 || remaining > wait) {
				if (timeout) {
					clearTimeout(timeout);
					timeout = null;
				}
				previous = now;
				result = func.apply(context, args);
				if (!timeout) {
					context = args = null;
				}
			} else if (!timeout && options.trailing !== false) {
				timeout = setTimeout(later, remaining);
			}
			return result;
		};
	};

	Cel.prototype.fetch = function (url, successCallback, errorCallback) {
		var req;
		req = new XMLHttpRequest();
		req.onload = function () {
			req.status === 200 ? successCallback(req.responseText) : errorCallback(req.statusText);
		};
		req.open('GET', url, true);
		req.send();
	};

	// Set state synchronously.
	Cel.prototype.setState = function (prop, value) {
		var vm = this;
		try {
			vm.state[prop] = value;
		} catch (err) {
			console.warn('[' + vm.name + ']: Could not set value of "' + prop + '", make sure it exists in your component config.', err);
		}
	};

	// Set state asynchronously.
	Cel.prototype.setStateAsync = function (prop, asyncTask, asyncCallback) {
		var vm = this;

		// Create promise.
		var p = new Promise(function (resolve, reject) {
			asyncTask(function (data) {
				resolve(data);
			}, function (err) {
				reject(err);
			});
		});

		// When promise succeeds.
		p.then(function (data) {
			vm.state[prop] = data;

			if ( // Pass data to callback if it exists and is a function.
			asyncCallback != null && typeof asyncCallback === 'function') {
				asyncCallback(data);
			}
		});

		// When promise fails.
		p.catch(function (err) {
			console.log('[' + vm.name + ']: Error setting state of ' + prop + ' asynchronously', err);
		});
	};

	Cel.prototype.setHtml = function (targetElem, value) {
		var vm = this;

		// Filters out an element that matches the event's target.
		var findTargetInElements = function findTargetInElements(item, index) {
			return item.name === targetElem;
		};

		var target = vm.elems.filter(findTargetInElements.bind(vm))[0];
		if (target.type === 'jquery') {
			target.elem.html(value);
		} else if (target.type === 'element') {
			target.elem.innerHTML = value;
		}
	};
}

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

// src/core/component.js
function Cel$3(options) {
	this.name = options.name || 'NamelessComponent';
	this._ = options._;
	this.state = options.state;
	this.elems = options.elems;
	this.methods = options.methods;
	this.handlers = options.handlers;
	this.events = options.events;
	this.exposed = options.exposed;
}

initMixin(Cel$3);
scriptMixin(Cel$3);

// src/helpers/exposeFunctions.js


function exposeFunctions(cel) {
	var exposed = {
		init: cel.init.bind(cel)
	};

	// Null-check for exposed functions
	if (cel.exposed != null) {
		if ( // Ensure exposed is an array.
		Array.isArray(cel.exposed) && cel.exposed.length > 0) {
			// Ensure user did not try to pass 'init' in the exposed list.
			// She/he should use a different function name.
			if (cel.exposed.indexOf('init') > 0) {
				console.warn('[' + cel.name + ']: The \'init\' property is already taken by Cel, please use a different name for your function.');
			} else {
				// Attach all exposed functions to the 'exposed' object.
				for (var i = 0, numExposed = cel.exposed.length; i < numExposed; i = i + 1) {
					if (cel.methods.hasOwnProperty(cel.exposed[i])) {
						exposed[cel.exposed[i]] = cel.methods[cel.exposed[i]].bind(cel);
					}
				}
			}
		} else {
			console.warn('[' + cel.name + ']: Please ensure the \'exposed\' property is an array of strings.');
		}
	}

	return exposed;
}

// src/core/cel.js
var Cel$1 = function Cel(options) {

	var cel = new Cel$3(options);

	// Exposes specified functions for public use.
	return exposeFunctions(cel);
};

// src/index.js

return Cel$1;

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2luaXRNaXhpbi5qcyIsIi4uL3NyYy9jb3JlL3NjcmlwdE1peGluLmpzIiwiLi4vc3JjL2NvcmUvY29tcG9uZW50LmpzIiwiLi4vc3JjL2hlbHBlcnMvZXhwb3NlRnVuY3Rpb25zLmpzIiwiLi4vc3JjL2NvcmUvY2VsLmpzIiwiLi4vc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHNyYy9jb3JlL2luaXRNaXhpbi5qc1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpbml0TWl4aW4oQ2VsKSB7XHJcblx0Ly8gRmluZHMgZWxlbWVudHMgdmlhIGl0cyBzZWxlY3RvciBhbmQgY2FjaGVzIHRoZW0gdW5kZXIgdGhlICdlbGVtJyBwcm9wZXJ0eVxyXG5cdC8vIG9mIHRoYXQgZWxlbWVudC5cclxuXHRDZWwucHJvdG90eXBlLl9nZXRFbGVtZW50c09uTW91bnQgPSBmdW5jdGlvbigpIHtcclxuXHRcdGNvbnN0IHZtID0gdGhpcztcclxuXHRcdGlmICggdm0uZWxlbXMgIT0gbnVsbCApIHtcclxuXHRcdFx0Zm9yICggdmFyIGkgPSAwLCBudW1FbGVtID0gdm0uZWxlbXMubGVuZ3RoOyBpIDwgbnVtRWxlbTsgaSsrICkge1xyXG5cclxuXHRcdFx0XHQvLyBJZiBqUXVlcnkgaXMgYXZhaWxhYmxlIGFuZCB1c2luZyB0aGUgJyRlbGVtTmFtZScgY29udmVudGlvbixcclxuXHRcdFx0XHQvLyBSZXR1cm4gYSBqUXVlcnkgb2JqZWN0LlxyXG5cdFx0XHRcdGlmICggKGpRdWVyeSAhPSBudWxsIHx8ICQgIT0gbnVsbCkgJiZcclxuXHRcdFx0XHRcdHZtLmVsZW1zW2ldLm5hbWUuc2xpY2UoMCwgMSkgPT09ICckJ1xyXG5cdFx0XHRcdCkge1xyXG5cdFx0XHRcdFx0dm0uZWxlbXNbaV0uZWxlbSA9ICQoIHZtLmVsZW1zW2ldLnNlbGVjdG9yICk7XHJcblx0XHRcdFx0XHR2bS5lbGVtc1tpXS50eXBlID0gJ2pxdWVyeSc7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyBFbHNlLCBqdXN0IHVzZSB2YW5pbGxhIGphdmFzY3JpcHQgRE9NIG5vZGUuXHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHR2bS5lbGVtc1tpXS5lbGVtID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvciggdm0uZWxlbXNbaV0uc2VsZWN0b3IgKTtcclxuXHRcdFx0XHRcdHZtLmVsZW1zW2ldLnR5cGUgPSAnZWxlbWVudCc7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IC8vIGZvclxyXG5cdFx0fSAvLyBpZlxyXG5cdH07XHJcblxyXG5cdC8vIEJpbmRzIHRoZSBjb21wb25lbnQncyBcInRoaXNcIiB0byB0aGUgbWV0aG9kcy5cclxuXHQvLyBUaGlzIGlzIGRvbmUgdG8gYmUgYWJsZSB0byBjYWxsICd0aGlzLm1ldGhvZHMuZnVuY3Rpb25OYW1lKCknIGZyb20gb3RoZXJcclxuXHQvLyBtZXRob2RzIGFuZCBoYW5kbGVycy5cclxuXHRDZWwucHJvdG90eXBlLl9iaW5kVGhpc1RvTWV0aG9kcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0Y29uc3Qgdm0gPSB0aGlzO1xyXG5cdFx0dmFyIG1ldGhvZHMgPSBPYmplY3Qua2V5cyh2bS5tZXRob2RzKTtcclxuXHRcdHZhciBudW1NZXRob2RzID0gbWV0aG9kcy5sZW5ndGg7XHJcblx0XHRpZiAoIG51bU1ldGhvZHMgPiAwICkge1xyXG5cdFx0XHRmb3IgKFxyXG5cdFx0XHRcdHZhciBpID0gMDtcclxuXHRcdFx0XHRpIDwgbnVtTWV0aG9kcztcclxuXHRcdFx0XHRpID0gaSsxXHJcblx0XHRcdCkge1xyXG5cdFx0XHRcdHZtLm1ldGhvZHNbIG1ldGhvZHNbaV0gXSA9IHZtLm1ldGhvZHNbIG1ldGhvZHNbaV0gXS5iaW5kKHZtKTtcclxuXHRcdFx0fSAvLyBmb3JcclxuXHRcdH0gLy8gaWZcclxuXHR9O1xyXG5cclxuXHQvLyBBZGRzIGV2ZW50LWxpc3RlbmVycyB0byB0YXJnZXQgZWxlbWVudHMgd2hlbiBjb21wb25lbnQgaW5pdGlhbGl6ZXMuXHJcblx0Q2VsLnByb3RvdHlwZS5fYmluZEV2ZW50c09uTW91bnQgPSBmdW5jdGlvbigpIHtcclxuXHRcdGNvbnN0IHZtID0gdGhpcztcclxuXHRcdC8vIEVuc3VyZSBldmVudHMgYXJlbid0IGVtcHR5XHJcblx0XHRpZiAoIHZtLmV2ZW50cyAhPSBudWxsICkge1xyXG5cdFx0XHR2YXIgbnVtRXZlbnRzID0gdm0uZXZlbnRzLmxlbmd0aDtcclxuXHJcblx0XHRcdC8vIEVuc3VyZSBlbGVtZW50cyBhcmVuJ3QgZW1wdHkgYW5kIHRoZXJlJ3MgYXQgbGVhc3Qgb24gZXZlbnQuXHJcblx0XHRcdGlmICggdm0uZWxlbXMgIT0gbnVsbCAmJiBudW1FdmVudHMgPiAwKSB7XHJcblxyXG5cdFx0XHRcdC8vIEZpbHRlcnMgb3V0IGFuIGVsZW1lbnQgdGhhdCBtYXRjaGVzIHRoZSBldmVudCdzIHRhcmdldC5cclxuXHRcdFx0XHR2YXIgZmluZEV2ZW50VGFyZ2V0SW5FbGVtZW50cyA9IGZ1bmN0aW9uKCBlbEluZGV4LCBpdGVtLCBpbmRleCApIHtcclxuXHRcdFx0XHRcdHJldHVybiBpdGVtLm5hbWUgPT09IHZtLmV2ZW50c1sgZWxJbmRleCBdLnRhcmdldDtcclxuXHRcdFx0XHR9O1xyXG5cclxuXHRcdFx0XHQvLyBCaW5kcyBlYWNoIGV2ZW50IHRvIGl0cyBkZXNpZ25hdGVkIHRhcmdldFxyXG5cdFx0XHRcdC8vIEFuZCBhZGQgZGVib3VuY2Ugb3IgdGhyb3R0bGluZyBpZiByZXF1ZXN0ZWQuXHJcblx0XHRcdFx0Zm9yICggdmFyIGkgPSAwOyBpIDwgbnVtRXZlbnRzOyBpKysgKSB7XHJcblx0XHRcdFx0XHR2YXIgdGFyZ2V0ID0gdm0uZWxlbXMuZmlsdGVyKFxyXG5cdFx0XHRcdFx0XHRmaW5kRXZlbnRUYXJnZXRJbkVsZW1lbnRzLmJpbmQodm0sIGkpXHJcblx0XHRcdFx0XHQpWzBdO1xyXG5cdFx0XHRcdFx0dmFyIGJpbmRUeXBlID0gKCB0YXJnZXQudHlwZSA9PT0gJ2pxdWVyeScgKVxyXG5cdFx0XHRcdFx0XHQ/ICdvbidcclxuXHRcdFx0XHRcdFx0OiAnYWRkRXZlbnRMaXN0ZW5lcic7XHJcblx0XHRcdFx0XHR2YXIgZnVuYyA9IHZtLmhhbmRsZXJzWyB2bS5ldmVudHNbaV0uaGFuZGxlciBdLmJpbmQodm0pXHJcblxyXG5cdFx0XHRcdFx0Ly8gUHJldmVudCB1c2luZyBEZWJvdW5jZSBhbmQgVGhyb3R0bGUgZm9yIHNhbWUgZXZlbnQuXHJcblx0XHRcdFx0XHRpZiAoXHJcblx0XHRcdFx0XHRcdHZtLmV2ZW50c1tpXS5kZWJvdW5jZSAhPSBudWxsICYmXHJcblx0XHRcdFx0XHRcdHR5cGVvZiB2bS5ldmVudHNbaV0uZGVib3VuY2UgPT09ICdudW1iZXInICYmXHJcblx0XHRcdFx0XHRcdHZtLmV2ZW50c1tpXS50aHJvdHRsZSAhPSBudWxsICYmXHJcblx0XHRcdFx0XHRcdHR5cGVvZiB2bS5ldmVudHNbaV0udGhyb3R0bGUgPT09ICdudW1iZXInXHJcblx0XHRcdFx0XHQpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdbJyt2bS5uYW1lKyddOiBDYW5ub3Qgc2V0IGJvdGggXFwnZGVib3VuY2VcXCcgYW5kIFxcJ3Rocm90dGxlXFwnIGNvbmZpZ3VyYXRpb25zIG9uIHRoZSBzYW1lIGV2ZW50LiBQbGVhc2UgdXNlIG9ubHkgb25lLicpO1xyXG5cdFx0XHRcdFx0fSAvLyBpZlxyXG5cclxuXHRcdFx0XHRcdC8vIEFkZCBkZWJvdW5jaW5nIHRvIGZ1bmN0aW9uIGlmIHNldHRpbmcgaXMgY29ycmVjdC5cclxuXHRcdFx0XHRcdGVsc2UgaWYgKCB2bS5ldmVudHNbaV0uZGVib3VuY2UgIT0gbnVsbCApIHtcclxuXHRcdFx0XHRcdFx0aWYgKFxyXG5cdFx0XHRcdFx0XHRcdHR5cGVvZiB2bS5ldmVudHNbaV0uZGVib3VuY2UgPT09ICdudW1iZXInICYmXHJcblx0XHRcdFx0XHRcdFx0dm0uZXZlbnRzW2ldLmRlYm91bmNlID4gMFxyXG5cdFx0XHRcdFx0XHQpIHsgLy8gU2V0dGluZyBpcyBjb3JyZWN0LCBhZGRpbmcgZGVib3VuY2luZy5cclxuXHRcdFx0XHRcdFx0XHRmdW5jID0gdm0uX2RlYm91bmNlKCBmdW5jLCB2bS5ldmVudHNbaV0uZGVib3VuY2UgKTtcclxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ1snK3ZtLm5hbWUrJ106IEVuc3VyZSB5b3VyIFxcJ2RlYm91bmNlXFwnIHNldHRpbmcgaXMgYSBudW1iZXIgZ3JlYXRlciB0aGFuIDAuJyk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0gLy8gZWxzZSBpZlxyXG5cclxuXHRcdFx0XHRcdC8vIEFkZCB0aHJvdHRsaW5nIHRvIGZ1bmN0aW9uIGlmIHNldHRpbmcgaXMgY29ycmVjdC5cclxuXHRcdFx0XHRcdGVsc2UgaWYgKCB2bS5ldmVudHNbaV0udGhyb3R0bGUgIT0gbnVsbCApIHtcclxuXHRcdFx0XHRcdFx0aWYgKFxyXG5cdFx0XHRcdFx0XHRcdHR5cGVvZiB2bS5ldmVudHNbaV0udGhyb3R0bGUgPT09ICdudW1iZXInICYmXHJcblx0XHRcdFx0XHRcdFx0dm0uZXZlbnRzW2ldLnRocm90dGxlID4gMFxyXG5cdFx0XHRcdFx0XHQpIHsgLy8gU2V0dGluZyBpcyBjb3JyZWN0LCBhZGRpbmcgdGhyb3R0bGluZy5cclxuXHRcdFx0XHRcdFx0XHRmdW5jID0gdm0uX3Rocm90dGxlKCBmdW5jLCB2bS5ldmVudHNbaV0udGhyb3R0bGUgKTtcclxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ1snK3ZtLm5hbWUrJ106IEVuc3VyZSB5b3VyIFxcJ3Rocm90dGxlXFwnIHNldHRpbmcgaXMgYSBudW1iZXIgZ3JlYXRlciB0aGFuIDAuJyk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0gLy8gZWxzZSBpZlxyXG5cclxuXHRcdFx0XHRcdC8vIEJpbmRpbmcgY2FsbGJhY2sgZXZlbnQgdG8gdGFyZ2V0LlxyXG5cdFx0XHRcdFx0dGFyZ2V0LmVsZW1bIGJpbmRUeXBlIF0oXHJcblx0XHRcdFx0XHRcdHZtLmV2ZW50c1sgaSBdLnR5cGUsXHJcblx0XHRcdFx0XHRcdGZ1bmNcclxuXHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0fSAvLyBmb3IgbnVtRXZlbnRzXHJcblx0XHRcdH0gLy8gaWYgZWxlbXMubGVuZ3RoXHJcblx0XHR9IC8vIGlmIHZtLmV2ZW50c1xyXG5cdH07XHJcblxyXG5cdC8vIEVuc3VyaW5nIHRoZSBzZXR0aW5ncyBhcmUgY29ycmVjdC5cclxuXHRDZWwucHJvdG90eXBlLl9jaGVja0NvbXBvbmVudFNldHRpbmdzID0gZnVuY3Rpb24oKSB7XHJcblx0XHRjb25zdCB2bSA9IHRoaXM7XHJcblx0XHRpZiAoXHJcblx0XHRcdHZtLm5hbWUgPT09IG51bGwgfHxcclxuXHRcdFx0dm0ubmFtZSA9PT0gJycgfHxcclxuXHRcdFx0dm0ubmFtZSA9PT0gJ05hbWVsZXNzQ29tcG9uZW50J1xyXG5cdFx0KSB7XHJcblx0XHRcdGNvbnNvbGUud2FybignUGxlYXNlIGVuc3VyZSB0aGF0IHlvdSBuYW1lZCBhbGwgeW91ciBjb21wb25lbnRzIHdpdGggYSBcXCduYW1lXFwnIHByb3BlcnR5LiBBdCBsZWFzdCBvbmUgaXMgbWlzc2luZyByaWdodCBub3cuJyk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBQdWJsaWNhbGx5IGFjY2Vzc2libGUgaW5pdGlhbGl6ZSBmdW5jdGlvbiB0byBib290c3RyYXAgdGhlIGNvbXBvbmVudC5cclxuXHRDZWwucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbigpIHtcclxuXHRcdGNvbnN0IHZtID0gdGhpcztcclxuXHRcdHZtLl9jaGVja0NvbXBvbmVudFNldHRpbmdzKCk7XHJcblx0XHR2bS5fZ2V0RWxlbWVudHNPbk1vdW50KCk7XHJcblx0XHR2bS5fYmluZFRoaXNUb01ldGhvZHMoKTtcclxuXHRcdHZtLl9iaW5kRXZlbnRzT25Nb3VudCgpO1xyXG5cdH07XHJcblxyXG59O1xyXG4iLCIvLyBzcmMvY29yZS9zY3JpcHRNaXhpbi5qc1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzY3JpcHRNaXhpbihDZWwpIHtcclxuXHJcblx0Ly8gRnJvbSBVbmRlcnNjb3JlIGxpYnJhcnlcclxuXHRDZWwucHJvdG90eXBlLl9kZWJvdW5jZSA9IGZ1bmN0aW9uKCBmdW5jLCB3YWl0LCBpbW1lZGlhdGUgKSB7XHJcblx0XHRsZXQgdGltZW91dDtcclxuXHRcdHJldHVybiBmdW5jdGlvbigpIHtcclxuXHRcdFx0bGV0IGNvbnRleHQgPSB0aGlzO1xyXG5cdFx0XHRsZXQgYXJncyA9IGFyZ3VtZW50cztcclxuXHRcdFx0bGV0IGxhdGVyID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dGltZW91dCA9IG51bGw7XHJcblx0XHRcdFx0aWYgKCFpbW1lZGlhdGUpIHtcclxuXHRcdFx0XHRcdGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cdFx0XHRsZXQgY2FsbE5vdyA9IChpbW1lZGlhdGUgJiYgIXRpbWVvdXQpO1xyXG5cdFx0XHRjbGVhclRpbWVvdXQoIHRpbWVvdXQgKTtcclxuXHRcdFx0dGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xyXG5cdFx0XHRpZiAoY2FsbE5vdykge1xyXG5cdFx0XHRcdGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblx0fTtcclxuXHJcblxyXG5cdC8vIEZyb20gVW5kZXJzY29yZSBsaWJyYXJ5XHJcblx0Q2VsLnByb3RvdHlwZS5fdGhyb3R0bGUgPSBmdW5jdGlvbiggZnVuYywgd2FpdCwgb3B0aW9ucyApIHtcclxuXHRcdGxldCBjb250ZXh0LCBhcmdzLCByZXN1bHQ7XHJcblx0XHRsZXQgdGltZW91dCA9IG51bGw7XHJcblx0XHRsZXQgcHJldmlvdXMgPSAwO1xyXG5cdFx0aWYgKCAhb3B0aW9ucyApIHtcclxuXHRcdFx0b3B0aW9ucyA9IHt9O1xyXG5cdFx0fVxyXG5cdFx0bGV0IGxhdGVyID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHByZXZpb3VzID0gb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSA/IDAgOiBEYXRlLm5vdygpO1xyXG5cdFx0XHR0aW1lb3V0ID0gbnVsbDtcclxuXHRcdFx0cmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcclxuXHRcdFx0aWYgKCAhdGltZW91dCApIHtcclxuXHRcdFx0XHRjb250ZXh0ID0gYXJncyA9IG51bGw7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XHJcblx0XHRcdGxldCBub3cgPSBEYXRlLm5vdygpO1xyXG5cdFx0XHRpZiAoICFwcmV2aW91cyAmJiBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlICkge1xyXG5cdFx0XHRcdHByZXZpb3VzID0gbm93O1xyXG5cdFx0XHR9XHJcblx0XHRcdGxldCByZW1haW5pbmcgPSB3YWl0IC0gKG5vdyAtIHByZXZpb3VzKTtcclxuXHRcdFx0Y29udGV4dCA9IHRoaXM7XHJcblx0XHRcdGFyZ3MgPSBhcmd1bWVudHM7XHJcblx0XHRcdGlmICggcmVtYWluaW5nIDw9IDAgfHwgcmVtYWluaW5nID4gd2FpdCApIHtcclxuXHRcdFx0XHRpZiAodGltZW91dCkge1xyXG5cdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xyXG5cdFx0XHRcdFx0dGltZW91dCA9IG51bGw7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHByZXZpb3VzID0gbm93O1xyXG5cdFx0XHRcdHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XHJcblx0XHRcdFx0aWYgKCAhdGltZW91dCApIHtcclxuXHRcdFx0XHRcdGNvbnRleHQgPSBhcmdzID0gbnVsbDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSBpZiAoICF0aW1lb3V0ICYmIG9wdGlvbnMudHJhaWxpbmcgIT09IGZhbHNlICkge1xyXG5cdFx0XHRcdHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCByZW1haW5pbmcpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiByZXN1bHQ7XHJcblx0XHR9O1xyXG5cdH07XHJcblxyXG5cdENlbC5wcm90b3R5cGUuZmV0Y2ggPSBmdW5jdGlvbiggdXJsLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2sgKSB7XHJcblx0XHRcdHZhciByZXE7XHJcblx0XHRcdHJlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG5cdFx0XHRyZXEub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0KCByZXEuc3RhdHVzID09PSAyMDAgKVxyXG5cdFx0XHRcdFx0PyBzdWNjZXNzQ2FsbGJhY2soIHJlcS5yZXNwb25zZVRleHQgKVxyXG5cdFx0XHRcdFx0OiBlcnJvckNhbGxiYWNrKCByZXEuc3RhdHVzVGV4dCApO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJlcS5vcGVuKCdHRVQnLCB1cmwsIHRydWUpO1xyXG5cdFx0XHRyZXEuc2VuZCgpO1xyXG5cdH07XHJcblxyXG5cclxuXHQvLyBTZXQgc3RhdGUgc3luY2hyb25vdXNseS5cclxuXHRDZWwucHJvdG90eXBlLnNldFN0YXRlID0gZnVuY3Rpb24oIHByb3AsIHZhbHVlICkge1xyXG5cdFx0Y29uc3Qgdm0gPSB0aGlzO1xyXG5cdFx0dHJ5IHtcclxuXHRcdFx0dm0uc3RhdGVbIHByb3AgXSA9IHZhbHVlO1xyXG5cdFx0fSBjYXRjaCAoZXJyKSB7XHJcblx0XHRcdGNvbnNvbGUud2FybignWycrdm0ubmFtZSsnXTogQ291bGQgbm90IHNldCB2YWx1ZSBvZiBcIicrcHJvcCsnXCIsIG1ha2Ugc3VyZSBpdCBleGlzdHMgaW4geW91ciBjb21wb25lbnQgY29uZmlnLicsIGVycik7XHJcblx0XHR9XHJcblx0fTtcclxuXHJcblxyXG5cdC8vIFNldCBzdGF0ZSBhc3luY2hyb25vdXNseS5cclxuXHRDZWwucHJvdG90eXBlLnNldFN0YXRlQXN5bmMgPSBmdW5jdGlvbiggcHJvcCwgYXN5bmNUYXNrLCBhc3luY0NhbGxiYWNrICkge1xyXG5cdFx0Y29uc3Qgdm0gPSB0aGlzO1xyXG5cclxuXHRcdC8vIENyZWF0ZSBwcm9taXNlLlxyXG5cdFx0dmFyIHAgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiggcmVzb2x2ZSwgcmVqZWN0ICkge1xyXG5cdFx0XHRhc3luY1Rhc2soXHJcblx0XHRcdFx0ZnVuY3Rpb24oZGF0YSkgeyByZXNvbHZlKCBkYXRhICk7IH0sXHJcblx0XHRcdFx0ZnVuY3Rpb24oZXJyKSB7IHJlamVjdCggZXJyICk7IH1cclxuXHRcdFx0KTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdC8vIFdoZW4gcHJvbWlzZSBzdWNjZWVkcy5cclxuXHRcdHAudGhlbihmdW5jdGlvbiggZGF0YSApIHtcclxuXHRcdFx0dm0uc3RhdGVbIHByb3AgXSA9IGRhdGE7XHJcblxyXG5cdFx0XHRpZiAoIC8vIFBhc3MgZGF0YSB0byBjYWxsYmFjayBpZiBpdCBleGlzdHMgYW5kIGlzIGEgZnVuY3Rpb24uXHJcblx0XHRcdFx0YXN5bmNDYWxsYmFjayAhPSBudWxsICYmXHJcblx0XHRcdCBcdHR5cGVvZiBhc3luY0NhbGxiYWNrID09PSAnZnVuY3Rpb24nXHJcblx0XHRcdCkge1xyXG5cdFx0XHRcdGFzeW5jQ2FsbGJhY2soIGRhdGEgKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdH0pO1xyXG5cclxuXHRcdC8vIFdoZW4gcHJvbWlzZSBmYWlscy5cclxuXHRcdHAuY2F0Y2goZnVuY3Rpb24oIGVyciApIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1snK3ZtLm5hbWUrJ106IEVycm9yIHNldHRpbmcgc3RhdGUgb2YgJytwcm9wKycgYXN5bmNocm9ub3VzbHknLCBlcnIpO1xyXG5cdFx0fSk7XHJcblxyXG5cdH07XHJcblxyXG5cclxuXHRDZWwucHJvdG90eXBlLnNldEh0bWwgPSBmdW5jdGlvbiggdGFyZ2V0RWxlbSwgdmFsdWUgKSB7XHJcblx0XHRjb25zdCB2bSA9IHRoaXM7XHJcblxyXG5cdFx0Ly8gRmlsdGVycyBvdXQgYW4gZWxlbWVudCB0aGF0IG1hdGNoZXMgdGhlIGV2ZW50J3MgdGFyZ2V0LlxyXG5cdFx0dmFyIGZpbmRUYXJnZXRJbkVsZW1lbnRzID0gZnVuY3Rpb24oIGl0ZW0sIGluZGV4ICkge1xyXG5cdFx0XHRyZXR1cm4gaXRlbS5uYW1lID09PSB0YXJnZXRFbGVtO1xyXG5cdFx0fTtcclxuXHJcblx0XHR2YXIgdGFyZ2V0ID0gdm0uZWxlbXMuZmlsdGVyKCBmaW5kVGFyZ2V0SW5FbGVtZW50cy5iaW5kKHZtKSApWzBdO1xyXG5cdFx0aWYgKCB0YXJnZXQudHlwZSA9PT0gJ2pxdWVyeScgKSB7XHJcblx0XHRcdHRhcmdldC5lbGVtLmh0bWwoIHZhbHVlICk7XHJcblx0XHR9IGVsc2UgaWYgKCB0YXJnZXQudHlwZSA9PT0gJ2VsZW1lbnQnKSB7XHJcblx0XHRcdHRhcmdldC5lbGVtLmlubmVySFRNTCA9IHZhbHVlO1xyXG5cdFx0fVxyXG5cdH07XHJcblxyXG59O1xyXG5cclxuXHJcblxyXG4vLyAvLyBFbHNlIGlmIGl0J3MgYXN5bmNocm9ub3VzLCBjaGVjayB0aGF0IGl0IGNhbiBiZSB0aHJvd24gaW50byBhIFByb21pc2UuXHJcbi8vIGlmIChcclxuLy8gXHQoYXN5bmNDYWxsYmFjayB8fCBhc3luY0NhbGxiYWNrID09PSAnZnVuY3Rpb24nKSAmJlxyXG4vLyBcdHR5cGVvZiBwcm9taXNhYmxlID09PSAnZnVuY3Rpb24nXHJcbi8vICkge1xyXG4vL1xyXG4vLyBcdC8vIEVuc3VyZSBhIFByb21pc2UgbGlicmFyeSBleGlzdHMuXHJcbi8vIFx0aWYgKCB3aW5kb3cuUHJvbWlzZSAhPSBudWxsICkge1xyXG4vL1xyXG4vLyBcdFx0dmFyIHByb21pc2UgPSBuZXcgd2luZG93LlByb21pc2UoIGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4vLyBcdFx0XHRjb25zb2xlLmxvZygnU2V0dGluZyB1cCBwcm9taXNlJyk7XHJcbi8vIFx0XHRcdHRyeSB7XHJcbi8vIFx0XHRcdFx0cmVzb2x2ZSggcHJvbWlzYWJsZSgpICk7XHJcbi8vIFx0XHRcdH0gY2F0Y2goIGVyciApIHtcclxuLy8gXHRcdFx0XHRyZWplY3QoIGVyciApO1xyXG4vLyBcdFx0XHR9XHJcbi8vIFx0XHR9KTtcclxuLy9cclxuLy8gXHRcdHByb21pc2VcclxuLy8gXHRcdFx0LnRoZW4oZnVuY3Rpb24oIGRhdGEgKSB7XHJcbi8vIFx0XHRcdFx0Y29uc29sZS5sb2coJ1J1bm5pbmcgXCJ0aGVuXCIgZnVuY3Rpb24gd2l0aC4uLicsIGRhdGEpO1xyXG4vLyBcdFx0XHRcdHZtLnN0YXRlWyBwcm9wIF0gPSBkYXRhO1xyXG4vLyBcdFx0XHRcdGFzeW5jQ2FsbGJhY2soIGRhdGEgKTtcclxuLy8gXHRcdFx0fSlcclxuLy9cclxuLy8gXHRcdFx0LmNhdGNoKGZ1bmN0aW9uKCByZWFzb24gKSB7XHJcbi8vIFx0XHRcdFx0Y29uc29sZS5sb2coJ1snK3ZtLm5hbWUrJ106IEFzeW5jIHNldFN0YXRlKCkgaGFkIGFuIGVycm9yLCcsIHJlYXNvbik7XHJcbi8vIFx0XHRcdH0pO1xyXG4vL1xyXG4vL1xyXG4vLyBcdH0gZWxzZSB7XHJcbi8vIFx0XHRjb25zb2xlLndhcm4oJ1snK3ZtLm5hbWUrJ106IFRoaXMgY29tcG9uZW50IGlzIHRyeWluZyB0byB1c2UgYW4gYXN5bmMgc2V0U3RhdGUoKSBidXQgaGFzIG5vIFxcJ1Byb21pc2VcXCcgbGlicmFyeS4gUGxlYXNlIGluY2x1ZGUgYSBwb2x5ZmlsbC4nKVxyXG4vLyBcdH0gLy8gZWxzZVxyXG4vL1xyXG4vLyB9IC8vIGlmXHJcbiIsIi8vIHNyYy9jb3JlL2NvbXBvbmVudC5qc1xyXG5pbXBvcnQgeyBpbml0TWl4aW4gfSBmcm9tICcuL2luaXRNaXhpbic7XHJcbmltcG9ydCB7IHNjcmlwdE1peGluIH0gZnJvbSAnLi9zY3JpcHRNaXhpbic7XHJcblxyXG5cclxuZnVuY3Rpb24gQ2VsKCBvcHRpb25zICkge1xyXG5cdHRoaXMubmFtZSA9IG9wdGlvbnMubmFtZSB8fCAnTmFtZWxlc3NDb21wb25lbnQnO1xyXG5cdHRoaXMuXyA9IG9wdGlvbnMuXztcclxuXHR0aGlzLnN0YXRlID0gb3B0aW9ucy5zdGF0ZTtcclxuXHR0aGlzLmVsZW1zID0gb3B0aW9ucy5lbGVtcztcclxuXHR0aGlzLm1ldGhvZHMgPSBvcHRpb25zLm1ldGhvZHM7XHJcblx0dGhpcy5oYW5kbGVycyA9IG9wdGlvbnMuaGFuZGxlcnM7XHJcblx0dGhpcy5ldmVudHMgPSBvcHRpb25zLmV2ZW50cztcclxuXHR0aGlzLmV4cG9zZWQgPSBvcHRpb25zLmV4cG9zZWQ7XHJcbn1cclxuXHJcbmluaXRNaXhpbiggQ2VsICk7XHJcbnNjcmlwdE1peGluKCBDZWwgKTtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBDZWw7IiwiLy8gc3JjL2hlbHBlcnMvZXhwb3NlRnVuY3Rpb25zLmpzXHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZXhwb3NlRnVuY3Rpb25zKCBjZWwgKSB7XHJcblx0dmFyIGV4cG9zZWQgPSB7XHJcblx0XHRpbml0OiBjZWwuaW5pdC5iaW5kKGNlbClcclxuXHR9O1xyXG5cclxuXHQvLyBOdWxsLWNoZWNrIGZvciBleHBvc2VkIGZ1bmN0aW9uc1xyXG5cdGlmICggY2VsLmV4cG9zZWQgIT0gbnVsbCApIHtcclxuXHRcdGlmICggLy8gRW5zdXJlIGV4cG9zZWQgaXMgYW4gYXJyYXkuXHJcblx0XHRcdEFycmF5LmlzQXJyYXkoIGNlbC5leHBvc2VkICkgJiZcclxuXHRcdFx0Y2VsLmV4cG9zZWQubGVuZ3RoID4gMFxyXG5cdFx0KSB7XHJcblx0XHRcdC8vIEVuc3VyZSB1c2VyIGRpZCBub3QgdHJ5IHRvIHBhc3MgJ2luaXQnIGluIHRoZSBleHBvc2VkIGxpc3QuXHJcblx0XHRcdC8vIFNoZS9oZSBzaG91bGQgdXNlIGEgZGlmZmVyZW50IGZ1bmN0aW9uIG5hbWUuXHJcblx0XHRcdGlmICggY2VsLmV4cG9zZWQuaW5kZXhPZignaW5pdCcpID4gMCApIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oJ1snK2NlbC5uYW1lKyddOiBUaGUgXFwnaW5pdFxcJyBwcm9wZXJ0eSBpcyBhbHJlYWR5IHRha2VuIGJ5IENlbCwgcGxlYXNlIHVzZSBhIGRpZmZlcmVudCBuYW1lIGZvciB5b3VyIGZ1bmN0aW9uLicpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdC8vIEF0dGFjaCBhbGwgZXhwb3NlZCBmdW5jdGlvbnMgdG8gdGhlICdleHBvc2VkJyBvYmplY3QuXHJcblx0XHRcdFx0Zm9yIChcclxuXHRcdFx0XHRcdGxldCBpID0gMCwgbnVtRXhwb3NlZCA9IGNlbC5leHBvc2VkLmxlbmd0aDtcclxuXHRcdFx0XHRcdGkgPCBudW1FeHBvc2VkO1xyXG5cdFx0XHRcdFx0aSA9IGkgKyAxXHJcblx0XHRcdFx0KSB7XHJcblx0XHRcdFx0XHRpZiAoIGNlbC5tZXRob2RzLmhhc093blByb3BlcnR5KCBjZWwuZXhwb3NlZFtpXSApICkge1xyXG5cdFx0XHRcdFx0XHRleHBvc2VkWyBjZWwuZXhwb3NlZFtpXSBdID0gY2VsLm1ldGhvZHNbIGNlbC5leHBvc2VkW2ldIF0uYmluZChjZWwpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y29uc29sZS53YXJuKCdbJytjZWwubmFtZSsnXTogUGxlYXNlIGVuc3VyZSB0aGUgXFwnZXhwb3NlZFxcJyBwcm9wZXJ0eSBpcyBhbiBhcnJheSBvZiBzdHJpbmdzLicpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIGV4cG9zZWQ7XHJcbn0iLCIvLyBzcmMvY29yZS9jZWwuanNcclxuaW1wb3J0IENvbXBvbmVudCBmcm9tICcuL2NvbXBvbmVudCc7XHJcbmltcG9ydCBleHBvc2VGdW5jdGlvbnMgZnJvbSAnLi4vaGVscGVycy9leHBvc2VGdW5jdGlvbnMnO1xyXG5cclxuXHJcbmNvbnN0IENlbCA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xyXG5cclxuXHRsZXQgY2VsID0gbmV3IENvbXBvbmVudCggb3B0aW9ucyApO1xyXG5cclxuXHQvLyBFeHBvc2VzIHNwZWNpZmllZCBmdW5jdGlvbnMgZm9yIHB1YmxpYyB1c2UuXHJcblx0cmV0dXJuIGV4cG9zZUZ1bmN0aW9ucyggY2VsICk7XHJcblxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQ2VsO1xyXG4iLCIvLyBzcmMvaW5kZXguanNcclxuaW1wb3J0IENlbCBmcm9tICcuL2NvcmUvY2VsLmpzJztcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBDZWw7Il0sIm5hbWVzIjpbImluaXRNaXhpbiIsIkNlbCIsInByb3RvdHlwZSIsIl9nZXRFbGVtZW50c09uTW91bnQiLCJ2bSIsImVsZW1zIiwiaSIsIm51bUVsZW0iLCJsZW5ndGgiLCJqUXVlcnkiLCIkIiwibmFtZSIsInNsaWNlIiwiZWxlbSIsInNlbGVjdG9yIiwidHlwZSIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvciIsIl9iaW5kVGhpc1RvTWV0aG9kcyIsIm1ldGhvZHMiLCJPYmplY3QiLCJrZXlzIiwibnVtTWV0aG9kcyIsImJpbmQiLCJfYmluZEV2ZW50c09uTW91bnQiLCJldmVudHMiLCJudW1FdmVudHMiLCJmaW5kRXZlbnRUYXJnZXRJbkVsZW1lbnRzIiwiZWxJbmRleCIsIml0ZW0iLCJpbmRleCIsInRhcmdldCIsImZpbHRlciIsImJpbmRUeXBlIiwiZnVuYyIsImhhbmRsZXJzIiwiaGFuZGxlciIsImRlYm91bmNlIiwidGhyb3R0bGUiLCJ3YXJuIiwiX2RlYm91bmNlIiwiX3Rocm90dGxlIiwiX2NoZWNrQ29tcG9uZW50U2V0dGluZ3MiLCJpbml0Iiwic2NyaXB0TWl4aW4iLCJ3YWl0IiwiaW1tZWRpYXRlIiwidGltZW91dCIsImNvbnRleHQiLCJhcmdzIiwiYXJndW1lbnRzIiwibGF0ZXIiLCJhcHBseSIsImNhbGxOb3ciLCJzZXRUaW1lb3V0Iiwib3B0aW9ucyIsInJlc3VsdCIsInByZXZpb3VzIiwibGVhZGluZyIsIkRhdGUiLCJub3ciLCJyZW1haW5pbmciLCJ0cmFpbGluZyIsImZldGNoIiwidXJsIiwic3VjY2Vzc0NhbGxiYWNrIiwiZXJyb3JDYWxsYmFjayIsInJlcSIsIlhNTEh0dHBSZXF1ZXN0Iiwib25sb2FkIiwic3RhdHVzIiwicmVzcG9uc2VUZXh0Iiwic3RhdHVzVGV4dCIsIm9wZW4iLCJzZW5kIiwic2V0U3RhdGUiLCJwcm9wIiwidmFsdWUiLCJzdGF0ZSIsImVyciIsInNldFN0YXRlQXN5bmMiLCJhc3luY1Rhc2siLCJhc3luY0NhbGxiYWNrIiwicCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiZGF0YSIsInRoZW4iLCJjYXRjaCIsImxvZyIsInNldEh0bWwiLCJ0YXJnZXRFbGVtIiwiZmluZFRhcmdldEluRWxlbWVudHMiLCJodG1sIiwiaW5uZXJIVE1MIiwiXyIsImV4cG9zZWQiLCJleHBvc2VGdW5jdGlvbnMiLCJjZWwiLCJpc0FycmF5IiwiaW5kZXhPZiIsIm51bUV4cG9zZWQiLCJoYXNPd25Qcm9wZXJ0eSIsIkNvbXBvbmVudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztBQUdBLEFBQU8sU0FBU0EsU0FBVCxDQUFtQkMsR0FBbkIsRUFBd0I7OztLQUcxQkMsU0FBSixDQUFjQyxtQkFBZCxHQUFvQyxZQUFXO01BQ3hDQyxLQUFLLElBQVg7TUFDS0EsR0FBR0MsS0FBSCxJQUFZLElBQWpCLEVBQXdCO1FBQ2pCLElBQUlDLElBQUksQ0FBUixFQUFXQyxVQUFVSCxHQUFHQyxLQUFILENBQVNHLE1BQXBDLEVBQTRDRixJQUFJQyxPQUFoRCxFQUF5REQsR0FBekQsRUFBK0Q7Ozs7UUFJekQsQ0FBQ0csVUFBVSxJQUFWLElBQWtCQyxLQUFLLElBQXhCLEtBQ0pOLEdBQUdDLEtBQUgsQ0FBU0MsQ0FBVCxFQUFZSyxJQUFaLENBQWlCQyxLQUFqQixDQUF1QixDQUF2QixFQUEwQixDQUExQixNQUFpQyxHQURsQyxFQUVFO1FBQ0VQLEtBQUgsQ0FBU0MsQ0FBVCxFQUFZTyxJQUFaLEdBQW1CSCxFQUFHTixHQUFHQyxLQUFILENBQVNDLENBQVQsRUFBWVEsUUFBZixDQUFuQjtRQUNHVCxLQUFILENBQVNDLENBQVQsRUFBWVMsSUFBWixHQUFtQixRQUFuQjs7OztTQUlJO1NBQ0RWLEtBQUgsQ0FBU0MsQ0FBVCxFQUFZTyxJQUFaLEdBQW1CRyxTQUFTQyxhQUFULENBQXdCYixHQUFHQyxLQUFILENBQVNDLENBQVQsRUFBWVEsUUFBcEMsQ0FBbkI7U0FDR1QsS0FBSCxDQUFTQyxDQUFULEVBQVlTLElBQVosR0FBbUIsU0FBbkI7O0lBZnFCO0dBRnNCO0VBQS9DOzs7OztLQTBCSWIsU0FBSixDQUFjZ0Isa0JBQWQsR0FBbUMsWUFBVztNQUN2Q2QsS0FBSyxJQUFYO01BQ0llLFVBQVVDLE9BQU9DLElBQVAsQ0FBWWpCLEdBQUdlLE9BQWYsQ0FBZDtNQUNJRyxhQUFhSCxRQUFRWCxNQUF6QjtNQUNLYyxhQUFhLENBQWxCLEVBQXNCO1FBRXBCLElBQUloQixJQUFJLENBRFQsRUFFQ0EsSUFBSWdCLFVBRkwsRUFHQ2hCLElBQUlBLElBQUUsQ0FIUCxFQUlFO09BQ0VhLE9BQUgsQ0FBWUEsUUFBUWIsQ0FBUixDQUFaLElBQTJCRixHQUFHZSxPQUFILENBQVlBLFFBQVFiLENBQVIsQ0FBWixFQUF5QmlCLElBQXpCLENBQThCbkIsRUFBOUIsQ0FBM0I7SUFOb0I7R0FKdUI7RUFBOUM7OztLQWdCSUYsU0FBSixDQUFjc0Isa0JBQWQsR0FBbUMsWUFBVztNQUN2Q3BCLEtBQUssSUFBWDs7TUFFS0EsR0FBR3FCLE1BQUgsSUFBYSxJQUFsQixFQUF5QjtPQUNwQkMsWUFBWXRCLEdBQUdxQixNQUFILENBQVVqQixNQUExQjs7O09BR0tKLEdBQUdDLEtBQUgsSUFBWSxJQUFaLElBQW9CcUIsWUFBWSxDQUFyQyxFQUF3Qzs7O1FBR25DQyw0QkFBNEIsU0FBNUJBLHlCQUE0QixDQUFVQyxPQUFWLEVBQW1CQyxJQUFuQixFQUF5QkMsS0FBekIsRUFBaUM7WUFDekRELEtBQUtsQixJQUFMLEtBQWNQLEdBQUdxQixNQUFILENBQVdHLE9BQVgsRUFBcUJHLE1BQTFDO0tBREQ7Ozs7U0FNTSxJQUFJekIsSUFBSSxDQUFkLEVBQWlCQSxJQUFJb0IsU0FBckIsRUFBZ0NwQixHQUFoQyxFQUFzQztTQUNqQ3lCLFNBQVMzQixHQUFHQyxLQUFILENBQVMyQixNQUFULENBQ1pMLDBCQUEwQkosSUFBMUIsQ0FBK0JuQixFQUEvQixFQUFtQ0UsQ0FBbkMsQ0FEWSxFQUVYLENBRlcsQ0FBYjtTQUdJMkIsV0FBYUYsT0FBT2hCLElBQVAsS0FBZ0IsUUFBbEIsR0FDWixJQURZLEdBRVosa0JBRkg7U0FHSW1CLE9BQU85QixHQUFHK0IsUUFBSCxDQUFhL0IsR0FBR3FCLE1BQUgsQ0FBVW5CLENBQVYsRUFBYThCLE9BQTFCLEVBQW9DYixJQUFwQyxDQUF5Q25CLEVBQXpDLENBQVg7OztTQUlDQSxHQUFHcUIsTUFBSCxDQUFVbkIsQ0FBVixFQUFhK0IsUUFBYixJQUF5QixJQUF6QixJQUNBLE9BQU9qQyxHQUFHcUIsTUFBSCxDQUFVbkIsQ0FBVixFQUFhK0IsUUFBcEIsS0FBaUMsUUFEakMsSUFFQWpDLEdBQUdxQixNQUFILENBQVVuQixDQUFWLEVBQWFnQyxRQUFiLElBQXlCLElBRnpCLElBR0EsT0FBT2xDLEdBQUdxQixNQUFILENBQVVuQixDQUFWLEVBQWFnQyxRQUFwQixLQUFpQyxRQUpsQyxFQUtFO2NBQ09DLElBQVIsQ0FBYSxNQUFJbkMsR0FBR08sSUFBUCxHQUFZLHlHQUF6QjtNQU5EOzs7VUFVSyxJQUFLUCxHQUFHcUIsTUFBSCxDQUFVbkIsQ0FBVixFQUFhK0IsUUFBYixJQUF5QixJQUE5QixFQUFxQztXQUV4QyxPQUFPakMsR0FBR3FCLE1BQUgsQ0FBVW5CLENBQVYsRUFBYStCLFFBQXBCLEtBQWlDLFFBQWpDLElBQ0FqQyxHQUFHcUIsTUFBSCxDQUFVbkIsQ0FBVixFQUFhK0IsUUFBYixHQUF3QixDQUZ6QixFQUdFOztlQUNNakMsR0FBR29DLFNBQUgsQ0FBY04sSUFBZCxFQUFvQjlCLEdBQUdxQixNQUFILENBQVVuQixDQUFWLEVBQWErQixRQUFqQyxDQUFQO1FBSkQsTUFLTztnQkFDRUUsSUFBUixDQUFhLE1BQUluQyxHQUFHTyxJQUFQLEdBQVksaUVBQXpCOztPQVBHOzs7V0FZQSxJQUFLUCxHQUFHcUIsTUFBSCxDQUFVbkIsQ0FBVixFQUFhZ0MsUUFBYixJQUF5QixJQUE5QixFQUFxQztZQUV4QyxPQUFPbEMsR0FBR3FCLE1BQUgsQ0FBVW5CLENBQVYsRUFBYWdDLFFBQXBCLEtBQWlDLFFBQWpDLElBQ0FsQyxHQUFHcUIsTUFBSCxDQUFVbkIsQ0FBVixFQUFhZ0MsUUFBYixHQUF3QixDQUZ6QixFQUdFOztnQkFDTWxDLEdBQUdxQyxTQUFILENBQWNQLElBQWQsRUFBb0I5QixHQUFHcUIsTUFBSCxDQUFVbkIsQ0FBVixFQUFhZ0MsUUFBakMsQ0FBUDtTQUpELE1BS087aUJBQ0VDLElBQVIsQ0FBYSxNQUFJbkMsR0FBR08sSUFBUCxHQUFZLGlFQUF6Qjs7UUF2Q21DOzs7WUE0QzlCRSxJQUFQLENBQWFvQixRQUFiLEVBQ0M3QixHQUFHcUIsTUFBSCxDQUFXbkIsQ0FBWCxFQUFlUyxJQURoQixFQUVDbUIsSUFGRDtLQXJEc0M7SUFKaEI7R0FIb0I7RUFBOUM7OztLQXNFSWhDLFNBQUosQ0FBY3dDLHVCQUFkLEdBQXdDLFlBQVc7TUFDNUN0QyxLQUFLLElBQVg7TUFFQ0EsR0FBR08sSUFBSCxLQUFZLElBQVosSUFDQVAsR0FBR08sSUFBSCxLQUFZLEVBRFosSUFFQVAsR0FBR08sSUFBSCxLQUFZLG1CQUhiLEVBSUU7V0FDTzRCLElBQVIsQ0FBYSwrR0FBYjs7RUFQRjs7O0tBWUlyQyxTQUFKLENBQWN5QyxJQUFkLEdBQXFCLFlBQVc7TUFDekJ2QyxLQUFLLElBQVg7S0FDR3NDLHVCQUFIO0tBQ0d2QyxtQkFBSDtLQUNHZSxrQkFBSDtLQUNHTSxrQkFBSDtFQUxEOzs7QUNsSUQ7OztBQUdBLEFBQU8sU0FBU29CLFdBQVQsQ0FBcUIzQyxHQUFyQixFQUEwQjs7O0tBRzVCQyxTQUFKLENBQWNzQyxTQUFkLEdBQTBCLFVBQVVOLElBQVYsRUFBZ0JXLElBQWhCLEVBQXNCQyxTQUF0QixFQUFrQztNQUN2REMsZ0JBQUo7U0FDTyxZQUFXO09BQ2JDLFVBQVUsSUFBZDtPQUNJQyxPQUFPQyxTQUFYO09BQ0lDLFFBQVEsU0FBUkEsS0FBUSxHQUFXO2NBQ1osSUFBVjtRQUNJLENBQUNMLFNBQUwsRUFBZ0I7VUFDVk0sS0FBTCxDQUFXSixPQUFYLEVBQW9CQyxJQUFwQjs7SUFIRjtPQU1JSSxVQUFXUCxhQUFhLENBQUNDLE9BQTdCO2dCQUNjQSxPQUFkO2FBQ1VPLFdBQVdILEtBQVgsRUFBa0JOLElBQWxCLENBQVY7T0FDSVEsT0FBSixFQUFhO1NBQ1BELEtBQUwsQ0FBV0osT0FBWCxFQUFvQkMsSUFBcEI7O0dBYkY7RUFGRDs7O0tBc0JJL0MsU0FBSixDQUFjdUMsU0FBZCxHQUEwQixVQUFVUCxJQUFWLEVBQWdCVyxJQUFoQixFQUFzQlUsT0FBdEIsRUFBZ0M7TUFDckRQLGdCQUFKO01BQWFDLGFBQWI7TUFBbUJPLGVBQW5CO01BQ0lULFVBQVUsSUFBZDtNQUNJVSxXQUFXLENBQWY7TUFDSyxDQUFDRixPQUFOLEVBQWdCO2FBQ0wsRUFBVjs7TUFFR0osUUFBUSxTQUFSQSxLQUFRLEdBQVc7Y0FDWEksUUFBUUcsT0FBUixLQUFvQixLQUFwQixHQUE0QixDQUE1QixHQUFnQ0MsS0FBS0MsR0FBTCxFQUEzQzthQUNVLElBQVY7WUFDUzFCLEtBQUtrQixLQUFMLENBQVdKLE9BQVgsRUFBb0JDLElBQXBCLENBQVQ7T0FDSyxDQUFDRixPQUFOLEVBQWdCO2NBQ0xFLE9BQU8sSUFBakI7O0dBTEY7U0FRTyxZQUFXO09BQ2JXLE1BQU1ELEtBQUtDLEdBQUwsRUFBVjtPQUNLLENBQUNILFFBQUQsSUFBYUYsUUFBUUcsT0FBUixLQUFvQixLQUF0QyxFQUE4QztlQUNsQ0UsR0FBWDs7T0FFR0MsWUFBWWhCLFFBQVFlLE1BQU1ILFFBQWQsQ0FBaEI7YUFDVSxJQUFWO1VBQ09QLFNBQVA7T0FDS1csYUFBYSxDQUFiLElBQWtCQSxZQUFZaEIsSUFBbkMsRUFBMEM7UUFDckNFLE9BQUosRUFBYTtrQkFDQ0EsT0FBYjtlQUNVLElBQVY7O2VBRVVhLEdBQVg7YUFDUzFCLEtBQUtrQixLQUFMLENBQVdKLE9BQVgsRUFBb0JDLElBQXBCLENBQVQ7UUFDSyxDQUFDRixPQUFOLEVBQWdCO2VBQ0xFLE9BQU8sSUFBakI7O0lBUkYsTUFVTyxJQUFLLENBQUNGLE9BQUQsSUFBWVEsUUFBUU8sUUFBUixLQUFxQixLQUF0QyxFQUE4QztjQUMxQ1IsV0FBV0gsS0FBWCxFQUFrQlUsU0FBbEIsQ0FBVjs7VUFFTUwsTUFBUDtHQXJCRDtFQWZEOztLQXdDSXRELFNBQUosQ0FBYzZELEtBQWQsR0FBc0IsVUFBVUMsR0FBVixFQUFlQyxlQUFmLEVBQWdDQyxhQUFoQyxFQUFnRDtNQUNoRUMsR0FBSjtRQUNNLElBQUlDLGNBQUosRUFBTjtNQUNJQyxNQUFKLEdBQWEsWUFBVztPQUNqQkMsTUFBSixLQUFlLEdBQWpCLEdBQ0dMLGdCQUFpQkUsSUFBSUksWUFBckIsQ0FESCxHQUVHTCxjQUFlQyxJQUFJSyxVQUFuQixDQUZIO0dBREQ7TUFLSUMsSUFBSixDQUFTLEtBQVQsRUFBZ0JULEdBQWhCLEVBQXFCLElBQXJCO01BQ0lVLElBQUo7RUFURjs7O0tBY0l4RSxTQUFKLENBQWN5RSxRQUFkLEdBQXlCLFVBQVVDLElBQVYsRUFBZ0JDLEtBQWhCLEVBQXdCO01BQzFDekUsS0FBSyxJQUFYO01BQ0k7TUFDQTBFLEtBQUgsQ0FBVUYsSUFBVixJQUFtQkMsS0FBbkI7R0FERCxDQUVFLE9BQU9FLEdBQVAsRUFBWTtXQUNMeEMsSUFBUixDQUFhLE1BQUluQyxHQUFHTyxJQUFQLEdBQVksNkJBQVosR0FBMENpRSxJQUExQyxHQUErQyxrREFBNUQsRUFBZ0hHLEdBQWhIOztFQUxGOzs7S0FXSTdFLFNBQUosQ0FBYzhFLGFBQWQsR0FBOEIsVUFBVUosSUFBVixFQUFnQkssU0FBaEIsRUFBMkJDLGFBQTNCLEVBQTJDO01BQ2xFOUUsS0FBSyxJQUFYOzs7TUFHSStFLElBQUksSUFBSUMsT0FBSixDQUFZLFVBQVVDLE9BQVYsRUFBbUJDLE1BQW5CLEVBQTRCO2FBRTlDLFVBQVNDLElBQVQsRUFBZTtZQUFXQSxJQUFUO0lBRGxCLEVBRUMsVUFBU1IsR0FBVCxFQUFjO1dBQVVBLEdBQVI7SUFGakI7R0FETyxDQUFSOzs7SUFRRVMsSUFBRixDQUFPLFVBQVVELElBQVYsRUFBaUI7TUFDcEJULEtBQUgsQ0FBVUYsSUFBVixJQUFtQlcsSUFBbkI7OztvQkFHa0IsSUFBakIsSUFDQyxPQUFPTCxhQUFQLEtBQXlCLFVBRjNCLEVBR0U7a0JBQ2NLLElBQWY7O0dBUEY7OztJQWFFRSxLQUFGLENBQVEsVUFBVVYsR0FBVixFQUFnQjtXQUNmVyxHQUFSLENBQVksTUFBSXRGLEdBQUdPLElBQVAsR0FBWSw0QkFBWixHQUF5Q2lFLElBQXpDLEdBQThDLGlCQUExRCxFQUE2RUcsR0FBN0U7R0FERDtFQXpCRDs7S0FnQ0k3RSxTQUFKLENBQWN5RixPQUFkLEdBQXdCLFVBQVVDLFVBQVYsRUFBc0JmLEtBQXRCLEVBQThCO01BQy9DekUsS0FBSyxJQUFYOzs7TUFHSXlGLHVCQUF1QixTQUF2QkEsb0JBQXVCLENBQVVoRSxJQUFWLEVBQWdCQyxLQUFoQixFQUF3QjtVQUMzQ0QsS0FBS2xCLElBQUwsS0FBY2lGLFVBQXJCO0dBREQ7O01BSUk3RCxTQUFTM0IsR0FBR0MsS0FBSCxDQUFTMkIsTUFBVCxDQUFpQjZELHFCQUFxQnRFLElBQXJCLENBQTBCbkIsRUFBMUIsQ0FBakIsRUFBaUQsQ0FBakQsQ0FBYjtNQUNLMkIsT0FBT2hCLElBQVAsS0FBZ0IsUUFBckIsRUFBZ0M7VUFDeEJGLElBQVAsQ0FBWWlGLElBQVosQ0FBa0JqQixLQUFsQjtHQURELE1BRU8sSUFBSzlDLE9BQU9oQixJQUFQLEtBQWdCLFNBQXJCLEVBQWdDO1VBQy9CRixJQUFQLENBQVlrRixTQUFaLEdBQXdCbEIsS0FBeEI7O0VBWkY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzdIRDtBQUNBLEFBQ0EsQUFHQSxTQUFTNUUsS0FBVCxDQUFjc0QsT0FBZCxFQUF3QjtNQUNsQjVDLElBQUwsR0FBWTRDLFFBQVE1QyxJQUFSLElBQWdCLG1CQUE1QjtNQUNLcUYsQ0FBTCxHQUFTekMsUUFBUXlDLENBQWpCO01BQ0tsQixLQUFMLEdBQWF2QixRQUFRdUIsS0FBckI7TUFDS3pFLEtBQUwsR0FBYWtELFFBQVFsRCxLQUFyQjtNQUNLYyxPQUFMLEdBQWVvQyxRQUFRcEMsT0FBdkI7TUFDS2dCLFFBQUwsR0FBZ0JvQixRQUFRcEIsUUFBeEI7TUFDS1YsTUFBTCxHQUFjOEIsUUFBUTlCLE1BQXRCO01BQ0t3RSxPQUFMLEdBQWUxQyxRQUFRMEMsT0FBdkI7OztBQUdEakcsVUFBV0MsS0FBWDtBQUNBMkMsWUFBYTNDLEtBQWIsRUFHQTs7QUNwQkE7OztBQUdBLEFBQWUsU0FBU2lHLGVBQVQsQ0FBMEJDLEdBQTFCLEVBQWdDO0tBQzFDRixVQUFVO1FBQ1BFLElBQUl4RCxJQUFKLENBQVNwQixJQUFULENBQWM0RSxHQUFkO0VBRFA7OztLQUtLQSxJQUFJRixPQUFKLElBQWUsSUFBcEIsRUFBMkI7O1FBRW5CRyxPQUFOLENBQWVELElBQUlGLE9BQW5CLEtBQ0FFLElBQUlGLE9BQUosQ0FBWXpGLE1BQVosR0FBcUIsQ0FGdEIsRUFHRTs7O09BR0kyRixJQUFJRixPQUFKLENBQVlJLE9BQVosQ0FBb0IsTUFBcEIsSUFBOEIsQ0FBbkMsRUFBdUM7WUFDOUI5RCxJQUFSLENBQWEsTUFBSTRELElBQUl4RixJQUFSLEdBQWEsa0dBQTFCO0lBREQsTUFFTzs7U0FHTCxJQUFJTCxJQUFJLENBQVIsRUFBV2dHLGFBQWFILElBQUlGLE9BQUosQ0FBWXpGLE1BRHJDLEVBRUNGLElBQUlnRyxVQUZMLEVBR0NoRyxJQUFJQSxJQUFJLENBSFQsRUFJRTtTQUNJNkYsSUFBSWhGLE9BQUosQ0FBWW9GLGNBQVosQ0FBNEJKLElBQUlGLE9BQUosQ0FBWTNGLENBQVosQ0FBNUIsQ0FBTCxFQUFvRDtjQUMxQzZGLElBQUlGLE9BQUosQ0FBWTNGLENBQVosQ0FBVCxJQUE0QjZGLElBQUloRixPQUFKLENBQWFnRixJQUFJRixPQUFKLENBQVkzRixDQUFaLENBQWIsRUFBOEJpQixJQUE5QixDQUFtQzRFLEdBQW5DLENBQTVCOzs7O0dBaEJKLE1Bb0JPO1dBQ0U1RCxJQUFSLENBQWEsTUFBSTRELElBQUl4RixJQUFSLEdBQWEsbUVBQTFCOzs7O1FBSUtzRixPQUFQOzs7QUNuQ0Q7QUFDQSxBQUNBLEFBR0EsSUFBTWhHLFFBQU0sU0FBTkEsR0FBTSxDQUFVc0QsT0FBVixFQUFvQjs7S0FFM0I0QyxNQUFNLElBQUlLLEtBQUosQ0FBZWpELE9BQWYsQ0FBVjs7O1FBR08yQyxnQkFBaUJDLEdBQWpCLENBQVA7Q0FMRCxDQVNBOztBQ2RBLGVBQ0EsQUFHQTs7OzsifQ==
