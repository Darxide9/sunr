'use strict';

/* Filters */

angular.module('myApp.filters', [])
	.filter('interpolate', ['version', function(version) {
    	return function(text) {
      		return String(text).replace(/\%VERSION\%/mg, version);
    	}
  	}])
  	
    .filter('percentage', function ($filter) {
        return function (input) {
            var rounded = Math.round(input*10000)/100;
            if (rounded == NaN) {
                return '';
            }
            var percentage = '' + $filter('number')(rounded) + '%';
            return percentage;
        };
    })
    
    .filter('percentage2', function ($filter) {
        return function (input) {
        	var sign = '';
            var rounded = Math.round(input*100);
            if (rounded == NaN) {
                return '';
            }
            if (rounded > 0)
            	sign = '+';
            var percentage = sign + $filter('number')(rounded) + '%';
            return percentage;
        };
    })
    
    .filter('timestamp', function(Utility) {
    	return function (value) {
    		if (value == undefined)
    			return undefined;
    		return new Utility.iso2Date(value).getTime();
    	}
    })
    
    // Usato in ng-repeat, filtra per valori unici
    // @see http://stackoverflow.com/questions/15914658/how-to-make-ng-repeat-filter-out-duplicate-results
	.filter('unique', function () {
	
	  return function (items, filterOn) {
	
	    if (filterOn === false) {
	      return items;
	    }
	
	    if ((filterOn || angular.isUndefined(filterOn)) && angular.isArray(items)) {
	      var hashCheck = {}, newItems = [];
	
	      var extractValueToCompare = function (item) {
	        if (angular.isObject(item) && angular.isString(filterOn)) {
	          return item[filterOn];
	        } else {
	          return item;
	        }
	      };
	
	      angular.forEach(items, function (item) {
	        var valueToCheck, isDuplicate = false;
	
	        for (var i = 0; i < newItems.length; i++) {
	          if (angular.equals(extractValueToCompare(newItems[i]), extractValueToCompare(item))) {
	            isDuplicate = true;
	            break;
	          }
	        }
	        if (!isDuplicate) {
	          newItems.push(item);
	        }
	
	      });
	      items = newItems;
	    }
	    return items;
	  };
	})
	
	/**
	 * Description:
	 *     removes white space from text. useful for html values that cannot have spaces
	 * Usage:
	 *   {{some_text | nospace}}
	 */
	.filter('nospace', function () {
		return function (value) {
		    return (!value) ? '' : value.replace(/ /g, '');
		};
	});
