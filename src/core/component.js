// src/core/component.js
import { initMixin } from './initMixin';
import { scriptMixin } from './scriptMixin';


function Cel( options ) {
	this.name = options.name || 'NamelessComponent';
	this._ = options._;
	this.state = options.state;
	this.elems = options.elems;
	this.methods = options.methods;
	this.handlers = options.handlers;
	this.events = options.events;
	this.exposed = options.exposed;
}

initMixin( Cel );
scriptMixin( Cel );


export default Cel;