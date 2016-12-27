# Cel
A JavaScript Component Micro-Framework


## Why?
This is a way to keep code organized and self-contained in an easy way. This helps keeps things clean and sets up your scripts so you can initialize it as soon as on page-load or never (if the page doesn't require it). None of your state, methods, or elements are exposed because it's wrapped inside a Revealing Module, only an `init()` is publically available.


## How To Use
First, include the script in your page/app.
```html
<script src="./assets/js/cel.min.js"></script>
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
		NAME: 'Leo'
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

### _ (object)
A list for constants. Any static values that will not change, you can throw in here. As a convention, use fully UPPERCASED property names as a reminder that these values should be read-only and not be altered.

### state (object)
Any data that will change over time, place here.

You can use the `this.setState( 'statePropName', value );` to ensure no one is directly overwriting values. So there should be no assignment operators (`=`) in these Cel components.

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

### handler (object of functions)
Handlers are a lot like the methods above except they are strictly callbacks to the component's events. They only run when an event you're listening to is fired. It's important to separate these from your methods to keep your code [DRY](https://en.wikipedia.org/wiki/Don't_repeat_yourself "Don't Repeat Yourself | Wikipedia") and improve it's reusability.

### events (array of objects)
This is to set up any type of event like clicks, changes, inputs, scroll, and so on. You pass in an element name from above, the event type, and the name of the handler. Additionally, you can add a `debounce` property along with how many milliseconds you want to debounce.


## What's Next?
~~* Add a _throttle_ setting for events to add another easy-to-use tool.~~ Added 12/26/2016
~~* Add a _throttle_ setting for events to add another easy-to-use tool.~~
~~* Add an _expose_ setting to make specified methods publically available.~~
* Improve the docs, add a playable demo, and beef up the examples.
