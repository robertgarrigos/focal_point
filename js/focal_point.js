//@ sourceURL=focal_point.js

/**
 * @file
 * Javascript functionality for the focal point widget.
 */

(function($) {
  'use strict';

  /**
   * Focal Point indicator.
   */
  Backdrop.behaviors.focalPointIndicator = {
    attach: function(context, settings) {
      $(".focal-point-indicator", context).once(function() {
        // Set some variables for the different pieces at play.
        var $indicator = $(this);
        var $id = $indicator.attr('id');
        var $img = $(this).siblings('img');
        var focalPointID = Backdrop.checkPlain($(this).attr('id'));
        var $field = $('.focal-point[data-focal-point-id="' + focalPointID + '"]', context);
        var $previewLink = $('.focal-point-preview-link[data-focal-point-id="' + focalPointID + '"]', context);

        // Hide the focal_point form item. We do this with js so that a non-js
        // user can still set the focal point values. Also, add functionality so
        // that if the indicator is double clicked, the form item is displayed.
        if (!$field.hasClass('error')) {
          $field.closest('.form-item').hide();
        }
        $indicator.dblclick(function() {
          $field.closest('.form-item').toggle();
        });

        // Set the position of the indicator on image load and any time the
        // field value changes. We use a bit of hackery to make certain that the
        // image is loaded before moving the crosshair. See http://goo.gl/B02vFO
        // The setTimeout was added to ensure the focal point is set properly on
        // modal windows. See http://goo.gl/s73ge.
        setTimeout(function() {
          $img.one('load', function( event ){
            focalPointSetIndicator($indicator, $(this), $field);
          }).each(function() {
            if (this.complete) {
              $(this).trigger('load'); // Trigger the load event manually if the image is already loaded
            }
          });
        }, 0);

        // Make the focal point indicator draggable and tell it to update the
        // appropriate field when it is moved by the user.
        $(this).draggable({
          containment: $img,
          stop: function() {
            focalPointSetValue($indicator, $img, $field);
          }
        });

        // Allow users to click on the image preview in order to set the focal_point
        // and set a cursor.
        $img.click(function(event) {
          // Some non-webkit browsers do not properly set event.offsetX|Y.
          // @see http://bugs.jquery.com/ticket/8523
          if (typeof event.offsetX === "undefined" || typeof event.offsetY === "undefined") {
            var targetOffset = $(event.target).offset();
            event.offsetX = event.pageX - targetOffset.left;
            event.offsetY = event.pageY - targetOffset.top;
          }

          $indicator.css('left', parseInt(event.offsetX, 10));
          $indicator.css('top', parseInt(event.offsetY, 10));
          focalPointSetValue($indicator, $img, $field);
        });
        $img.css('cursor', 'crosshair');

        // Wrap the focal point indicator and thumbnail image in a div so that
        // everything still works with RTL languages.
        $(this).add($img).wrapAll("<div class='focal-point-wrapper' />");

        // Add a change event to the focal point field so it will properly
        // update the indicator position and the preview link.
        $field.change(function() {
          // Update the indicator position in case someone has typed in a value.
          focalPointSetIndicator($indicator, $img, $(this));

          // Re-jigger the href of the preview link.
          if ($previewLink.length > 0) {
            var previewId = $id + '-preview-link';
            var href = $previewLink.attr('href').split('/');
            href.pop();
            href.push(encodeURIComponent($(this).val()));
            href = href.join('/');
            $previewLink.attr('href', href);
            Backdrop.ajax[previewId].url = href;
            Backdrop.ajax[previewId].options.url = href;
          }
        });

      });
    }

  };

  /**
   * Change the value of the focal point field.
   *
   * Use the current position of the indicator to calculate the focal point and
   * set the focal point field to that value.
   *
   * @param object $indicator
   *   The indicator jQuery object whose position should be set.
   * @param object $img
   *   The image jQuery object to which the indicator is attached.
   * @param array $field
   *   The field jQuery object where the position can be found.
   */
  function focalPointSetValue($indicator, $img, $field) {
    var imgOffset = $img.offset();
    var focalPointOffset = $indicator.offset();

    var leftDelta = focalPointOffset.left - imgOffset.left;
    var topDelta = focalPointOffset.top - imgOffset.top;

    var leftOffset = focalPointRound(100 * leftDelta / $img.width(), 0, 100);
    var topOffset = focalPointRound(100 * topDelta / $img.height(), 0, 100);

    $field.val(leftOffset + ',' + topOffset).trigger('change');
  }

  /**
   * Change the position of the focal point indicator.
   *
   * @param object $indicator
   *   The indicator jQuery object whose position should be set.
   * @param object $img
   *   The image jQuery object to which the indicator is attached.
   * @param object $field
   *   The field jQuery object where the position can be found.
   */
  function focalPointSetIndicator($indicator, $img, $field) {
    var dimensions = focalPointGetDimensions($img);
    var coordinates = $field.val() !== '' && $field.val() !== undefined ? $field.val().split(',') : [50,50];
    $indicator.css('left', (parseInt(coordinates[0], 10) / 100) * dimensions.width);
    $indicator.css('top', (parseInt(coordinates[1], 10) / 100) * dimensions.height);
    $field.val(coordinates[0] + ',' + coordinates[1]);
  }

  /**
   * Rounds the given value to the nearest integer within the given bounds.
   *
   * @param float value
   *   The value to round.
   * @param int min
   *   The lower bound.
   * @param max
   *   The upper bound.
   *
   * @returns int
   */
  function focalPointRound(value, min, max) {
    var roundedVal = Math.max(Math.round(value), min);
    roundedVal = Math.min(roundedVal, max);

    return roundedVal;
  }

  /**
   * Returns the dimensions of the given image even if it is currently hidden.
   *
   * @param object $img
   *   The image jQuery object to which the indicator is attached.
   *
   * @returns object
   */
  function focalPointGetDimensions($img) {
    var dimensions = {
      width: 0,
      height: 0
    };

    if ($img.width() != 0 && $img.height() != 0) {
      // Both dimensions > 0 so use the image dimensions are found.
      dimensions.width = $img.width();
      dimensions.height = $img.height();
    }
    else {
      // The image may be hidden, check image source dimensions manually.
      var tempImage = new Image();
      tempImage.src = $img.attr('src');
      dimensions.width = tempImage.width;
      dimensions.height = tempImage.height;
    }

    return dimensions;
  }

})(jQuery);
