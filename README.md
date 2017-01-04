# Cel
A JavaScript Component Micro-Framework


## Demo
Here's a playable Hello World demo on CodePen: http://codepen.io/leocreatini/pen/MbMeQo


## Why?
This is a way to keep code organized and self-contained in an easy way. It helps keeps things clean and sets up your scripts so you can run it on page-load or never (if the page doesn't require it). None of your state, methods, or elements are exposed because it's wrapped inside a Revealing Module, only an `init()` is publicly available.


## How To Use
First, include the script in your page/app.
```html
<script src="./assets/js/cel.min.js"></script>
```

```javascript
// You can also include as a module in your Javascript...

// ES2015
import Cel from 'cel';

// CommonJS
var Cel = require('cel');

// AMD (RequireJS)
define(['cel'], function(Cel) {
	// Your code...
});
```

Then you can use it by passing an object of component specifications. Here's an empty shell:

```javascript
var sampleComponent = Cel({
	name: '',
	_: {}, //constants
	state: {},
	elems: [],
	methods: {},
	handlers: {},
	events: []
});
```

After you have added your code, just init it. Like so:

```javascript
sampleComponent.init();
```

The init function is the only thing exposed from Cel components. Moreover, in the background it finds the elements from the DOM; adds event listeners and binds the callbacks; as well as bind the methods to the component -- letting us use the `this` like `this.methods.greet()` in other methods and handlers.

___Here's a simple example:___

```javascript
// app.hello-world.js
var APP = window.APP || {};

APP.helloWorld = Cel({
	name: 'HelloWorld',
	_: {
		NAME: 'Mr. Robot'
	},
	state: {
		clicks: 0
	},
	elems: [
		{ name: 'header', selector: '.widget__header' }, // vanillaJS
		{ name: '$textField', selector: '.widget__text-field' } // jQuery
	],
	methods: {
		greet: function( name ) {
			console.log( 'Hello, ' + name );
			this.setState( 'clicks', this.state.clicks + 1);
			console.log( 'CPU greeted ' + this.state.clicks + ' humans.' );
		},
		report: function( data ) {
			console.log( 'Reporting:', data );
		}
	},
	handlers: {
		headerClick: function(e) {
			this.methods.greet( this._.NAME );
		},
		textFieldValChanged: function(e) {
			this.methods.report( e.currentTarget.value );
		}
	},
	events: [
		{
			target: 'header',
			type: 'click',
			handler: 'headerClick'
		},
		{
			target: '$textField',
			type: 'input',
			handler: 'textFieldValChanged',
			debounce: 500
		}
	]
});

APP.helloWorld.init();
```


## Options
### name (string)
Provides a name to help debug in some cases.

### dependencies (array of strings)
A list to name other Cel modules that you want to use in the current module. So instead of using the stored variable name of your Cel component, like `APP.services.users`, you use `this.$['UserService']` (See /examples/service-component.html).

Once it's listed in here, it will run an init for that dependency if it has not been already. Afterwards, it will make the dependency available under the `this.$` object (which is only created when the current component's init if it has dependencies listed).

### _ (object)
A list for constants. Any static values that will not change, you can throw in here. As a convention, use fully UPPERCASED property names as a reminder that these values should be read-only and not be altered.

### state (object)
Any data that will change over time, place here.

You can use the `this.setState( 'statePropName', value );` to ensure no one is directly overwriting values. So there should be no assignment operators (`=`) in these Cel components.

For asynchronous state changes, like fetching data from an AJAX request, you can use the `this.setStateAsync()` method. It takes a state name (string), asynchronous function, and an optional callback.

```javascript
// From the "examples/service-component.html"
// app.controllers.widget.js

methods: {
	fetchData: function() {
		this.setStateAsync(
			'users', // a property in 'this.state' as string
			APP.services.users.getUsers, // async task, gets wrapped in a Promise
			this.methods.updateUIList // async callback
		);
	},
	updateUIList: function( data ) {
		this.setHtml( 'list', data );
	}
},

// code continues...
```

When this _fetchData_ method is called, it will run the _getUsers_ method from the _APP.services.users_ Cel component. This is an exposed method from that component. Once complete, it will update the target state with this new data. Afterwards, if it has a callback function, it will invoke it while passing the data to it.

```javascript
// app.services.users.js

methods: {
	// 'setStateAsync' wraps this 'getUsers' in a Promise.
	// Async functions require two params: 'onSuccess' and 'onFail'.
	getUsers: function(onSuccess, onFail) {
		if ( this.state.users.length < 1 ) {
			this.fetch( // an in-house ajax GET request.
				'https://api.github.com/users', // url endpoint
				this.methods.setUsers( onSuccess ), // on fetch success callback
				onFail // on fetch error callback
			);
		} else {
			return this.state.users;
		}
	},
	setUsers: function( newUsers ) {
		this.setState( 'users', newUsers );
		return this.state.users; // returns data to setStateAsync's callback method.
	}
	// other methods...
},
exposed: [ 'getUsers' ] // let's other components use the 'getUsers' method.
```


### elems (array of objects)
Elements that will be used to add behavior like attaching event listeners or updating values.
Each object in this array show have two properties: _name_ (string), and _selector_ (string).

```javascript
elems: [
  {
    name: 'widgetButton', // arbitrary name, will be referenced later in the events section.
    selector: '.widget__button' // any valid selector like a class, id, element, attribute, etc.
  }
]
```

Cel is jQuery-friendly. It runs by itself and does not depend on jQuery, but if you want to use it. You only need to start your element names with a `$`, like `$widgetButton`, and it will do the rest.

### methods (object of functions)
Put all your business logic in here. Any function that does any real work in your component should be a property in this object. It will be simply be referenced as `this.methods.functionName()` by other events and handlers.

### handlers (object of functions)
Handlers are a lot like the methods above except they are strictly callbacks to the component's events. They only run when an event you're listening to is fired. It's important to separate these from your methods to keep your code [DRY](https://en.wikipedia.org/wiki/Don't_repeat_yourself "Don't Repeat Yourself | Wikipedia") and improve it's reusability.

### events (array of objects)
This is to set up any type of event like clicks, changes, inputs, scroll, and so on. You pass in an element name from above, the event type, and the name of the handler. Additionally, you can add a `debounce` property along with how many milliseconds you want to debounce.

### exposed (array of strings)
A list of methods that you want to be made available for other components. The exposed method must be in the `methods` object of functions.



## Component Methods
There are some useful tools provided with each Cel component. You can leverage these to reduce dependency on some libraries like jQuery or Lodash (depending on your type of usage).

### this.setHtml( elem, value )
This works with vanilla JS or jQuery; it will update the HTML inside the element with the given value. This is helpful for controllers in updating UI with new data.

* elem - string
* value - any

### this.setState( state, value )
This updates the value of the state property with the provided value parameter. The first parameter must be a string with that's listed under the component's state.

* state - string
* value - any

### this.setStateAsync( state, asyncTask, asyncCallback )
Note: this does not add a Promise library, though to use this feature, it expects you to have it or provide one (under `window.Promise`).

* state - string
* asyncTask - function
* asyncCallback - function

### this.fetch( url, successCallback, errorCallback )
Fetch already exists for modern browsers, and this one works in just about the same fashion but is a bit more backwards compatible. It also works nicely with `setStateAsync()` as part of it's asyncTask.

* url - string
* successCallback - function
* errorCallback - function



## What's Next?
* ~~Add a _throttle_ setting for events to add another easy-to-use tool.~~
* ~~Add an _expose_ setting to make specified methods publicly available.~~
* ~~Add a way to dynamically `init()` each component that is actually present on the page.~~
* ~~Add dependency injection to initialize dependencies and make inter-modular code run more smoothly.~~
* Improve the docs, add a playable demo, and beef up the examples.
