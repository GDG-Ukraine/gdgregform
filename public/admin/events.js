angular.module('gdgorgua')

    .controller('EventsListCtrl', function ($scope, GEvent, $location) {
        $scope.events = GEvent.query();
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


    .controller('EventsEditCtrl', function ($scope, $location, $routeParams, GEvent, $http,Participant) {
        var self = this;
        $scope.editing = true;
        $scope.tab = 'info';

        GEvent.get({id: $routeParams.eventId}, function (e) {
            self.original = e;
            $scope.e = new GEvent(self.original);
        });

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
