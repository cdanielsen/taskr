function pause(millis) {
  var date = new Date();
  var curDate = null;
  do {
    curDate = new Date();
  }
  while (curDate - date < millis);
}

function getCycleTime(start, end, units) {
  if (units === "min") {
    cycleTime = TimeHelper.timeDiff(start, end);
  } else if (units === "day") {
    cycleTime = TimeHelper.timeDiff(start, end) / 1440;
  }

  if (!cycleTime) {
    cycleTime = 0;
  }

  return cycleTime.toFixed(1);
}
