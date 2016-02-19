function pause(millis)
 {
  var date = new Date();
  var curDate = null;
  do { curDate = new Date(); }
  while(curDate-date < millis);
}

function getCycleTime(start, end, units) {
	if (units === "min") {
		cycleTime = TimeHelper.timeDiff(start, end);
	}
	else if (units === "day") {
		cycleTime = TimeHelper.timeDiff(start, end) / 1440;
	}
	
	if (!cycleTime) {
		cycleTime = 0;
	}
	
	return cycleTime.toFixed(1);
}

function PivotalTrackerConnection(projectID, xTrackerToken) {
	this.ProjectID = projectID;
	this.XTrackerToken = xTrackerToken;
	this.BaseURL = "https://www.pivotaltracker.com/services/v5/projects/" + projectID;
	this.projectMembers = "";
}

PivotalTrackerConnection.prototype.addTask = function(storyID, task) {
	var client = new XMLHttpRequest();
	var url = this.BaseURL + "/stories/" + storyID + "/tasks";
	console.log("request: " + url); 
	client.open("POST", url, false);
	client.setRequestHeader("x-TrackerToken", this.XTrackerToken);
	client.setRequestHeader("Content-Type", "application/json;charset=UTF-8");


		client.send(JSON.stringify({description:task}));
		if (200 === client.status)	{
			return JSON.parse(client.response);
		}
		else
		{
			log(client.status);
		}
}

PivotalTrackerConnection.prototype.executeGet = function(url) {
	var client = new XMLHttpRequest();
	client.open("GET", url, false);
	client.setRequestHeader("x-TrackerToken", this.XTrackerToken);
	try {
		client.send();
		if (200 === client.status)	{
			return JSON.parse(client.response);
		}
	}
	catch (e) {
		console.log("failed: " + url);
		var client = new XMLHttpRequest();
		client.open("GET", url, false);
		client.setRequestHeader("x-TrackerToken", this.XTrackerToken);
		try {
			console.log("retry at: " + Date.now());
			pause(25000);
			if (200 === client.status)	{
				console.log("retry success");
				return JSON.parse(client.response);
			}
		}
		catch (e) {
			console.log("retry failed at : " + Date.now() + ". Trying one more time...");
			pause(36000);
			if (200 === client.status)	{
				console.log("2nd retry success");
				return JSON.parse(client.response);
			}
		}
	}
}

PivotalTrackerConnection.prototype.getStories = function(query) {
	return this.executeGet(this.BaseURL + "/search?query=" + query);
}

PivotalTrackerConnection.prototype.getStoryLabels = function(storyID) {
	return this.executeGet(this.BaseURL + "/stories/" + storyID + "/labels");
}

PivotalTrackerConnection.prototype.getStoryLabelString = function(storyID) {

	var labelArray = this.getStoryLabels(storyID);
	var labelString = "";
	
	for (var i in labelArray) {
		if (i == 0) {
			labelString += labelArray[i]["name"];
		}
		else {
			labelString += ", " + labelArray[i]["name"];
		}
	}
	
	return labelString;

}

PivotalTrackerConnection.prototype.getStoryActivity = function(storyID) {
	return this.executeGet(this.BaseURL + "/stories/" + storyID + "/activity");
}

PivotalTrackerConnection.prototype.getStoryEventTimes = function(pivotalTrackerActivityJSON, units) {

	// TODO: Deal with the case where it was never started 
	
	var stateTransitions = {
		eventTimes : {
			addedTime : "",
			startTime : "", 
			finishTime : "",
			deliverTime : "",
			endTime : ""
		},
		stateCycleTimes : {
			finishedCycleTime : "",
			deliveryCycleTime : "",
			acceptedCycleTime : "",
			workCycleTime : "",
			totalLeadTime : ""
		}
	};

	for (var i in pivotalTrackerActivityJSON) {
		if ((i == pivotalTrackerActivityJSON.length - 1) && (pivotalTrackerActivityJSON[i]["highlight"] === "added")){
			stateTransitions["eventTimes"]["addedTime"] = pivotalTrackerActivityJSON[i]["occurred_at"];
		}
		else if ((pivotalTrackerActivityJSON[i]["highlight"] === "accepted") && ("" === stateTransitions["eventTimes"]["endTime"])) {
			stateTransitions["eventTimes"]["endTime"] = pivotalTrackerActivityJSON[i]["occurred_at"];
		}
		else if ((pivotalTrackerActivityJSON[i]["highlight"] === "delivered") && ("" === stateTransitions["eventTimes"]["deliverTime"])) {
			stateTransitions["eventTimes"]["deliverTime"] = pivotalTrackerActivityJSON[i]["occurred_at"];
		}
		else if ((pivotalTrackerActivityJSON[i]["highlight"] === "finished") && ("" === stateTransitions["eventTimes"]["finishTime"])) {
			stateTransitions["eventTimes"]["finishTime"] = pivotalTrackerActivityJSON[i]["occurred_at"];
		}
		else if (pivotalTrackerActivityJSON[i]["highlight"] === "started") {
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

PivotalTrackerConnection.prototype.ProjectMembers = function() {
	this.projectMembers = {};
	var projectMembersJson = this.executeGet(this.BaseURL + "/memberships");
	
	for (var i in projectMembersJson) {
		this.projectMembers[projectMembersJson[i]["person"]["id"]] = projectMembersJson[i]["person"]["name"];
	}
}

PivotalTrackerConnection.prototype.getProjectMembers = function(userId) {
	if ("" === this.projectMembers) { this.ProjectMembers(); }
	return this.projectMembers[userId] ? this.projectMembers[userId] : "";
}
// Are there other things from PivotalTracker we want to be able to pull out with some custom reporting?

// TODO
// What do we do about NaN scenarios where it was never started? Log separately as errors
// What do we do about crazy low times like 0m, 1m, etc.? These things that we don't want credit for finishing quickly, they're probably just not moved to the started phase when they were actually started. Log as errors, exclude from average
// Do we want to time between states as well (e.g. started to finished cycle time) or just the start to accepted cycle time?
// Add Owner
// Split up the aggregation between types?
// Get/Print out the status of the stories
// Get projectID by name
// Stories should report themselves