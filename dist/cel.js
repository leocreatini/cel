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
  if (namespace == null) {
    console.warn('Must provide a global object as your namespace for your components.');
    return;
  }

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
				console.warn('There was bad configurations with a Cel component. You must pass options for a cel component, or "null" and a namespace object as a parameter to initialize your components.');
			}
};

// src/index.js

return Cel$1;

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2luaXRNaXhpbi5qcyIsIi4uL3NyYy9jb3JlL3NjcmlwdE1peGluLmpzIiwiLi4vc3JjL2NvcmUvY29tcG9uZW50LmpzIiwiLi4vc3JjL2hlbHBlcnMvZXhwb3NlRnVuY3Rpb25zLmpzIiwiLi4vc3JjL2hlbHBlcnMvaW5pdEF2YWlsYWJsZUNvbXBvbmVudHMuanMiLCIuLi9zcmMvY29yZS9jZWwuanMiLCIuLi9zcmMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gc3JjL2NvcmUvaW5pdE1peGluLmpzXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRNaXhpbihDZWwpIHtcblx0Ly8gRmluZHMgZWxlbWVudHMgdmlhIGl0cyBzZWxlY3RvciBhbmQgY2FjaGVzIHRoZW0gdW5kZXIgdGhlICdlbGVtJyBwcm9wZXJ0eVxuXHQvLyBvZiB0aGF0IGVsZW1lbnQuXG5cdENlbC5wcm90b3R5cGUuX2dldEVsZW1lbnRzT25Nb3VudCA9IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IHZtID0gdGhpcztcblx0XHRpZiAoIHZtLmVsZW1zICE9IG51bGwgKSB7XG5cdFx0XHRmb3IgKCB2YXIgaSA9IDAsIG51bUVsZW0gPSB2bS5lbGVtcy5sZW5ndGg7IGkgPCBudW1FbGVtOyBpKysgKSB7XG5cblx0XHRcdFx0Ly8gSWYgalF1ZXJ5IGlzIGF2YWlsYWJsZSBhbmQgdXNpbmcgdGhlICckZWxlbU5hbWUnIGNvbnZlbnRpb24sXG5cdFx0XHRcdC8vIFJldHVybiBhIGpRdWVyeSBvYmplY3QuXG5cdFx0XHRcdGlmICggKHdpbmRvdy5qUXVlcnkgIT0gbnVsbCB8fCB3aW5kb3cuJCAhPSBudWxsKSAmJlxuXHRcdFx0XHRcdHZtLmVsZW1zW2ldLm5hbWUuc2xpY2UoMCwgMSkgPT09ICckJ1xuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHR2bS5lbGVtc1tpXS5lbGVtID0gJCggdm0uZWxlbXNbaV0uc2VsZWN0b3IgKTtcblx0XHRcdFx0XHR2bS5lbGVtc1tpXS50eXBlID0gJ2pxdWVyeSc7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBFbHNlLCBqdXN0IHVzZSB2YW5pbGxhIGphdmFzY3JpcHQgRE9NIG5vZGUuXG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHZtLmVsZW1zW2ldLmVsZW0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCB2bS5lbGVtc1tpXS5zZWxlY3RvciApO1xuXHRcdFx0XHRcdHZtLmVsZW1zW2ldLnR5cGUgPSAnZWxlbWVudCc7XG5cdFx0XHRcdH1cblx0XHRcdH0gLy8gZm9yXG5cdFx0fSAvLyBpZlxuXHR9O1xuXG5cdC8vIEJpbmRzIHRoZSBjb21wb25lbnQncyBcInRoaXNcIiB0byB0aGUgbWV0aG9kcy5cblx0Ly8gVGhpcyBpcyBkb25lIHRvIGJlIGFibGUgdG8gY2FsbCAndGhpcy5tZXRob2RzLmZ1bmN0aW9uTmFtZSgpJyBmcm9tIG90aGVyXG5cdC8vIG1ldGhvZHMgYW5kIGhhbmRsZXJzLlxuXHRDZWwucHJvdG90eXBlLl9iaW5kVGhpc1RvTWV0aG9kcyA9IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IHZtID0gdGhpcztcblx0XHR2YXIgbWV0aG9kcyA9IE9iamVjdC5rZXlzKHZtLm1ldGhvZHMpO1xuXHRcdHZhciBudW1NZXRob2RzID0gbWV0aG9kcy5sZW5ndGg7XG5cdFx0aWYgKCBudW1NZXRob2RzID4gMCApIHtcblx0XHRcdGZvciAoXG5cdFx0XHRcdHZhciBpID0gMDtcblx0XHRcdFx0aSA8IG51bU1ldGhvZHM7XG5cdFx0XHRcdGkgPSBpKzFcblx0XHRcdCkge1xuXHRcdFx0XHR2bS5tZXRob2RzWyBtZXRob2RzW2ldIF0gPSB2bS5tZXRob2RzWyBtZXRob2RzW2ldIF0uYmluZCh2bSk7XG5cdFx0XHR9IC8vIGZvclxuXHRcdH0gLy8gaWZcblx0fTtcblxuXHQvLyBbVE9ET106IFJlZmFjdG9yIGludG8gc21hbGxlciBwYXJ0cy9taXhpbnMuXG5cdC8vIEFkZHMgZXZlbnQtbGlzdGVuZXJzIHRvIHRhcmdldCBlbGVtZW50cyB3aGVuIGNvbXBvbmVudCBpbml0aWFsaXplcy5cblx0Q2VsLnByb3RvdHlwZS5fYmluZEV2ZW50c09uTW91bnQgPSBmdW5jdGlvbigpIHtcblx0XHRjb25zdCB2bSA9IHRoaXM7XG5cdFx0Ly8gRW5zdXJlIGV2ZW50cyBhcmVuJ3QgZW1wdHlcblx0XHRpZiAoIHZtLmV2ZW50cyAhPSBudWxsICkge1xuXHRcdFx0dmFyIG51bUV2ZW50cyA9IHZtLmV2ZW50cy5sZW5ndGg7XG5cblx0XHRcdC8vIEVuc3VyZSBlbGVtZW50cyBhcmVuJ3QgZW1wdHkgYW5kIHRoZXJlJ3MgYXQgbGVhc3Qgb24gZXZlbnQuXG5cdFx0XHRpZiAoIHZtLmVsZW1zICE9IG51bGwgJiYgbnVtRXZlbnRzID4gMCkge1xuXG5cdFx0XHRcdC8vIEZpbHRlcnMgb3V0IGFuIGVsZW1lbnQgdGhhdCBtYXRjaGVzIHRoZSBldmVudCdzIHRhcmdldC5cblx0XHRcdFx0dmFyIGZpbmRFdmVudFRhcmdldEluRWxlbWVudHMgPSBmdW5jdGlvbiggZWxJbmRleCwgaXRlbSwgaW5kZXggKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGl0ZW0ubmFtZSA9PT0gdm0uZXZlbnRzWyBlbEluZGV4IF0udGFyZ2V0O1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdC8vIEJpbmRzIGVhY2ggZXZlbnQgdG8gaXRzIGRlc2lnbmF0ZWQgdGFyZ2V0XG5cdFx0XHRcdC8vIEFuZCBhZGQgZGVib3VuY2Ugb3IgdGhyb3R0bGluZyBpZiByZXF1ZXN0ZWQuXG5cdFx0XHRcdGZvciAoIHZhciBpID0gMDsgaSA8IG51bUV2ZW50czsgaSsrICkge1xuXHRcdFx0XHRcdHZhciB0YXJnZXQgPSB2bS5lbGVtcy5maWx0ZXIoXG5cdFx0XHRcdFx0XHRmaW5kRXZlbnRUYXJnZXRJbkVsZW1lbnRzLmJpbmQodm0sIGkpXG5cdFx0XHRcdFx0KVswXTtcblx0XHRcdFx0XHR2YXIgYmluZFR5cGUgPSAoIHRhcmdldC50eXBlID09PSAnanF1ZXJ5JyApXG5cdFx0XHRcdFx0XHQ/ICdvbidcblx0XHRcdFx0XHRcdDogJ2FkZEV2ZW50TGlzdGVuZXInO1xuXHRcdFx0XHRcdHZhciBmdW5jID0gdm0uaGFuZGxlcnNbIHZtLmV2ZW50c1tpXS5oYW5kbGVyIF0uYmluZCh2bSlcblxuXHRcdFx0XHRcdC8vIFByZXZlbnQgdXNpbmcgRGVib3VuY2UgYW5kIFRocm90dGxlIGZvciBzYW1lIGV2ZW50LlxuXHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdHZtLmV2ZW50c1tpXS5kZWJvdW5jZSAhPSBudWxsICYmXG5cdFx0XHRcdFx0XHR0eXBlb2Ygdm0uZXZlbnRzW2ldLmRlYm91bmNlID09PSAnbnVtYmVyJyAmJlxuXHRcdFx0XHRcdFx0dm0uZXZlbnRzW2ldLnRocm90dGxlICE9IG51bGwgJiZcblx0XHRcdFx0XHRcdHR5cGVvZiB2bS5ldmVudHNbaV0udGhyb3R0bGUgPT09ICdudW1iZXInXG5cdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ1snK3ZtLm5hbWUrJ106IENhbm5vdCBzZXQgYm90aCBcXCdkZWJvdW5jZVxcJyBhbmQgXFwndGhyb3R0bGVcXCcgY29uZmlndXJhdGlvbnMgb24gdGhlIHNhbWUgZXZlbnQuIFBsZWFzZSB1c2Ugb25seSBvbmUuJyk7XG5cdFx0XHRcdFx0fSAvLyBpZlxuXG5cdFx0XHRcdFx0Ly8gQWRkIGRlYm91bmNpbmcgdG8gZnVuY3Rpb24gaWYgc2V0dGluZyBpcyBjb3JyZWN0LlxuXHRcdFx0XHRcdGVsc2UgaWYgKCB2bS5ldmVudHNbaV0uZGVib3VuY2UgIT0gbnVsbCApIHtcblx0XHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdFx0dHlwZW9mIHZtLmV2ZW50c1tpXS5kZWJvdW5jZSA9PT0gJ251bWJlcicgJiZcblx0XHRcdFx0XHRcdFx0dm0uZXZlbnRzW2ldLmRlYm91bmNlID4gMFxuXHRcdFx0XHRcdFx0KSB7IC8vIFNldHRpbmcgaXMgY29ycmVjdCwgYWRkaW5nIGRlYm91bmNpbmcuXG5cdFx0XHRcdFx0XHRcdGZ1bmMgPSB2bS5fZGVib3VuY2UoIGZ1bmMsIHZtLmV2ZW50c1tpXS5kZWJvdW5jZSApO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdbJyt2bS5uYW1lKyddOiBFbnN1cmUgeW91ciBcXCdkZWJvdW5jZVxcJyBzZXR0aW5nIGlzIGEgbnVtYmVyIGdyZWF0ZXIgdGhhbiAwLicpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gLy8gZWxzZSBpZlxuXG5cdFx0XHRcdFx0Ly8gQWRkIHRocm90dGxpbmcgdG8gZnVuY3Rpb24gaWYgc2V0dGluZyBpcyBjb3JyZWN0LlxuXHRcdFx0XHRcdGVsc2UgaWYgKCB2bS5ldmVudHNbaV0udGhyb3R0bGUgIT0gbnVsbCApIHtcblx0XHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdFx0dHlwZW9mIHZtLmV2ZW50c1tpXS50aHJvdHRsZSA9PT0gJ251bWJlcicgJiZcblx0XHRcdFx0XHRcdFx0dm0uZXZlbnRzW2ldLnRocm90dGxlID4gMFxuXHRcdFx0XHRcdFx0KSB7IC8vIFNldHRpbmcgaXMgY29ycmVjdCwgYWRkaW5nIHRocm90dGxpbmcuXG5cdFx0XHRcdFx0XHRcdGZ1bmMgPSB2bS5fdGhyb3R0bGUoIGZ1bmMsIHZtLmV2ZW50c1tpXS50aHJvdHRsZSApO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdbJyt2bS5uYW1lKyddOiBFbnN1cmUgeW91ciBcXCd0aHJvdHRsZVxcJyBzZXR0aW5nIGlzIGEgbnVtYmVyIGdyZWF0ZXIgdGhhbiAwLicpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gLy8gZWxzZSBpZlxuXG5cdFx0XHRcdFx0Ly8gQmluZGluZyBjYWxsYmFjayBldmVudCB0byB0YXJnZXQuXG5cdFx0XHRcdFx0dGFyZ2V0LmVsZW1bIGJpbmRUeXBlIF0oXG5cdFx0XHRcdFx0XHR2bS5ldmVudHNbIGkgXS50eXBlLFxuXHRcdFx0XHRcdFx0ZnVuY1xuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH0gLy8gZm9yIG51bUV2ZW50c1xuXHRcdFx0fSAvLyBpZiBlbGVtcy5sZW5ndGhcblx0XHR9IC8vIGlmIHZtLmV2ZW50c1xuXHR9O1xuXG5cdC8vIEVuc3VyaW5nIHRoZSBzZXR0aW5ncyBhcmUgY29ycmVjdC5cblx0Q2VsLnByb3RvdHlwZS5fY2hlY2tDb21wb25lbnRTZXR0aW5ncyA9IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IHZtID0gdGhpcztcblx0XHRpZiAoXG5cdFx0XHR2bS5uYW1lID09PSBudWxsIHx8XG5cdFx0XHR2bS5uYW1lID09PSAnJyB8fFxuXHRcdFx0dm0ubmFtZSA9PT0gJ05hbWVsZXNzQ29tcG9uZW50J1xuXHRcdCkge1xuXHRcdFx0Y29uc29sZS53YXJuKCdQbGVhc2UgZW5zdXJlIHRoYXQgeW91IG5hbWVkIGFsbCB5b3VyIGNvbXBvbmVudHMgd2l0aCBhIFxcJ25hbWVcXCcgcHJvcGVydHkuIEF0IGxlYXN0IG9uZSBpcyBtaXNzaW5nIHJpZ2h0IG5vdy4nKTtcblx0XHR9XG5cdH1cblxuXHRDZWwucHJvdG90eXBlLmdldE5hbWUgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5uYW1lO1xuXHR9O1xuXG5cdENlbC5wcm90b3R5cGUuX19jdHhfXyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0Ly8gUHVibGljYWxseSBhY2Nlc3NpYmxlIGluaXRpYWxpemUgZnVuY3Rpb24gdG8gYm9vdHN0cmFwIHRoZSBjb21wb25lbnQuXG5cdENlbC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IHZtID0gdGhpcztcblx0XHR2bS5fY2hlY2tDb21wb25lbnRTZXR0aW5ncygpO1xuXHRcdHZtLl9nZXRFbGVtZW50c09uTW91bnQoKTtcblx0XHR2bS5fYmluZFRoaXNUb01ldGhvZHMoKTtcblx0XHR2bS5fYmluZEV2ZW50c09uTW91bnQoKTtcblx0fTtcblxufTtcbiIsIi8vIHNyYy9jb3JlL3NjcmlwdE1peGluLmpzXG5cblxuZXhwb3J0IGZ1bmN0aW9uIHNjcmlwdE1peGluKENlbCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0Ly8gRnJvbSBVbmRlcnNjb3JlIGxpYnJhcnlcblx0Q2VsLnByb3RvdHlwZS5fZGVib3VuY2UgPSBmdW5jdGlvbiggZnVuYywgd2FpdCwgaW1tZWRpYXRlICkge1xuXHRcdGxldCB0aW1lb3V0O1xuXHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdGxldCBjb250ZXh0ID0gdGhpcztcblx0XHRcdGxldCBhcmdzID0gYXJndW1lbnRzO1xuXHRcdFx0bGV0IGxhdGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHRpbWVvdXQgPSBudWxsO1xuXHRcdFx0XHRpZiAoIWltbWVkaWF0ZSkge1xuXHRcdFx0XHRcdGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0XHRsZXQgY2FsbE5vdyA9IChpbW1lZGlhdGUgJiYgIXRpbWVvdXQpO1xuXHRcdFx0Y2xlYXJUaW1lb3V0KCB0aW1lb3V0ICk7XG5cdFx0XHR0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG5cdFx0XHRpZiAoY2FsbE5vdykge1xuXHRcdFx0XHRmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH07XG5cblxuXHQvLyBGcm9tIFVuZGVyc2NvcmUgbGlicmFyeVxuXHRDZWwucHJvdG90eXBlLl90aHJvdHRsZSA9IGZ1bmN0aW9uKCBmdW5jLCB3YWl0LCBvcHRpb25zICkge1xuXHRcdGxldCBjb250ZXh0LCBhcmdzLCByZXN1bHQ7XG5cdFx0bGV0IHRpbWVvdXQgPSBudWxsO1xuXHRcdGxldCBwcmV2aW91cyA9IDA7XG5cdFx0aWYgKCAhb3B0aW9ucyApIHtcblx0XHRcdG9wdGlvbnMgPSB7fTtcblx0XHR9XG5cdFx0bGV0IGxhdGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRwcmV2aW91cyA9IG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UgPyAwIDogRGF0ZS5ub3coKTtcblx0XHRcdHRpbWVvdXQgPSBudWxsO1xuXHRcdFx0cmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0XHRcdGlmICggIXRpbWVvdXQgKSB7XG5cdFx0XHRcdGNvbnRleHQgPSBhcmdzID0gbnVsbDtcblx0XHRcdH1cblx0XHR9O1xuXHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdGxldCBub3cgPSBEYXRlLm5vdygpO1xuXHRcdFx0aWYgKCAhcHJldmlvdXMgJiYgb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSApIHtcblx0XHRcdFx0cHJldmlvdXMgPSBub3c7XG5cdFx0XHR9XG5cdFx0XHRsZXQgcmVtYWluaW5nID0gd2FpdCAtIChub3cgLSBwcmV2aW91cyk7XG5cdFx0XHRjb250ZXh0ID0gdGhpcztcblx0XHRcdGFyZ3MgPSBhcmd1bWVudHM7XG5cdFx0XHRpZiAoIHJlbWFpbmluZyA8PSAwIHx8IHJlbWFpbmluZyA+IHdhaXQgKSB7XG5cdFx0XHRcdGlmICh0aW1lb3V0KSB7XG5cdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXHRcdFx0XHRcdHRpbWVvdXQgPSBudWxsO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHByZXZpb3VzID0gbm93O1xuXHRcdFx0XHRyZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHRcdFx0XHRpZiAoICF0aW1lb3V0ICkge1xuXHRcdFx0XHRcdGNvbnRleHQgPSBhcmdzID0gbnVsbDtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmICggIXRpbWVvdXQgJiYgb3B0aW9ucy50cmFpbGluZyAhPT0gZmFsc2UgKSB7XG5cdFx0XHRcdHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCByZW1haW5pbmcpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9O1xuXHR9O1xuXG5cdENlbC5wcm90b3R5cGUuZmV0Y2ggPSBmdW5jdGlvbiggdXJsLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2sgKSB7XG5cdFx0XHR2YXIgcmVxO1xuXHRcdFx0cmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cdFx0XHRyZXEub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCggcmVxLnN0YXR1cyA9PT0gMjAwIClcblx0XHRcdFx0XHQ/IHN1Y2Nlc3NDYWxsYmFjayggcmVxLnJlc3BvbnNlVGV4dCApXG5cdFx0XHRcdFx0OiBlcnJvckNhbGxiYWNrKCByZXEuc3RhdHVzVGV4dCApO1xuXHRcdFx0fVxuXHRcdFx0cmVxLm9wZW4oJ0dFVCcsIHVybCwgdHJ1ZSk7XG5cdFx0XHRyZXEuc2VuZCgpO1xuXHR9O1xuXG5cblx0Ly8gU2V0IHN0YXRlIHN5bmNocm9ub3VzbHkuXG5cdENlbC5wcm90b3R5cGUuc2V0U3RhdGUgPSBmdW5jdGlvbiggc3RhdGUsIHZhbHVlICkge1xuXHRcdGNvbnN0IHZtID0gdGhpcztcblx0XHR0cnkge1xuXHRcdFx0dm0uc3RhdGVbIHN0YXRlIF0gPSB2YWx1ZTtcblx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdGNvbnNvbGUud2FybignWycrdm0ubmFtZSsnXTogQ291bGQgbm90IHNldCB2YWx1ZSBvZiBcIicrc3RhdGUrJ1wiLCBtYWtlIHN1cmUgaXQgZXhpc3RzIGluIHlvdXIgY29tcG9uZW50IGNvbmZpZy4nLCBlcnIpO1xuXHRcdH1cblx0fTtcblxuXG5cdC8vIFNldCBzdGF0ZSBhc3luY2hyb25vdXNseS5cblx0Q2VsLnByb3RvdHlwZS5zZXRTdGF0ZUFzeW5jID0gZnVuY3Rpb24oIHN0YXRlLCBhc3luY1Rhc2ssIGFzeW5jQ2FsbGJhY2sgKSB7XG5cdFx0Y29uc3Qgdm0gPSB0aGlzO1xuXG5cdFx0Ly8gQ3JlYXRlIHByb21pc2UuXG5cdFx0dmFyIHAgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiggcmVzb2x2ZSwgcmVqZWN0ICkge1xuXHRcdFx0YXN5bmNUYXNrKFxuXHRcdFx0XHRmdW5jdGlvbiggZGF0YSApIHsgcmVzb2x2ZSggZGF0YSApOyB9LFxuXHRcdFx0XHRmdW5jdGlvbiggZXJyICkgeyByZWplY3QoIGVyciApOyB9XG5cdFx0XHQpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gV2hlbiBwcm9taXNlIHN1Y2NlZWRzLlxuXHRcdHAudGhlbihmdW5jdGlvbiggZGF0YSApIHtcblx0XHRcdHZtLnNldFN0YXRlKCBzdGF0ZSwgZGF0YSk7XG5cblx0XHRcdGlmICggLy8gUGFzcyBkYXRhIHRvIGNhbGxiYWNrIGlmIGl0IGV4aXN0cyBhbmQgaXMgYSBmdW5jdGlvbi5cblx0XHRcdFx0YXN5bmNDYWxsYmFjayAhPSBudWxsICYmXG5cdFx0XHQgXHR0eXBlb2YgYXN5bmNDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJ1xuXHRcdFx0KSB7XG5cdFx0XHRcdGFzeW5jQ2FsbGJhY2soIGRhdGEgKTtcblx0XHRcdH1cblxuXHRcdH0pO1xuXG5cdFx0Ly8gV2hlbiBwcm9taXNlIGZhaWxzLlxuXHRcdHAuY2F0Y2goZnVuY3Rpb24oIGVyciApIHtcblx0XHRcdGNvbnNvbGUubG9nKCdbJyt2bS5uYW1lKyddOiBFcnJvciBzZXR0aW5nIHN0YXRlIG9mICcrc3RhdGUrJyBhc3luY2hyb25vdXNseScsIGVycik7XG5cdFx0fSk7XG5cblx0fTtcblxuXG5cdENlbC5wcm90b3R5cGUuc2V0SHRtbCA9IGZ1bmN0aW9uKCBlbGVtLCB2YWx1ZSApIHtcblx0XHRjb25zdCB2bSA9IHRoaXM7XG5cblx0XHQvLyBGaWx0ZXJzIG91dCBhbiBlbGVtZW50IHRoYXQgbWF0Y2hlcyB0aGUgZXZlbnQncyB0YXJnZXQuXG5cdFx0dmFyIGZpbmRUYXJnZXRJbkVsZW1lbnRzID0gZnVuY3Rpb24oIGl0ZW0sIGluZGV4ICkge1xuXHRcdFx0cmV0dXJuIGl0ZW0ubmFtZSA9PT0gZWxlbTtcblx0XHR9O1xuXG5cdFx0dmFyIHRhcmdldCA9IHZtLmVsZW1zLmZpbHRlciggZmluZFRhcmdldEluRWxlbWVudHMuYmluZCh2bSkgKVswXTtcblx0XHRpZiAoIHRhcmdldC50eXBlID09PSAnanF1ZXJ5JyApIHtcblx0XHRcdHRhcmdldC5lbGVtLmh0bWwoIHZhbHVlICk7XG5cdFx0fSBlbHNlIGlmICggdGFyZ2V0LnR5cGUgPT09ICdlbGVtZW50Jykge1xuXHRcdFx0dGFyZ2V0LmVsZW0uaW5uZXJIVE1MID0gdmFsdWU7XG5cdFx0fVxuXHR9O1xuXG59O1xuIiwiLy8gc3JjL2NvcmUvY29tcG9uZW50LmpzXG5pbXBvcnQgeyBpbml0TWl4aW4gfSBmcm9tICcuL2luaXRNaXhpbic7XG5pbXBvcnQgeyBzY3JpcHRNaXhpbiB9IGZyb20gJy4vc2NyaXB0TWl4aW4nO1xuXG5cbmZ1bmN0aW9uIENlbCggb3B0aW9ucyApIHtcblx0dGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lIHx8ICdOYW1lbGVzc0NvbXBvbmVudCc7XG5cdHRoaXMuZGVwZW5kZW5jaWVzID0gb3B0aW9ucy5kZXBlbmRlbmNpZXM7XG5cdHRoaXMuXyA9IG9wdGlvbnMuXztcblx0dGhpcy5zdGF0ZSA9IG9wdGlvbnMuc3RhdGU7XG5cdHRoaXMuZWxlbXMgPSBvcHRpb25zLmVsZW1zO1xuXHR0aGlzLm1ldGhvZHMgPSBvcHRpb25zLm1ldGhvZHM7XG5cdHRoaXMuaGFuZGxlcnMgPSBvcHRpb25zLmhhbmRsZXJzO1xuXHR0aGlzLmV2ZW50cyA9IG9wdGlvbnMuZXZlbnRzO1xuXHR0aGlzLmV4cG9zZWQgPSBvcHRpb25zLmV4cG9zZWQ7XG59XG5cbmluaXRNaXhpbiggQ2VsICk7XG5zY3JpcHRNaXhpbiggQ2VsICk7XG5cblxuZXhwb3J0IGRlZmF1bHQgQ2VsO1xuIiwiLy8gc3JjL2hlbHBlcnMvZXhwb3NlRnVuY3Rpb25zLmpzXG5cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZXhwb3NlRnVuY3Rpb25zKCBjZWwgKSB7XG5cblx0dmFyIGV4cG9zZWQgPSB7XG5cdFx0X19jdHhfXzogY2VsLl9fY3R4X18uYmluZChjZWwpLFxuXHRcdGluaXQ6IGNlbC5pbml0LmJpbmQoY2VsKSxcblx0XHRnZXROYW1lOiBjZWwuZ2V0TmFtZS5iaW5kKGNlbClcblx0fTtcblxuXHQvLyBOdWxsLWNoZWNrIGZvciBleHBvc2VkIGZ1bmN0aW9uc1xuXHRpZiAoIGNlbC5leHBvc2VkICE9IG51bGwgKSB7XG5cdFx0aWYgKCAvLyBFbnN1cmUgZXhwb3NlZCBpcyBhbiBhcnJheS5cblx0XHRcdEFycmF5LmlzQXJyYXkoIGNlbC5leHBvc2VkICkgJiZcblx0XHRcdGNlbC5leHBvc2VkLmxlbmd0aCA+IDBcblx0XHQpIHtcblx0XHRcdC8vIEVuc3VyZSB1c2VyIGRpZCBub3QgdHJ5IHRvIHBhc3MgJ2luaXQnIGluIHRoZSBleHBvc2VkIGxpc3QuXG5cdFx0XHQvLyBTaGUvaGUgc2hvdWxkIHVzZSBhIGRpZmZlcmVudCBmdW5jdGlvbiBuYW1lLlxuXHRcdFx0aWYgKCBjZWwuZXhwb3NlZC5pbmRleE9mKCdpbml0JykgPiAwICkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oJ1snK2NlbC5uYW1lKyddOiBUaGUgXFwnaW5pdFxcJyBwcm9wZXJ0eSBpcyBhbHJlYWR5IHRha2VuIGJ5IENlbCwgcGxlYXNlIHVzZSBhIGRpZmZlcmVudCBuYW1lIGZvciB5b3VyIGZ1bmN0aW9uLicpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gQXR0YWNoIGFsbCBleHBvc2VkIGZ1bmN0aW9ucyB0byB0aGUgJ2V4cG9zZWQnIG9iamVjdC5cblx0XHRcdFx0Zm9yICggbGV0IGkgPSAwLCBudW1FeHBvID0gY2VsLmV4cG9zZWQubGVuZ3RoOyBpIDwgbnVtRXhwbzsgaSsrICkge1xuXHRcdFx0XHRcdGlmICggY2VsLm1ldGhvZHMuaGFzT3duUHJvcGVydHkoIGNlbC5leHBvc2VkW2ldICkgKSB7XG5cdFx0XHRcdFx0XHRleHBvc2VkWyBjZWwuZXhwb3NlZFtpXSBdID0gY2VsLm1ldGhvZHNbIGNlbC5leHBvc2VkW2ldIF0uYmluZCggY2VsICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnNvbGUud2FybignWycrY2VsLm5hbWUrJ106IFBsZWFzZSBlbnN1cmUgdGhlIFxcJ2V4cG9zZWRcXCcgcHJvcGVydHkgaXMgYW4gYXJyYXkgb2Ygc3RyaW5ncy4nKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZXhwb3NlZDtcbn1cbiIsIi8vIHNyYy9oZWxwZXJzL2luaXRBdmFpbGFibGVDb21wb25lbnRzLmpzXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGluaXRBdmFpbGFibGVDb21wb25lbnRzKCBuYW1lc3BhY2UgKSB7XG4gIGlmICggbmFtZXNwYWNlID09IG51bGwgKSB7XG4gICAgY29uc29sZS53YXJuKCdNdXN0IHByb3ZpZGUgYSBnbG9iYWwgb2JqZWN0IGFzIHlvdXIgbmFtZXNwYWNlIGZvciB5b3VyIGNvbXBvbmVudHMuJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgd2luZG93LkNlbC5zZXR0aW5ncyA9IHdpbmRvdy5DZWwuc2V0dGluZ3MgfHwge307XG4gIHdpbmRvdy5DZWwuc2V0dGluZ3MubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuXG4gIHZhciBfcm91dGUgPSAnJztcbiAgdmFyIGFjdGlvbiA9ICdpbml0JztcbiAgdmFyIGRhdGFBY3Rpb25BdHRyID0gJ2RhdGEtYWN0aW9uJztcbiAgdmFyIGRvdFJlZ2V4ID0gL1xcLi87XG5cbiAgdmFyIHNldFJvdXRlID0gZnVuY3Rpb24oIHJvdXRlU3RyaW5nICkge1xuICAgICAgX3JvdXRlID0gcm91dGVTdHJpbmc7XG4gIH07XG5cbiAgdmFyIGdldFJvdXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIF9yb3V0ZTtcbiAgfTtcblxuICB2YXIgbG9jYXRlUm91dGFibGVFbGVtZW50c0luRE9NID0gZnVuY3Rpb24oIGF0dHJpYnV0ZSApIHtcbiAgICAgIHZhciBtYXRjaGluZ0VsZW1zID0gW107XG4gICAgICB2YXIgYWxsRWxlbXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnKicpO1xuXG4gICAgICBmb3IgKCB2YXIgaSA9IDAsIG51bUVsZW1zID0gYWxsRWxlbXMubGVuZ3RoOyBpIDwgbnVtRWxlbXM7IGkgPSBpICsgMSApIHtcbiAgICAgICAgICAvLyBFbGVtZW50IGV4aXN0cyB3aXRoIGF0dHJpYnV0ZS4gQWRkIHRvIGFycmF5LlxuICAgICAgICAgIGlmICggYWxsRWxlbXNbaV0uZ2V0QXR0cmlidXRlKCBhdHRyaWJ1dGUgKSAhPT0gbnVsbCApIHtcbiAgICAgICAgICAgICAgbWF0Y2hpbmdFbGVtcy5wdXNoKCBhbGxFbGVtc1tpXSApO1xuICAgICAgICAgIH1cbiAgICAgIH0gLy8gZm9yXG5cbiAgICAgIHJldHVybiBtYXRjaGluZ0VsZW1zO1xuICB9O1xuXG4gIHZhciBnZXRSb3V0ZU9iamVjdCA9IGZ1bmN0aW9uKCByb3V0ZSApIHtcbiAgICB2YXIgbGF0ZXN0SW5kZXggPSBuYW1lc3BhY2U7XG4gICAgcm91dGVcbiAgICAuc3BsaXQoJy4nKVxuICAgIC5tYXAoIGZ1bmN0aW9uKCBpdGVtLCBpICkge1xuICAgICAgbGF0ZXN0SW5kZXggPSBsYXRlc3RJbmRleFsgaXRlbSBdO1xuICAgIH0pO1xuICAgIHJldHVybiBsYXRlc3RJbmRleDtcbiAgfTtcblxuICB2YXIgZXhlY3V0ZVJvdXRlRm9yRWxlbWVudCA9IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuICAgICAgdmFyIHJvdXRlID0gZ2V0Um91dGUoKTtcblxuICAgICAgaWYgKCByb3V0ZSAhPT0gJycgKSB7XG4gICAgICAgIC8vIFRoZSByb3V0ZSBpcyB1c2luZyBkb3Qgbm90YXRpb24uXG4gICAgICAgIGlmICggZG90UmVnZXgudGVzdCggcm91dGUgKSkge1xuICAgICAgICAgIHZhciByb3V0ZU9iaiA9IGdldFJvdXRlT2JqZWN0KCByb3V0ZSApO1xuICAgICAgICAgIHJvdXRlT2JqW2FjdGlvbl0oIGVsZW1lbnQgKTtcbiAgICAgICAgfSAvLyBpZiBkb3RSZWdleFxuXG4gICAgICAgIC8vIFRoZSBjb21wb25lbnQgc2hvdWxkIGJlIGluIHRoZSBmaXJzdCBoaWVyYXJjaHksXG4gICAgICAgIC8vIGxpa2UgXCJBUFAuY29tcG9uZW50TmFtZVwiXG4gICAgICAgIGVsc2UgaWYgKFxuICAgICAgICAgIG5hbWVzcGFjZVtyb3V0ZV0gJiZcbiAgICAgICAgICB0eXBlb2YgbmFtZXNwYWNlW3JvdXRlXVthY3Rpb25dID09PSAnZnVuY3Rpb24nXG4gICAgICAgICkge1xuICAgICAgICAgIG5hbWVzcGFjZVtyb3V0ZV1bYWN0aW9uXSggZWxlbWVudCApO1xuICAgICAgICB9IC8vIGVsc2UgaWZcblxuICAgICAgfSAvLyBpZiByb3V0ZVxuICB9O1xuXG4gIHZhciBpbml0RGVwZW5kZW5jaWVzID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gY2hlY2sgZWFjaCBpbnN0YW5jZSBmb3IgZGVwZW5kZW5jaWVzLlxuICAgIHdpbmRvdy5DZWwuaW5zdGFuY2VzLm1hcChmdW5jdGlvbiggaW5zdGFuY2UsIGkgKSB7XG4gICAgICB2YXIgY2VsID0gaW5zdGFuY2UuX19jdHhfXygpO1xuICAgICAgLy8gY2hlY2sgaWYgaW5zdGFuY2UgaGFzIGRlcGVuZGVuY2llcy5cbiAgICAgIGlmICggY2VsLmRlcGVuZGVuY2llcyAhPSBudWxsICYmIGNlbC5kZXBlbmRlbmNpZXMubGVuZ3RoID4gMCApIHtcbiAgICAgICAgLy8gZmluZCBhbiBpbnN0YW5jZSBmb3IgZWFjaCBkZXBlbmRlbmN5LlxuICAgICAgICBjZWwuZGVwZW5kZW5jaWVzLm1hcChmdW5jdGlvbiggZGVwZW5kZW5jeSwgaSApIHtcbiAgICAgICAgICAvLyBmaW5kIG1hdGNoaW5nIGRlcGVuZGVuY3kgZnJvbSBpbnN0YW5jZXMuXG4gICAgICAgICAgdmFyIGRlcCA9IHdpbmRvdy5DZWwuaW5zdGFuY2VzLmZpbHRlcihmdW5jdGlvbiggaW5zdCwgaiApIHtcbiAgICAgICAgICAgIHJldHVybiBpbnN0LmdldE5hbWUoKSA9PT0gZGVwZW5kZW5jeTtcbiAgICAgICAgICB9KVswXTtcbiAgICAgICAgICAvLyBpbml0IGlmIGl0IGhhcyBub3QgeWV0IGJlZW4gaW5pdCdkLlxuICAgICAgICAgIGlmICggdHlwZW9mIGRlcC5pbml0ID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgZGVwLmluaXQoKTsgLy8gaW5pdCBkZXBlbmRlbmN5XG4gICAgICAgICAgICAvLyBbVE9ET106IE5lZWRzIHRlc3RpbmcgdG8gc2VlIGlmIGl0IHByZXZlbnRzL2NhdXNlcyBlcnJvcnNcbiAgICAgICAgICAgIGRlcC5pbml0ID0gbnVsbDsgLy8gcHJldmVudCBtdWx0aXBsZSBpbml0aWFsaXphdGlvbnMuXG4gICAgICAgICAgfVxuICAgICAgICAgIGNlbC4kID0gY2VsLiQgfHwge307XG4gICAgICAgICAgY2VsLiRbZGVwZW5kZW5jeV0gPSBkZXA7IC8vIGFkZCByZWZlcmVuY2UgZm9yIGNvbXBvbmVudFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICB2YXIgaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJvdXRlcyA9IGxvY2F0ZVJvdXRhYmxlRWxlbWVudHNJbkRPTSggZGF0YUFjdGlvbkF0dHIgKTtcblxuICAgICAgLy8gSW5pdCBjb21wb25lbnRzXG4gICAgICBmb3IgKCB2YXIgaSA9IDAsIG51bVJvdXRlcyA9IHJvdXRlcy5sZW5ndGg7IGkgPCBudW1Sb3V0ZXM7IGkrKyApIHtcbiAgICAgICAgICB2YXIgZWxlbWVudCA9IHJvdXRlc1tpXTtcbiAgICAgICAgICBzZXRSb3V0ZSggZWxlbWVudC5nZXRBdHRyaWJ1dGUoIGRhdGFBY3Rpb25BdHRyICkgKTtcbiAgICAgICAgICBleGVjdXRlUm91dGVGb3JFbGVtZW50KCBlbGVtZW50ICk7XG4gICAgICB9IC8vIGZvclxuICAgICAgaW5pdERlcGVuZGVuY2llcygpO1xuICB9O1xuXG4gIGluaXQoKTtcbn1cbiIsIi8vIHNyYy9jb3JlL2NlbC5qc1xuaW1wb3J0IENvbXBvbmVudCBmcm9tICcuL2NvbXBvbmVudCc7XG5pbXBvcnQgZXhwb3NlRnVuY3Rpb25zIGZyb20gJy4uL2hlbHBlcnMvZXhwb3NlRnVuY3Rpb25zJztcbmltcG9ydCBpbml0QXZhaWxhYmxlQ29tcG9uZW50cyBmcm9tICcuLi9oZWxwZXJzL2luaXRBdmFpbGFibGVDb21wb25lbnRzJztcblxuY29uc3QgQ2VsID0gZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdHdpbmRvdy5DZWwuaW5zdGFuY2VzID0gd2luZG93LkNlbC5pbnN0YW5jZXMgfHwgW107XG5cblx0Ly8gTWFrZSBjb21wb25lbnQuXG5cdGlmICggb3B0aW9ucyAhPSBudWxsICkge1xuXHRcdGxldCBjZWwgPSBuZXcgQ29tcG9uZW50KCBvcHRpb25zICk7XG5cdFx0Ly8gRXhwb3NlcyBzcGVjaWZpZWQgZnVuY3Rpb25zIGZvciBwdWJsaWMgdXNlLlxuXHRcdGNlbCA9IGV4cG9zZUZ1bmN0aW9ucyggY2VsICk7XG5cdFx0Ly8gQWRkcyBjZWwgdG8gbGlzdCBvZiBDZWwgaW5zdGFuY2VzLlxuXHRcdHdpbmRvdy5DZWwuaW5zdGFuY2VzLnB1c2goIGNlbCApO1xuXHRcdC8vIFJldHVybiBjZWwgY29tcG9uZW50IHdpdGggZXhwb3NlZCBmdW5jdGlvbnMuXG5cdFx0cmV0dXJuIGNlbDtcblx0fVxuXG5cdC8vIEluaXRpYWxpemUgY29tcG9uZW50c1xuXHRlbHNlIGlmICggb3B0aW9ucyA9PSBudWxsICkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRpbml0OiBpbml0QXZhaWxhYmxlQ29tcG9uZW50c1xuXHRcdH07XG5cdH1cblxuXHQvLyBXYXJuIG9mIGJhZCBjb25maWcuXG5cdGVsc2Uge1xuXHRcdGNvbnNvbGUud2FybignVGhlcmUgd2FzIGJhZCBjb25maWd1cmF0aW9ucyB3aXRoIGEgQ2VsIGNvbXBvbmVudC4gWW91IG11c3QgcGFzcyBvcHRpb25zIGZvciBhIGNlbCBjb21wb25lbnQsIG9yIFwibnVsbFwiIGFuZCBhIG5hbWVzcGFjZSBvYmplY3QgYXMgYSBwYXJhbWV0ZXIgdG8gaW5pdGlhbGl6ZSB5b3VyIGNvbXBvbmVudHMuJyk7XG5cdH1cblxufTtcblxuZXhwb3J0IGRlZmF1bHQgQ2VsO1xuIiwiLy8gc3JjL2luZGV4LmpzXG5pbXBvcnQgQ2VsIGZyb20gJy4vY29yZS9jZWwuanMnO1xuXG5cbmV4cG9ydCBkZWZhdWx0IENlbDsiXSwibmFtZXMiOlsiaW5pdE1peGluIiwiQ2VsIiwicHJvdG90eXBlIiwiX2dldEVsZW1lbnRzT25Nb3VudCIsInZtIiwiZWxlbXMiLCJpIiwibnVtRWxlbSIsImxlbmd0aCIsIndpbmRvdyIsImpRdWVyeSIsIiQiLCJuYW1lIiwic2xpY2UiLCJlbGVtIiwic2VsZWN0b3IiLCJ0eXBlIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yIiwiX2JpbmRUaGlzVG9NZXRob2RzIiwibWV0aG9kcyIsIk9iamVjdCIsImtleXMiLCJudW1NZXRob2RzIiwiYmluZCIsIl9iaW5kRXZlbnRzT25Nb3VudCIsImV2ZW50cyIsIm51bUV2ZW50cyIsImZpbmRFdmVudFRhcmdldEluRWxlbWVudHMiLCJlbEluZGV4IiwiaXRlbSIsImluZGV4IiwidGFyZ2V0IiwiZmlsdGVyIiwiYmluZFR5cGUiLCJmdW5jIiwiaGFuZGxlcnMiLCJoYW5kbGVyIiwiZGVib3VuY2UiLCJ0aHJvdHRsZSIsIndhcm4iLCJfZGVib3VuY2UiLCJfdGhyb3R0bGUiLCJfY2hlY2tDb21wb25lbnRTZXR0aW5ncyIsImdldE5hbWUiLCJfX2N0eF9fIiwiaW5pdCIsInNjcmlwdE1peGluIiwid2FpdCIsImltbWVkaWF0ZSIsInRpbWVvdXQiLCJjb250ZXh0IiwiYXJncyIsImFyZ3VtZW50cyIsImxhdGVyIiwiYXBwbHkiLCJjYWxsTm93Iiwic2V0VGltZW91dCIsIm9wdGlvbnMiLCJyZXN1bHQiLCJwcmV2aW91cyIsImxlYWRpbmciLCJEYXRlIiwibm93IiwicmVtYWluaW5nIiwidHJhaWxpbmciLCJmZXRjaCIsInVybCIsInN1Y2Nlc3NDYWxsYmFjayIsImVycm9yQ2FsbGJhY2siLCJyZXEiLCJYTUxIdHRwUmVxdWVzdCIsIm9ubG9hZCIsInN0YXR1cyIsInJlc3BvbnNlVGV4dCIsInN0YXR1c1RleHQiLCJvcGVuIiwic2VuZCIsInNldFN0YXRlIiwic3RhdGUiLCJ2YWx1ZSIsImVyciIsInNldFN0YXRlQXN5bmMiLCJhc3luY1Rhc2siLCJhc3luY0NhbGxiYWNrIiwicCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiZGF0YSIsInRoZW4iLCJjYXRjaCIsImxvZyIsInNldEh0bWwiLCJmaW5kVGFyZ2V0SW5FbGVtZW50cyIsImh0bWwiLCJpbm5lckhUTUwiLCJkZXBlbmRlbmNpZXMiLCJfIiwiZXhwb3NlZCIsImV4cG9zZUZ1bmN0aW9ucyIsImNlbCIsImlzQXJyYXkiLCJpbmRleE9mIiwibnVtRXhwbyIsImhhc093blByb3BlcnR5IiwiaW5pdEF2YWlsYWJsZUNvbXBvbmVudHMiLCJuYW1lc3BhY2UiLCJzZXR0aW5ncyIsIl9yb3V0ZSIsImFjdGlvbiIsImRhdGFBY3Rpb25BdHRyIiwiZG90UmVnZXgiLCJzZXRSb3V0ZSIsInJvdXRlU3RyaW5nIiwiZ2V0Um91dGUiLCJsb2NhdGVSb3V0YWJsZUVsZW1lbnRzSW5ET00iLCJhdHRyaWJ1dGUiLCJtYXRjaGluZ0VsZW1zIiwiYWxsRWxlbXMiLCJnZXRFbGVtZW50c0J5VGFnTmFtZSIsIm51bUVsZW1zIiwiZ2V0QXR0cmlidXRlIiwicHVzaCIsImdldFJvdXRlT2JqZWN0Iiwicm91dGUiLCJsYXRlc3RJbmRleCIsInNwbGl0IiwibWFwIiwiZXhlY3V0ZVJvdXRlRm9yRWxlbWVudCIsImVsZW1lbnQiLCJ0ZXN0Iiwicm91dGVPYmoiLCJpbml0RGVwZW5kZW5jaWVzIiwiaW5zdGFuY2VzIiwiaW5zdGFuY2UiLCJkZXBlbmRlbmN5IiwiZGVwIiwiaW5zdCIsImoiLCJyb3V0ZXMiLCJudW1Sb3V0ZXMiLCJDb21wb25lbnQiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7QUFHQSxBQUFPLFNBQVNBLFNBQVQsQ0FBbUJDLEdBQW5CLEVBQXdCOzs7S0FHMUJDLFNBQUosQ0FBY0MsbUJBQWQsR0FBb0MsWUFBVztNQUN4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
