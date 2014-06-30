

var FB_addr = "https://js-test.firebaseio.com/RTCMediaBroad/videoBroadcasting/";
var FB = new Firebase(FB_addr);
var Broadcast;
var constraints = {
		audio: true,
		video: true
	};

var Channel = "channel";
var channelSocket = FB.child(Channel).child("socket");

/*UI: */
var roomList = document.querySelector("#room_list");
var roomListHint = document.querySelector("#calls_hint");
var endCallButton = document.querySelector("#disconnect");
var audioButton = document.querySelector("#switch_audio");
var videoButton = document.querySelector("#switch_video");
var messages_block = document.querySelector("#service_message_block");
var callPopup = document.querySelector("#call_popup");
var selfUserToken_block = document.querySelector("#self_usertoken");
var remoteUserToken_block = document.querySelector("#remote_usertoken");
var selfVideo_block = document.querySelector("#self_video");
var remoteVideo_block = document.querySelector("#remote_video");
var log_block = document.querySelector("#messages_list");
var waitPic = document.querySelector("#call_waiting_img");


var socketConfig = {
	constraints: constraints,
	openSocket: function(nConfig) {
		console.log("openSocket");
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
		console.log("onUserConnected", userToken, ip, mediaElem);
		remoteUserToken_block.innerHTML = userToken + "<br/>" + ip;
		
		remoteVideo_block.innerHTML = "";
		remoteVideo_block.appendChild(mediaElem);
		mediaElem.controls = "true";
		mediaElem.style.width = "100%";
		
		newLogMessage(Strings.userConnSuc);
		waitPic.style.display = "none";
	},
	onUserDisconnected: function(userToken, ip) {
		console.log("onUserDisconnected", userToken, ip);
		Broadcast.disconnect();
		Broadcast = Broadcasting(socketConfig);
		
		closePopup();
		messages_block.textContent = Strings.callEnd;
		newLogMessage();
	},
	onRoomFounded: function(roomToken, adminToken) {
		if (!document.querySelector("[room=" + roomToken + "]")) {
			console.log("onRoomFounded", roomToken, adminToken);
			roomListHint.innerHTML = "";
			var but = document.createElement("div");
			but.className = "button_block room_button";
			but.setAttribute("room", roomToken);
			but.setAttribute("admin", adminToken);
			but.innerHTML = roomToken;
			roomList.appendChild(but);
			but.onclick = function(e) {
				var b = e.target;
				var room = b.getAttribute("room");
				var admin = b.getAttribute("admin");
				connectToRoom(room, admin);
			};
		}
	},
	onRoomClosed: function(roomToken, adminToken) {
		console.log("onRoomClosed", roomToken, adminToken);
		var but = document.querySelector("[room='" + roomToken + "']");
		if (but) {
			roomList.removeChild(but);
			
			if (roomList.children.length == 0) {
				roomListHint.innerHTML = Strings.noCalls;
			}
		}
	},
	onGetMediaSuccess: function(myToken, mediaElem) {
		console.log("onGetMediaSuccess", myToken, mediaElem);
		selfUserToken_block.innerHTML = myToken + "<br/>" + (window.IP || "");
		
		openPopup();
		selfVideo_block.appendChild(mediaElem);
		mediaElem.style.width = "100%";
		
		newLogMessage(Strings.waitRes);
		waitPic.style.display = "block";
	},
	onError: function(message) {
		console.warn("onError", message);
		Broadcast.disconnect();
		Broadcast = Broadcasting(socketConfig);
		
		closePopup();
		messages_block.textContent = "Error: " + message;
	}
};

endCallButton.onclick = function() {
	Broadcast.disconnect();
	Broadcast = Broadcasting(socketConfig);
	
	closePopup();
};
function connectToRoom(roomToken, adminToken) {
	Broadcast.connect(roomToken, adminToken);
	
	openPopup();
	newLogMessage(Strings.connecting);
	newLogMessage(Strings.confirmAccess);
	
	//send message about closing room
		//its necessary to hide answered room from other users: 
	channelSocket.push({
			roomToken: roomToken,
			broadcaster: adminToken,
			closed: true
		});
}

function openPopup() {
	messages_block.innerHTML = "";
	
	callPopup.style.display = "block";
	
	audioButton.style.backgroundImage = "url(" + Strings.micOn + ")";
	audioState = true;
	videoButton.style.backgroundImage = "url(" + Strings.cameraOn + ")";
	videoState = true;
}
function closePopup() {
	callPopup.style.display = "none";
	waitPic.style.display = "none";
	remoteVideo_block.innerHTML = "";
	selfVideo_block.innerHTML = "";
	remoteUserToken_block.innerHTML = "";
}
function newLogMessage(message) {
	if (message != undefined) {
		log_block.innerHTML += message + "<br/>";
		log_block.scrollTop = log_block.scrollHeight;
	}
	else {
		log_block.innerHTML = "";
	}
}


var audioState = true;
audioButton.onclick = function() {
	var img = "";
	var res = Broadcast.switchAudio(!audioState);
	audioState = res;
	if (res == true) {
		img = Strings.micOn;
	}
	else {
		img = Strings.micOff;
	}
	audioButton.style.backgroundImage = "url(" + img + ")";
};

var videoState = true;
videoButton.onclick = function() {
	var img = "";
	var res = Broadcast.switchVideo(!videoState);
	videoState = res;
	if (res == true) {
		img = Strings.cameraOn;
	}
	else {
		img = Strings.cameraOff;
	}
	videoButton.style.backgroundImage = "url(" + img + ")";
};


Broadcast = Broadcasting(socketConfig);



