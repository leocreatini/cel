// src/core/prototypesMixin.js


export function prototypesMixin(Cel) {
	Cel.prototype._getElementsOnMount = function() {
		const vm = this;
		if ( vm.elems.length > 0 ) {
			for ( var i = 0, numElem = vm.elems.length; i < numElem; i++ ) {
				if ( (jQuery != null || $ != null) &&
					vm.elems[i].name.slice(0, 1) === '$'
				) {
					vm.elems[i].elem = $( vm.elems[i].selector );
					vm.elems[i].type = 'jquery';
				} else {
					vm.elems[i].elem = document.querySelector( vm.elems[i].selector );
					vm.elems[i].type = 'element';
				}
			} // for
		} // if
	};


	Cel.prototype._bindThisToMethods = function() {
		const vm = this;
		var methods = Object.keys(vm.methods);
		if ( methods.length > 0 ) {
			for (
				var i = 0,
				numMethods = methods.length;
				i < numMethods;
				i = i+1
			) {
				vm.methods[ methods[i] ] = vm.methods[ methods[i] ].bind(vm);
			} // for
		} // if
	};


	Cel.prototype._bindEventsOnMount = function() {
		const vm = this;
		var numEvents = vm.events.length;
		if ( vm.elems.length > 0 && numEvents > 0) {

			// Filters out an element that matches the event's target.
			var findEventTargetInElements = function( elIndex, item, index ) {
				return item.name === vm.events[ elIndex ].target;
			};

			// Binds each event to its designated target
			for ( var i = 0; i < numEvents; i++ ) {
				var target = vm.elems.filter( findEventTargetInElements.bind(vm, i) )[0];
				var bindType = ( target.type === 'jquery' ) ? 'on' : 'addEventListener';

				var func = vm.handle[ vm.events[i].handler ].bind(vm)

				if (
					vm.events[i].debounce != null &&
					typeof vm.events[i].debounce === 'number' &&
					vm.events[i].debounce > 0
				) {
					func = vm._debounce( func, vm.events[i].debounce );
				} // if

				target.elem[ bindType ](
					vm.events[ i ].type,
					func
				);
			} // for numEvents
		} // if elems.length
	};


	// From David Walsh
	Cel.prototype._debounce = function(func, wait, immediate) {
		//const vm = this;
		var timeout;
		return function() {
			var context = this;
			var args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) {
					func.apply(context, args);
				}
			};
			var callNow = (immediate && !timeout);
			clearTimeout( timeout );
			timeout = setTimeout(later, wait);
			if (callNow) {
				func.apply(context, args);
			}
		};
	};


	Cel.prototype.setState = function( prop, value ) {
		const vm = this;
		try {
			vm.state[ prop ] = value;
		} catch (e) {
			return;
		}
	};


	Cel.prototype.init = function() {
		const vm = this;
		vm._getElementsOnMount();
		vm._bindThisToMethods();
		vm._bindEventsOnMount();
	};

};