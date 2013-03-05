angular.module('gdgorgua')

.controller('ParticipantsListCtrl', function ($scope, Participant, $location) {
  $scope.participants = Participant.query();
  $scope.edit = function(id) {
      $location.path('/participants/'+id);
  }
})


.controller('ParticipantsCreateCtrl', function ($scope, $location, Participant) {
  $scope.save = function() {
    Participant.save($scope.p, function(participant) {
      $location.path('/edit/' + participant.id);
    });
  }
})


.controller('ParticipantsEditCtrl', function ($scope, $location, $routeParams, Participant, $window,GEvent, $http) {
  var self = this;

  Participant.get({id: $routeParams.participantId}, function(participant) {
    self.original = participant;
    $scope.p = new Participant(self.original);

  });

  $scope.isClean = function() {
    return angular.equals(self.original, $scope.p);
  }

  $scope.destroy = function() {
    self.original.$remove(function() {
      $location.path('/list');
    });
  };

  $scope.save = function() {
    $scope.p.$update(function() {
      $location.path('/');
    });
  };
  $scope.back = function() {
      $window.history.back();
  }
  $scope.show = function(id) {
      $location.path('/events/'+id);
  }

})

.factory('Participant', function($resource) {
      var Participant = $resource('/api/participants/:id',
          { id: "@id" }, {
            update: { method: 'PUT' }
          }
      );
      return Participant;
});
