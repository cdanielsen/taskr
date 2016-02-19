var angular = require("angular");
var tasker = require("./scripts/PivotalTrackerTasker");

var app = angular.module("myapp", [])
  .controller("TaskFormController", function($scope, $http) {
    $scope.pivotalTaskForm = {};
    $scope.pivotalTaskForm.storyID = "";
    $scope.pivotalTaskForm.project = 0;
    $scope.pivotalTaskForm.taskList = "QA: Test Task\nDEV: Unit Test";

    $scope.pivotalTaskForm.submitTheForm = function(item, event) {
      var formData = {
        storyID: $scope.pivotalTaskForm.storyID,
        projectID: $scope.pivotalTaskForm.project,
        taskList: $scope.pivotalTaskForm.taskList,
      };

      tasker.executeAddTask(formData);
    };
  });

module.exports = app;
