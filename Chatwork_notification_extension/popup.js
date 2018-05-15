// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let changeColor = document.getElementById('changeColor');

chrome.storage.sync.get('color', function(data) {
  changeColor.style.backgroundColor = data.color;
  changeColor.setAttribute('value', data.color);
});

changeColor.onclick = function(element) {
  let color = element.target.value;
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.executeScript(
        tabs[0].id,
        {code: 'document.body.style.backgroundColor = "' + color + '";'});
  });
};

let alarmButton = document.getElementById('toggleAlarm');
alarmButton.onclick = function(element) {
  checkAlarm();
}

alarmButton.addEventListener('click', doToggleAlarm);

var alarmName = 'remindme';

function checkAlarm(callback) {
  chrome.alarms.getAll(function(alarms) {
    var hasAlarm = alarms.some(function(a) {
      return a.name == alarmName;
    });
    var newLabel;
    if (hasAlarm) {
      newLabel = 'Cancel alarm';
    } else {
      newLabel = 'Activate alarm';
    }
    document.getElementById('toggleAlarm').innerText = newLabel;
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
