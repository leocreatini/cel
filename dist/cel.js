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
				if ((window.jQuery != null || window.$ != null) && vm.elems[i].name.slice(0, 1) === '$') {
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
	Cel.prototype.setState = function (state, value) {
		var vm = this;
		try {
			vm.state[state] = value;
		} catch (err) {
			console.warn('[' + vm.name + ']: Could not set value of "' + state + '", make sure it exists in your component config.', err);
		}
	};

	// Set state asynchronously.
	Cel.prototype.setStateAsync = function (state, asyncTask, asyncCallback) {
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
			vm.setState(state, data);

			if ( // Pass data to callback if it exists and is a function.
			asyncCallback != null && typeof asyncCallback === 'function') {
				asyncCallback(data);
			}
		});

		// When promise fails.
		p.catch(function (err) {
			console.log('[' + vm.name + ']: Error setting state of ' + state + ' asynchronously', err);
		});
	};

	Cel.prototype.setHtml = function (elem, value) {
		var vm = this;

		// Filters out an element that matches the event's target.
		var findTargetInElements = function findTargetInElements(item, index) {
			return item.name === elem;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2luaXRNaXhpbi5qcyIsIi4uL3NyYy9jb3JlL3NjcmlwdE1peGluLmpzIiwiLi4vc3JjL2NvcmUvY29tcG9uZW50LmpzIiwiLi4vc3JjL2hlbHBlcnMvZXhwb3NlRnVuY3Rpb25zLmpzIiwiLi4vc3JjL2NvcmUvY2VsLmpzIiwiLi4vc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHNyYy9jb3JlL2luaXRNaXhpbi5qc1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpbml0TWl4aW4oQ2VsKSB7XHJcblx0Ly8gRmluZHMgZWxlbWVudHMgdmlhIGl0cyBzZWxlY3RvciBhbmQgY2FjaGVzIHRoZW0gdW5kZXIgdGhlICdlbGVtJyBwcm9wZXJ0eVxyXG5cdC8vIG9mIHRoYXQgZWxlbWVudC5cclxuXHRDZWwucHJvdG90eXBlLl9nZXRFbGVtZW50c09uTW91bnQgPSBmdW5jdGlvbigpIHtcclxuXHRcdGNvbnN0IHZtID0gdGhpcztcclxuXHRcdGlmICggdm0uZWxlbXMgIT0gbnVsbCApIHtcclxuXHRcdFx0Zm9yICggdmFyIGkgPSAwLCBudW1FbGVtID0gdm0uZWxlbXMubGVuZ3RoOyBpIDwgbnVtRWxlbTsgaSsrICkge1xyXG5cclxuXHRcdFx0XHQvLyBJZiBqUXVlcnkgaXMgYXZhaWxhYmxlIGFuZCB1c2luZyB0aGUgJyRlbGVtTmFtZScgY29udmVudGlvbixcclxuXHRcdFx0XHQvLyBSZXR1cm4gYSBqUXVlcnkgb2JqZWN0LlxyXG5cdFx0XHRcdGlmICggKHdpbmRvdy5qUXVlcnkgIT0gbnVsbCB8fCB3aW5kb3cuJCAhPSBudWxsKSAmJlxyXG5cdFx0XHRcdFx0dm0uZWxlbXNbaV0ubmFtZS5zbGljZSgwLCAxKSA9PT0gJyQnXHJcblx0XHRcdFx0KSB7XHJcblx0XHRcdFx0XHR2bS5lbGVtc1tpXS5lbGVtID0gJCggdm0uZWxlbXNbaV0uc2VsZWN0b3IgKTtcclxuXHRcdFx0XHRcdHZtLmVsZW1zW2ldLnR5cGUgPSAnanF1ZXJ5JztcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdC8vIEVsc2UsIGp1c3QgdXNlIHZhbmlsbGEgamF2YXNjcmlwdCBET00gbm9kZS5cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdHZtLmVsZW1zW2ldLmVsZW0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCB2bS5lbGVtc1tpXS5zZWxlY3RvciApO1xyXG5cdFx0XHRcdFx0dm0uZWxlbXNbaV0udHlwZSA9ICdlbGVtZW50JztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gLy8gZm9yXHJcblx0XHR9IC8vIGlmXHJcblx0fTtcclxuXHJcblx0Ly8gQmluZHMgdGhlIGNvbXBvbmVudCdzIFwidGhpc1wiIHRvIHRoZSBtZXRob2RzLlxyXG5cdC8vIFRoaXMgaXMgZG9uZSB0byBiZSBhYmxlIHRvIGNhbGwgJ3RoaXMubWV0aG9kcy5mdW5jdGlvbk5hbWUoKScgZnJvbSBvdGhlclxyXG5cdC8vIG1ldGhvZHMgYW5kIGhhbmRsZXJzLlxyXG5cdENlbC5wcm90b3R5cGUuX2JpbmRUaGlzVG9NZXRob2RzID0gZnVuY3Rpb24oKSB7XHJcblx0XHRjb25zdCB2bSA9IHRoaXM7XHJcblx0XHR2YXIgbWV0aG9kcyA9IE9iamVjdC5rZXlzKHZtLm1ldGhvZHMpO1xyXG5cdFx0dmFyIG51bU1ldGhvZHMgPSBtZXRob2RzLmxlbmd0aDtcclxuXHRcdGlmICggbnVtTWV0aG9kcyA+IDAgKSB7XHJcblx0XHRcdGZvciAoXHJcblx0XHRcdFx0dmFyIGkgPSAwO1xyXG5cdFx0XHRcdGkgPCBudW1NZXRob2RzO1xyXG5cdFx0XHRcdGkgPSBpKzFcclxuXHRcdFx0KSB7XHJcblx0XHRcdFx0dm0ubWV0aG9kc1sgbWV0aG9kc1tpXSBdID0gdm0ubWV0aG9kc1sgbWV0aG9kc1tpXSBdLmJpbmQodm0pO1xyXG5cdFx0XHR9IC8vIGZvclxyXG5cdFx0fSAvLyBpZlxyXG5cdH07XHJcblxyXG5cdC8vIEFkZHMgZXZlbnQtbGlzdGVuZXJzIHRvIHRhcmdldCBlbGVtZW50cyB3aGVuIGNvbXBvbmVudCBpbml0aWFsaXplcy5cclxuXHRDZWwucHJvdG90eXBlLl9iaW5kRXZlbnRzT25Nb3VudCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0Y29uc3Qgdm0gPSB0aGlzO1xyXG5cdFx0Ly8gRW5zdXJlIGV2ZW50cyBhcmVuJ3QgZW1wdHlcclxuXHRcdGlmICggdm0uZXZlbnRzICE9IG51bGwgKSB7XHJcblx0XHRcdHZhciBudW1FdmVudHMgPSB2bS5ldmVudHMubGVuZ3RoO1xyXG5cclxuXHRcdFx0Ly8gRW5zdXJlIGVsZW1lbnRzIGFyZW4ndCBlbXB0eSBhbmQgdGhlcmUncyBhdCBsZWFzdCBvbiBldmVudC5cclxuXHRcdFx0aWYgKCB2bS5lbGVtcyAhPSBudWxsICYmIG51bUV2ZW50cyA+IDApIHtcclxuXHJcblx0XHRcdFx0Ly8gRmlsdGVycyBvdXQgYW4gZWxlbWVudCB0aGF0IG1hdGNoZXMgdGhlIGV2ZW50J3MgdGFyZ2V0LlxyXG5cdFx0XHRcdHZhciBmaW5kRXZlbnRUYXJnZXRJbkVsZW1lbnRzID0gZnVuY3Rpb24oIGVsSW5kZXgsIGl0ZW0sIGluZGV4ICkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGl0ZW0ubmFtZSA9PT0gdm0uZXZlbnRzWyBlbEluZGV4IF0udGFyZ2V0O1xyXG5cdFx0XHRcdH07XHJcblxyXG5cdFx0XHRcdC8vIEJpbmRzIGVhY2ggZXZlbnQgdG8gaXRzIGRlc2lnbmF0ZWQgdGFyZ2V0XHJcblx0XHRcdFx0Ly8gQW5kIGFkZCBkZWJvdW5jZSBvciB0aHJvdHRsaW5nIGlmIHJlcXVlc3RlZC5cclxuXHRcdFx0XHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBudW1FdmVudHM7IGkrKyApIHtcclxuXHRcdFx0XHRcdHZhciB0YXJnZXQgPSB2bS5lbGVtcy5maWx0ZXIoXHJcblx0XHRcdFx0XHRcdGZpbmRFdmVudFRhcmdldEluRWxlbWVudHMuYmluZCh2bSwgaSlcclxuXHRcdFx0XHRcdClbMF07XHJcblx0XHRcdFx0XHR2YXIgYmluZFR5cGUgPSAoIHRhcmdldC50eXBlID09PSAnanF1ZXJ5JyApXHJcblx0XHRcdFx0XHRcdD8gJ29uJ1xyXG5cdFx0XHRcdFx0XHQ6ICdhZGRFdmVudExpc3RlbmVyJztcclxuXHRcdFx0XHRcdHZhciBmdW5jID0gdm0uaGFuZGxlcnNbIHZtLmV2ZW50c1tpXS5oYW5kbGVyIF0uYmluZCh2bSlcclxuXHJcblx0XHRcdFx0XHQvLyBQcmV2ZW50IHVzaW5nIERlYm91bmNlIGFuZCBUaHJvdHRsZSBmb3Igc2FtZSBldmVudC5cclxuXHRcdFx0XHRcdGlmIChcclxuXHRcdFx0XHRcdFx0dm0uZXZlbnRzW2ldLmRlYm91bmNlICE9IG51bGwgJiZcclxuXHRcdFx0XHRcdFx0dHlwZW9mIHZtLmV2ZW50c1tpXS5kZWJvdW5jZSA9PT0gJ251bWJlcicgJiZcclxuXHRcdFx0XHRcdFx0dm0uZXZlbnRzW2ldLnRocm90dGxlICE9IG51bGwgJiZcclxuXHRcdFx0XHRcdFx0dHlwZW9mIHZtLmV2ZW50c1tpXS50aHJvdHRsZSA9PT0gJ251bWJlcidcclxuXHRcdFx0XHRcdCkge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ1snK3ZtLm5hbWUrJ106IENhbm5vdCBzZXQgYm90aCBcXCdkZWJvdW5jZVxcJyBhbmQgXFwndGhyb3R0bGVcXCcgY29uZmlndXJhdGlvbnMgb24gdGhlIHNhbWUgZXZlbnQuIFBsZWFzZSB1c2Ugb25seSBvbmUuJyk7XHJcblx0XHRcdFx0XHR9IC8vIGlmXHJcblxyXG5cdFx0XHRcdFx0Ly8gQWRkIGRlYm91bmNpbmcgdG8gZnVuY3Rpb24gaWYgc2V0dGluZyBpcyBjb3JyZWN0LlxyXG5cdFx0XHRcdFx0ZWxzZSBpZiAoIHZtLmV2ZW50c1tpXS5kZWJvdW5jZSAhPSBudWxsICkge1xyXG5cdFx0XHRcdFx0XHRpZiAoXHJcblx0XHRcdFx0XHRcdFx0dHlwZW9mIHZtLmV2ZW50c1tpXS5kZWJvdW5jZSA9PT0gJ251bWJlcicgJiZcclxuXHRcdFx0XHRcdFx0XHR2bS5ldmVudHNbaV0uZGVib3VuY2UgPiAwXHJcblx0XHRcdFx0XHRcdCkgeyAvLyBTZXR0aW5nIGlzIGNvcnJlY3QsIGFkZGluZyBkZWJvdW5jaW5nLlxyXG5cdFx0XHRcdFx0XHRcdGZ1bmMgPSB2bS5fZGVib3VuY2UoIGZ1bmMsIHZtLmV2ZW50c1tpXS5kZWJvdW5jZSApO1xyXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUud2FybignWycrdm0ubmFtZSsnXTogRW5zdXJlIHlvdXIgXFwnZGVib3VuY2VcXCcgc2V0dGluZyBpcyBhIG51bWJlciBncmVhdGVyIHRoYW4gMC4nKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSAvLyBlbHNlIGlmXHJcblxyXG5cdFx0XHRcdFx0Ly8gQWRkIHRocm90dGxpbmcgdG8gZnVuY3Rpb24gaWYgc2V0dGluZyBpcyBjb3JyZWN0LlxyXG5cdFx0XHRcdFx0ZWxzZSBpZiAoIHZtLmV2ZW50c1tpXS50aHJvdHRsZSAhPSBudWxsICkge1xyXG5cdFx0XHRcdFx0XHRpZiAoXHJcblx0XHRcdFx0XHRcdFx0dHlwZW9mIHZtLmV2ZW50c1tpXS50aHJvdHRsZSA9PT0gJ251bWJlcicgJiZcclxuXHRcdFx0XHRcdFx0XHR2bS5ldmVudHNbaV0udGhyb3R0bGUgPiAwXHJcblx0XHRcdFx0XHRcdCkgeyAvLyBTZXR0aW5nIGlzIGNvcnJlY3QsIGFkZGluZyB0aHJvdHRsaW5nLlxyXG5cdFx0XHRcdFx0XHRcdGZ1bmMgPSB2bS5fdGhyb3R0bGUoIGZ1bmMsIHZtLmV2ZW50c1tpXS50aHJvdHRsZSApO1xyXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUud2FybignWycrdm0ubmFtZSsnXTogRW5zdXJlIHlvdXIgXFwndGhyb3R0bGVcXCcgc2V0dGluZyBpcyBhIG51bWJlciBncmVhdGVyIHRoYW4gMC4nKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSAvLyBlbHNlIGlmXHJcblxyXG5cdFx0XHRcdFx0Ly8gQmluZGluZyBjYWxsYmFjayBldmVudCB0byB0YXJnZXQuXHJcblx0XHRcdFx0XHR0YXJnZXQuZWxlbVsgYmluZFR5cGUgXShcclxuXHRcdFx0XHRcdFx0dm0uZXZlbnRzWyBpIF0udHlwZSxcclxuXHRcdFx0XHRcdFx0ZnVuY1xyXG5cdFx0XHRcdFx0KTtcclxuXHRcdFx0XHR9IC8vIGZvciBudW1FdmVudHNcclxuXHRcdFx0fSAvLyBpZiBlbGVtcy5sZW5ndGhcclxuXHRcdH0gLy8gaWYgdm0uZXZlbnRzXHJcblx0fTtcclxuXHJcblx0Ly8gRW5zdXJpbmcgdGhlIHNldHRpbmdzIGFyZSBjb3JyZWN0LlxyXG5cdENlbC5wcm90b3R5cGUuX2NoZWNrQ29tcG9uZW50U2V0dGluZ3MgPSBmdW5jdGlvbigpIHtcclxuXHRcdGNvbnN0IHZtID0gdGhpcztcclxuXHRcdGlmIChcclxuXHRcdFx0dm0ubmFtZSA9PT0gbnVsbCB8fFxyXG5cdFx0XHR2bS5uYW1lID09PSAnJyB8fFxyXG5cdFx0XHR2bS5uYW1lID09PSAnTmFtZWxlc3NDb21wb25lbnQnXHJcblx0XHQpIHtcclxuXHRcdFx0Y29uc29sZS53YXJuKCdQbGVhc2UgZW5zdXJlIHRoYXQgeW91IG5hbWVkIGFsbCB5b3VyIGNvbXBvbmVudHMgd2l0aCBhIFxcJ25hbWVcXCcgcHJvcGVydHkuIEF0IGxlYXN0IG9uZSBpcyBtaXNzaW5nIHJpZ2h0IG5vdy4nKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIFB1YmxpY2FsbHkgYWNjZXNzaWJsZSBpbml0aWFsaXplIGZ1bmN0aW9uIHRvIGJvb3RzdHJhcCB0aGUgY29tcG9uZW50LlxyXG5cdENlbC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0Y29uc3Qgdm0gPSB0aGlzO1xyXG5cdFx0dm0uX2NoZWNrQ29tcG9uZW50U2V0dGluZ3MoKTtcclxuXHRcdHZtLl9nZXRFbGVtZW50c09uTW91bnQoKTtcclxuXHRcdHZtLl9iaW5kVGhpc1RvTWV0aG9kcygpO1xyXG5cdFx0dm0uX2JpbmRFdmVudHNPbk1vdW50KCk7XHJcblx0fTtcclxuXHJcbn07XHJcbiIsIi8vIHNyYy9jb3JlL3NjcmlwdE1peGluLmpzXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNjcmlwdE1peGluKENlbCkge1xyXG5cclxuXHQvLyBGcm9tIFVuZGVyc2NvcmUgbGlicmFyeVxyXG5cdENlbC5wcm90b3R5cGUuX2RlYm91bmNlID0gZnVuY3Rpb24oIGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSApIHtcclxuXHRcdGxldCB0aW1lb3V0O1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRsZXQgY29udGV4dCA9IHRoaXM7XHJcblx0XHRcdGxldCBhcmdzID0gYXJndW1lbnRzO1xyXG5cdFx0XHRsZXQgbGF0ZXIgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR0aW1lb3V0ID0gbnVsbDtcclxuXHRcdFx0XHRpZiAoIWltbWVkaWF0ZSkge1xyXG5cdFx0XHRcdFx0ZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH07XHJcblx0XHRcdGxldCBjYWxsTm93ID0gKGltbWVkaWF0ZSAmJiAhdGltZW91dCk7XHJcblx0XHRcdGNsZWFyVGltZW91dCggdGltZW91dCApO1xyXG5cdFx0XHR0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XHJcblx0XHRcdGlmIChjYWxsTm93KSB7XHJcblx0XHRcdFx0ZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHR9O1xyXG5cclxuXHJcblx0Ly8gRnJvbSBVbmRlcnNjb3JlIGxpYnJhcnlcclxuXHRDZWwucHJvdG90eXBlLl90aHJvdHRsZSA9IGZ1bmN0aW9uKCBmdW5jLCB3YWl0LCBvcHRpb25zICkge1xyXG5cdFx0bGV0IGNvbnRleHQsIGFyZ3MsIHJlc3VsdDtcclxuXHRcdGxldCB0aW1lb3V0ID0gbnVsbDtcclxuXHRcdGxldCBwcmV2aW91cyA9IDA7XHJcblx0XHRpZiAoICFvcHRpb25zICkge1xyXG5cdFx0XHRvcHRpb25zID0ge307XHJcblx0XHR9XHJcblx0XHRsZXQgbGF0ZXIgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cHJldmlvdXMgPSBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlID8gMCA6IERhdGUubm93KCk7XHJcblx0XHRcdHRpbWVvdXQgPSBudWxsO1xyXG5cdFx0XHRyZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xyXG5cdFx0XHRpZiAoICF0aW1lb3V0ICkge1xyXG5cdFx0XHRcdGNvbnRleHQgPSBhcmdzID0gbnVsbDtcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHRcdHJldHVybiBmdW5jdGlvbigpIHtcclxuXHRcdFx0bGV0IG5vdyA9IERhdGUubm93KCk7XHJcblx0XHRcdGlmICggIXByZXZpb3VzICYmIG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UgKSB7XHJcblx0XHRcdFx0cHJldmlvdXMgPSBub3c7XHJcblx0XHRcdH1cclxuXHRcdFx0bGV0IHJlbWFpbmluZyA9IHdhaXQgLSAobm93IC0gcHJldmlvdXMpO1xyXG5cdFx0XHRjb250ZXh0ID0gdGhpcztcclxuXHRcdFx0YXJncyA9IGFyZ3VtZW50cztcclxuXHRcdFx0aWYgKCByZW1haW5pbmcgPD0gMCB8fCByZW1haW5pbmcgPiB3YWl0ICkge1xyXG5cdFx0XHRcdGlmICh0aW1lb3V0KSB7XHJcblx0XHRcdFx0XHRjbGVhclRpbWVvdXQodGltZW91dCk7XHJcblx0XHRcdFx0XHR0aW1lb3V0ID0gbnVsbDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cHJldmlvdXMgPSBub3c7XHJcblx0XHRcdFx0cmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcclxuXHRcdFx0XHRpZiAoICF0aW1lb3V0ICkge1xyXG5cdFx0XHRcdFx0Y29udGV4dCA9IGFyZ3MgPSBudWxsO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIGlmICggIXRpbWVvdXQgJiYgb3B0aW9ucy50cmFpbGluZyAhPT0gZmFsc2UgKSB7XHJcblx0XHRcdFx0dGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZyk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHJlc3VsdDtcclxuXHRcdH07XHJcblx0fTtcclxuXHJcblx0Q2VsLnByb3RvdHlwZS5mZXRjaCA9IGZ1bmN0aW9uKCB1cmwsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjayApIHtcclxuXHRcdFx0dmFyIHJlcTtcclxuXHRcdFx0cmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblx0XHRcdHJlcS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQoIHJlcS5zdGF0dXMgPT09IDIwMCApXHJcblx0XHRcdFx0XHQ/IHN1Y2Nlc3NDYWxsYmFjayggcmVxLnJlc3BvbnNlVGV4dCApXHJcblx0XHRcdFx0XHQ6IGVycm9yQ2FsbGJhY2soIHJlcS5zdGF0dXNUZXh0ICk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmVxLm9wZW4oJ0dFVCcsIHVybCwgdHJ1ZSk7XHJcblx0XHRcdHJlcS5zZW5kKCk7XHJcblx0fTtcclxuXHJcblxyXG5cdC8vIFNldCBzdGF0ZSBzeW5jaHJvbm91c2x5LlxyXG5cdENlbC5wcm90b3R5cGUuc2V0U3RhdGUgPSBmdW5jdGlvbiggc3RhdGUsIHZhbHVlICkge1xyXG5cdFx0Y29uc3Qgdm0gPSB0aGlzO1xyXG5cdFx0dHJ5IHtcclxuXHRcdFx0dm0uc3RhdGVbIHN0YXRlIF0gPSB2YWx1ZTtcclxuXHRcdH0gY2F0Y2ggKGVycikge1xyXG5cdFx0XHRjb25zb2xlLndhcm4oJ1snK3ZtLm5hbWUrJ106IENvdWxkIG5vdCBzZXQgdmFsdWUgb2YgXCInK3N0YXRlKydcIiwgbWFrZSBzdXJlIGl0IGV4aXN0cyBpbiB5b3VyIGNvbXBvbmVudCBjb25maWcuJywgZXJyKTtcclxuXHRcdH1cclxuXHR9O1xyXG5cclxuXHJcblx0Ly8gU2V0IHN0YXRlIGFzeW5jaHJvbm91c2x5LlxyXG5cdENlbC5wcm90b3R5cGUuc2V0U3RhdGVBc3luYyA9IGZ1bmN0aW9uKCBzdGF0ZSwgYXN5bmNUYXNrLCBhc3luY0NhbGxiYWNrICkge1xyXG5cdFx0Y29uc3Qgdm0gPSB0aGlzO1xyXG5cclxuXHRcdC8vIENyZWF0ZSBwcm9taXNlLlxyXG5cdFx0dmFyIHAgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiggcmVzb2x2ZSwgcmVqZWN0ICkge1xyXG5cdFx0XHRhc3luY1Rhc2soXHJcblx0XHRcdFx0ZnVuY3Rpb24oZGF0YSkgeyByZXNvbHZlKCBkYXRhICk7IH0sXHJcblx0XHRcdFx0ZnVuY3Rpb24oZXJyKSB7IHJlamVjdCggZXJyICk7IH1cclxuXHRcdFx0KTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdC8vIFdoZW4gcHJvbWlzZSBzdWNjZWVkcy5cclxuXHRcdHAudGhlbihmdW5jdGlvbiggZGF0YSApIHtcclxuXHRcdFx0dm0uc2V0U3RhdGUoIHN0YXRlLCBkYXRhKTtcclxuXHJcblx0XHRcdGlmICggLy8gUGFzcyBkYXRhIHRvIGNhbGxiYWNrIGlmIGl0IGV4aXN0cyBhbmQgaXMgYSBmdW5jdGlvbi5cclxuXHRcdFx0XHRhc3luY0NhbGxiYWNrICE9IG51bGwgJiZcclxuXHRcdFx0IFx0dHlwZW9mIGFzeW5jQ2FsbGJhY2sgPT09ICdmdW5jdGlvbidcclxuXHRcdFx0KSB7XHJcblx0XHRcdFx0YXN5bmNDYWxsYmFjayggZGF0YSApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0fSk7XHJcblxyXG5cdFx0Ly8gV2hlbiBwcm9taXNlIGZhaWxzLlxyXG5cdFx0cC5jYXRjaChmdW5jdGlvbiggZXJyICkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnWycrdm0ubmFtZSsnXTogRXJyb3Igc2V0dGluZyBzdGF0ZSBvZiAnK3N0YXRlKycgYXN5bmNocm9ub3VzbHknLCBlcnIpO1xyXG5cdFx0fSk7XHJcblxyXG5cdH07XHJcblxyXG5cclxuXHRDZWwucHJvdG90eXBlLnNldEh0bWwgPSBmdW5jdGlvbiggZWxlbSwgdmFsdWUgKSB7XHJcblx0XHRjb25zdCB2bSA9IHRoaXM7XHJcblxyXG5cdFx0Ly8gRmlsdGVycyBvdXQgYW4gZWxlbWVudCB0aGF0IG1hdGNoZXMgdGhlIGV2ZW50J3MgdGFyZ2V0LlxyXG5cdFx0dmFyIGZpbmRUYXJnZXRJbkVsZW1lbnRzID0gZnVuY3Rpb24oIGl0ZW0sIGluZGV4ICkge1xyXG5cdFx0XHRyZXR1cm4gaXRlbS5uYW1lID09PSBlbGVtO1xyXG5cdFx0fTtcclxuXHJcblx0XHR2YXIgdGFyZ2V0ID0gdm0uZWxlbXMuZmlsdGVyKCBmaW5kVGFyZ2V0SW5FbGVtZW50cy5iaW5kKHZtKSApWzBdO1xyXG5cdFx0aWYgKCB0YXJnZXQudHlwZSA9PT0gJ2pxdWVyeScgKSB7XHJcblx0XHRcdHRhcmdldC5lbGVtLmh0bWwoIHZhbHVlICk7XHJcblx0XHR9IGVsc2UgaWYgKCB0YXJnZXQudHlwZSA9PT0gJ2VsZW1lbnQnKSB7XHJcblx0XHRcdHRhcmdldC5lbGVtLmlubmVySFRNTCA9IHZhbHVlO1xyXG5cdFx0fVxyXG5cdH07XHJcblxyXG59O1xyXG5cclxuXHJcblxyXG4vLyAvLyBFbHNlIGlmIGl0J3MgYXN5bmNocm9ub3VzLCBjaGVjayB0aGF0IGl0IGNhbiBiZSB0aHJvd24gaW50byBhIFByb21pc2UuXHJcbi8vIGlmIChcclxuLy8gXHQoYXN5bmNDYWxsYmFjayB8fCBhc3luY0NhbGxiYWNrID09PSAnZnVuY3Rpb24nKSAmJlxyXG4vLyBcdHR5cGVvZiBwcm9taXNhYmxlID09PSAnZnVuY3Rpb24nXHJcbi8vICkge1xyXG4vL1xyXG4vLyBcdC8vIEVuc3VyZSBhIFByb21pc2UgbGlicmFyeSBleGlzdHMuXHJcbi8vIFx0aWYgKCB3aW5kb3cuUHJvbWlzZSAhPSBudWxsICkge1xyXG4vL1xyXG4vLyBcdFx0dmFyIHByb21pc2UgPSBuZXcgd2luZG93LlByb21pc2UoIGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4vLyBcdFx0XHRjb25zb2xlLmxvZygnU2V0dGluZyB1cCBwcm9taXNlJyk7XHJcbi8vIFx0XHRcdHRyeSB7XHJcbi8vIFx0XHRcdFx0cmVzb2x2ZSggcHJvbWlzYWJsZSgpICk7XHJcbi8vIFx0XHRcdH0gY2F0Y2goIGVyciApIHtcclxuLy8gXHRcdFx0XHRyZWplY3QoIGVyciApO1xyXG4vLyBcdFx0XHR9XHJcbi8vIFx0XHR9KTtcclxuLy9cclxuLy8gXHRcdHByb21pc2VcclxuLy8gXHRcdFx0LnRoZW4oZnVuY3Rpb24oIGRhdGEgKSB7XHJcbi8vIFx0XHRcdFx0Y29uc29sZS5sb2coJ1J1bm5pbmcgXCJ0aGVuXCIgZnVuY3Rpb24gd2l0aC4uLicsIGRhdGEpO1xyXG4vLyBcdFx0XHRcdHZtLnN0YXRlWyBwcm9wIF0gPSBkYXRhO1xyXG4vLyBcdFx0XHRcdGFzeW5jQ2FsbGJhY2soIGRhdGEgKTtcclxuLy8gXHRcdFx0fSlcclxuLy9cclxuLy8gXHRcdFx0LmNhdGNoKGZ1bmN0aW9uKCByZWFzb24gKSB7XHJcbi8vIFx0XHRcdFx0Y29uc29sZS5sb2coJ1snK3ZtLm5hbWUrJ106IEFzeW5jIHNldFN0YXRlKCkgaGFkIGFuIGVycm9yLCcsIHJlYXNvbik7XHJcbi8vIFx0XHRcdH0pO1xyXG4vL1xyXG4vL1xyXG4vLyBcdH0gZWxzZSB7XHJcbi8vIFx0XHRjb25zb2xlLndhcm4oJ1snK3ZtLm5hbWUrJ106IFRoaXMgY29tcG9uZW50IGlzIHRyeWluZyB0byB1c2UgYW4gYXN5bmMgc2V0U3RhdGUoKSBidXQgaGFzIG5vIFxcJ1Byb21pc2VcXCcgbGlicmFyeS4gUGxlYXNlIGluY2x1ZGUgYSBwb2x5ZmlsbC4nKVxyXG4vLyBcdH0gLy8gZWxzZVxyXG4vL1xyXG4vLyB9IC8vIGlmXHJcbiIsIi8vIHNyYy9jb3JlL2NvbXBvbmVudC5qc1xyXG5pbXBvcnQgeyBpbml0TWl4aW4gfSBmcm9tICcuL2luaXRNaXhpbic7XHJcbmltcG9ydCB7IHNjcmlwdE1peGluIH0gZnJvbSAnLi9zY3JpcHRNaXhpbic7XHJcblxyXG5cclxuZnVuY3Rpb24gQ2VsKCBvcHRpb25zICkge1xyXG5cdHRoaXMubmFtZSA9IG9wdGlvbnMubmFtZSB8fCAnTmFtZWxlc3NDb21wb25lbnQnO1xyXG5cdHRoaXMuXyA9IG9wdGlvbnMuXztcclxuXHR0aGlzLnN0YXRlID0gb3B0aW9ucy5zdGF0ZTtcclxuXHR0aGlzLmVsZW1zID0gb3B0aW9ucy5lbGVtcztcclxuXHR0aGlzLm1ldGhvZHMgPSBvcHRpb25zLm1ldGhvZHM7XHJcblx0dGhpcy5oYW5kbGVycyA9IG9wdGlvbnMuaGFuZGxlcnM7XHJcblx0dGhpcy5ldmVudHMgPSBvcHRpb25zLmV2ZW50cztcclxuXHR0aGlzLmV4cG9zZWQgPSBvcHRpb25zLmV4cG9zZWQ7XHJcbn1cclxuXHJcbmluaXRNaXhpbiggQ2VsICk7XHJcbnNjcmlwdE1peGluKCBDZWwgKTtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBDZWw7IiwiLy8gc3JjL2hlbHBlcnMvZXhwb3NlRnVuY3Rpb25zLmpzXHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZXhwb3NlRnVuY3Rpb25zKCBjZWwgKSB7XHJcblx0dmFyIGV4cG9zZWQgPSB7XHJcblx0XHRpbml0OiBjZWwuaW5pdC5iaW5kKGNlbClcclxuXHR9O1xyXG5cclxuXHQvLyBOdWxsLWNoZWNrIGZvciBleHBvc2VkIGZ1bmN0aW9uc1xyXG5cdGlmICggY2VsLmV4cG9zZWQgIT0gbnVsbCApIHtcclxuXHRcdGlmICggLy8gRW5zdXJlIGV4cG9zZWQgaXMgYW4gYXJyYXkuXHJcblx0XHRcdEFycmF5LmlzQXJyYXkoIGNlbC5leHBvc2VkICkgJiZcclxuXHRcdFx0Y2VsLmV4cG9zZWQubGVuZ3RoID4gMFxyXG5cdFx0KSB7XHJcblx0XHRcdC8vIEVuc3VyZSB1c2VyIGRpZCBub3QgdHJ5IHRvIHBhc3MgJ2luaXQnIGluIHRoZSBleHBvc2VkIGxpc3QuXHJcblx0XHRcdC8vIFNoZS9oZSBzaG91bGQgdXNlIGEgZGlmZmVyZW50IGZ1bmN0aW9uIG5hbWUuXHJcblx0XHRcdGlmICggY2VsLmV4cG9zZWQuaW5kZXhPZignaW5pdCcpID4gMCApIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oJ1snK2NlbC5uYW1lKyddOiBUaGUgXFwnaW5pdFxcJyBwcm9wZXJ0eSBpcyBhbHJlYWR5IHRha2VuIGJ5IENlbCwgcGxlYXNlIHVzZSBhIGRpZmZlcmVudCBuYW1lIGZvciB5b3VyIGZ1bmN0aW9uLicpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdC8vIEF0dGFjaCBhbGwgZXhwb3NlZCBmdW5jdGlvbnMgdG8gdGhlICdleHBvc2VkJyBvYmplY3QuXHJcblx0XHRcdFx0Zm9yIChcclxuXHRcdFx0XHRcdGxldCBpID0gMCwgbnVtRXhwb3NlZCA9IGNlbC5leHBvc2VkLmxlbmd0aDtcclxuXHRcdFx0XHRcdGkgPCBudW1FeHBvc2VkO1xyXG5cdFx0XHRcdFx0aSA9IGkgKyAxXHJcblx0XHRcdFx0KSB7XHJcblx0XHRcdFx0XHRpZiAoIGNlbC5tZXRob2RzLmhhc093blByb3BlcnR5KCBjZWwuZXhwb3NlZFtpXSApICkge1xyXG5cdFx0XHRcdFx0XHRleHBvc2VkWyBjZWwuZXhwb3NlZFtpXSBdID0gY2VsLm1ldGhvZHNbIGNlbC5leHBvc2VkW2ldIF0uYmluZChjZWwpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y29uc29sZS53YXJuKCdbJytjZWwubmFtZSsnXTogUGxlYXNlIGVuc3VyZSB0aGUgXFwnZXhwb3NlZFxcJyBwcm9wZXJ0eSBpcyBhbiBhcnJheSBvZiBzdHJpbmdzLicpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIGV4cG9zZWQ7XHJcbn0iLCIvLyBzcmMvY29yZS9jZWwuanNcclxuaW1wb3J0IENvbXBvbmVudCBmcm9tICcuL2NvbXBvbmVudCc7XHJcbmltcG9ydCBleHBvc2VGdW5jdGlvbnMgZnJvbSAnLi4vaGVscGVycy9leHBvc2VGdW5jdGlvbnMnO1xyXG5cclxuXHJcbmNvbnN0IENlbCA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xyXG5cclxuXHRsZXQgY2VsID0gbmV3IENvbXBvbmVudCggb3B0aW9ucyApO1xyXG5cclxuXHQvLyBFeHBvc2VzIHNwZWNpZmllZCBmdW5jdGlvbnMgZm9yIHB1YmxpYyB1c2UuXHJcblx0cmV0dXJuIGV4cG9zZUZ1bmN0aW9ucyggY2VsICk7XHJcblxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQ2VsO1xyXG4iLCIvLyBzcmMvaW5kZXguanNcclxuaW1wb3J0IENlbCBmcm9tICcuL2NvcmUvY2VsLmpzJztcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBDZWw7Il0sIm5hbWVzIjpbImluaXRNaXhpbiIsIkNlbCIsInByb3RvdHlwZSIsIl9nZXRFbGVtZW50c09uTW91bnQiLCJ2bSIsImVsZW1zIiwiaSIsIm51bUVsZW0iLCJsZW5ndGgiLCJ3aW5kb3ciLCJqUXVlcnkiLCIkIiwibmFtZSIsInNsaWNlIiwiZWxlbSIsInNlbGVjdG9yIiwidHlwZSIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvciIsIl9iaW5kVGhpc1RvTWV0aG9kcyIsIm1ldGhvZHMiLCJPYmplY3QiLCJrZXlzIiwibnVtTWV0aG9kcyIsImJpbmQiLCJfYmluZEV2ZW50c09uTW91bnQiLCJldmVudHMiLCJudW1FdmVudHMiLCJmaW5kRXZlbnRUYXJnZXRJbkVsZW1lbnRzIiwiZWxJbmRleCIsIml0ZW0iLCJpbmRleCIsInRhcmdldCIsImZpbHRlciIsImJpbmRUeXBlIiwiZnVuYyIsImhhbmRsZXJzIiwiaGFuZGxlciIsImRlYm91bmNlIiwidGhyb3R0bGUiLCJ3YXJuIiwiX2RlYm91bmNlIiwiX3Rocm90dGxlIiwiX2NoZWNrQ29tcG9uZW50U2V0dGluZ3MiLCJpbml0Iiwic2NyaXB0TWl4aW4iLCJ3YWl0IiwiaW1tZWRpYXRlIiwidGltZW91dCIsImNvbnRleHQiLCJhcmdzIiwiYXJndW1lbnRzIiwibGF0ZXIiLCJhcHBseSIsImNhbGxOb3ciLCJzZXRUaW1lb3V0Iiwib3B0aW9ucyIsInJlc3VsdCIsInByZXZpb3VzIiwibGVhZGluZyIsIkRhdGUiLCJub3ciLCJyZW1haW5pbmciLCJ0cmFpbGluZyIsImZldGNoIiwidXJsIiwic3VjY2Vzc0NhbGxiYWNrIiwiZXJyb3JDYWxsYmFjayIsInJlcSIsIlhNTEh0dHBSZXF1ZXN0Iiwib25sb2FkIiwic3RhdHVzIiwicmVzcG9uc2VUZXh0Iiwic3RhdHVzVGV4dCIsIm9wZW4iLCJzZW5kIiwic2V0U3RhdGUiLCJzdGF0ZSIsInZhbHVlIiwiZXJyIiwic2V0U3RhdGVBc3luYyIsImFzeW5jVGFzayIsImFzeW5jQ2FsbGJhY2siLCJwIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJkYXRhIiwidGhlbiIsImNhdGNoIiwibG9nIiwic2V0SHRtbCIsImZpbmRUYXJnZXRJbkVsZW1lbnRzIiwiaHRtbCIsImlubmVySFRNTCIsIl8iLCJleHBvc2VkIiwiZXhwb3NlRnVuY3Rpb25zIiwiY2VsIiwiaXNBcnJheSIsImluZGV4T2YiLCJudW1FeHBvc2VkIiwiaGFzT3duUHJvcGVydHkiLCJDb21wb25lbnQiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7QUFHQSxBQUFPLFNBQVNBLFNBQVQsQ0FBbUJDLEdBQW5CLEVBQXdCOzs7S0FHMUJDLFNBQUosQ0FBY0MsbUJBQWQsR0FBb0MsWUFBVztNQUN4Q0MsS0FBSyxJQUFYO01BQ0tBLEdBQUdDLEtBQUgsSUFBWSxJQUFqQixFQUF3QjtRQUNqQixJQUFJQyxJQUFJLENBQVIsRUFBV0MsVUFBVUgsR0FBR0MsS0FBSCxDQUFTRyxNQUFwQyxFQUE0Q0YsSUFBSUMsT0FBaEQsRUFBeURELEdBQXpELEVBQStEOzs7O1FBSXpELENBQUNHLE9BQU9DLE1BQVAsSUFBaUIsSUFBakIsSUFBeUJELE9BQU9FLENBQVAsSUFBWSxJQUF0QyxLQUNKUCxHQUFHQyxLQUFILENBQVNDLENBQVQsRUFBWU0sSUFBWixDQUFpQkMsS0FBakIsQ0FBdUIsQ0FBdkIsRUFBMEIsQ0FBMUIsTUFBaUMsR0FEbEMsRUFFRTtRQUNFUixLQUFILENBQVNDLENBQVQsRUFBWVEs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
