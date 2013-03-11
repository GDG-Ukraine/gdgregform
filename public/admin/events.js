angular.module('gdgorgua')

    .controller('EventsListCtrl', function ($scope, GEvent, $location, $window, $filter) {
        if ($window.sessionStorage) {
            try {
                $scope.events = JSON.parse($window.sessionStorage.getItem('gdgevents'));
            } catch (err) {}
        }
        var currentDate = new Date();
        $scope.isPast = function(e) {

            var date = new Date(e.date);
            return date<currentDate;
        }
        //$scope.events = GEvent.query()
        GEvent.query({},function(events) {
            events.forEach(function(e) {
                e.date = $filter('date')(e.date, 'yyyy-MM-dd');
            })
            $scope.events = events;
            if ($window.sessionStorage) {
                $window.sessionStorage.setItem("gdgevents",JSON.stringify(events));
            }
        });
        $scope.edit = function (id) {
            $location.path('/events/' + id);
        }
    })
    .factory('EventsFielder', function() {
        return function($scope) {
           $scope.addField = function() {
               if (!$scope.e.fields) $scope.e.fields = [];
               $scope.e.fields.push({});
           }
           $scope.deleteField = function(field) {
              var i = $scope.e.fields.indexOf(field);
              if (i>=0) $scope.e.fields.splice(i,1);
           }
        };
    })


    .controller('EventsCreateCtrl', function ($scope, $location, GEvent) {
        $scope.editing = false;
        $scope.save = function () {
            GEvent.save($scope.e, function (e) {
                $location.path('/edit/' + e.id);
            });
        }
    })


    .controller('EventsEditCtrl', function ($scope, $location, $routeParams, GEvent, $http,Participant,$window, $filter, EventsFielder) {
        EventsFielder($scope);
        var self = this;
        $scope.editing = true;
        $scope.tab = 'info';

        if ($window.sessionStorage) {
            try {
                $scope.e = JSON.parse($window.sessionStorage.getItem('gdgevent'+$routeParams.eventId));
            } catch(err) {};
        }
        $scope.refresh = function() {
            $scope.loading = true;
            GEvent.get({id: $routeParams.eventId}, function (e) {
                $scope.loading = false;
                e.date = $filter('date')(e.date,'yyyy-MM-dd');
                e.closereg = $filter('date')(e.closereg,'yyyy-MM-dd');
                self.original = e;
                $scope.e = new GEvent(self.original);
                $window.sessionStorage.setItem('gdgevent'+$routeParams.eventId, JSON.stringify(e));
        });
        };
        $scope.refresh();

        $scope.isClean = function () {
            return angular.equals(self.original, $scope.e);
        }

        $scope.destroy = function () {
            self.original.$remove(function () {
                $location.path('/list');
            });
        };

        $scope.save = function () {
            $scope.e.$update(function () {
                $window.sessionStorage.setItem('gdgevent'+$routeParams.eventId, JSON.stringify($scope.e));
                $location.path('/');
            });
        };
        $scope.show = function(id) {
            $location.path('/participants/'+id);
        }


    })

    .factory('GEvent', function ($resource) {
        var GEvent = $resource('/api/events/:id',
            {  id: "@id" }, {
                update: { method: 'PUT' }
            }
        );
        return GEvent;
    });

