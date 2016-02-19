function executeAddTask(pivotalData) {
	var apiToken = "SECRET";
	var pivotal = new PivotalTrackerConnection(pivotalData.projectID, apiToken);

	var task = "";
	var taskArray = pivotalData.taskList.match(/[^\r\n]+/g);

	for (var i in taskArray)
	{
		task = taskArray[i];
		pivotal.addTask(pivotalData.storyID, task);
	}
}
