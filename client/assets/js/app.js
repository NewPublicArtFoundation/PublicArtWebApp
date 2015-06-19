(function() {
  'use strict';

  angular.module('application', [
    'ui.router',
    'ngAnimate',

    //foundation
    'foundation',
    'foundation.dynamicRouting',
    'foundation.dynamicRouting.animations'
  ])
  .controller('PlacesCtrl', function($scope, $state, $http){
    $scope = genericController($scope, $state, $http, 'places', 'place');
  })
  .controller('SpeciesCtrl', function($scope, $state, $http){
    $scope = genericController($scope, $state, $http, 'species', 'specie');
  })
  .controller('PlanetsCtrl', function($scope, $state, $http){
    $scope = genericController($scope, $state, $http, 'planets', 'planet');
  })
  .controller('PeopleCtrl', function($scope, $state, $http){
    $scope = genericController($scope, $state, $http, 'people', 'person');
  })
  .controller('StarshipsCtrl', function($scope, $state, $http){
    $scope = genericController($scope, $state, $http, 'starships', 'starship');
  })
  
  .filter('capitalize', function() {
    // Send the results of this manipulating function
    // back to the view.
    return function (input) {
      // If input exists, replace the first letter of
      // each word with its capital equivalent.
      return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g,
        function(txt){return txt.charAt(0).toUpperCase() +
          txt.substr(1)}) : '';
    }
  })
  .filter('lastdir', function () {
    // Send the results of this manipulating function
    // back to the view.
    return function (input) {
      // Simple JavaScript to split and slice like a fine chef.
      return (!!input) ? input.split('/').slice(-2, -1)[0] : '';
    }
  })
  .directive("getProp", ['$http', '$filter', function($http, $filter) {
    return {
      // All we're going to display is the scope's property variable.
      template: "{{property}}",
      scope: {
        // Rather than hard-coding 'name' as in 'person.name', we may need
        // to access 'title' in some instances, so we use a variable (prop) instead.
        prop: "=",
        // This is the swapi.co URL that we pass to the directive.
        url: "="
      },
      link: function(scope, element, attrs) {
        // Make our 'capitalize' filter usable here
        var capitalize = $filter('capitalize');
        // Make an http request for the 'url' variable passed to this directive
        $http.get(scope.url, { cache: true }).then(function(result) {
          // Get the 'prop' property of our returned data so we can use it in the template.
          scope.property = capitalize(result.data[scope.prop]);
        }, function(err) {
          // If there's an error, just return 'Unknown'.
          scope.property = "Unknown";
        });
      }
    }
  }])
    .config(config)
    .run(run)
  ;

  config.$inject = ['$urlRouterProvider', '$locationProvider'];

  function config($urlProvider, $locationProvider) {
    $urlProvider.otherwise('/');

    $locationProvider.html5Mode({
      enabled:false,
      requireBase: false
    });

    $locationProvider.hashPrefix('!');
  }

  function run() {
    FastClick.attach(document.body);
  }

  function genericController($scope, $state, $http, multiple, single){

    // Grab URL parameters
    $scope.id = ($state.params.id || '');
    $scope.page = ($state.params.p || 1);

    // Use Aerobatic's caching if we're on that server
    var urlApi = "http://swapi.co/api/"+multiple+"/"+$scope.id+"?page="+$scope.page,
      queryParams = {
        cache: true
      };

    if (window.location.hostname.match('aerobaticapp')) {
      queryParams = {
        params: {
          url: urlApi,
          cache: 1,
          ttl: 30000 // cache for 500 minutes
        }
      }
      urlApi = '/proxy';
    }

    if ($scope.page == 1) {
      if ($scope.id != '') {
        // We've got a URL parameter, so let's get the single entity's data
        $http.get(urlApi, queryParams)
          .success(function(data) {
            // The HTTP GET only works if it's referencing an ng-repeat'ed array for some reason...
            if (data.homeworld) data.homeworld = [data.homeworld];

            $scope[single] = data;

            var name = data.name;
            if (single == 'film') name = data.title;
            // Get an image from a Google Custom Search (this API key only works on localhost & aerobaticapp.com)
            var googleUrl = 'https://www.googleapis.com/customsearch/v1?cx=001000040755652345309%3Aosltt3fexvk&q='+encodeURIComponent(name)+'&imgSize=large&num=1&fileType=jpg&key=AIzaSyBDvUGYCJfOyTNoJzk-5P9vE-dllx-Wne4',
              googleParams = { cache: true };

            if (window.location.hostname.match('aerobaticapp')) {
              googleParams = {
                params: {
                  url: googleUrl,
                  cache: 1,
                  ttl: 300000 // cache for 5000 minutes
                }
              }
              googleUrl = '/proxy';
            }

            $http.get(googleUrl, googleParams)
            .then(function(result) {
              $scope.imageUrl = result.data.items[0].pagemap.cse_image[0].src;
            }, function(err) {
              $scope.imageUrl = "Unknown";
            });
          })

      } else {
        // We're on page 1, so thet next page is 2.
        $http.get(urlApi, queryParams)
        .success(function(data) {
          $scope[multiple] = data;
          if (data['next']) $scope.nextPage = 2;
        });
      }
    } else {
      // If there's a next page, let's add it. Otherwise just add the previous page button.
      $http.get(urlApi, queryParams)
      .success(function(data) {
        $scope[multiple] = data;
        if (data['next']) $scope.nextPage = 1*$scope.page + 1;
      });
      $scope.prevPage = 1*$scope.page - 1;
    }
    return $scope;

  }

})();