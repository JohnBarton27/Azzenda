'use strict';

// Events controller
angular.module('events').controller('EventsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Events', '$modal', '$log',
	function($scope, $stateParams, $location, Authentication, Events, $modal, $log) {
		$scope.authentication = Authentication;
        
        $scope.events = Events.query();
        
        //Open Modal window for creating events
        $scope.createModal = function (size) {
            
            var modalInstance = $modal.open({
              animation: $scope.animationsEnabled,
              templateUrl: 'modules/events/views/create-event.client.view.html',
              controller: function ($scope, $modalInstance, items) {
//                  $scope.events = events;
//                  $scope.selected = {
//                    event: $scope.events[0]
//                  };

                  $scope.ok = function () {
                    $modalInstance.close($scope.selected.event);
                  };

                  $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                  };
              },
              size: size,
              resolve: {
                items: function () {
                  //return $scope.events;
                }
              }
            });

            modalInstance.result.then(function (selectedEvent) {
              $scope.selected = selectedEvent;
            }, function () {
              $log.info('Modal dismissed at: ' + new Date());
            });
        };

		// Create new Event
		$scope.create = function() {
			// Create new Event object
			var event = new Events ({
				name: this.name
			});

			// Redirect after save
			event.$save(function(response) {
				$location.path('events/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Event
		$scope.remove = function(event) {
			if ( event ) { 
				event.$remove();

				for (var i in $scope.events) {
					if ($scope.events [i] === event) {
						$scope.events.splice(i, 1);
					}
				}
			} else {
				$scope.event.$remove(function() {
					$location.path('events');
				});
			}
		};

		// Update existing Event
		$scope.update = function() {
			var event = $scope.event;

			event.$update(function() {
				$location.path('events/' + event._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Events
		$scope.find = function() {
			$scope.events = Events.query();
		};

		// Find existing Event
		$scope.findOne = function() {
			$scope.event = Events.get({ 
				eventId: $stateParams.eventId
			});
		};
	}
]);