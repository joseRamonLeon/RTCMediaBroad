

var FB_addr = "https://js-test.firebaseio.com/RTCMediaBroad/dataChannel/";
var FB = new Firebase(FB_addr);
var Broadcast;
var constraints = {
		audio: true,
		video: false
	};

var Channel = "channel";
var channelSocket = FB.child(Channel).child("socket");

var socketConfig = {
	constraints: constraints,
	openSocket: function(nConfig) {
		var room = nConfig.channel || Channel;
		var Sref = channelSocket;
		Sref.channel = room;
		Sref.on("child_added", function(data) {
			nConfig.onmessage(data.val());
		});
		Sref.send = function(data) {
			this.push(data);
		};
		if (nConfig.onopen) setTimeout(nConfig.onopen, 1);
		
		Sref.removeSocket = function() {
			Sref.set("");
		};
		
		return Sref;
	},
	onUserConnected: function(userToken, mediaElem, ip) {
		document.body.appendChild(mediaElem);
		mediaElem.controls = true;
		mediaElem.width = 150;
		
		dataChannelPanel.style.display = "block";
		receivedList.innerHTML = "";
	},
	onUserDisconnected: function(userToken, ip) {
		var video = document.getElementById(userToken);
		video.parentNode.removeChild(video);
	},
	onRoomFounded: function(roomToken, adminToken) {
		connectToRoom(roomToken, adminToken);
	},
	onGetMediaSuccess: function(myToken, mediaElem) {
		if (mediaElem.audio) {
			mediaElem.controls = true;
		}
		document.body.appendChild(mediaElem);
		mediaElem.width = 100;
	},
	onError: function(message) {
		console.warn("onError", message);
		//
	},
	
	onReceiveData: function(data, sender) {
		console.log("onReceiveData:", sender, data);
		var txt = document.createElement("pre");
		txt.innerHTML = "<b>" + sender + "</b>: " + data;
		receivedList.appendChild(txt);
	},
	onReceiveFile: function(base64, fileName, sender) {
		console.log("onReceiveFile:", fileName, sender);
		var link = document.createElement("a");
		link.href = base64;
		link.target = "_blank";
		link.innerHTML = "<b>" + sender + "</b>: " + fileName;
		receivedList.appendChild(link);
	}
};

function createRoom() {
	Broadcast.create();
}
function connectToRoom(roomToken, broadcaster) {
	Broadcast.connect(roomToken, broadcaster);
}
function disconnect() {
	Broadcast.disconnect();
}

document.querySelector("#create").onclick = function(e) {
	createRoom();
};
document.querySelector("#disconnect").onclick = function() {
	disconnect();
};


var dataChannelPanel = document.querySelector("#data_channel_block");
var receivedList = document.querySelector("#data_list");

var file = document.querySelector("#file");
var sendFile = document.querySelector("#send_file");
var infoBl = document.querySelector("#send_file_mess");

var textField = document.querySelector("#text_data");
var sendData = document.querySelector("#send_data");

sendData.onclick = function() {
	Broadcast.sendData(textField.value);
	textField.value = "";
};
sendFile.onclick = function() {
	var fileObj = file.files[0];
	
	Broadcast.sendFile(fileObj, function() {
			console.info("file sended successfully");
			infoBl.textContent = "sended successful";
		}, function(error) {
			console.warn(error);
			infoBl.textContent = "error on sending file";
		}, function(percents) {
			infoBl.textContent = "sended " + percents + "%";
		});
};


Broadcast = Broadcasting(socketConfig);




