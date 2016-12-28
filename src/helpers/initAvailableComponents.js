// src/helpers/initAvailableComponents.js

export default function initAvailableComponents( namespace ) {
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
      var matchingElements = [];
      var allElements = document.getElementsByTagName('*');

      for (
        var i = 0,
        numElems = allElements.length;
        i < numElems;
        i = i + 1
      ) {
          // Element exists with attribute. Add to array.
          if ( allElements[i].getAttribute(attribute) !== null ) {
              matchingElements.push( allElements[i] );
          }
      } // for

      return matchingElements;
  };

  var executeRouteForElement = function( element ) {
      var route = getRoute();

      if ( route !== '' ) {
        // The route is using dot notation.
        if ( dotRegex.test( route )) {
          var latestIndex = namespace;
          route
            .split('.')
            .map( function( item, i ) {
              latestIndex = latestIndex[ item ];
            });
          latestIndex[action]( element );
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

  var init = function() {
      var routes = locateRoutableElementsInDOM( dataActionAttr );

      for (
        var i = 0,
        numRoutes = routes.length;
        i < numRoutes;
        i++
      ) {
          var element = routes[i];
          setRoute( element.getAttribute( dataActionAttr ) );
          executeRouteForElement( element );
      } // for
  };

  init();
}
