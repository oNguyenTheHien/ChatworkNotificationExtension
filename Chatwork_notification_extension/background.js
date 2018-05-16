// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var rooms = [];
var roomsDict = {};

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({color: '#3aa757'}, function() {
  createAlarm();
  });
});

var alarmName = 'remindme';

function createAlarm() {
  chrome.alarms.create(alarmName, {
    delayInMinutes: 0.1, periodInMinutes: 0.3});
}
function cancelAlarm() {
  chrome.alarms.clear(alarmName);
}

chrome.alarms.onAlarm.addListener(function( alarm ) {
  let tokenStr = localStorage.getItem("insertToken");
  if(tokenStr == "" || tokenStr == null) return;
  if (rooms.length == 0)
  {
    getRooms();
    return;
  }

  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].type != "group") continue;
    console.log("room count" + i);
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", "https://api.chatwork.com/v2/rooms/"+rooms[i].room_id+"/messages", false);
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
      console.log("no message");
      continue;
    }
    var json = JSON.parse(xmlHttp.responseText);
    var length = json.length;
    var messageBody = json[length - 1].body;
    messageBody = convertMessage(messageBody);
    if (length == 0) continue;
    var opt = {
      type: 'basic',
      title: 'You receive a new message',
      message: messageBody,
      iconUrl: json[length - 1].account.avatar_image_url
    };
    chrome.notifications.create(datetime,opt, function(id) { console.log("Last error:", chrome.runtime.lastError); });
    if(i == 0) {
      getRooms();
    }
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
    if(roomsJson[i].unread_num != 0 || roomsDict[roomsJson[i].room_id] == undefined || roomsJson[i].unread_num != roomsDict[roomsJson[i].unread_num]) {
      rooms.push(roomsJson[i].room_id);
    }
    roomsDict[roomsJson[i].room_id] = roomsJson[i].unread_num;
  }

}


 function convertMessage (messageBody) {
  var index = messageBody.indexOf("[rp aid");
  while (index != -1) {
    for(var i = index; i < messageBody.length; i++) {
      if (messageBody.charAt(i) == ']') {
        var replyStr = messageBody.substring(index, i+1);
        messageBody = messageBody.replace(replyStr, " RE:");
        index = messageBody.indexOf("[rp aid");
        break;
      }
    }
  }

  return messageBody;
 
 }



