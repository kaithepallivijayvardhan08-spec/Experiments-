'use strict';

/**
 * whmk-hold="KEY" - fires scope.press(KEY, true/false) on touch/mouse hold.
 * Pointer events keep the phone controller responsive without 300ms delays.
 */
angular.module('keyboardGame').directive('whmkHold', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      const key = attrs.whmkHold;
      let down = false;

      function press(event) {
        event.preventDefault();
        if (down) {
          return;
        }
        down = true;
        element.addClass('is-down');
        scope.$apply(function () {
          scope.press(key, true);
        });
      }

      function release(event) {
        if (!down) {
          return;
        }
        event.preventDefault();
        down = false;
        element.removeClass('is-down');
        scope.$apply(function () {
          scope.press(key, false);
        });
      }

      element.on('pointerdown', press);
      element.on('pointerup', release);
      element.on('pointercancel', release);
      element.on('pointerleave', release);
      element.on('contextmenu', function (event) {
        event.preventDefault();
      });

      scope.$on('$destroy', function () {
        element.off();
      });
    }
  };
});
