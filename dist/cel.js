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

	// [TODO]: Refactor into smaller parts/mixins.
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

	Cel.prototype.getName = function () {
		return this.name;
	};

	Cel.prototype.__ctx__ = function () {
		return this;
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
	'use strict';

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
		__ctx__: cel.__ctx__.bind(cel),
		init: cel.init.bind(cel),
		getName: cel.getName.bind(cel)
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
				for (var i = 0, numExpo = cel.exposed.length; i < numExpo; i++) {
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
  window.Cel.settings = window.Cel.settings || {};
  window.Cel.settings.namespace = namespace;

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
    var matchingElems = [];
    var allElems = document.getElementsByTagName('*');

    for (var i = 0, numElems = allElems.length; i < numElems; i = i + 1) {
      // Element exists with attribute. Add to array.
      if (allElems[i].getAttribute(attribute) !== null) {
        matchingElems.push(allElems[i]);
      }
    } // for

    return matchingElems;
  };

  var getRouteObject = function getRouteObject(route) {
    var latestIndex = namespace;
    route.split('.').map(function (item, i) {
      latestIndex = latestIndex[item];
    });
    return latestIndex;
  };

  var executeRouteForElement = function executeRouteForElement(element) {
    var route = getRoute();

    if (route !== '') {
      // The route is using dot notation.
      if (dotRegex.test(route)) {
        var routeObj = getRouteObject(route);
        routeObj[action](element);
      } // if dotRegex

      // The component should be in the first hierarchy,
      // like "APP.componentName"
      else if (namespace[route] && typeof namespace[route][action] === 'function') {
          namespace[route][action](element);
        } // else if
    } // if route
  };

  var initDependencies = function initDependencies() {
    // check each instance for dependencies.
    window.Cel.instances.map(function (instance, i) {
      var cel = instance.__ctx__();
      // check if instance has dependencies.
      if (cel.dependencies != null && cel.dependencies.length > 0) {
        // find an instance for each dependency.
        cel.dependencies.map(function (dependency, i) {
          // find matching dependency from instances.
          var dep = window.Cel.instances.filter(function (inst, j) {
            return inst.getName() === dependency;
          })[0];
          // init if it has not yet been init'd.
          if (typeof dep.init === 'function') {
            dep.init(); // init dependency
            // [TODO]: Needs testing to see if it prevents/causes errors
            dep.init = null; // prevent multiple initializations.
          }
          cel.$ = cel.$ || {};
          cel.$[dependency] = dep; // add reference for component
        });
      }
    });
  };

  var init = function init() {
    var routes = locateRoutableElementsInDOM(dataActionAttr);

    // Init components
    for (var i = 0, numRoutes = routes.length; i < numRoutes; i++) {
      var element = routes[i];
      setRoute(element.getAttribute(dataActionAttr));
      executeRouteForElement(element);
    } // for
    initDependencies();
  };

  init();
}

// src/core/cel.js
var Cel$1 = function Cel(options) {
	window.Cel.instances = window.Cel.instances || [];

	// Make component.
	if (options != null) {
		var cel = new Cel$3(options);
		// Exposes specified functions for public use.
		cel = exposeFunctions(cel);
		// Adds cel to list of Cel instances.
		window.Cel.instances.push(cel);
		// Return cel component with exposed functions.
		return cel;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2luaXRNaXhpbi5qcyIsIi4uL3NyYy9jb3JlL3NjcmlwdE1peGluLmpzIiwiLi4vc3JjL2NvcmUvY29tcG9uZW50LmpzIiwiLi4vc3JjL2hlbHBlcnMvZXhwb3NlRnVuY3Rpb25zLmpzIiwiLi4vc3JjL2hlbHBlcnMvaW5pdEF2YWlsYWJsZUNvbXBvbmVudHMuanMiLCIuLi9zcmMvY29yZS9jZWwuanMiLCIuLi9zcmMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gc3JjL2NvcmUvaW5pdE1peGluLmpzXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRNaXhpbihDZWwpIHtcblx0Ly8gRmluZHMgZWxlbWVudHMgdmlhIGl0cyBzZWxlY3RvciBhbmQgY2FjaGVzIHRoZW0gdW5kZXIgdGhlICdlbGVtJyBwcm9wZXJ0eVxuXHQvLyBvZiB0aGF0IGVsZW1lbnQuXG5cdENlbC5wcm90b3R5cGUuX2dldEVsZW1lbnRzT25Nb3VudCA9IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IHZtID0gdGhpcztcblx0XHRpZiAoIHZtLmVsZW1zICE9IG51bGwgKSB7XG5cdFx0XHRmb3IgKCB2YXIgaSA9IDAsIG51bUVsZW0gPSB2bS5lbGVtcy5sZW5ndGg7IGkgPCBudW1FbGVtOyBpKysgKSB7XG5cblx0XHRcdFx0Ly8gSWYgalF1ZXJ5IGlzIGF2YWlsYWJsZSBhbmQgdXNpbmcgdGhlICckZWxlbU5hbWUnIGNvbnZlbnRpb24sXG5cdFx0XHRcdC8vIFJldHVybiBhIGpRdWVyeSBvYmplY3QuXG5cdFx0XHRcdGlmICggKHdpbmRvdy5qUXVlcnkgIT0gbnVsbCB8fCB3aW5kb3cuJCAhPSBudWxsKSAmJlxuXHRcdFx0XHRcdHZtLmVsZW1zW2ldLm5hbWUuc2xpY2UoMCwgMSkgPT09ICckJ1xuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHR2bS5lbGVtc1tpXS5lbGVtID0gJCggdm0uZWxlbXNbaV0uc2VsZWN0b3IgKTtcblx0XHRcdFx0XHR2bS5lbGVtc1tpXS50eXBlID0gJ2pxdWVyeSc7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBFbHNlLCBqdXN0IHVzZSB2YW5pbGxhIGphdmFzY3JpcHQgRE9NIG5vZGUuXG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHZtLmVsZW1zW2ldLmVsZW0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCB2bS5lbGVtc1tpXS5zZWxlY3RvciApO1xuXHRcdFx0XHRcdHZtLmVsZW1zW2ldLnR5cGUgPSAnZWxlbWVudCc7XG5cdFx0XHRcdH1cblx0XHRcdH0gLy8gZm9yXG5cdFx0fSAvLyBpZlxuXHR9O1xuXG5cdC8vIEJpbmRzIHRoZSBjb21wb25lbnQncyBcInRoaXNcIiB0byB0aGUgbWV0aG9kcy5cblx0Ly8gVGhpcyBpcyBkb25lIHRvIGJlIGFibGUgdG8gY2FsbCAndGhpcy5tZXRob2RzLmZ1bmN0aW9uTmFtZSgpJyBmcm9tIG90aGVyXG5cdC8vIG1ldGhvZHMgYW5kIGhhbmRsZXJzLlxuXHRDZWwucHJvdG90eXBlLl9iaW5kVGhpc1RvTWV0aG9kcyA9IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IHZtID0gdGhpcztcblx0XHR2YXIgbWV0aG9kcyA9IE9iamVjdC5rZXlzKHZtLm1ldGhvZHMpO1xuXHRcdHZhciBudW1NZXRob2RzID0gbWV0aG9kcy5sZW5ndGg7XG5cdFx0aWYgKCBudW1NZXRob2RzID4gMCApIHtcblx0XHRcdGZvciAoXG5cdFx0XHRcdHZhciBpID0gMDtcblx0XHRcdFx0aSA8IG51bU1ldGhvZHM7XG5cdFx0XHRcdGkgPSBpKzFcblx0XHRcdCkge1xuXHRcdFx0XHR2bS5tZXRob2RzWyBtZXRob2RzW2ldIF0gPSB2bS5tZXRob2RzWyBtZXRob2RzW2ldIF0uYmluZCh2bSk7XG5cdFx0XHR9IC8vIGZvclxuXHRcdH0gLy8gaWZcblx0fTtcblxuXHQvLyBbVE9ET106IFJlZmFjdG9yIGludG8gc21hbGxlciBwYXJ0cy9taXhpbnMuXG5cdC8vIEFkZHMgZXZlbnQtbGlzdGVuZXJzIHRvIHRhcmdldCBlbGVtZW50cyB3aGVuIGNvbXBvbmVudCBpbml0aWFsaXplcy5cblx0Q2VsLnByb3RvdHlwZS5fYmluZEV2ZW50c09uTW91bnQgPSBmdW5jdGlvbigpIHtcblx0XHRjb25zdCB2bSA9IHRoaXM7XG5cdFx0Ly8gRW5zdXJlIGV2ZW50cyBhcmVuJ3QgZW1wdHlcblx0XHRpZiAoIHZtLmV2ZW50cyAhPSBudWxsICkge1xuXHRcdFx0dmFyIG51bUV2ZW50cyA9IHZtLmV2ZW50cy5sZW5ndGg7XG5cblx0XHRcdC8vIEVuc3VyZSBlbGVtZW50cyBhcmVuJ3QgZW1wdHkgYW5kIHRoZXJlJ3MgYXQgbGVhc3Qgb24gZXZlbnQuXG5cdFx0XHRpZiAoIHZtLmVsZW1zICE9IG51bGwgJiYgbnVtRXZlbnRzID4gMCkge1xuXG5cdFx0XHRcdC8vIEZpbHRlcnMgb3V0IGFuIGVsZW1lbnQgdGhhdCBtYXRjaGVzIHRoZSBldmVudCdzIHRhcmdldC5cblx0XHRcdFx0dmFyIGZpbmRFdmVudFRhcmdldEluRWxlbWVudHMgPSBmdW5jdGlvbiggZWxJbmRleCwgaXRlbSwgaW5kZXggKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGl0ZW0ubmFtZSA9PT0gdm0uZXZlbnRzWyBlbEluZGV4IF0udGFyZ2V0O1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdC8vIEJpbmRzIGVhY2ggZXZlbnQgdG8gaXRzIGRlc2lnbmF0ZWQgdGFyZ2V0XG5cdFx0XHRcdC8vIEFuZCBhZGQgZGVib3VuY2Ugb3IgdGhyb3R0bGluZyBpZiByZXF1ZXN0ZWQuXG5cdFx0XHRcdGZvciAoIHZhciBpID0gMDsgaSA8IG51bUV2ZW50czsgaSsrICkge1xuXHRcdFx0XHRcdHZhciB0YXJnZXQgPSB2bS5lbGVtcy5maWx0ZXIoXG5cdFx0XHRcdFx0XHRmaW5kRXZlbnRUYXJnZXRJbkVsZW1lbnRzLmJpbmQodm0sIGkpXG5cdFx0XHRcdFx0KVswXTtcblx0XHRcdFx0XHR2YXIgYmluZFR5cGUgPSAoIHRhcmdldC50eXBlID09PSAnanF1ZXJ5JyApXG5cdFx0XHRcdFx0XHQ/ICdvbidcblx0XHRcdFx0XHRcdDogJ2FkZEV2ZW50TGlzdGVuZXInO1xuXHRcdFx0XHRcdHZhciBmdW5jID0gdm0uaGFuZGxlcnNbIHZtLmV2ZW50c1tpXS5oYW5kbGVyIF0uYmluZCh2bSlcblxuXHRcdFx0XHRcdC8vIFByZXZlbnQgdXNpbmcgRGVib3VuY2UgYW5kIFRocm90dGxlIGZvciBzYW1lIGV2ZW50LlxuXHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdHZtLmV2ZW50c1tpXS5kZWJvdW5jZSAhPSBudWxsICYmXG5cdFx0XHRcdFx0XHR0eXBlb2Ygdm0uZXZlbnRzW2ldLmRlYm91bmNlID09PSAnbnVtYmVyJyAmJlxuXHRcdFx0XHRcdFx0dm0uZXZlbnRzW2ldLnRocm90dGxlICE9IG51bGwgJiZcblx0XHRcdFx0XHRcdHR5cGVvZiB2bS5ldmVudHNbaV0udGhyb3R0bGUgPT09ICdudW1iZXInXG5cdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ1snK3ZtLm5hbWUrJ106IENhbm5vdCBzZXQgYm90aCBcXCdkZWJvdW5jZVxcJyBhbmQgXFwndGhyb3R0bGVcXCcgY29uZmlndXJhdGlvbnMgb24gdGhlIHNhbWUgZXZlbnQuIFBsZWFzZSB1c2Ugb25seSBvbmUuJyk7XG5cdFx0XHRcdFx0fSAvLyBpZlxuXG5cdFx0XHRcdFx0Ly8gQWRkIGRlYm91bmNpbmcgdG8gZnVuY3Rpb24gaWYgc2V0dGluZyBpcyBjb3JyZWN0LlxuXHRcdFx0XHRcdGVsc2UgaWYgKCB2bS5ldmVudHNbaV0uZGVib3VuY2UgIT0gbnVsbCApIHtcblx0XHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdFx0dHlwZW9mIHZtLmV2ZW50c1tpXS5kZWJvdW5jZSA9PT0gJ251bWJlcicgJiZcblx0XHRcdFx0XHRcdFx0dm0uZXZlbnRzW2ldLmRlYm91bmNlID4gMFxuXHRcdFx0XHRcdFx0KSB7IC8vIFNldHRpbmcgaXMgY29ycmVjdCwgYWRkaW5nIGRlYm91bmNpbmcuXG5cdFx0XHRcdFx0XHRcdGZ1bmMgPSB2bS5fZGVib3VuY2UoIGZ1bmMsIHZtLmV2ZW50c1tpXS5kZWJvdW5jZSApO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdbJyt2bS5uYW1lKyddOiBFbnN1cmUgeW91ciBcXCdkZWJvdW5jZVxcJyBzZXR0aW5nIGlzIGEgbnVtYmVyIGdyZWF0ZXIgdGhhbiAwLicpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gLy8gZWxzZSBpZlxuXG5cdFx0XHRcdFx0Ly8gQWRkIHRocm90dGxpbmcgdG8gZnVuY3Rpb24gaWYgc2V0dGluZyBpcyBjb3JyZWN0LlxuXHRcdFx0XHRcdGVsc2UgaWYgKCB2bS5ldmVudHNbaV0udGhyb3R0bGUgIT0gbnVsbCApIHtcblx0XHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdFx0dHlwZW9mIHZtLmV2ZW50c1tpXS50aHJvdHRsZSA9PT0gJ251bWJlcicgJiZcblx0XHRcdFx0XHRcdFx0dm0uZXZlbnRzW2ldLnRocm90dGxlID4gMFxuXHRcdFx0XHRcdFx0KSB7IC8vIFNldHRpbmcgaXMgY29ycmVjdCwgYWRkaW5nIHRocm90dGxpbmcuXG5cdFx0XHRcdFx0XHRcdGZ1bmMgPSB2bS5fdGhyb3R0bGUoIGZ1bmMsIHZtLmV2ZW50c1tpXS50aHJvdHRsZSApO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdbJyt2bS5uYW1lKyddOiBFbnN1cmUgeW91ciBcXCd0aHJvdHRsZVxcJyBzZXR0aW5nIGlzIGEgbnVtYmVyIGdyZWF0ZXIgdGhhbiAwLicpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gLy8gZWxzZSBpZlxuXG5cdFx0XHRcdFx0Ly8gQmluZGluZyBjYWxsYmFjayBldmVudCB0byB0YXJnZXQuXG5cdFx0XHRcdFx0dGFyZ2V0LmVsZW1bIGJpbmRUeXBlIF0oXG5cdFx0XHRcdFx0XHR2bS5ldmVudHNbIGkgXS50eXBlLFxuXHRcdFx0XHRcdFx0ZnVuY1xuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH0gLy8gZm9yIG51bUV2ZW50c1xuXHRcdFx0fSAvLyBpZiBlbGVtcy5sZW5ndGhcblx0XHR9IC8vIGlmIHZtLmV2ZW50c1xuXHR9O1xuXG5cdC8vIEVuc3VyaW5nIHRoZSBzZXR0aW5ncyBhcmUgY29ycmVjdC5cblx0Q2VsLnByb3RvdHlwZS5fY2hlY2tDb21wb25lbnRTZXR0aW5ncyA9IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IHZtID0gdGhpcztcblx0XHRpZiAoXG5cdFx0XHR2bS5uYW1lID09PSBudWxsIHx8XG5cdFx0XHR2bS5uYW1lID09PSAnJyB8fFxuXHRcdFx0dm0ubmFtZSA9PT0gJ05hbWVsZXNzQ29tcG9uZW50J1xuXHRcdCkge1xuXHRcdFx0Y29uc29sZS53YXJuKCdQbGVhc2UgZW5zdXJlIHRoYXQgeW91IG5hbWVkIGFsbCB5b3VyIGNvbXBvbmVudHMgd2l0aCBhIFxcJ25hbWVcXCcgcHJvcGVydHkuIEF0IGxlYXN0IG9uZSBpcyBtaXNzaW5nIHJpZ2h0IG5vdy4nKTtcblx0XHR9XG5cdH1cblxuXHRDZWwucHJvdG90eXBlLmdldE5hbWUgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5uYW1lO1xuXHR9O1xuXG5cdENlbC5wcm90b3R5cGUuX19jdHhfXyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0Ly8gUHVibGljYWxseSBhY2Nlc3NpYmxlIGluaXRpYWxpemUgZnVuY3Rpb24gdG8gYm9vdHN0cmFwIHRoZSBjb21wb25lbnQuXG5cdENlbC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IHZtID0gdGhpcztcblx0XHR2bS5fY2hlY2tDb21wb25lbnRTZXR0aW5ncygpO1xuXHRcdHZtLl9nZXRFbGVtZW50c09uTW91bnQoKTtcblx0XHR2bS5fYmluZFRoaXNUb01ldGhvZHMoKTtcblx0XHR2bS5fYmluZEV2ZW50c09uTW91bnQoKTtcblx0fTtcblxufTtcbiIsIi8vIHNyYy9jb3JlL3NjcmlwdE1peGluLmpzXG5cblxuZXhwb3J0IGZ1bmN0aW9uIHNjcmlwdE1peGluKENlbCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0Ly8gRnJvbSBVbmRlcnNjb3JlIGxpYnJhcnlcblx0Q2VsLnByb3RvdHlwZS5fZGVib3VuY2UgPSBmdW5jdGlvbiggZnVuYywgd2FpdCwgaW1tZWRpYXRlICkge1xuXHRcdGxldCB0aW1lb3V0O1xuXHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdGxldCBjb250ZXh0ID0gdGhpcztcblx0XHRcdGxldCBhcmdzID0gYXJndW1lbnRzO1xuXHRcdFx0bGV0IGxhdGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHRpbWVvdXQgPSBudWxsO1xuXHRcdFx0XHRpZiAoIWltbWVkaWF0ZSkge1xuXHRcdFx0XHRcdGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0XHRsZXQgY2FsbE5vdyA9IChpbW1lZGlhdGUgJiYgIXRpbWVvdXQpO1xuXHRcdFx0Y2xlYXJUaW1lb3V0KCB0aW1lb3V0ICk7XG5cdFx0XHR0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG5cdFx0XHRpZiAoY2FsbE5vdykge1xuXHRcdFx0XHRmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH07XG5cblxuXHQvLyBGcm9tIFVuZGVyc2NvcmUgbGlicmFyeVxuXHRDZWwucHJvdG90eXBlLl90aHJvdHRsZSA9IGZ1bmN0aW9uKCBmdW5jLCB3YWl0LCBvcHRpb25zICkge1xuXHRcdGxldCBjb250ZXh0LCBhcmdzLCByZXN1bHQ7XG5cdFx0bGV0IHRpbWVvdXQgPSBudWxsO1xuXHRcdGxldCBwcmV2aW91cyA9IDA7XG5cdFx0aWYgKCAhb3B0aW9ucyApIHtcblx0XHRcdG9wdGlvbnMgPSB7fTtcblx0XHR9XG5cdFx0bGV0IGxhdGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRwcmV2aW91cyA9IG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UgPyAwIDogRGF0ZS5ub3coKTtcblx0XHRcdHRpbWVvdXQgPSBudWxsO1xuXHRcdFx0cmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0XHRcdGlmICggIXRpbWVvdXQgKSB7XG5cdFx0XHRcdGNvbnRleHQgPSBhcmdzID0gbnVsbDtcblx0XHRcdH1cblx0XHR9O1xuXHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdGxldCBub3cgPSBEYXRlLm5vdygpO1xuXHRcdFx0aWYgKCAhcHJldmlvdXMgJiYgb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSApIHtcblx0XHRcdFx0cHJldmlvdXMgPSBub3c7XG5cdFx0XHR9XG5cdFx0XHRsZXQgcmVtYWluaW5nID0gd2FpdCAtIChub3cgLSBwcmV2aW91cyk7XG5cdFx0XHRjb250ZXh0ID0gdGhpcztcblx0XHRcdGFyZ3MgPSBhcmd1bWVudHM7XG5cdFx0XHRpZiAoIHJlbWFpbmluZyA8PSAwIHx8IHJlbWFpbmluZyA+IHdhaXQgKSB7XG5cdFx0XHRcdGlmICh0aW1lb3V0KSB7XG5cdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXHRcdFx0XHRcdHRpbWVvdXQgPSBudWxsO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHByZXZpb3VzID0gbm93O1xuXHRcdFx0XHRyZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHRcdFx0XHRpZiAoICF0aW1lb3V0ICkge1xuXHRcdFx0XHRcdGNvbnRleHQgPSBhcmdzID0gbnVsbDtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmICggIXRpbWVvdXQgJiYgb3B0aW9ucy50cmFpbGluZyAhPT0gZmFsc2UgKSB7XG5cdFx0XHRcdHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCByZW1haW5pbmcpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9O1xuXHR9O1xuXG5cdENlbC5wcm90b3R5cGUuZmV0Y2ggPSBmdW5jdGlvbiggdXJsLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2sgKSB7XG5cdFx0XHR2YXIgcmVxO1xuXHRcdFx0cmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cdFx0XHRyZXEub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCggcmVxLnN0YXR1cyA9PT0gMjAwIClcblx0XHRcdFx0XHQ/IHN1Y2Nlc3NDYWxsYmFjayggcmVxLnJlc3BvbnNlVGV4dCApXG5cdFx0XHRcdFx0OiBlcnJvckNhbGxiYWNrKCByZXEuc3RhdHVzVGV4dCApO1xuXHRcdFx0fVxuXHRcdFx0cmVxLm9wZW4oJ0dFVCcsIHVybCwgdHJ1ZSk7XG5cdFx0XHRyZXEuc2VuZCgpO1xuXHR9O1xuXG5cblx0Ly8gU2V0IHN0YXRlIHN5bmNocm9ub3VzbHkuXG5cdENlbC5wcm90b3R5cGUuc2V0U3RhdGUgPSBmdW5jdGlvbiggc3RhdGUsIHZhbHVlICkge1xuXHRcdGNvbnN0IHZtID0gdGhpcztcblx0XHR0cnkge1xuXHRcdFx0dm0uc3RhdGVbIHN0YXRlIF0gPSB2YWx1ZTtcblx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdGNvbnNvbGUud2FybignWycrdm0ubmFtZSsnXTogQ291bGQgbm90IHNldCB2YWx1ZSBvZiBcIicrc3RhdGUrJ1wiLCBtYWtlIHN1cmUgaXQgZXhpc3RzIGluIHlvdXIgY29tcG9uZW50IGNvbmZpZy4nLCBlcnIpO1xuXHRcdH1cblx0fTtcblxuXG5cdC8vIFNldCBzdGF0ZSBhc3luY2hyb25vdXNseS5cblx0Q2VsLnByb3RvdHlwZS5zZXRTdGF0ZUFzeW5jID0gZnVuY3Rpb24oIHN0YXRlLCBhc3luY1Rhc2ssIGFzeW5jQ2FsbGJhY2sgKSB7XG5cdFx0Y29uc3Qgdm0gPSB0aGlzO1xuXG5cdFx0Ly8gQ3JlYXRlIHByb21pc2UuXG5cdFx0dmFyIHAgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiggcmVzb2x2ZSwgcmVqZWN0ICkge1xuXHRcdFx0YXN5bmNUYXNrKFxuXHRcdFx0XHRmdW5jdGlvbiggZGF0YSApIHsgcmVzb2x2ZSggZGF0YSApOyB9LFxuXHRcdFx0XHRmdW5jdGlvbiggZXJyICkgeyByZWplY3QoIGVyciApOyB9XG5cdFx0XHQpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gV2hlbiBwcm9taXNlIHN1Y2NlZWRzLlxuXHRcdHAudGhlbihmdW5jdGlvbiggZGF0YSApIHtcblx0XHRcdHZtLnNldFN0YXRlKCBzdGF0ZSwgZGF0YSk7XG5cblx0XHRcdGlmICggLy8gUGFzcyBkYXRhIHRvIGNhbGxiYWNrIGlmIGl0IGV4aXN0cyBhbmQgaXMgYSBmdW5jdGlvbi5cblx0XHRcdFx0YXN5bmNDYWxsYmFjayAhPSBudWxsICYmXG5cdFx0XHQgXHR0eXBlb2YgYXN5bmNDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJ1xuXHRcdFx0KSB7XG5cdFx0XHRcdGFzeW5jQ2FsbGJhY2soIGRhdGEgKTtcblx0XHRcdH1cblxuXHRcdH0pO1xuXG5cdFx0Ly8gV2hlbiBwcm9taXNlIGZhaWxzLlxuXHRcdHAuY2F0Y2goZnVuY3Rpb24oIGVyciApIHtcblx0XHRcdGNvbnNvbGUubG9nKCdbJyt2bS5uYW1lKyddOiBFcnJvciBzZXR0aW5nIHN0YXRlIG9mICcrc3RhdGUrJyBhc3luY2hyb25vdXNseScsIGVycik7XG5cdFx0fSk7XG5cblx0fTtcblxuXG5cdENlbC5wcm90b3R5cGUuc2V0SHRtbCA9IGZ1bmN0aW9uKCBlbGVtLCB2YWx1ZSApIHtcblx0XHRjb25zdCB2bSA9IHRoaXM7XG5cblx0XHQvLyBGaWx0ZXJzIG91dCBhbiBlbGVtZW50IHRoYXQgbWF0Y2hlcyB0aGUgZXZlbnQncyB0YXJnZXQuXG5cdFx0dmFyIGZpbmRUYXJnZXRJbkVsZW1lbnRzID0gZnVuY3Rpb24oIGl0ZW0sIGluZGV4ICkge1xuXHRcdFx0cmV0dXJuIGl0ZW0ubmFtZSA9PT0gZWxlbTtcblx0XHR9O1xuXG5cdFx0dmFyIHRhcmdldCA9IHZtLmVsZW1zLmZpbHRlciggZmluZFRhcmdldEluRWxlbWVudHMuYmluZCh2bSkgKVswXTtcblx0XHRpZiAoIHRhcmdldC50eXBlID09PSAnanF1ZXJ5JyApIHtcblx0XHRcdHRhcmdldC5lbGVtLmh0bWwoIHZhbHVlICk7XG5cdFx0fSBlbHNlIGlmICggdGFyZ2V0LnR5cGUgPT09ICdlbGVtZW50Jykge1xuXHRcdFx0dGFyZ2V0LmVsZW0uaW5uZXJIVE1MID0gdmFsdWU7XG5cdFx0fVxuXHR9O1xuXG59O1xuIiwiLy8gc3JjL2NvcmUvY29tcG9uZW50LmpzXG5pbXBvcnQgeyBpbml0TWl4aW4gfSBmcm9tICcuL2luaXRNaXhpbic7XG5pbXBvcnQgeyBzY3JpcHRNaXhpbiB9IGZyb20gJy4vc2NyaXB0TWl4aW4nO1xuXG5cbmZ1bmN0aW9uIENlbCggb3B0aW9ucyApIHtcblx0dGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lIHx8ICdOYW1lbGVzc0NvbXBvbmVudCc7XG5cdHRoaXMuZGVwZW5kZW5jaWVzID0gb3B0aW9ucy5kZXBlbmRlbmNpZXM7XG5cdHRoaXMuXyA9IG9wdGlvbnMuXztcblx0dGhpcy5zdGF0ZSA9IG9wdGlvbnMuc3RhdGU7XG5cdHRoaXMuZWxlbXMgPSBvcHRpb25zLmVsZW1zO1xuXHR0aGlzLm1ldGhvZHMgPSBvcHRpb25zLm1ldGhvZHM7XG5cdHRoaXMuaGFuZGxlcnMgPSBvcHRpb25zLmhhbmRsZXJzO1xuXHR0aGlzLmV2ZW50cyA9IG9wdGlvbnMuZXZlbnRzO1xuXHR0aGlzLmV4cG9zZWQgPSBvcHRpb25zLmV4cG9zZWQ7XG59XG5cbmluaXRNaXhpbiggQ2VsICk7XG5zY3JpcHRNaXhpbiggQ2VsICk7XG5cblxuZXhwb3J0IGRlZmF1bHQgQ2VsO1xuIiwiLy8gc3JjL2hlbHBlcnMvZXhwb3NlRnVuY3Rpb25zLmpzXG5cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZXhwb3NlRnVuY3Rpb25zKCBjZWwgKSB7XG5cblx0dmFyIGV4cG9zZWQgPSB7XG5cdFx0X19jdHhfXzogY2VsLl9fY3R4X18uYmluZChjZWwpLFxuXHRcdGluaXQ6IGNlbC5pbml0LmJpbmQoY2VsKSxcblx0XHRnZXROYW1lOiBjZWwuZ2V0TmFtZS5iaW5kKGNlbClcblx0fTtcblxuXHQvLyBOdWxsLWNoZWNrIGZvciBleHBvc2VkIGZ1bmN0aW9uc1xuXHRpZiAoIGNlbC5leHBvc2VkICE9IG51bGwgKSB7XG5cdFx0aWYgKCAvLyBFbnN1cmUgZXhwb3NlZCBpcyBhbiBhcnJheS5cblx0XHRcdEFycmF5LmlzQXJyYXkoIGNlbC5leHBvc2VkICkgJiZcblx0XHRcdGNlbC5leHBvc2VkLmxlbmd0aCA+IDBcblx0XHQpIHtcblx0XHRcdC8vIEVuc3VyZSB1c2VyIGRpZCBub3QgdHJ5IHRvIHBhc3MgJ2luaXQnIGluIHRoZSBleHBvc2VkIGxpc3QuXG5cdFx0XHQvLyBTaGUvaGUgc2hvdWxkIHVzZSBhIGRpZmZlcmVudCBmdW5jdGlvbiBuYW1lLlxuXHRcdFx0aWYgKCBjZWwuZXhwb3NlZC5pbmRleE9mKCdpbml0JykgPiAwICkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oJ1snK2NlbC5uYW1lKyddOiBUaGUgXFwnaW5pdFxcJyBwcm9wZXJ0eSBpcyBhbHJlYWR5IHRha2VuIGJ5IENlbCwgcGxlYXNlIHVzZSBhIGRpZmZlcmVudCBuYW1lIGZvciB5b3VyIGZ1bmN0aW9uLicpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gQXR0YWNoIGFsbCBleHBvc2VkIGZ1bmN0aW9ucyB0byB0aGUgJ2V4cG9zZWQnIG9iamVjdC5cblx0XHRcdFx0Zm9yICggbGV0IGkgPSAwLCBudW1FeHBvID0gY2VsLmV4cG9zZWQubGVuZ3RoOyBpIDwgbnVtRXhwbzsgaSsrICkge1xuXHRcdFx0XHRcdGlmICggY2VsLm1ldGhvZHMuaGFzT3duUHJvcGVydHkoIGNlbC5leHBvc2VkW2ldICkgKSB7XG5cdFx0XHRcdFx0XHRleHBvc2VkWyBjZWwuZXhwb3NlZFtpXSBdID0gY2VsLm1ldGhvZHNbIGNlbC5leHBvc2VkW2ldIF0uYmluZCggY2VsICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnNvbGUud2FybignWycrY2VsLm5hbWUrJ106IFBsZWFzZSBlbnN1cmUgdGhlIFxcJ2V4cG9zZWRcXCcgcHJvcGVydHkgaXMgYW4gYXJyYXkgb2Ygc3RyaW5ncy4nKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZXhwb3NlZDtcbn1cbiIsIi8vIHNyYy9oZWxwZXJzL2luaXRBdmFpbGFibGVDb21wb25lbnRzLmpzXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGluaXRBdmFpbGFibGVDb21wb25lbnRzKCBuYW1lc3BhY2UgKSB7XG4gIHdpbmRvdy5DZWwuc2V0dGluZ3MgPSB3aW5kb3cuQ2VsLnNldHRpbmdzIHx8IHt9O1xuICB3aW5kb3cuQ2VsLnNldHRpbmdzLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcblxuICB2YXIgX3JvdXRlID0gJyc7XG4gIHZhciBhY3Rpb24gPSAnaW5pdCc7XG4gIHZhciBkYXRhQWN0aW9uQXR0ciA9ICdkYXRhLWFjdGlvbic7XG4gIHZhciBkb3RSZWdleCA9IC9cXC4vO1xuXG4gIHZhciBzZXRSb3V0ZSA9IGZ1bmN0aW9uKCByb3V0ZVN0cmluZyApIHtcbiAgICAgIF9yb3V0ZSA9IHJvdXRlU3RyaW5nO1xuICB9O1xuXG4gIHZhciBnZXRSb3V0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBfcm91dGU7XG4gIH07XG5cbiAgdmFyIGxvY2F0ZVJvdXRhYmxlRWxlbWVudHNJbkRPTSA9IGZ1bmN0aW9uKCBhdHRyaWJ1dGUgKSB7XG4gICAgICB2YXIgbWF0Y2hpbmdFbGVtcyA9IFtdO1xuICAgICAgdmFyIGFsbEVsZW1zID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJyonKTtcblxuICAgICAgZm9yICggdmFyIGkgPSAwLCBudW1FbGVtcyA9IGFsbEVsZW1zLmxlbmd0aDsgaSA8IG51bUVsZW1zOyBpID0gaSArIDEgKSB7XG4gICAgICAgICAgLy8gRWxlbWVudCBleGlzdHMgd2l0aCBhdHRyaWJ1dGUuIEFkZCB0byBhcnJheS5cbiAgICAgICAgICBpZiAoIGFsbEVsZW1zW2ldLmdldEF0dHJpYnV0ZSggYXR0cmlidXRlICkgIT09IG51bGwgKSB7XG4gICAgICAgICAgICAgIG1hdGNoaW5nRWxlbXMucHVzaCggYWxsRWxlbXNbaV0gKTtcbiAgICAgICAgICB9XG4gICAgICB9IC8vIGZvclxuXG4gICAgICByZXR1cm4gbWF0Y2hpbmdFbGVtcztcbiAgfTtcblxuICB2YXIgZ2V0Um91dGVPYmplY3QgPSBmdW5jdGlvbiggcm91dGUgKSB7XG4gICAgdmFyIGxhdGVzdEluZGV4ID0gbmFtZXNwYWNlO1xuICAgIHJvdXRlXG4gICAgLnNwbGl0KCcuJylcbiAgICAubWFwKCBmdW5jdGlvbiggaXRlbSwgaSApIHtcbiAgICAgIGxhdGVzdEluZGV4ID0gbGF0ZXN0SW5kZXhbIGl0ZW0gXTtcbiAgICB9KTtcbiAgICByZXR1cm4gbGF0ZXN0SW5kZXg7XG4gIH07XG5cbiAgdmFyIGV4ZWN1dGVSb3V0ZUZvckVsZW1lbnQgPSBmdW5jdGlvbiggZWxlbWVudCApIHtcbiAgICAgIHZhciByb3V0ZSA9IGdldFJvdXRlKCk7XG5cbiAgICAgIGlmICggcm91dGUgIT09ICcnICkge1xuICAgICAgICAvLyBUaGUgcm91dGUgaXMgdXNpbmcgZG90IG5vdGF0aW9uLlxuICAgICAgICBpZiAoIGRvdFJlZ2V4LnRlc3QoIHJvdXRlICkpIHtcbiAgICAgICAgICB2YXIgcm91dGVPYmogPSBnZXRSb3V0ZU9iamVjdCggcm91dGUgKTtcbiAgICAgICAgICByb3V0ZU9ialthY3Rpb25dKCBlbGVtZW50ICk7XG4gICAgICAgIH0gLy8gaWYgZG90UmVnZXhcblxuICAgICAgICAvLyBUaGUgY29tcG9uZW50IHNob3VsZCBiZSBpbiB0aGUgZmlyc3QgaGllcmFyY2h5LFxuICAgICAgICAvLyBsaWtlIFwiQVBQLmNvbXBvbmVudE5hbWVcIlxuICAgICAgICBlbHNlIGlmIChcbiAgICAgICAgICBuYW1lc3BhY2Vbcm91dGVdICYmXG4gICAgICAgICAgdHlwZW9mIG5hbWVzcGFjZVtyb3V0ZV1bYWN0aW9uXSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICApIHtcbiAgICAgICAgICBuYW1lc3BhY2Vbcm91dGVdW2FjdGlvbl0oIGVsZW1lbnQgKTtcbiAgICAgICAgfSAvLyBlbHNlIGlmXG5cbiAgICAgIH0gLy8gaWYgcm91dGVcbiAgfTtcblxuICB2YXIgaW5pdERlcGVuZGVuY2llcyA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIGNoZWNrIGVhY2ggaW5zdGFuY2UgZm9yIGRlcGVuZGVuY2llcy5cbiAgICB3aW5kb3cuQ2VsLmluc3RhbmNlcy5tYXAoZnVuY3Rpb24oIGluc3RhbmNlLCBpICkge1xuICAgICAgdmFyIGNlbCA9IGluc3RhbmNlLl9fY3R4X18oKTtcbiAgICAgIC8vIGNoZWNrIGlmIGluc3RhbmNlIGhhcyBkZXBlbmRlbmNpZXMuXG4gICAgICBpZiAoIGNlbC5kZXBlbmRlbmNpZXMgIT0gbnVsbCAmJiBjZWwuZGVwZW5kZW5jaWVzLmxlbmd0aCA+IDAgKSB7XG4gICAgICAgIC8vIGZpbmQgYW4gaW5zdGFuY2UgZm9yIGVhY2ggZGVwZW5kZW5jeS5cbiAgICAgICAgY2VsLmRlcGVuZGVuY2llcy5tYXAoZnVuY3Rpb24oIGRlcGVuZGVuY3ksIGkgKSB7XG4gICAgICAgICAgLy8gZmluZCBtYXRjaGluZyBkZXBlbmRlbmN5IGZyb20gaW5zdGFuY2VzLlxuICAgICAgICAgIHZhciBkZXAgPSB3aW5kb3cuQ2VsLmluc3RhbmNlcy5maWx0ZXIoZnVuY3Rpb24oIGluc3QsIGogKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5zdC5nZXROYW1lKCkgPT09IGRlcGVuZGVuY3k7XG4gICAgICAgICAgfSlbMF07XG4gICAgICAgICAgLy8gaW5pdCBpZiBpdCBoYXMgbm90IHlldCBiZWVuIGluaXQnZC5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBkZXAuaW5pdCA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgIGRlcC5pbml0KCk7IC8vIGluaXQgZGVwZW5kZW5jeVxuICAgICAgICAgICAgLy8gW1RPRE9dOiBOZWVkcyB0ZXN0aW5nIHRvIHNlZSBpZiBpdCBwcmV2ZW50cy9jYXVzZXMgZXJyb3JzXG4gICAgICAgICAgICBkZXAuaW5pdCA9IG51bGw7IC8vIHByZXZlbnQgbXVsdGlwbGUgaW5pdGlhbGl6YXRpb25zLlxuICAgICAgICAgIH1cbiAgICAgICAgICBjZWwuJCA9IGNlbC4kIHx8IHt9O1xuICAgICAgICAgIGNlbC4kW2RlcGVuZGVuY3ldID0gZGVwOyAvLyBhZGQgcmVmZXJlbmNlIGZvciBjb21wb25lbnRcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgdmFyIGluaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByb3V0ZXMgPSBsb2NhdGVSb3V0YWJsZUVsZW1lbnRzSW5ET00oIGRhdGFBY3Rpb25BdHRyICk7XG5cbiAgICAgIC8vIEluaXQgY29tcG9uZW50c1xuICAgICAgZm9yICggdmFyIGkgPSAwLCBudW1Sb3V0ZXMgPSByb3V0ZXMubGVuZ3RoOyBpIDwgbnVtUm91dGVzOyBpKysgKSB7XG4gICAgICAgICAgdmFyIGVsZW1lbnQgPSByb3V0ZXNbaV07XG4gICAgICAgICAgc2V0Um91dGUoIGVsZW1lbnQuZ2V0QXR0cmlidXRlKCBkYXRhQWN0aW9uQXR0ciApICk7XG4gICAgICAgICAgZXhlY3V0ZVJvdXRlRm9yRWxlbWVudCggZWxlbWVudCApO1xuICAgICAgfSAvLyBmb3JcbiAgICAgIGluaXREZXBlbmRlbmNpZXMoKTtcbiAgfTtcblxuICBpbml0KCk7XG59XG4iLCIvLyBzcmMvY29yZS9jZWwuanNcbmltcG9ydCBDb21wb25lbnQgZnJvbSAnLi9jb21wb25lbnQnO1xuaW1wb3J0IGV4cG9zZUZ1bmN0aW9ucyBmcm9tICcuLi9oZWxwZXJzL2V4cG9zZUZ1bmN0aW9ucyc7XG5pbXBvcnQgaW5pdEF2YWlsYWJsZUNvbXBvbmVudHMgZnJvbSAnLi4vaGVscGVycy9pbml0QXZhaWxhYmxlQ29tcG9uZW50cyc7XG5cbmNvbnN0IENlbCA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuXHR3aW5kb3cuQ2VsLmluc3RhbmNlcyA9IHdpbmRvdy5DZWwuaW5zdGFuY2VzIHx8IFtdO1xuXG5cdC8vIE1ha2UgY29tcG9uZW50LlxuXHRpZiAoIG9wdGlvbnMgIT0gbnVsbCApIHtcblx0XHRsZXQgY2VsID0gbmV3IENvbXBvbmVudCggb3B0aW9ucyApO1xuXHRcdC8vIEV4cG9zZXMgc3BlY2lmaWVkIGZ1bmN0aW9ucyBmb3IgcHVibGljIHVzZS5cblx0XHRjZWwgPSBleHBvc2VGdW5jdGlvbnMoIGNlbCApO1xuXHRcdC8vIEFkZHMgY2VsIHRvIGxpc3Qgb2YgQ2VsIGluc3RhbmNlcy5cblx0XHR3aW5kb3cuQ2VsLmluc3RhbmNlcy5wdXNoKCBjZWwgKTtcblx0XHQvLyBSZXR1cm4gY2VsIGNvbXBvbmVudCB3aXRoIGV4cG9zZWQgZnVuY3Rpb25zLlxuXHRcdHJldHVybiBjZWw7XG5cdH1cblxuXHQvLyBJbml0aWFsaXplIGNvbXBvbmVudHNcblx0ZWxzZSBpZiAoXG5cdFx0b3B0aW9ucyA9PSBudWxsXG5cdCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRpbml0OiBpbml0QXZhaWxhYmxlQ29tcG9uZW50c1xuXHRcdH07XG5cdH1cblxuXHQvLyBXYXJuIG9mIGJhZCBjb25maWcuXG5cdGVsc2Uge1xuXHRcdGNvbnNvbGUud2FybignVGhlcmUgd2FzIGJhZCBjb25maWd1cmF0aW9ucyB3aXRoIGEgQ2VsIGNvbXBvbmVudC4gWW91IG11c3QgcGFzcyBvcHRpb25zIGZvciBhIGNlbCBjb21wb25lbnQsIG9yIFwibnVsbFwiIGFuZCBhIG5hbWVzcGFjZSBvYmplY3QgZm9yIHBhcmFtZXRlcnMgdG8gaW5pdGlhbGl6ZSBjb21wb25lbnRzLicpO1xuXHR9XG5cbn07XG5cbmV4cG9ydCBkZWZhdWx0IENlbDtcbiIsIi8vIHNyYy9pbmRleC5qc1xuaW1wb3J0IENlbCBmcm9tICcuL2NvcmUvY2VsLmpzJztcblxuXG5leHBvcnQgZGVmYXVsdCBDZWw7Il0sIm5hbWVzIjpbImluaXRNaXhpbiIsIkNlbCIsInByb3RvdHlwZSIsIl9nZXRFbGVtZW50c09uTW91bnQiLCJ2bSIsImVsZW1zIiwiaSIsIm51bUVsZW0iLCJsZW5ndGgiLCJ3aW5kb3ciLCJqUXVlcnkiLCIkIiwibmFtZSIsInNsaWNlIiwiZWxlbSIsInNlbGVjdG9yIiwidHlwZSIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvciIsIl9iaW5kVGhpc1RvTWV0aG9kcyIsIm1ldGhvZHMiLCJPYmplY3QiLCJrZXlzIiwibnVtTWV0aG9kcyIsImJpbmQiLCJfYmluZEV2ZW50c09uTW91bnQiLCJldmVudHMiLCJudW1FdmVudHMiLCJmaW5kRXZlbnRUYXJnZXRJbkVsZW1lbnRzIiwiZWxJbmRleCIsIml0ZW0iLCJpbmRleCIsInRhcmdldCIsImZpbHRlciIsImJpbmRUeXBlIiwiZnVuYyIsImhhbmRsZXJzIiwiaGFuZGxlciIsImRlYm91bmNlIiwidGhyb3R0bGUiLCJ3YXJuIiwiX2RlYm91bmNlIiwiX3Rocm90dGxlIiwiX2NoZWNrQ29tcG9uZW50U2V0dGluZ3MiLCJnZXROYW1lIiwiX19jdHhfXyIsImluaXQiLCJzY3JpcHRNaXhpbiIsIndhaXQiLCJpbW1lZGlhdGUiLCJ0aW1lb3V0IiwiY29udGV4dCIsImFyZ3MiLCJhcmd1bWVudHMiLCJsYXRlciIsImFwcGx5IiwiY2FsbE5vdyIsInNldFRpbWVvdXQiLCJvcHRpb25zIiwicmVzdWx0IiwicHJldmlvdXMiLCJsZWFkaW5nIiwiRGF0ZSIsIm5vdyIsInJlbWFpbmluZyIsInRyYWlsaW5nIiwiZmV0Y2giLCJ1cmwiLCJzdWNjZXNzQ2FsbGJhY2siLCJlcnJvckNhbGxiYWNrIiwicmVxIiwiWE1MSHR0cFJlcXVlc3QiLCJvbmxvYWQiLCJzdGF0dXMiLCJyZXNwb25zZVRleHQiLCJzdGF0dXNUZXh0Iiwib3BlbiIsInNlbmQiLCJzZXRTdGF0ZSIsInN0YXRlIiwidmFsdWUiLCJlcnIiLCJzZXRTdGF0ZUFzeW5jIiwiYXN5bmNUYXNrIiwiYXN5bmNDYWxsYmFjayIsInAiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImRhdGEiLCJ0aGVuIiwiY2F0Y2giLCJsb2ciLCJzZXRIdG1sIiwiZmluZFRhcmdldEluRWxlbWVudHMiLCJodG1sIiwiaW5uZXJIVE1MIiwiZGVwZW5kZW5jaWVzIiwiXyIsImV4cG9zZWQiLCJleHBvc2VGdW5jdGlvbnMiLCJjZWwiLCJpc0FycmF5IiwiaW5kZXhPZiIsIm51bUV4cG8iLCJoYXNPd25Qcm9wZXJ0eSIsImluaXRBdmFpbGFibGVDb21wb25lbnRzIiwibmFtZXNwYWNlIiwic2V0dGluZ3MiLCJfcm91dGUiLCJhY3Rpb24iLCJkYXRhQWN0aW9uQXR0ciIsImRvdFJlZ2V4Iiwic2V0Um91dGUiLCJyb3V0ZVN0cmluZyIsImdldFJvdXRlIiwibG9jYXRlUm91dGFibGVFbGVtZW50c0luRE9NIiwiYXR0cmlidXRlIiwibWF0Y2hpbmdFbGVtcyIsImFsbEVsZW1zIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJudW1FbGVtcyIsImdldEF0dHJpYnV0ZSIsInB1c2giLCJnZXRSb3V0ZU9iamVjdCIsInJvdXRlIiwibGF0ZXN0SW5kZXgiLCJzcGxpdCIsIm1hcCIsImV4ZWN1dGVSb3V0ZUZvckVsZW1lbnQiLCJlbGVtZW50IiwidGVzdCIsInJvdXRlT2JqIiwiaW5pdERlcGVuZGVuY2llcyIsImluc3RhbmNlcyIsImluc3RhbmNlIiwiZGVwZW5kZW5jeSIsImRlcCIsImluc3QiLCJqIiwicm91dGVzIiwibnVtUm91dGVzIiwiQ29tcG9uZW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0FBR0EsQUFBTyxTQUFTQSxTQUFULENBQW1CQyxHQUFuQixFQUF3Qjs7O0tBRzFCQyxTQUFKLENBQWNDLG1CQUFkLEdBQW9DLFlBQVc7TUFDeENDLEtBQUssSUFBWDtNQUNLQSxHQUFHQyxLQUFILElBQVksSUFBakIsRUFBd0I7UUFDakIsSUFBSUMsSUFBSSxDQUFSLEVBQVdDLFVBQVVILEdBQUdDLEtBQUgsQ0FBU0csTUFBcEMsRUFBNENGLElBQUlDLE9BQWhELEVBQXlERCxHQUF6RCxF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
