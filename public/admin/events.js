angular.module('gdgorgua')

    .controller('EventsListCtrl', function ($scope, GEvent, $location, $window, $filter) {
        if ($window.sessionStorage) {
            try {
                $scope.events = JSON.parse($window.sessionStorage.getItem('gdgevents'));
            } catch (err) {}
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


    .controller('EventsCreateCtrl', function ($scope, $location, GEvent) {
        $scope.editing = false;
        $scope.save = function () {
            GEvent.save($scope.e, function (e) {
                $location.path('/edit/' + e.id);
            });
        }
    })


    .controller('EventsEditCtrl', function ($scope, $location, $routeParams, GEvent, $http,Participant,$window, $filter) {
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
                self.original = e;
                $scope.e = new GEvent(self.original);
                $window.sessionStorage.setItem('gdgevent'+$routeParams.eventId, JSON.stringify(e));
        });
        };
        /*$scope.$watch('dateStr', function(nv) {
            if (!nv) return;
            $scope.e.date = Date.parse($scope.dateStr);
        });*/
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
