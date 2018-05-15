// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({color: '#3aa757'}, function() {
    console.log('The color is green.');
    doToggleAlarm();
  });
});

var alarmName = 'remindme';

function checkAlarm(callback) {
  chrome.alarms.getAll(function(alarms) {
    var hasAlarm = alarms.some(function(a) {
      return a.name == alarmName;
    });
    if (callback) callback(hasAlarm);
  })
}
function createAlarm() {
  chrome.alarms.create(alarmName, {
    delayInMinutes: 0.1, periodInMinutes: 0.1});
}
function cancelAlarm() {
  chrome.alarms.clear(alarmName);
}
function doToggleAlarm() {
  checkAlarm( function(hasAlarm) {
    if (hasAlarm) {
      cancelAlarm();
    } else {
      createAlarm();
    }
    checkAlarm();
  });
}

var opt = {
  type: 'list',
  title: 'keep burning',
  message: 'Primary message to display',
  priority: 1,
  items: [{ title: '', message: ''}],
  iconUrl:'images/get_started16.png'

};

chrome.alarms.onAlarm.addListener(function( alarm ) {
  chrome.notifications.create('notify1', opt, function(id) { console.log("Last error:", chrome.runtime.lastError); });
  chrome.notifications.clear('notify1', function(id) { console.log("Last error:", chrome.runtime.lastError); });
;
});


var xmlHttp = new XMLHttpRequest();
xmlHttp.open("GET", "https://api.chatwork.com/v2/rooms/43446443/messages", false);
xmlHttp.setRequestHeader("X-ChatWorkToken", "e23a78058e9ff971d1240110248a6af4");
xmlHttp.send(null)
alert("Result: " + xmlHttp.responseText);

