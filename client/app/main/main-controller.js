(function() {

  'use strict';

  /*
   * Reference the App Module to attach a controller
   *
   * controllerAs Controller Syntax
   * Helps avoid the temptation of using $scope methods inside a controller when it may otherwise be better to
   * avoid them or move the method to a factory, and reference them from the controller.
   *
   * We'll use the controllerAs syntax by declaring the controller to be 'MainController as main', which
   * means that we’ll reference the MainController as main within our Views (e.g., layout.html).
   *
   * Consider using $scope in a controller only when needed. For example when publishing or subscribing to events.
   * $broadcast: Sends events from a parent scope downward to its children.
   * $emit: Sends events from a child upward to its parent.
   * $on: Listens for an event and responds.
   */

  /*
   * Use UpperCamelCase when naming controllers, as they are constructors.
   */

  angular.module('app.main')
    .controller('MainController', MainController);

  /*
   * Use $inject to manually identify your dependencies for Angular components.
   * This technique mirrors the technique used by ng-annotate, for automating the creation of minification safe
   * dependencies. If ng-annotate detects injection has already been made, it will not duplicate it.
   */

  MainController.$inject = ['$log', '$translate', '$scope', 'containersModel', 'shapesModel',
    'paperSizesModel', 'fontFamiliesModel', 'fontSizesModel', 'themesModel', 'fabric', 'fabricConfig'];

  function MainController($log, $translate, $scope, containersModel, shapesModel,
                          paperSizesModel, fontFamiliesModel, fontSizesModel, themesModel, fabric, fabricConfig) {

    $log.debug('MainController');

    /*
     * Per common convention, I like to store a reference to the top-level this object (this has a habit
     * of changing context based on function level scope). I also like to name the reference to this, the
     * same name that I declare the controllerAs (e.g., MainController as main).
     * This makes it easier to read and connect the dots as you jump between the HTML and the JavaScript.
     */

    var main = this;

    //
    // Shapes and Containers
    //

    main.shapes = null;
    main.containers = null;

    main.containerDefaults = angular.copy(fabricConfig.getRectWithTextDefaults());

    //
    // Format Diagram
    //

    const A4_ARRAY_INDEX = 1;

    main.diagram = {};
    // main.diagram.paperSize = main.paperSizes[A4_ARRAY_INDEX].value;

    main.paperSizes = null;
    main.pageView = {};
    main.pageView.portrait = true;
    main.pageView.landscape = false;

    //
    // Format Shape
    //

    main.formatShape = false;
    main.shape = {};

    main.fontFamilies = null;
    main.fontSizes = null;
    main.themes = null;

    main.nodeId = 1;

    main.nodeDefaults = angular.copy(fabricConfig.getRectWithTextDefaults());

    //
    // Canvas
    //

    main.canvas = null;
    main.grid = { show: true, snapTo: false};

    main.getShapes = function () {
      shapesModel.find()
        .then(function (response) {
          main.shapes = (response !== 'null') ? response.data : [];
        }, function (response) {
          $log.error('MainController - could not load shapes');
        });
    };

    main.getContainers = function () {
      containersModel.find()
        .then(function (response) {
          main.containers = (response !== 'null') ? response.data : [];
        }, function (response) {
          $log.error('MainController - could not load containers');
        });
    };

    main.getPaperSizes = function () {
      paperSizesModel.find()
        .then(function (response) {
          main.paperSizes = (response !== 'null') ? response.data : [];
          main.diagram.paperSize = main.paperSizes[A4_ARRAY_INDEX].value;
        }, function (response) {
          $log.error('MainController - could not load paper sizes');
        });
    };

    main.getFontFamilies = function () {
      fontFamiliesModel.find()
        .then(function (response) {
          main.fontFamilies = (response !== 'null') ? response.data : [];
        }, function (response) {
          $log.error('MainController - could not load font families');
        });
    };

    main.getFontSizes = function () {
      fontSizesModel.find()
        .then(function (response) {
          main.fontSizes = (response !== 'null') ? response.data : [];
        }, function (response) {
          $log.error('MainController - could not load font sizes');
        });
    };

    main.getThemes = function () {
      themesModel.find()
        .then(function (response) {
          main.themes = (response !== 'null') ? response.data : [];
        }, function (response) {
          $log.error('MainController - could not load themes');
        });
    };

    main.getShapes();
    main.getContainers();
    main.getPaperSizes();
    main.getFontFamilies();
    main.getFontSizes();
    main.getThemes();

    main.init = function () {

      $log.debug('MainController - init()');

      main.canvas = fabric.getCanvas();

      main.toggleGrid();

      /*
       * Listen for Fabric 'object:selected' event
       */

      main.canvas.on('object:selected', function(element) {

        $log.debug('MainController - object:selected');

        fabric.objectSelectedListener(element);

        main.shape = fabric.getActiveObject();
        main.formatShape = true;

        document.getElementById("format-diagram-container").style.display = "none";
        document.getElementById("format-shape-container").style.display = "block";
      });

      /*
       * Listen for Fabric 'selection:cleared' event
       */

      main.canvas.on('selection:cleared', function(element) {

        $log.debug('MainController - selection:cleared');

        fabric.selectionClearedListener(element);

        main.shape = null;
        main.formatShape = false;

        document.getElementById("format-shape-container").style.display = "none";
        document.getElementById("format-diagram-container").style.display = "block";
      });

    };

    /*
     * Listen for 'canvas:created' event $broadcast by fabricCanvas
     */

    $scope.$on('canvas:created', main.init);

    main.newShape = function(name, fill) {

      $log.debug('MainController.newShape()');

      main.newNode(name, fill);
    };

    // const GRID_SIZE = 50;

    main.newNode = function(name, fill) {

      $log.debug('MainController.newNode()');

      fabric.setConnectorMode(false);

      name = name || 'NODE';
      fill = fill || 'GRAY';  // http://htmlcolorcodes.com/color-names/
      main.nodeDefaults.fill = fill;

      $translate(name)
        .then(function (translatedValue) {

          var id = main.nodeId++;
          var text = translatedValue + ' ' + id;

          // main.nodeDefaults.left = (main.nodeDefaults.width * id) + (GRID_SIZE * id);

          var object = fabric.addRectWithText(text, main.nodeDefaults);
          object.set('type', 'node');

          // object(fromPort) <-- toArrow -- connector(fromLine or toLine) -- fromArrow --> (toPort)otherObject

          // object.connectors = { fromPort: [], fromLine: [], fromArrow: [], toPort: [], toLine: [], toArrow: [], otherObject: [] };
          object.connectors = { fromPort: [], toArrow: [], fromLine: [],  toLine: [], fromArrow: [], toPort: [], otherObject: [] };

          fabric.setActiveObject(object);
        });
    };

    const RECT_WIDTH = 300;
    const RECT_HEIGHT = 300;
    const FONT_SIZE = '20';
    const FONT_WEIGHT = 'bold';

    main.newContainer = function(name, fill) {

      $log.debug('MainController.newContainer()');

      fabric.setConnectorMode(false);

      name = name || 'CONTROLLED_ZONE';
      fill = fill || 'GRAY';
      main.containerDefaults.fill = fill;
      main.containerDefaults.fontSize = FONT_SIZE;
      main.containerDefaults.fontWeight = FONT_WEIGHT;
      main.containerDefaults.width = RECT_WIDTH;
      main.containerDefaults.height = RECT_HEIGHT;
      main.containerDefaults.textYAlign = 'top';

      $translate(name)
        .then(function (translatedValue) {
          var object = fabric.addRectWithText(translatedValue, main.containerDefaults);
          object.set('type', 'container');

          fabric.setActiveObject(object);
        });
    };

    main.fileNew = function() {
      $log.debug('MainController.fileNew()');
    };

    main.editDelete = function() {
      $log.debug('MainController.editDelete()');
      fabric.removeActiveObjectFromCanvas();
    };

    main.togglePageViewOrientation = function() {
      $log.debug('MainController.togglePageViewOrientation()');
      main.pageView.portrait = !main.pageView.portrait;
      main.pageView.landscape = !main.pageView.portrait;
    };

    main.toggleGrid = function() {
      $log.debug('MainController.toggleGrid()');
      main.grid.show = !main.grid.show;
      fabric.showGrid(main.grid.show);
    };

    main.showGrid = function(flag) {
      $log.debug('MainController.showGrid()');
      main.grid.show = flag;
      fabric.showGrid(main.grid.show);
    };

    main.toggleSnapToGrid = function() {
      $log.debug('MainController.toggleSnapToGrid()');
      main.grid.snapTo = !main.grid.snapTo;
      fabric.snapToGrid(main.grid.snapTo);
    };

    main.snapToGrid = function(flag) {
      $log.debug('MainController.snapToGrid()');
      main.grid.snapTo = flag;
      fabric.snapToGrid(main.grid.snapTo);
    };

    main.setPointerMode = function() {
      $log.debug('MainController.setPointerMode()');
      fabric.setConnectorMode(false);
    };

    main.setConnectorMode = function() {
      $log.debug('MainController.setConnectorMode()');
      fabric.setConnectorMode(true);
      main.grid.snapTo = false;
      fabric.snapToGrid(main.grid.snapTo);
    };

    // Arrange Menu Items

    main.bringForward = function() {
      fabric.bringForward();
    };

    main.bringToFront = function() {
      fabric.bringToFront();
    };

    main.sendBackward = function() {
      fabric.sendBackward();
    };

    main.sendToBack = function() {
      fabric.sendToBack();
    };

    //
    // Language Menu Items
    //

    main.switchLanguage = function(key) {
      $log.debug('MainController.switchLanguage() - ' + key.toLocaleString());
      $translate.use(key);
    };

    // Format Shape

    // HTML5 Canvas
    // font-style: normal, italic and oblique
    // font-weight: normal, bold, bolder, lighter, 100-900

    main.toggleBold = function() {

      $log.debug('MainController.toggleBold()');

      if (main.shape.fontWeight.indexOf('bold') !== -1) {
        if (main.shape.fontWeight.indexOf('italic') !== -1) {
          main.shape.fontWeight = 'italic';
        } else {
          main.shape.fontWeight = '';
        }
      } else {
        if (main.shape.fontWeight.indexOf('italic') !== -1) {
          main.shape.fontWeight = 'bold italic';
        } else {
          main.shape.fontWeight = 'bold';
        }
      }

      $log.debug('MainController.toggleBold() - fontWeight: ' + main.shape.fontWeight);
    };

    main.toggleItalic = function() {

      $log.debug('MainController.toggleItalic()');

      if (main.shape.fontWeight.indexOf('italic') !== -1) {
        if (main.shape.fontWeight.indexOf('bold') !== -1) {
          main.shape.fontWeight = 'bold';
        } else {
          main.shape.fontWeight = '';
        }
      } else {
        if (main.shape.fontWeight.indexOf('bold') !== -1) {
          main.shape.fontWeight = 'bold italic';
        } else {
          main.shape.fontWeight = 'italic';
        }
      }

      $log.debug('MainController.toggleBold() - fontWeight: ' + main.shape.fontWeight);
    };

    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textAlign
    // left, right, center, start, end

    main.textXAlign = function(align) {

      $log.debug('MainController.textXAlign()');

      main.shape.textXAlign = align;

      $log.debug('MainController.textXAlign() - align: ' + main.shape.textXAlign);
    };

    // top, bottom, middle

    main.textYAlign = function(align) {

      $log.debug('MainController.textYAlign()');

      main.shape.textYAlign = align;

      $log.debug('MainController.textXAlign() - align: ' + main.shape.textYAlign);
    };

  }

})();

/*

 // https://coolors.co
 $log.debug('MainController - main.shape.text: ' + main.shape.text);
 $log.debug('MainController - main.shape.fontFamily: ' + main.shape.fontFamily);
 $log.debug('MainController - main.shape.fontSize: ' + main.shape.fontSize);


 main.setShapeName = function(name) {
 $log.debug('MainController.setShapeName()');
 // fabric.setActiveObject(main.shape);
 };

 */
