// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

window.onload = function() {
	var allGroupsStr;
	chrome.storage.sync.get(["allGroups", "selectedGroups"], function(data) {
		updateTable(data.allGroups, data.selectedGroups);
	});

	document.getElementById("btnSelectAll").onclick = function() {
		updateAllCheckbox(true);
	};

	document.getElementById("btnDeselectAll").onclick = function() {
		updateAllCheckbox(false);
	};

	document.getElementById("btnSaveToken").onclick = function() {
		var tokenKey = document.getElementById("txtTokenKey").value;
		if (tokenKey == null || tokenKey == "") {
			alert("Please enter your chatwork token key!");
			return;
		}
		chrome.storage.sync.set({"tokenKey": tokenKey}, function() {

		});
	};

	document.getElementById("btnSaveSettings").onclick = function() {
		var checkboxArr = document.getElementsByName("selection[]");
		var selectedGroups = [];
		for (var i = 0; i < checkboxArr.length; i++) {
			if (checkboxArr[i].checked) {
				selectedGroups.push(checkboxArr[i].value);
			}
		}
		chrome.storage.sync.set({"selectedGroups": JSON.stringify(selectedGroups)}, function() {
			alert("Save settings successfully!");
		});
	};
};

function updateTable(allGroupsStr, selectedGroupsStr) {
	if (allGroupsStr == null || allGroupsStr == "") {
		console.log("No groups cache found!");
		return;
	}
	var allGroups = JSON.parse(allGroupsStr);
	var selectedGroups = JSON.parse(selectedGroupsStr);
	var table = document.getElementById("tblGroupList");
	var tableRowCount = table.getElementsByTagName("tr").length;
	for (var i = 0; i < tableRowCount - 1; i++) {
		table.deleteRow(i);
	}
	for (var i = 0; i < allGroups.length; i++) {
		var newRow = table.insertRow(i + 1);
		var orderCell = newRow.insertCell(0);
		orderCell.classList.add("text-center");
		var groupIDCell = newRow.insertCell(1);
		groupIDCell.classList.add("text-padding-10");
		var groupNameCell = newRow.insertCell(2);
		groupNameCell.classList.add("text-padding-10");
		var selectionCell = newRow.insertCell(3);
		orderCell.innerHTML = i + 1;
		groupIDCell.innerHTML = allGroups[i].room_id;
		groupNameCell.innerHTML = allGroups[i].name;
		var checkedStr = "";
		if (selectedGroups.includes(allGroups[i].room_id + "")) {
			checkedStr = "checked";
		}
		selectionCell.innerHTML = "<input type='checkbox' name='selection[]' value='" + allGroups[i].room_id + "' " + checkedStr + "/>";
		if (i % 2 == 1) {
			newRow.classList.add("odd-row");
		}
	}
}

function updateAllCheckbox(isChecked) {
	var checkboxArr = document.getElementsByName("selection[]");
	for (var i = 0; i < checkboxArr.length; i++) {
		checkboxArr[i].checked = isChecked;
	}
}
