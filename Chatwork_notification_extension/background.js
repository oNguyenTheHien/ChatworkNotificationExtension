// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

chrome.runtime.onInstalled.addListener(function() {
  createAlarm();
});

var alarmName = 'notification-worker';

function createAlarm() {
  chrome.alarms.create(alarmName, {
    delayInMinutes: 0.5, periodInMinutes: 0.5
  });
}

chrome.alarms.onAlarm.addListener(function(alarm) {
  chrome.storage.sync.get(["tokenKey", "allGroups", "selectedGroups"], function(data) {
    let tokenKey = data.tokenKey;
    let allGroups = JSON.parse(data.allGroups);
    let selectedGroups = JSON.parse(data.selectedGroups);
    let currentDate = new Date(); 
    var dateTimeString = currentDate.toString();
    if (tokenKey == null || tokenKey == "") {
      console.log(dateTimeString + " No token key.");
      return;
    }
    let requestingGroups = getGroups(tokenKey, allGroups, selectedGroups);
    if (requestingGroups.length == 0) {
      console.log(dateTimeString + " No groups have new message.");
    }
    for (var i = 0; i < requestingGroups.length; i++) {
      console.log(dateTimeString + " Requesting messages from " + requestingGroups[i].name);
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.open("GET", "https://api.chatwork.com/v2/rooms/" + requestingGroups[i].room_id + "/messages", false);
      xmlHttp.setRequestHeader("X-ChatWorkToken", tokenKey);
      xmlHttp.send(null)
      
      if (xmlHttp.responseText == "" || xmlHttp.responseText == null) {
        console.log(dateTimeString + " No new messages from " + requestingGroups[i].name);
        continue;
      }
      var messages = JSON.parse(xmlHttp.responseText);
      var length = messages.length;
      var messageBody = convertQuotedMessage(messages[length - 1].body);
      messageBody = convertMessage(messageBody);
      if (length == 0) {
        console.log(dateTimeString + " No new messages from " + requestingGroups[i].name);
        continue;
      }
      var options = {
        type: "basic",
        title: requestingGroups[i].name,
        message: messageBody,
        iconUrl: messages[length - 1].account.avatar_image_url
      };
      chrome.notifications.create(dateTimeString, options);
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
  }
  chrome.storage.sync.set({"allGroups": JSON.stringify(savingGroups)}, function() {});
  return returnGroups;
}

function convertQuotedMessage(messageBody) {
  var index = messageBody.indexOf("[qt]");
  if (index != -1) {
    var lastIndex = messageBody.substring(index).lastIndexOf("[/qt]")
    if (lastIndex != -1) {
      messageBody = messageBody.replace(messageBody.substring(index, index + lastIndex + "[/qt]".length), "\"Quoted messages\"");
    } 
  }
  return messageBody;
}

function convertMessage(messageBody) {
  for (var i = 0; i < startStrings.length; i++) {
    var startIndex = messageBody.indexOf(startStrings[i]);
    while (startIndex != -1) {
      var endIndex = messageBody.substring(startIndex).indexOf(endStrings[i]);
      console.log(messageBody.substring(startIndex) + " - " + endIndex);
      if (endIndex != -1) {
        var replacedStr = messageBody.substring(startIndex, startIndex + endIndex + endStrings[i].length);
        messageBody = messageBody.replace(replacedStr, replaceStrings[i]);
        startIndex = messageBody.indexOf(startStrings[i]);
      } else {
        startIndex = -1;
      }
    }
  }
  return messageBody;
}

var startStrings = ["[To:", "[rp aid", "[info][title][dtext:chatroom_chat_edited][/title][dtext:chatroom_member_is]", "[info][title][dtext:chatroom_chat_edited][/title][dtext:chatroom_member_is]"];
var endStrings = ["]", "]", "[dtext:chatroom_added][/info]", "[dtext:chatroom_deleted][/info]"];
var replaceStrings = ["[To]", "[Re]", "[Quoted message]", "A new member joined the group.", "A member has been deleted."];
