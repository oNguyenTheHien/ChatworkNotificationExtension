// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var rooms = [];
var roomsDict = {};

chrome.runtime.onInstalled.addListener(function() {
  createAlarm();
});

var alarmName = 'notification-worker';

function createAlarm() {
  chrome.alarms.create(alarmName, {
    delayInMinutes: 0.0, periodInMinutes: 0.1
  });
}

chrome.alarms.onAlarm.addListener(function( alarm ) {
  let tokenStr = localStorage.getItem("insertToken");
  if(tokenStr == "" || tokenStr == null) return;
  getRooms();
  if (rooms.length == 0)
  {
    return;
  }

  for (var i = 0; i < rooms.length; i++) {
    console.log("Requesting messages from " + rooms[i].name);
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", "https://api.chatwork.com/v2/rooms/"+rooms[i]+"/messages", false);
    xmlHttp.setRequestHeader("X-ChatWorkToken", tokenStr);
    xmlHttp.send(null)
    var currentdate = new Date(); 
    var datetime = "Last Sync: " + currentdate.getDate() + "/"
    + (currentdate.getMonth()+1)  + "/" 
    + currentdate.getFullYear() + " @ "  
    + currentdate.getHours() + ":"  
    + currentdate.getMinutes() + ":" 
    + currentdate.getSeconds();
    if (xmlHttp.responseText == "" || xmlHttp.responseText == null) {
      console.log("No new messages from " + rooms[i].name);
      continue;
    }
    var json = JSON.parse(xmlHttp.responseText);
    var length = json.length;
    var messageBody = json[length - 1].body;
    messageBody = convertMessage(messageBody);
    if (length == 0) continue;
    var opt = {
      type: 'basic',
      title: rooms[i].name,
      message: messageBody,
      iconUrl: json[length - 1].account.avatar_image_url
    };
    chrome.notifications.create(datetime,opt, function(id) { console.log("Last error:", chrome.runtime.lastError); });
  }
});

function getRooms() {
  let tokenStr = localStorage.getItem("insertToken");
  if(tokenStr == "" || tokenStr == null) return;
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", "https://api.chatwork.com/v2/rooms", false);
  xmlHttp.setRequestHeader("X-ChatWorkToken", tokenStr);
  xmlHttp.send(null)
  if (xmlHttp.responseText == "" || xmlHttp.responseText == null) {
    return;
  }
  rooms = [];
  var roomsJson = JSON.parse(xmlHttp.responseText);
  if(roomsJson.length == 0) return;

  for (var i = 0 ; i < roomsJson.length ; i++) {
    var aRoom = roomsJson[i];
    if (aRoom.type != "group") continue;
    if (roomsDict[aRoom.room_id] == undefined) {
      if (aRoom.unread_num != 0) {
        console.log("Getting messages from " + aRoom.name + ". Unread count: " + aRoom.unread_num);
        rooms.push(aRoom.room_id);
      }
    } else {
      if (roomsDict[aRoom.room_id] != aRoom.unread_num && aRoom.unread_num != 0) {
        console.log("Getting messages from " + aRoom.name + ". Unread count: " + aRoom.unread_num);
        rooms.push(aRoom.room_id);
      }
    }
    roomsDict[aRoom.room_id] = aRoom.unread_num;
  }
}


function convertMessage (messageBody) {
  var index = messageBody.indexOf("[rp aid");
  while (index != -1) {
    for(var i = index; i < messageBody.length; i++) {
      if (messageBody.charAt(i) == ']') {
        var replyStr = messageBody.substring(index, i + 1);
        messageBody = messageBody.replace(replyStr, " [RE]");
        index = messageBody.indexOf("[rp aid");
        break;
      }
    }
  }
  return messageBody;
}



