// src/core/component.js
import { prototypesMixin } from './prototypesMixin';


function Cel( options ) {
	this._ = options._;
	this.state = options.state;
	this.elems = options.elems;
	this.methods = options.methods;
	this.handle = options.handle;
	this.events = options.events;
}

prototypesMixin( Cel );

export default Cel;