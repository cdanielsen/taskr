function executeAddTask(pivotalData) {
	var apiToken = "3b08df767e6bc16b55952a00a8e7d97d";
	var pivotal = new PivotalTrackerConnection(pivotalData.projectID, apiToken);

	var task = "";
	var taskArray = pivotalData.taskList.match(/[^\r\n]+/g);

	for (var i in taskArray)
	{
		task = taskArray[i];
		pivotal.addTask(pivotalData.storyID, task);
	}
}