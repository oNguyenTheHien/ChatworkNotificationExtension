// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// var roomsDict = {};

chrome.runtime.onInstalled.addListener(function() {
  createAlarm();
});

var alarmName = 'notification-worker';

function createAlarm() {
  chrome.alarms.create(alarmName, {
    delayInMinutes: 0.0, periodInMinutes: 0.3
  });
}

chrome.alarms.onAlarm.addListener(function(alarm) {
  chrome.storage.sync.get(["tokenKey", "allGroups", "selectedGroups"], function(data) {
    let tokenKey = data.tokenKey;
    let allGroups = JSON.parse(data.allGroups);
    let selectedGroups = JSON.parse(data.selectedGroups);
    if (tokenKey == null || tokenKey == "") {
      console.log("No token key.");
      return;
    }
    let requestingGroups = getGroups(tokenKey, allGroups, selectedGroups);
    for (var i = 0; i < requestingGroups.length; i++) {
      console.log("Requesting messages from " + requestingGroups[i].name);
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.open("GET", "https://api.chatwork.com/v2/rooms/" + requestingGroups[i].room_id + "/messages", false);
      xmlHttp.setRequestHeader("X-ChatWorkToken", tokenKey);
      xmlHttp.send(null)
      let currentDate = new Date(); 
      var notificationID = currentDate.toString();
      if (xmlHttp.responseText == "" || xmlHttp.responseText == null) {
        console.log("No new messages from " + requestingGroups[i].name);
        continue;
      }
      var messages = JSON.parse(xmlHttp.responseText);
      var length = messages.length;
      var messageBody = messages[length - 1].body;
      messageBody = convertMessage(messageBody);
      if (length == 0) continue;
      var options = {
        type: "basic",
        title: requestingGroups[i].name,
        message: messageBody,
        iconUrl: messages[length - 1].account.avatar_image_url
      };
      chrome.notifications.create(notificationID, options);
    }
  });
});

function getGroups(tokenKey, allGroups, selectedGroups) {
  var returnGroups = [];
  var checkingGroups = [];
  for (var i = 0; i < allGroups.length; i++) {
    if (selectedGroups.includes(allGroups[i].room_id + "")) {
      checkingGroups.push(allGroups[i]);
    }
  }
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", "https://api.chatwork.com/v2/rooms", false);
  xmlHttp.setRequestHeader("X-ChatWorkToken", tokenKey);
  xmlHttp.send(null)
  if (xmlHttp.responseText == "" || xmlHttp.responseText == null) {
    return returnGroups;
  }
  var savingGroups = [];
  var totalGroups = JSON.parse(xmlHttp.responseText);
  for (var i = 0; i < totalGroups.length ; i++) {
    if (totalGroups[i].type != "group") continue;
    savingGroups.push(totalGroups[i]);
    if (totalGroups[i].unread_num == 0) continue;
    for (var j = 0; j < checkingGroups.length; j++) {
      if (totalGroups[i].room_id == checkingGroups[j].room_id && totalGroups[i].unread_num != checkingGroups[j].unread_num) {
        returnGroups.push(totalGroups[i]);
        break;
      }
    }
      // if (roomsDict[group.room_id] == undefined) {
      //   if (group.unread_num != 0) {
      //     console.log("Getting messages from " + group.name + ". Unread count: " + group.unread_num);
      //     rooms.push(group);
      //   }
      // } else {
      //   if (roomsDict[group.room_id] != group.unread_num && group.unread_num != 0) {
      //     console.log("Getting messages from " + group.name + ". Unread count: " + group.unread_num);
      //     rooms.push(group);
      //   }
      // }
      // roomsDict[group.room_id] = group.unread_num;
    }
    chrome.storage.sync.set({"allGroups": JSON.stringify(savingGroups)}, function() {});
    return returnGroups;
}


function convertMessage (messageBody) {
  var index = messageBody.indexOf("[rp aid");
  while (index != -1) {
    for(var i = index; i < messageBody.length; i++) {
      if (messageBody.charAt(i) == ']') {
        var replyStr = messageBody.substring(index, i + 1);
        messageBody = messageBody.replace(replyStr, "[RE]");
        index = messageBody.indexOf("[rp aid");
        break;
      }
    }
  }
  return messageBody;
}



