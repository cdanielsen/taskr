

PivotalTrackerConnection.prototype.getStories = function(query) {
  return this.executeGet(this.BaseURL + "/search?query=" + query);
};

PivotalTrackerConnection.prototype.getStoryLabels = function(storyID) {
  return this.executeGet(this.BaseURL + "/stories/" + storyID + "/labels");
};

PivotalTrackerConnection.prototype.getStoryLabelString = function(storyID) {

  var labelArray = this.getStoryLabels(storyID);
  var labelString = "";

  for (var i in labelArray) {
    if (i === 0) {
      labelString += labelArray[i].name;
    } else {
      labelString += ", " + labelArray[i].name;
    }
  }
  return labelString;
};

PivotalTrackerConnection.prototype.getStoryActivity = function(storyID) {
  return this.executeGet(this.BaseURL + "/stories/" + storyID + "/activity");
};

PivotalTrackerConnection.prototype.ProjectMembers = function() {
  this.projectMembers = {};
  var projectMembersJson = this.executeGet(this.BaseURL + "/memberships");

  for (var i in projectMembersJson) {
    this.projectMembers[projectMembersJson[i]["person"]["id"]] = projectMembersJson[i]["person"]["name"];
  }
};

PivotalTrackerConnection.prototype.getProjectMembers = function(userId) {
  if ("" === this.projectMembers) {
    this.ProjectMembers();
  }
  return this.projectMembers[userId] ? this.projectMembers[userId] : "";
};

PivotalTrackerConnection.prototype.getStoryEventTimes = function(pivotalTrackerActivityJSON, units) {

  // TODO: Deal with the case where it was never started

  var stateTransitions = {
    eventTimes: {
      addedTime: "",
      startTime: "",
      finishTime: "",
      deliverTime: "",
      endTime: ""
    },
    stateCycleTimes: {
      finishedCycleTime: "",
      deliveryCycleTime: "",
      acceptedCycleTime: "",
      workCycleTime: "",
      totalLeadTime: ""
    }
  };

  for (var i in pivotalTrackerActivityJSON) {
    if ((i == pivotalTrackerActivityJSON.length - 1) && (pivotalTrackerActivityJSON[i]["highlight"] === "added")) {
      stateTransitions["eventTimes"]["addedTime"] = pivotalTrackerActivityJSON[i]["occurred_at"];
    } else if ((pivotalTrackerActivityJSON[i]["highlight"] === "accepted") && ("" === stateTransitions["eventTimes"]["endTime"])) {
      stateTransitions["eventTimes"]["endTime"] = pivotalTrackerActivityJSON[i]["occurred_at"];
    } else if ((pivotalTrackerActivityJSON[i]["highlight"] === "delivered") && ("" === stateTransitions["eventTimes"]["deliverTime"])) {
      stateTransitions["eventTimes"]["deliverTime"] = pivotalTrackerActivityJSON[i]["occurred_at"];
    } else if ((pivotalTrackerActivityJSON[i]["highlight"] === "finished") && ("" === stateTransitions["eventTimes"]["finishTime"])) {
      stateTransitions["eventTimes"]["finishTime"] = pivotalTrackerActivityJSON[i]["occurred_at"];
    } else if (pivotalTrackerActivityJSON[i]["highlight"] === "started") {
      stateTransitions["eventTimes"]["startTime"] = pivotalTrackerActivityJSON[i]["occurred_at"];
    }
  }

  stateTransitions["stateCycleTimes"]["finishedCycleTime"] = getCycleTime(stateTransitions["eventTimes"]["startTime"], stateTransitions["eventTimes"]["finishTime"], units);
  stateTransitions["stateCycleTimes"]["deliveryCycleTime"] = getCycleTime(stateTransitions["eventTimes"]["finishTime"], stateTransitions["eventTimes"]["deliverTime"], units);
  stateTransitions["stateCycleTimes"]["acceptedCycleTime"] = getCycleTime(stateTransitions["eventTimes"]["deliverTime"], stateTransitions["eventTimes"]["endTime"], units);
  stateTransitions["stateCycleTimes"]["workCycleTime"] = getCycleTime(stateTransitions["eventTimes"]["startTime"], stateTransitions["eventTimes"]["endTime"], units);
  stateTransitions["stateCycleTimes"]["totalLeadTime"] = getCycleTime(stateTransitions["eventTimes"]["addedTime"], stateTransitions["eventTimes"]["endTime"], units);

  return stateTransitions;
}
