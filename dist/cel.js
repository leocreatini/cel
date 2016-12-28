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
	this.dependencies = options.dependencies;
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

// src/helpers/initAvailableComponents.js

function initAvailableComponents(namespace) {
  var _route = '';
  var action = 'init';
  var dataActionAttr = 'data-action';
  var dotRegex = /\./;

  var setRoute = function setRoute(routeString) {
    _route = routeString;
  };

  var getRoute = function getRoute() {
    return _route;
  };

  var locateRoutableElementsInDOM = function locateRoutableElementsInDOM(attribute) {
    var matchingElements = [];
    var allElements = document.getElementsByTagName('*');

    for (var i = 0, numElems = allElements.length; i < numElems; i = i + 1) {
      // Element exists with attribute. Add to array.
      if (allElements[i].getAttribute(attribute) !== null) {
        matchingElements.push(allElements[i]);
      }
    } // for

    return matchingElements;
  };

  var executeRouteForElement = function executeRouteForElement(element) {
    var route = getRoute();

    if (route !== '') {
      // The route is using dot notation.
      if (dotRegex.test(route)) {
        var latestIndex = namespace;
        route.split('.').map(function (item, i) {
          latestIndex = latestIndex[item];
        });
        latestIndex[action](element);
      } // if dotRegex

      // The component should be in the first hierarchy,
      // like "APP.componentName"
      else if (namespace[route] && typeof namespace[route][action] === 'function') {
          namespace[route][action](element);
        } // else if
    } // if route
  };

  var init = function init() {
    var routes = locateRoutableElementsInDOM(dataActionAttr);

    for (var i = 0, numRoutes = routes.length; i < numRoutes; i++) {
      var element = routes[i];
      setRoute(element.getAttribute(dataActionAttr));
      executeRouteForElement(element);
    } // for
  };

  init();
}

// src/core/cel.js
var Cel$1 = function Cel(options) {

	// Make component.
	if (options != null) {
		var cel = new Cel$3(options);
		// Exposes specified functions for public use.
		return exposeFunctions(cel);
	}

	// Initialize components
	else if (options == null) {
			return {
				init: initAvailableComponents
			};
		}

		// Warn of bad config.
		else {
				console.warn('There was bad configurations with a Cel component. You must pass options for a cel component, or "null" and a namespace object for parameters to initialize components.');
			}
};

// src/index.js

return Cel$1;

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2luaXRNaXhpbi5qcyIsIi4uL3NyYy9jb3JlL3NjcmlwdE1peGluLmpzIiwiLi4vc3JjL2NvcmUvY29tcG9uZW50LmpzIiwiLi4vc3JjL2hlbHBlcnMvZXhwb3NlRnVuY3Rpb25zLmpzIiwiLi4vc3JjL2hlbHBlcnMvaW5pdEF2YWlsYWJsZUNvbXBvbmVudHMuanMiLCIuLi9zcmMvY29yZS9jZWwuanMiLCIuLi9zcmMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gc3JjL2NvcmUvaW5pdE1peGluLmpzXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRNaXhpbihDZWwpIHtcblx0Ly8gRmluZHMgZWxlbWVudHMgdmlhIGl0cyBzZWxlY3RvciBhbmQgY2FjaGVzIHRoZW0gdW5kZXIgdGhlICdlbGVtJyBwcm9wZXJ0eVxuXHQvLyBvZiB0aGF0IGVsZW1lbnQuXG5cdENlbC5wcm90b3R5cGUuX2dldEVsZW1lbnRzT25Nb3VudCA9IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IHZtID0gdGhpcztcblx0XHRpZiAoIHZtLmVsZW1zICE9IG51bGwgKSB7XG5cdFx0XHRmb3IgKCB2YXIgaSA9IDAsIG51bUVsZW0gPSB2bS5lbGVtcy5sZW5ndGg7IGkgPCBudW1FbGVtOyBpKysgKSB7XG5cblx0XHRcdFx0Ly8gSWYgalF1ZXJ5IGlzIGF2YWlsYWJsZSBhbmQgdXNpbmcgdGhlICckZWxlbU5hbWUnIGNvbnZlbnRpb24sXG5cdFx0XHRcdC8vIFJldHVybiBhIGpRdWVyeSBvYmplY3QuXG5cdFx0XHRcdGlmICggKHdpbmRvdy5qUXVlcnkgIT0gbnVsbCB8fCB3aW5kb3cuJCAhPSBudWxsKSAmJlxuXHRcdFx0XHRcdHZtLmVsZW1zW2ldLm5hbWUuc2xpY2UoMCwgMSkgPT09ICckJ1xuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHR2bS5lbGVtc1tpXS5lbGVtID0gJCggdm0uZWxlbXNbaV0uc2VsZWN0b3IgKTtcblx0XHRcdFx0XHR2bS5lbGVtc1tpXS50eXBlID0gJ2pxdWVyeSc7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBFbHNlLCBqdXN0IHVzZSB2YW5pbGxhIGphdmFzY3JpcHQgRE9NIG5vZGUuXG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHZtLmVsZW1zW2ldLmVsZW0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCB2bS5lbGVtc1tpXS5zZWxlY3RvciApO1xuXHRcdFx0XHRcdHZtLmVsZW1zW2ldLnR5cGUgPSAnZWxlbWVudCc7XG5cdFx0XHRcdH1cblx0XHRcdH0gLy8gZm9yXG5cdFx0fSAvLyBpZlxuXHR9O1xuXG5cdC8vIEJpbmRzIHRoZSBjb21wb25lbnQncyBcInRoaXNcIiB0byB0aGUgbWV0aG9kcy5cblx0Ly8gVGhpcyBpcyBkb25lIHRvIGJlIGFibGUgdG8gY2FsbCAndGhpcy5tZXRob2RzLmZ1bmN0aW9uTmFtZSgpJyBmcm9tIG90aGVyXG5cdC8vIG1ldGhvZHMgYW5kIGhhbmRsZXJzLlxuXHRDZWwucHJvdG90eXBlLl9iaW5kVGhpc1RvTWV0aG9kcyA9IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IHZtID0gdGhpcztcblx0XHR2YXIgbWV0aG9kcyA9IE9iamVjdC5rZXlzKHZtLm1ldGhvZHMpO1xuXHRcdHZhciBudW1NZXRob2RzID0gbWV0aG9kcy5sZW5ndGg7XG5cdFx0aWYgKCBudW1NZXRob2RzID4gMCApIHtcblx0XHRcdGZvciAoXG5cdFx0XHRcdHZhciBpID0gMDtcblx0XHRcdFx0aSA8IG51bU1ldGhvZHM7XG5cdFx0XHRcdGkgPSBpKzFcblx0XHRcdCkge1xuXHRcdFx0XHR2bS5tZXRob2RzWyBtZXRob2RzW2ldIF0gPSB2bS5tZXRob2RzWyBtZXRob2RzW2ldIF0uYmluZCh2bSk7XG5cdFx0XHR9IC8vIGZvclxuXHRcdH0gLy8gaWZcblx0fTtcblxuXHQvLyBBZGRzIGV2ZW50LWxpc3RlbmVycyB0byB0YXJnZXQgZWxlbWVudHMgd2hlbiBjb21wb25lbnQgaW5pdGlhbGl6ZXMuXG5cdENlbC5wcm90b3R5cGUuX2JpbmRFdmVudHNPbk1vdW50ID0gZnVuY3Rpb24oKSB7XG5cdFx0Y29uc3Qgdm0gPSB0aGlzO1xuXHRcdC8vIEVuc3VyZSBldmVudHMgYXJlbid0IGVtcHR5XG5cdFx0aWYgKCB2bS5ldmVudHMgIT0gbnVsbCApIHtcblx0XHRcdHZhciBudW1FdmVudHMgPSB2bS5ldmVudHMubGVuZ3RoO1xuXG5cdFx0XHQvLyBFbnN1cmUgZWxlbWVudHMgYXJlbid0IGVtcHR5IGFuZCB0aGVyZSdzIGF0IGxlYXN0IG9uIGV2ZW50LlxuXHRcdFx0aWYgKCB2bS5lbGVtcyAhPSBudWxsICYmIG51bUV2ZW50cyA+IDApIHtcblxuXHRcdFx0XHQvLyBGaWx0ZXJzIG91dCBhbiBlbGVtZW50IHRoYXQgbWF0Y2hlcyB0aGUgZXZlbnQncyB0YXJnZXQuXG5cdFx0XHRcdHZhciBmaW5kRXZlbnRUYXJnZXRJbkVsZW1lbnRzID0gZnVuY3Rpb24oIGVsSW5kZXgsIGl0ZW0sIGluZGV4ICkge1xuXHRcdFx0XHRcdHJldHVybiBpdGVtLm5hbWUgPT09IHZtLmV2ZW50c1sgZWxJbmRleCBdLnRhcmdldDtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQvLyBCaW5kcyBlYWNoIGV2ZW50IHRvIGl0cyBkZXNpZ25hdGVkIHRhcmdldFxuXHRcdFx0XHQvLyBBbmQgYWRkIGRlYm91bmNlIG9yIHRocm90dGxpbmcgaWYgcmVxdWVzdGVkLlxuXHRcdFx0XHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBudW1FdmVudHM7IGkrKyApIHtcblx0XHRcdFx0XHR2YXIgdGFyZ2V0ID0gdm0uZWxlbXMuZmlsdGVyKFxuXHRcdFx0XHRcdFx0ZmluZEV2ZW50VGFyZ2V0SW5FbGVtZW50cy5iaW5kKHZtLCBpKVxuXHRcdFx0XHRcdClbMF07XG5cdFx0XHRcdFx0dmFyIGJpbmRUeXBlID0gKCB0YXJnZXQudHlwZSA9PT0gJ2pxdWVyeScgKVxuXHRcdFx0XHRcdFx0PyAnb24nXG5cdFx0XHRcdFx0XHQ6ICdhZGRFdmVudExpc3RlbmVyJztcblx0XHRcdFx0XHR2YXIgZnVuYyA9IHZtLmhhbmRsZXJzWyB2bS5ldmVudHNbaV0uaGFuZGxlciBdLmJpbmQodm0pXG5cblx0XHRcdFx0XHQvLyBQcmV2ZW50IHVzaW5nIERlYm91bmNlIGFuZCBUaHJvdHRsZSBmb3Igc2FtZSBldmVudC5cblx0XHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0XHR2bS5ldmVudHNbaV0uZGVib3VuY2UgIT0gbnVsbCAmJlxuXHRcdFx0XHRcdFx0dHlwZW9mIHZtLmV2ZW50c1tpXS5kZWJvdW5jZSA9PT0gJ251bWJlcicgJiZcblx0XHRcdFx0XHRcdHZtLmV2ZW50c1tpXS50aHJvdHRsZSAhPSBudWxsICYmXG5cdFx0XHRcdFx0XHR0eXBlb2Ygdm0uZXZlbnRzW2ldLnRocm90dGxlID09PSAnbnVtYmVyJ1xuXHRcdFx0XHRcdCkge1xuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdbJyt2bS5uYW1lKyddOiBDYW5ub3Qgc2V0IGJvdGggXFwnZGVib3VuY2VcXCcgYW5kIFxcJ3Rocm90dGxlXFwnIGNvbmZpZ3VyYXRpb25zIG9uIHRoZSBzYW1lIGV2ZW50LiBQbGVhc2UgdXNlIG9ubHkgb25lLicpO1xuXHRcdFx0XHRcdH0gLy8gaWZcblxuXHRcdFx0XHRcdC8vIEFkZCBkZWJvdW5jaW5nIHRvIGZ1bmN0aW9uIGlmIHNldHRpbmcgaXMgY29ycmVjdC5cblx0XHRcdFx0XHRlbHNlIGlmICggdm0uZXZlbnRzW2ldLmRlYm91bmNlICE9IG51bGwgKSB7XG5cdFx0XHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0XHRcdHR5cGVvZiB2bS5ldmVudHNbaV0uZGVib3VuY2UgPT09ICdudW1iZXInICYmXG5cdFx0XHRcdFx0XHRcdHZtLmV2ZW50c1tpXS5kZWJvdW5jZSA+IDBcblx0XHRcdFx0XHRcdCkgeyAvLyBTZXR0aW5nIGlzIGNvcnJlY3QsIGFkZGluZyBkZWJvdW5jaW5nLlxuXHRcdFx0XHRcdFx0XHRmdW5jID0gdm0uX2RlYm91bmNlKCBmdW5jLCB2bS5ldmVudHNbaV0uZGVib3VuY2UgKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUud2FybignWycrdm0ubmFtZSsnXTogRW5zdXJlIHlvdXIgXFwnZGVib3VuY2VcXCcgc2V0dGluZyBpcyBhIG51bWJlciBncmVhdGVyIHRoYW4gMC4nKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IC8vIGVsc2UgaWZcblxuXHRcdFx0XHRcdC8vIEFkZCB0aHJvdHRsaW5nIHRvIGZ1bmN0aW9uIGlmIHNldHRpbmcgaXMgY29ycmVjdC5cblx0XHRcdFx0XHRlbHNlIGlmICggdm0uZXZlbnRzW2ldLnRocm90dGxlICE9IG51bGwgKSB7XG5cdFx0XHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0XHRcdHR5cGVvZiB2bS5ldmVudHNbaV0udGhyb3R0bGUgPT09ICdudW1iZXInICYmXG5cdFx0XHRcdFx0XHRcdHZtLmV2ZW50c1tpXS50aHJvdHRsZSA+IDBcblx0XHRcdFx0XHRcdCkgeyAvLyBTZXR0aW5nIGlzIGNvcnJlY3QsIGFkZGluZyB0aHJvdHRsaW5nLlxuXHRcdFx0XHRcdFx0XHRmdW5jID0gdm0uX3Rocm90dGxlKCBmdW5jLCB2bS5ldmVudHNbaV0udGhyb3R0bGUgKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUud2FybignWycrdm0ubmFtZSsnXTogRW5zdXJlIHlvdXIgXFwndGhyb3R0bGVcXCcgc2V0dGluZyBpcyBhIG51bWJlciBncmVhdGVyIHRoYW4gMC4nKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IC8vIGVsc2UgaWZcblxuXHRcdFx0XHRcdC8vIEJpbmRpbmcgY2FsbGJhY2sgZXZlbnQgdG8gdGFyZ2V0LlxuXHRcdFx0XHRcdHRhcmdldC5lbGVtWyBiaW5kVHlwZSBdKFxuXHRcdFx0XHRcdFx0dm0uZXZlbnRzWyBpIF0udHlwZSxcblx0XHRcdFx0XHRcdGZ1bmNcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9IC8vIGZvciBudW1FdmVudHNcblx0XHRcdH0gLy8gaWYgZWxlbXMubGVuZ3RoXG5cdFx0fSAvLyBpZiB2bS5ldmVudHNcblx0fTtcblxuXHQvLyBFbnN1cmluZyB0aGUgc2V0dGluZ3MgYXJlIGNvcnJlY3QuXG5cdENlbC5wcm90b3R5cGUuX2NoZWNrQ29tcG9uZW50U2V0dGluZ3MgPSBmdW5jdGlvbigpIHtcblx0XHRjb25zdCB2bSA9IHRoaXM7XG5cdFx0aWYgKFxuXHRcdFx0dm0ubmFtZSA9PT0gbnVsbCB8fFxuXHRcdFx0dm0ubmFtZSA9PT0gJycgfHxcblx0XHRcdHZtLm5hbWUgPT09ICdOYW1lbGVzc0NvbXBvbmVudCdcblx0XHQpIHtcblx0XHRcdGNvbnNvbGUud2FybignUGxlYXNlIGVuc3VyZSB0aGF0IHlvdSBuYW1lZCBhbGwgeW91ciBjb21wb25lbnRzIHdpdGggYSBcXCduYW1lXFwnIHByb3BlcnR5LiBBdCBsZWFzdCBvbmUgaXMgbWlzc2luZyByaWdodCBub3cuJyk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gUHVibGljYWxseSBhY2Nlc3NpYmxlIGluaXRpYWxpemUgZnVuY3Rpb24gdG8gYm9vdHN0cmFwIHRoZSBjb21wb25lbnQuXG5cdENlbC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IHZtID0gdGhpcztcblx0XHR2bS5fY2hlY2tDb21wb25lbnRTZXR0aW5ncygpO1xuXHRcdHZtLl9nZXRFbGVtZW50c09uTW91bnQoKTtcblx0XHR2bS5fYmluZFRoaXNUb01ldGhvZHMoKTtcblx0XHR2bS5fYmluZEV2ZW50c09uTW91bnQoKTtcblx0fTtcblxufTtcbiIsIi8vIHNyYy9jb3JlL3NjcmlwdE1peGluLmpzXG5cblxuZXhwb3J0IGZ1bmN0aW9uIHNjcmlwdE1peGluKENlbCkge1xuXG5cdC8vIEZyb20gVW5kZXJzY29yZSBsaWJyYXJ5XG5cdENlbC5wcm90b3R5cGUuX2RlYm91bmNlID0gZnVuY3Rpb24oIGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSApIHtcblx0XHRsZXQgdGltZW91dDtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRsZXQgY29udGV4dCA9IHRoaXM7XG5cdFx0XHRsZXQgYXJncyA9IGFyZ3VtZW50cztcblx0XHRcdGxldCBsYXRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aW1lb3V0ID0gbnVsbDtcblx0XHRcdFx0aWYgKCFpbW1lZGlhdGUpIHtcblx0XHRcdFx0XHRmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdFx0bGV0IGNhbGxOb3cgPSAoaW1tZWRpYXRlICYmICF0aW1lb3V0KTtcblx0XHRcdGNsZWFyVGltZW91dCggdGltZW91dCApO1xuXHRcdFx0dGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuXHRcdFx0aWYgKGNhbGxOb3cpIHtcblx0XHRcdFx0ZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9O1xuXG5cblx0Ly8gRnJvbSBVbmRlcnNjb3JlIGxpYnJhcnlcblx0Q2VsLnByb3RvdHlwZS5fdGhyb3R0bGUgPSBmdW5jdGlvbiggZnVuYywgd2FpdCwgb3B0aW9ucyApIHtcblx0XHRsZXQgY29udGV4dCwgYXJncywgcmVzdWx0O1xuXHRcdGxldCB0aW1lb3V0ID0gbnVsbDtcblx0XHRsZXQgcHJldmlvdXMgPSAwO1xuXHRcdGlmICggIW9wdGlvbnMgKSB7XG5cdFx0XHRvcHRpb25zID0ge307XG5cdFx0fVxuXHRcdGxldCBsYXRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cHJldmlvdXMgPSBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlID8gMCA6IERhdGUubm93KCk7XG5cdFx0XHR0aW1lb3V0ID0gbnVsbDtcblx0XHRcdHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdFx0XHRpZiAoICF0aW1lb3V0ICkge1xuXHRcdFx0XHRjb250ZXh0ID0gYXJncyA9IG51bGw7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRsZXQgbm93ID0gRGF0ZS5ub3coKTtcblx0XHRcdGlmICggIXByZXZpb3VzICYmIG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UgKSB7XG5cdFx0XHRcdHByZXZpb3VzID0gbm93O1xuXHRcdFx0fVxuXHRcdFx0bGV0IHJlbWFpbmluZyA9IHdhaXQgLSAobm93IC0gcHJldmlvdXMpO1xuXHRcdFx0Y29udGV4dCA9IHRoaXM7XG5cdFx0XHRhcmdzID0gYXJndW1lbnRzO1xuXHRcdFx0aWYgKCByZW1haW5pbmcgPD0gMCB8fCByZW1haW5pbmcgPiB3YWl0ICkge1xuXHRcdFx0XHRpZiAodGltZW91dCkge1xuXHRcdFx0XHRcdGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblx0XHRcdFx0XHR0aW1lb3V0ID0gbnVsbDtcblx0XHRcdFx0fVxuXHRcdFx0XHRwcmV2aW91cyA9IG5vdztcblx0XHRcdFx0cmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0XHRcdFx0aWYgKCAhdGltZW91dCApIHtcblx0XHRcdFx0XHRjb250ZXh0ID0gYXJncyA9IG51bGw7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoICF0aW1lb3V0ICYmIG9wdGlvbnMudHJhaWxpbmcgIT09IGZhbHNlICkge1xuXHRcdFx0XHR0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgcmVtYWluaW5nKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fTtcblx0fTtcblxuXHRDZWwucHJvdG90eXBlLmZldGNoID0gZnVuY3Rpb24oIHVybCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrICkge1xuXHRcdFx0dmFyIHJlcTtcblx0XHRcdHJlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXHRcdFx0cmVxLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQoIHJlcS5zdGF0dXMgPT09IDIwMCApXG5cdFx0XHRcdFx0PyBzdWNjZXNzQ2FsbGJhY2soIHJlcS5yZXNwb25zZVRleHQgKVxuXHRcdFx0XHRcdDogZXJyb3JDYWxsYmFjayggcmVxLnN0YXR1c1RleHQgKTtcblx0XHRcdH1cblx0XHRcdHJlcS5vcGVuKCdHRVQnLCB1cmwsIHRydWUpO1xuXHRcdFx0cmVxLnNlbmQoKTtcblx0fTtcblxuXG5cdC8vIFNldCBzdGF0ZSBzeW5jaHJvbm91c2x5LlxuXHRDZWwucHJvdG90eXBlLnNldFN0YXRlID0gZnVuY3Rpb24oIHN0YXRlLCB2YWx1ZSApIHtcblx0XHRjb25zdCB2bSA9IHRoaXM7XG5cdFx0dHJ5IHtcblx0XHRcdHZtLnN0YXRlWyBzdGF0ZSBdID0gdmFsdWU7XG5cdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ1snK3ZtLm5hbWUrJ106IENvdWxkIG5vdCBzZXQgdmFsdWUgb2YgXCInK3N0YXRlKydcIiwgbWFrZSBzdXJlIGl0IGV4aXN0cyBpbiB5b3VyIGNvbXBvbmVudCBjb25maWcuJywgZXJyKTtcblx0XHR9XG5cdH07XG5cblxuXHQvLyBTZXQgc3RhdGUgYXN5bmNocm9ub3VzbHkuXG5cdENlbC5wcm90b3R5cGUuc2V0U3RhdGVBc3luYyA9IGZ1bmN0aW9uKCBzdGF0ZSwgYXN5bmNUYXNrLCBhc3luY0NhbGxiYWNrICkge1xuXHRcdGNvbnN0IHZtID0gdGhpcztcblxuXHRcdC8vIENyZWF0ZSBwcm9taXNlLlxuXHRcdHZhciBwID0gbmV3IFByb21pc2UoZnVuY3Rpb24oIHJlc29sdmUsIHJlamVjdCApIHtcblx0XHRcdGFzeW5jVGFzayhcblx0XHRcdFx0ZnVuY3Rpb24oZGF0YSkgeyByZXNvbHZlKCBkYXRhICk7IH0sXG5cdFx0XHRcdGZ1bmN0aW9uKGVycikgeyByZWplY3QoIGVyciApOyB9XG5cdFx0XHQpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gV2hlbiBwcm9taXNlIHN1Y2NlZWRzLlxuXHRcdHAudGhlbihmdW5jdGlvbiggZGF0YSApIHtcblx0XHRcdHZtLnNldFN0YXRlKCBzdGF0ZSwgZGF0YSk7XG5cblx0XHRcdGlmICggLy8gUGFzcyBkYXRhIHRvIGNhbGxiYWNrIGlmIGl0IGV4aXN0cyBhbmQgaXMgYSBmdW5jdGlvbi5cblx0XHRcdFx0YXN5bmNDYWxsYmFjayAhPSBudWxsICYmXG5cdFx0XHQgXHR0eXBlb2YgYXN5bmNDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJ1xuXHRcdFx0KSB7XG5cdFx0XHRcdGFzeW5jQ2FsbGJhY2soIGRhdGEgKTtcblx0XHRcdH1cblxuXHRcdH0pO1xuXG5cdFx0Ly8gV2hlbiBwcm9taXNlIGZhaWxzLlxuXHRcdHAuY2F0Y2goZnVuY3Rpb24oIGVyciApIHtcblx0XHRcdGNvbnNvbGUubG9nKCdbJyt2bS5uYW1lKyddOiBFcnJvciBzZXR0aW5nIHN0YXRlIG9mICcrc3RhdGUrJyBhc3luY2hyb25vdXNseScsIGVycik7XG5cdFx0fSk7XG5cblx0fTtcblxuXG5cdENlbC5wcm90b3R5cGUuc2V0SHRtbCA9IGZ1bmN0aW9uKCBlbGVtLCB2YWx1ZSApIHtcblx0XHRjb25zdCB2bSA9IHRoaXM7XG5cblx0XHQvLyBGaWx0ZXJzIG91dCBhbiBlbGVtZW50IHRoYXQgbWF0Y2hlcyB0aGUgZXZlbnQncyB0YXJnZXQuXG5cdFx0dmFyIGZpbmRUYXJnZXRJbkVsZW1lbnRzID0gZnVuY3Rpb24oIGl0ZW0sIGluZGV4ICkge1xuXHRcdFx0cmV0dXJuIGl0ZW0ubmFtZSA9PT0gZWxlbTtcblx0XHR9O1xuXG5cdFx0dmFyIHRhcmdldCA9IHZtLmVsZW1zLmZpbHRlciggZmluZFRhcmdldEluRWxlbWVudHMuYmluZCh2bSkgKVswXTtcblx0XHRpZiAoIHRhcmdldC50eXBlID09PSAnanF1ZXJ5JyApIHtcblx0XHRcdHRhcmdldC5lbGVtLmh0bWwoIHZhbHVlICk7XG5cdFx0fSBlbHNlIGlmICggdGFyZ2V0LnR5cGUgPT09ICdlbGVtZW50Jykge1xuXHRcdFx0dGFyZ2V0LmVsZW0uaW5uZXJIVE1MID0gdmFsdWU7XG5cdFx0fVxuXHR9O1xuXG59O1xuXG5cblxuLy8gLy8gRWxzZSBpZiBpdCdzIGFzeW5jaHJvbm91cywgY2hlY2sgdGhhdCBpdCBjYW4gYmUgdGhyb3duIGludG8gYSBQcm9taXNlLlxuLy8gaWYgKFxuLy8gXHQoYXN5bmNDYWxsYmFjayB8fCBhc3luY0NhbGxiYWNrID09PSAnZnVuY3Rpb24nKSAmJlxuLy8gXHR0eXBlb2YgcHJvbWlzYWJsZSA9PT0gJ2Z1bmN0aW9uJ1xuLy8gKSB7XG4vL1xuLy8gXHQvLyBFbnN1cmUgYSBQcm9taXNlIGxpYnJhcnkgZXhpc3RzLlxuLy8gXHRpZiAoIHdpbmRvdy5Qcm9taXNlICE9IG51bGwgKSB7XG4vL1xuLy8gXHRcdHZhciBwcm9taXNlID0gbmV3IHdpbmRvdy5Qcm9taXNlKCBmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbi8vIFx0XHRcdGNvbnNvbGUubG9nKCdTZXR0aW5nIHVwIHByb21pc2UnKTtcbi8vIFx0XHRcdHRyeSB7XG4vLyBcdFx0XHRcdHJlc29sdmUoIHByb21pc2FibGUoKSApO1xuLy8gXHRcdFx0fSBjYXRjaCggZXJyICkge1xuLy8gXHRcdFx0XHRyZWplY3QoIGVyciApO1xuLy8gXHRcdFx0fVxuLy8gXHRcdH0pO1xuLy9cbi8vIFx0XHRwcm9taXNlXG4vLyBcdFx0XHQudGhlbihmdW5jdGlvbiggZGF0YSApIHtcbi8vIFx0XHRcdFx0Y29uc29sZS5sb2coJ1J1bm5pbmcgXCJ0aGVuXCIgZnVuY3Rpb24gd2l0aC4uLicsIGRhdGEpO1xuLy8gXHRcdFx0XHR2bS5zdGF0ZVsgcHJvcCBdID0gZGF0YTtcbi8vIFx0XHRcdFx0YXN5bmNDYWxsYmFjayggZGF0YSApO1xuLy8gXHRcdFx0fSlcbi8vXG4vLyBcdFx0XHQuY2F0Y2goZnVuY3Rpb24oIHJlYXNvbiApIHtcbi8vIFx0XHRcdFx0Y29uc29sZS5sb2coJ1snK3ZtLm5hbWUrJ106IEFzeW5jIHNldFN0YXRlKCkgaGFkIGFuIGVycm9yLCcsIHJlYXNvbik7XG4vLyBcdFx0XHR9KTtcbi8vXG4vL1xuLy8gXHR9IGVsc2Uge1xuLy8gXHRcdGNvbnNvbGUud2FybignWycrdm0ubmFtZSsnXTogVGhpcyBjb21wb25lbnQgaXMgdHJ5aW5nIHRvIHVzZSBhbiBhc3luYyBzZXRTdGF0ZSgpIGJ1dCBoYXMgbm8gXFwnUHJvbWlzZVxcJyBsaWJyYXJ5LiBQbGVhc2UgaW5jbHVkZSBhIHBvbHlmaWxsLicpXG4vLyBcdH0gLy8gZWxzZVxuLy9cbi8vIH0gLy8gaWZcbiIsIi8vIHNyYy9jb3JlL2NvbXBvbmVudC5qc1xuaW1wb3J0IHsgaW5pdE1peGluIH0gZnJvbSAnLi9pbml0TWl4aW4nO1xuaW1wb3J0IHsgc2NyaXB0TWl4aW4gfSBmcm9tICcuL3NjcmlwdE1peGluJztcblxuXG5mdW5jdGlvbiBDZWwoIG9wdGlvbnMgKSB7XG5cdHRoaXMubmFtZSA9IG9wdGlvbnMubmFtZSB8fCAnTmFtZWxlc3NDb21wb25lbnQnO1xuXHR0aGlzLmRlcGVuZGVuY2llcyA9IG9wdGlvbnMuZGVwZW5kZW5jaWVzO1xuXHR0aGlzLl8gPSBvcHRpb25zLl87XG5cdHRoaXMuc3RhdGUgPSBvcHRpb25zLnN0YXRlO1xuXHR0aGlzLmVsZW1zID0gb3B0aW9ucy5lbGVtcztcblx0dGhpcy5tZXRob2RzID0gb3B0aW9ucy5tZXRob2RzO1xuXHR0aGlzLmhhbmRsZXJzID0gb3B0aW9ucy5oYW5kbGVycztcblx0dGhpcy5ldmVudHMgPSBvcHRpb25zLmV2ZW50cztcblx0dGhpcy5leHBvc2VkID0gb3B0aW9ucy5leHBvc2VkO1xufVxuXG5pbml0TWl4aW4oIENlbCApO1xuc2NyaXB0TWl4aW4oIENlbCApO1xuXG5cbmV4cG9ydCBkZWZhdWx0IENlbDtcbiIsIi8vIHNyYy9oZWxwZXJzL2V4cG9zZUZ1bmN0aW9ucy5qc1xuXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGV4cG9zZUZ1bmN0aW9ucyggY2VsICkge1xuXHR2YXIgZXhwb3NlZCA9IHtcblx0XHRpbml0OiBjZWwuaW5pdC5iaW5kKGNlbClcblx0fTtcblxuXHQvLyBOdWxsLWNoZWNrIGZvciBleHBvc2VkIGZ1bmN0aW9uc1xuXHRpZiAoIGNlbC5leHBvc2VkICE9IG51bGwgKSB7XG5cdFx0aWYgKCAvLyBFbnN1cmUgZXhwb3NlZCBpcyBhbiBhcnJheS5cblx0XHRcdEFycmF5LmlzQXJyYXkoIGNlbC5leHBvc2VkICkgJiZcblx0XHRcdGNlbC5leHBvc2VkLmxlbmd0aCA+IDBcblx0XHQpIHtcblx0XHRcdC8vIEVuc3VyZSB1c2VyIGRpZCBub3QgdHJ5IHRvIHBhc3MgJ2luaXQnIGluIHRoZSBleHBvc2VkIGxpc3QuXG5cdFx0XHQvLyBTaGUvaGUgc2hvdWxkIHVzZSBhIGRpZmZlcmVudCBmdW5jdGlvbiBuYW1lLlxuXHRcdFx0aWYgKCBjZWwuZXhwb3NlZC5pbmRleE9mKCdpbml0JykgPiAwICkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oJ1snK2NlbC5uYW1lKyddOiBUaGUgXFwnaW5pdFxcJyBwcm9wZXJ0eSBpcyBhbHJlYWR5IHRha2VuIGJ5IENlbCwgcGxlYXNlIHVzZSBhIGRpZmZlcmVudCBuYW1lIGZvciB5b3VyIGZ1bmN0aW9uLicpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gQXR0YWNoIGFsbCBleHBvc2VkIGZ1bmN0aW9ucyB0byB0aGUgJ2V4cG9zZWQnIG9iamVjdC5cblx0XHRcdFx0Zm9yIChcblx0XHRcdFx0XHRsZXQgaSA9IDAsIG51bUV4cG9zZWQgPSBjZWwuZXhwb3NlZC5sZW5ndGg7XG5cdFx0XHRcdFx0aSA8IG51bUV4cG9zZWQ7XG5cdFx0XHRcdFx0aSA9IGkgKyAxXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdGlmICggY2VsLm1ldGhvZHMuaGFzT3duUHJvcGVydHkoIGNlbC5leHBvc2VkW2ldICkgKSB7XG5cdFx0XHRcdFx0XHRleHBvc2VkWyBjZWwuZXhwb3NlZFtpXSBdID0gY2VsLm1ldGhvZHNbIGNlbC5leHBvc2VkW2ldIF0uYmluZChjZWwpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ1snK2NlbC5uYW1lKyddOiBQbGVhc2UgZW5zdXJlIHRoZSBcXCdleHBvc2VkXFwnIHByb3BlcnR5IGlzIGFuIGFycmF5IG9mIHN0cmluZ3MuJyk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGV4cG9zZWQ7XG59IiwiLy8gc3JjL2hlbHBlcnMvaW5pdEF2YWlsYWJsZUNvbXBvbmVudHMuanNcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5pdEF2YWlsYWJsZUNvbXBvbmVudHMoIG5hbWVzcGFjZSApIHtcbiAgdmFyIF9yb3V0ZSA9ICcnO1xuICB2YXIgYWN0aW9uID0gJ2luaXQnO1xuICB2YXIgZGF0YUFjdGlvbkF0dHIgPSAnZGF0YS1hY3Rpb24nO1xuICB2YXIgZG90UmVnZXggPSAvXFwuLztcblxuICB2YXIgc2V0Um91dGUgPSBmdW5jdGlvbiggcm91dGVTdHJpbmcgKSB7XG4gICAgICBfcm91dGUgPSByb3V0ZVN0cmluZztcbiAgfTtcblxuICB2YXIgZ2V0Um91dGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gX3JvdXRlO1xuICB9O1xuXG4gIHZhciBsb2NhdGVSb3V0YWJsZUVsZW1lbnRzSW5ET00gPSBmdW5jdGlvbiggYXR0cmlidXRlICkge1xuICAgICAgdmFyIG1hdGNoaW5nRWxlbWVudHMgPSBbXTtcbiAgICAgIHZhciBhbGxFbGVtZW50cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCcqJyk7XG5cbiAgICAgIGZvciAoXG4gICAgICAgIHZhciBpID0gMCxcbiAgICAgICAgbnVtRWxlbXMgPSBhbGxFbGVtZW50cy5sZW5ndGg7XG4gICAgICAgIGkgPCBudW1FbGVtcztcbiAgICAgICAgaSA9IGkgKyAxXG4gICAgICApIHtcbiAgICAgICAgICAvLyBFbGVtZW50IGV4aXN0cyB3aXRoIGF0dHJpYnV0ZS4gQWRkIHRvIGFycmF5LlxuICAgICAgICAgIGlmICggYWxsRWxlbWVudHNbaV0uZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSkgIT09IG51bGwgKSB7XG4gICAgICAgICAgICAgIG1hdGNoaW5nRWxlbWVudHMucHVzaCggYWxsRWxlbWVudHNbaV0gKTtcbiAgICAgICAgICB9XG4gICAgICB9IC8vIGZvclxuXG4gICAgICByZXR1cm4gbWF0Y2hpbmdFbGVtZW50cztcbiAgfTtcblxuICB2YXIgZXhlY3V0ZVJvdXRlRm9yRWxlbWVudCA9IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuICAgICAgdmFyIHJvdXRlID0gZ2V0Um91dGUoKTtcblxuICAgICAgaWYgKCByb3V0ZSAhPT0gJycgKSB7XG4gICAgICAgIC8vIFRoZSByb3V0ZSBpcyB1c2luZyBkb3Qgbm90YXRpb24uXG4gICAgICAgIGlmICggZG90UmVnZXgudGVzdCggcm91dGUgKSkge1xuICAgICAgICAgIHZhciBsYXRlc3RJbmRleCA9IG5hbWVzcGFjZTtcbiAgICAgICAgICByb3V0ZVxuICAgICAgICAgICAgLnNwbGl0KCcuJylcbiAgICAgICAgICAgIC5tYXAoIGZ1bmN0aW9uKCBpdGVtLCBpICkge1xuICAgICAgICAgICAgICBsYXRlc3RJbmRleCA9IGxhdGVzdEluZGV4WyBpdGVtIF07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICBsYXRlc3RJbmRleFthY3Rpb25dKCBlbGVtZW50ICk7XG4gICAgICAgIH0gLy8gaWYgZG90UmVnZXhcblxuICAgICAgICAvLyBUaGUgY29tcG9uZW50IHNob3VsZCBiZSBpbiB0aGUgZmlyc3QgaGllcmFyY2h5LFxuICAgICAgICAvLyBsaWtlIFwiQVBQLmNvbXBvbmVudE5hbWVcIlxuICAgICAgICBlbHNlIGlmIChcbiAgICAgICAgICBuYW1lc3BhY2Vbcm91dGVdICYmXG4gICAgICAgICAgdHlwZW9mIG5hbWVzcGFjZVtyb3V0ZV1bYWN0aW9uXSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICApIHtcbiAgICAgICAgICBuYW1lc3BhY2Vbcm91dGVdW2FjdGlvbl0oIGVsZW1lbnQgKTtcbiAgICAgICAgfSAvLyBlbHNlIGlmXG5cbiAgICAgIH0gLy8gaWYgcm91dGVcbiAgfTtcblxuICB2YXIgaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJvdXRlcyA9IGxvY2F0ZVJvdXRhYmxlRWxlbWVudHNJbkRPTSggZGF0YUFjdGlvbkF0dHIgKTtcblxuICAgICAgZm9yIChcbiAgICAgICAgdmFyIGkgPSAwLFxuICAgICAgICBudW1Sb3V0ZXMgPSByb3V0ZXMubGVuZ3RoO1xuICAgICAgICBpIDwgbnVtUm91dGVzO1xuICAgICAgICBpKytcbiAgICAgICkge1xuICAgICAgICAgIHZhciBlbGVtZW50ID0gcm91dGVzW2ldO1xuICAgICAgICAgIHNldFJvdXRlKCBlbGVtZW50LmdldEF0dHJpYnV0ZSggZGF0YUFjdGlvbkF0dHIgKSApO1xuICAgICAgICAgIGV4ZWN1dGVSb3V0ZUZvckVsZW1lbnQoIGVsZW1lbnQgKTtcbiAgICAgIH0gLy8gZm9yXG4gIH07XG5cbiAgaW5pdCgpO1xufVxuIiwiLy8gc3JjL2NvcmUvY2VsLmpzXG5pbXBvcnQgQ29tcG9uZW50IGZyb20gJy4vY29tcG9uZW50JztcbmltcG9ydCBleHBvc2VGdW5jdGlvbnMgZnJvbSAnLi4vaGVscGVycy9leHBvc2VGdW5jdGlvbnMnO1xuaW1wb3J0IGluaXRBdmFpbGFibGVDb21wb25lbnRzIGZyb20gJy4uL2hlbHBlcnMvaW5pdEF2YWlsYWJsZUNvbXBvbmVudHMnO1xuXG5cbmNvbnN0IENlbCA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuXG5cdC8vIE1ha2UgY29tcG9uZW50LlxuXHRpZiAoIG9wdGlvbnMgIT0gbnVsbCApIHtcblx0XHRsZXQgY2VsID0gbmV3IENvbXBvbmVudCggb3B0aW9ucyApO1xuXHRcdC8vIEV4cG9zZXMgc3BlY2lmaWVkIGZ1bmN0aW9ucyBmb3IgcHVibGljIHVzZS5cblx0XHRyZXR1cm4gZXhwb3NlRnVuY3Rpb25zKCBjZWwgKTtcblx0fVxuXG5cdC8vIEluaXRpYWxpemUgY29tcG9uZW50c1xuXHRlbHNlIGlmIChcblx0XHRvcHRpb25zID09IG51bGxcblx0KSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGluaXQ6IGluaXRBdmFpbGFibGVDb21wb25lbnRzXG5cdFx0fTtcblx0fVxuXG5cdC8vIFdhcm4gb2YgYmFkIGNvbmZpZy5cblx0ZWxzZSB7XG5cdFx0Y29uc29sZS53YXJuKCdUaGVyZSB3YXMgYmFkIGNvbmZpZ3VyYXRpb25zIHdpdGggYSBDZWwgY29tcG9uZW50LiBZb3UgbXVzdCBwYXNzIG9wdGlvbnMgZm9yIGEgY2VsIGNvbXBvbmVudCwgb3IgXCJudWxsXCIgYW5kIGEgbmFtZXNwYWNlIG9iamVjdCBmb3IgcGFyYW1ldGVycyB0byBpbml0aWFsaXplIGNvbXBvbmVudHMuJyk7XG5cdH1cblxufTtcblxuZXhwb3J0IGRlZmF1bHQgQ2VsO1xuIiwiLy8gc3JjL2luZGV4LmpzXG5pbXBvcnQgQ2VsIGZyb20gJy4vY29yZS9jZWwuanMnO1xuXG5cbmV4cG9ydCBkZWZhdWx0IENlbDsiXSwibmFtZXMiOlsiaW5pdE1peGluIiwiQ2VsIiwicHJvdG90eXBlIiwiX2dldEVsZW1lbnRzT25Nb3VudCIsInZtIiwiZWxlbXMiLCJpIiwibnVtRWxlbSIsImxlbmd0aCIsIndpbmRvdyIsImpRdWVyeSIsIiQiLCJuYW1lIiwic2xpY2UiLCJlbGVtIiwic2VsZWN0b3IiLCJ0eXBlIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yIiwiX2JpbmRUaGlzVG9NZXRob2RzIiwibWV0aG9kcyIsIk9iamVjdCIsImtleXMiLCJudW1NZXRob2RzIiwiYmluZCIsIl9iaW5kRXZlbnRzT25Nb3VudCIsImV2ZW50cyIsIm51bUV2ZW50cyIsImZpbmRFdmVudFRhcmdldEluRWxlbWVudHMiLCJlbEluZGV4IiwiaXRlbSIsImluZGV4IiwidGFyZ2V0IiwiZmlsdGVyIiwiYmluZFR5cGUiLCJmdW5jIiwiaGFuZGxlcnMiLCJoYW5kbGVyIiwiZGVib3VuY2UiLCJ0aHJvdHRsZSIsIndhcm4iLCJfZGVib3VuY2UiLCJfdGhyb3R0bGUiLCJfY2hlY2tDb21wb25lbnRTZXR0aW5ncyIsImluaXQiLCJzY3JpcHRNaXhpbiIsIndhaXQiLCJpbW1lZGlhdGUiLCJ0aW1lb3V0IiwiY29udGV4dCIsImFyZ3MiLCJhcmd1bWVudHMiLCJsYXRlciIsImFwcGx5IiwiY2FsbE5vdyIsInNldFRpbWVvdXQiLCJvcHRpb25zIiwicmVzdWx0IiwicHJldmlvdXMiLCJsZWFkaW5nIiwiRGF0ZSIsIm5vdyIsInJlbWFpbmluZyIsInRyYWlsaW5nIiwiZmV0Y2giLCJ1cmwiLCJzdWNjZXNzQ2FsbGJhY2siLCJlcnJvckNhbGxiYWNrIiwicmVxIiwiWE1MSHR0cFJlcXVlc3QiLCJvbmxvYWQiLCJzdGF0dXMiLCJyZXNwb25zZVRleHQiLCJzdGF0dXNUZXh0Iiwib3BlbiIsInNlbmQiLCJzZXRTdGF0ZSIsInN0YXRlIiwidmFsdWUiLCJlcnIiLCJzZXRTdGF0ZUFzeW5jIiwiYXN5bmNUYXNrIiwiYXN5bmNDYWxsYmFjayIsInAiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImRhdGEiLCJ0aGVuIiwiY2F0Y2giLCJsb2ciLCJzZXRIdG1sIiwiZmluZFRhcmdldEluRWxlbWVudHMiLCJodG1sIiwiaW5uZXJIVE1MIiwiZGVwZW5kZW5jaWVzIiwiXyIsImV4cG9zZWQiLCJleHBvc2VGdW5jdGlvbnMiLCJjZWwiLCJpc0FycmF5IiwiaW5kZXhPZiIsIm51bUV4cG9zZWQiLCJoYXNPd25Qcm9wZXJ0eSIsImluaXRBdmFpbGFibGVDb21wb25lbnRzIiwibmFtZXNwYWNlIiwiX3JvdXRlIiwiYWN0aW9uIiwiZGF0YUFjdGlvbkF0dHIiLCJkb3RSZWdleCIsInNldFJvdXRlIiwicm91dGVTdHJpbmciLCJnZXRSb3V0ZSIsImxvY2F0ZVJvdXRhYmxlRWxlbWVudHNJbkRPTSIsImF0dHJpYnV0ZSIsIm1hdGNoaW5nRWxlbWVudHMiLCJhbGxFbGVtZW50cyIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwibnVtRWxlbXMiLCJnZXRBdHRyaWJ1dGUiLCJwdXNoIiwiZXhlY3V0ZVJvdXRlRm9yRWxlbWVudCIsImVsZW1lbnQiLCJyb3V0ZSIsInRlc3QiLCJsYXRlc3RJbmRleCIsInNwbGl0IiwibWFwIiwicm91dGVzIiwibnVtUm91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
