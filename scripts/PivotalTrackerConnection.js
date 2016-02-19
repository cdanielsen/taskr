

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


  client.send(JSON.stringify({
    description: task
  }));
  if (200 === client.status) {
    return JSON.parse(client.response);
  } else {
    log(client.status);
  }
};

PivotalTrackerConnection.prototype.executeGet = function(url) {
  var client = new XMLHttpRequest();
  client.open("GET", url, false);
  client.setRequestHeader("x-TrackerToken", this.XTrackerToken);
  try {
    client.send();
    if (200 === client.status) {
      return JSON.parse(client.response);
    }
  } catch (e) {
    console.log("failed: " + url);
    var client = new XMLHttpRequest();
    client.open("GET", url, false);
    client.setRequestHeader("x-TrackerToken", this.XTrackerToken);
    try {
      console.log("retry at: " + Date.now());
      pause(25000);
      if (200 === client.status) {
        console.log("retry success");
        return JSON.parse(client.response);
      }
    } catch (err) {
      console.log("retry failed at : " + Date.now() + ". Trying one more time...");
      pause(36000);
      if (200 === client.status) {
        console.log("2nd retry success");
        return JSON.parse(client.response);
      }
    }
  }
};
