// src/core/initMixin.js


export function initMixin(Cel) {
	// Finds elements via its selector and caches them under the 'elem' property
	// of that element.
	Cel.prototype._getElementsOnMount = function() {
		const vm = this;
		if ( vm.elems != null ) {
			for ( var i = 0, numElem = vm.elems.length; i < numElem; i++ ) {

				// If jQuery is available and using the '$elemName' convention,
				// Return a jQuery object.
				if ( (window.jQuery != null || window.$ != null) &&
					vm.elems[i].name.slice(0, 1) === '$'
				) {
					vm.elems[i].elem = $( vm.elems[i].selector );
					vm.elems[i].type = 'jquery';
				}

				// Else, just use vanilla javascript DOM node.
				else {
					vm.elems[i].elem = document.querySelector( vm.elems[i].selector );
					vm.elems[i].type = 'element';
				}
			} // for
		} // if
	};

	// Binds the component's "this" to the methods.
	// This is done to be able to call 'this.methods.functionName()' from other
	// methods and handlers.
	Cel.prototype._bindThisToMethods = function() {
		const vm = this;
		var methods = Object.keys(vm.methods);
		var numMethods = methods.length;
		if ( numMethods > 0 ) {
			for (
				var i = 0;
				i < numMethods;
				i = i+1
			) {
				vm.methods[ methods[i] ] = vm.methods[ methods[i] ].bind(vm);
			} // for
		} // if
	};

	// [TODO]: Refactor into smaller parts/mixins.
	// Adds event-listeners to target elements when component initializes.
	Cel.prototype._bindEventsOnMount = function() {
		const vm = this;
		// Ensure events aren't empty
		if ( vm.events != null ) {
			var numEvents = vm.events.length;

			// Ensure elements aren't empty and there's at least on event.
			if ( vm.elems != null && numEvents > 0) {

				// Filters out an element that matches the event's target.
				var findEventTargetInElements = function( elIndex, item, index ) {
					return item.name === vm.events[ elIndex ].target;
				};

				// Binds each event to its designated target
				// And add debounce or throttling if requested.
				for ( var i = 0; i < numEvents; i++ ) {
					var target = vm.elems.filter(
						findEventTargetInElements.bind(vm, i)
					)[0];
					var bindType = ( target.type === 'jquery' )
						? 'on'
						: 'addEventListener';
					var func = vm.handlers[ vm.events[i].handler ].bind(vm)

					// Prevent using Debounce and Throttle for same event.
					if (
						vm.events[i].debounce != null &&
						typeof vm.events[i].debounce === 'number' &&
						vm.events[i].throttle != null &&
						typeof vm.events[i].throttle === 'number'
					) {
						console.warn('['+vm.name+']: Cannot set both \'debounce\' and \'throttle\' configurations on the same event. Please use only one.');
					} // if

					// Add debouncing to function if setting is correct.
					else if ( vm.events[i].debounce != null ) {
						if (
							typeof vm.events[i].debounce === 'number' &&
							vm.events[i].debounce > 0
						) { // Setting is correct, adding debouncing.
							func = vm._debounce( func, vm.events[i].debounce );
						} else {
							console.warn('['+vm.name+']: Ensure your \'debounce\' setting is a number greater than 0.');
						}
					} // else if

					// Add throttling to function if setting is correct.
					else if ( vm.events[i].throttle != null ) {
						if (
							typeof vm.events[i].throttle === 'number' &&
							vm.events[i].throttle > 0
						) { // Setting is correct, adding throttling.
							func = vm._throttle( func, vm.events[i].throttle );
						} else {
							console.warn('['+vm.name+']: Ensure your \'throttle\' setting is a number greater than 0.');
						}
					} // else if

					// Binding callback event to target.
					target.elem[ bindType ](
						vm.events[ i ].type,
						func
					);
				} // for numEvents
			} // if elems.length
		} // if vm.events
	};

	// Ensuring the settings are correct.
	Cel.prototype._checkComponentSettings = function() {
		const vm = this;
		if (
			vm.name === null ||
			vm.name === '' ||
			vm.name === 'NamelessComponent'
		) {
			console.warn('Please ensure that you named all your components with a \'name\' property. At least one is missing right now.');
		}
	}

	Cel.prototype.getName = function() {
		return this.name;
	};

	Cel.prototype.__ctx__ = function() {
		return this;
	}

	// Publically accessible initialize function to bootstrap the component.
	Cel.prototype.init = function() {
		const vm = this;
		vm._checkComponentSettings();
		vm._getElementsOnMount();
		vm._bindThisToMethods();
		vm._bindEventsOnMount();
	};

};
