(function() {

  /*
   * Wrap Angular components in an Immediately Invoked Function Expression (IIFE).
   * An IIFE removes variables from the global scope. This helps prevent variables and function declarations
   * from living longer than expected in the global scope, which also helps avoid variable collisions.
   */

  'use strict';

  /*
   * Declare a new module called 'app.main', and list its dependencies.
   * Modules serve as containers to help you organise code within your AngularJS application.
   * Modules can contain sub-modules, making it easy to compose functionality as needed.
   */

  angular.module('app.main', [

    /*
     * Angular modules
     */

    'ngAnimate',
    'ui.bootstrap',
    'ui.router',

    /*
     * Our reusable cross app code modules
     */

    'blocks.exception',
    'blocks.endpoint',

    /*
     * 3rd Party modules
     */

    'pascalprecht.translate',
    'ui.fabric'

  ]);

})();
