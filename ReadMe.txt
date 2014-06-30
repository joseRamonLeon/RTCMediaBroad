
RTCMediaBroad - JS library for video/audio broadcasting based on RTCPeerConnnection 
and data broadcasting via WebRTC dataChannel.

RTCMediaBroad_2.0.js:	https://googledrive.com/host/0B2JzwD3Qc8A8cUJaRGcxOGd1a0U
MIT license:		https://googledrive.com/host/0B2JzwD3Qc8A8QkZHMktnaExiaTg


How to use: 

For start broadcasting need to create Broadcasting object with parameters like: 

var socketConfig = {
	constraints: { video: true, audio: true },
	openSocket: function(config) {
		var Socket = ...
		Socket.channel = config.channel || "channel-string";
		Socket.onmessage = function(data) {
			config.onmessage(data);
		};
		Socket.send = function(data) {
			//sending...
		};
		if (config.onopen) setTimeout(config.onopen, 1);
		
		Socket.removeSocket = function() {
			//clearing socket...
		};
		
		return Socket;
	},
	onUserConnected: function(userToken, mediaElem, ip) {
		//show media (audio/video elem) of connected user
	},
	onUserDisconnected: function(userToken, ip) {
		//can remove elem
	},
	onRoomFounded: function(roomToken, adminToken) {
		//founded new room, can connect
	},
	onGetMediaSuccess: function(myToken, mediaElem) {
		//your media was successful obtained
	},
	onError: function(message) {
		//get media error
	},
	
	onReceiveData: function(data, sender) {
		//somebody sent text data
	},
	onReceiveFile: function(base64, fileName, sender) {
		//somebody sent file
		//file received as Base64 string
	}
};

//Create Broadcasting object: 
var Broadcast = Broadcasting(socketConfig);

//After this need to create room or connect to room


Broadcast have a methods: 

create()	-	creating room

connect(roomToken, broadcasterToken)	-	connecting to existing room
	can invoke this method in onRoomFounded

disconnect()	-	disconnecting from socket

restart()	-	restart broadcasting (may be necessary if room starter left the conference)

userCount()	-	get number of connected users

switchAudio(state)	-	switch on/off audio sreaming. Audio stream will be paused.
	state - boolean

switchVideo(video)	-	switch on/off video streaming
	For example: 
		//Off video: 
		Broadcast.switchVideo(false);

sendData(dataString)	-	send text data via dataChannel

sendFile(file, onSuccess, onError, onProgressChanged)	-	send file data via dataChannel
	file - file object
	onSuccess, onError, onProgressChanged - callback functions
	
	For example: 
		var file = document.querySelector("#file_field").files[0];
		
		Broadcast.sendFile(file, function() {
				console.info("file sended successfully");
			}, function(error) {
				console.warn(error);
			}, function(percents) {
				console.log("sended " + percents + "%");
			});


Library has a function for checking WebRTC support:
checkSupport()

This function returns object: 
{
	res: boolean,
	message: string
}
	res - true if WebRTC is fully supported
	message - info about problem if some WebRTC functions is not supported


Media broadcasting constraints - object defaultConstraints
Is used by default if constraints was not specified in socketConfig







