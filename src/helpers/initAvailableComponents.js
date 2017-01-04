// src/helpers/initAvailableComponents.js

export default function initAvailableComponents( namespace ) {
  if ( namespace == null ) {
    console.warn('Must provide a global object as your namespace for your components.');
    return;
  }

  window.Cel.settings = window.Cel.settings || {};
  window.Cel.settings.namespace = namespace;

  var _route = '';
  var action = 'init';
  var dataActionAttr = 'data-action';
  var dotRegex = /\./;

  var setRoute = function( routeString ) {
      _route = routeString;
  };

  var getRoute = function () {
      return _route;
  };

  var locateRoutableElementsInDOM = function( attribute ) {
      var matchingElems = [];
      var allElems = document.getElementsByTagName('*');

      for ( var i = 0, numElems = allElems.length; i < numElems; i = i + 1 ) {
          // Element exists with attribute. Add to array.
          if ( allElems[i].getAttribute( attribute ) !== null ) {
              matchingElems.push( allElems[i] );
          }
      } // for

      return matchingElems;
  };

  var getRouteObject = function( route ) {
    var latestIndex = namespace;
    route
    .split('.')
    .map( function( item, i ) {
      latestIndex = latestIndex[ item ];
    });
    return latestIndex;
  };

  var executeRouteForElement = function( element ) {
      var route = getRoute();

      if ( route !== '' ) {
        // The route is using dot notation.
        if ( dotRegex.test( route )) {
          var routeObj = getRouteObject( route );
          routeObj[action]( element );
        } // if dotRegex

        // The component should be in the first hierarchy,
        // like "APP.componentName"
        else if (
          namespace[route] &&
          typeof namespace[route][action] === 'function'
        ) {
          namespace[route][action]( element );
        } // else if

      } // if route
  };

  var initDependencies = function() {
    // check each instance for dependencies.
    window.Cel.instances.map(function( instance, i ) {
      var cel = instance.__ctx__();
      // check if instance has dependencies.
      if ( cel.dependencies != null && cel.dependencies.length > 0 ) {
        // find an instance for each dependency.
        cel.dependencies.map(function( dependency, i ) {
          // find matching dependency from instances.
          var dep = window.Cel.instances.filter(function( inst, j ) {
            return inst.getName() === dependency;
          })[0];
          // init if it has not yet been init'd.
          if ( typeof dep.init === 'function' ) {
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

  var init = function() {
      var routes = locateRoutableElementsInDOM( dataActionAttr );

      // Init components
      for ( var i = 0, numRoutes = routes.length; i < numRoutes; i++ ) {
          var element = routes[i];
          setRoute( element.getAttribute( dataActionAttr ) );
          executeRouteForElement( element );
      } // for
      initDependencies();
  };

  init();
}
