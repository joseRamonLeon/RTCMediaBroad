

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
var callButton = document.querySelector("#call_button");
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
		
		remoteVideo_block.appendChild(mediaElem);
		mediaElem.controls = "true";
		mediaElem.style.width = "100%";
		
		newLogMessage(Strings.userConnSuc);
		waitPic.style.display = "none";
	},
	onUserDisconnected: function(userToken, ip) {
		console.log("onUserDisconnected", userToken, ip);
		Broadcast.disconnect();
		
		closePopup();
		messages_block.textContent = Strings.callEnd;
		newLogMessage();
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

callButton.onclick = function(e) {
	Broadcast = Broadcasting(socketConfig);
	Broadcast.create();
	
	openPopup();
	newLogMessage(Strings.confirmAccess);
};

endCallButton.onclick = function() {
	Broadcast.disconnect();
	
	closePopup();
	messages_block.textContent = Strings.callEnd;
	newLogMessage();
};

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
	selfUserToken_block.innerHTML = "";
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


