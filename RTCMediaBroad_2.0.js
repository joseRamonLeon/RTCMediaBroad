
/**
RTCMediaBroad - library for WebRTC video/audio brodcasting

Autor:		kamikad7e (kamikad7e@gmail.com)
MIT license:	https://googledrive.com/host/0B2JzwD3Qc8A8QkZHMktnaExiaTg
How to use:		https://googledrive.com/host/0B2JzwD3Qc8A8ZUZlMVZOVjhYZnM
*/


window.moz = !!navigator.mozGetUserMedia;
window.URL = window.webkitURL || window.mozURL || window.URL;
navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.getUserMedia;

function checkSupport() {
	var res = { res: false, message: "" };
	
	var getM = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || 
			navigator.getUserMedia || false;
	var rtcPeer = window.mozRTCPeerConnection || window.webkitRTCPeerConnection || 
			window.RTCPeerConnection || false;
	var sDescr = window.mozRTCSessionDescription || window.RTCSessionDescription || false;
	var iceCand = window.mozRTCIceCandidate || window.RTCIceCandidate || false;
	
	if (getM) {
		if (rtcPeer) {
			if (sDescr) {
				if (iceCand) {
					res.res = true;
					res.message = "OK";
				}
				else res.message = "RTCIceCandidate is not supported";
			}
			else res.message = "RTCSessionDescription is not supported";
		}
		else res.message = "RTCPeerConnection is not supported";
	}
	else res.message = "getUserMedia is not supported";
	
	return res;
}

function generateRandomToken() {
	var alph = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	
	function getN() {
		return Math.round(Math.random() * (alph.length - 1));
	}
	
	var token = "";
	for (var i = 0; i < 10; i++) {
		token += alph[getN()];
	}
	
	return token;
}


/* getUserMedia constraints: */
var defaultConstraints = {
	"audio": true,
	"video": {
		"mandatory": {
			"minWidth": "320",
			"maxWidth": "1280",
			"minHeight": "180",
			"maxHeight": "720",
			"minFrameRate": "30",
			"maxFrameRate": "60"
		},
		"optional": [
		    { "facingMode": "user" }
		]
 	}
};

/* ICE: */
var Servers = [
	{ url: 'stun:stun.anyfirewall.com:3478' },
	{ url: 'turn:turn.anyfirewall.com:443?transport=tcp',
	username: 'webrtckamtest',
	credential : 'kfSDjHJ' },
	{ url: 'turn:192.158.29.39:3478?transport=udp',
		credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
		username: '28224511:1379330808' }
];
/* List of ICE servers: 
{ url: 'stun:stun.anyfirewall.com:3478' },
{ url: 'stun:stun1.l.google.com:19302' },
{ url: 'stun:stun2.l.google.com:19302' },
{ url: 'stun:stun3.l.google.com:19302' },
{ url: 'stun:stun4.l.google.com:19302' },

{ url: 'turn:192.158.29.39:3478?transport=udp',
	credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
	username: '28224511:1379330808' },
{ url: 'turn:192.158.29.39:3478?transport=tcp',
	credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
	username: '28224511:1379330808' }

{ url: 'turn:turn.anyfirewall.com:443?transport=tcp',
	username: 'webrtckamtest',
	credential : 'kfSDjHJ' }
{ url: 'turn:turn.anyfirewall.com:3478?transport=udp',	<-- this server works incorrect for Chrome
	username: 'webrtckamtest',
	credential: 'kfSDjHJ' },
*/

//Setting bandwidth, support only chrome: 
var peerBandwidth = { audio: 128, video: 512 };

var peerOptional = [{ DtlsSrtpKeyAgreement: true }, { RtpDataChannels: true }];

var dataChannelOptions = {
	optional: {
		ordered: true
	},
	//Sending files parameters: 
	delay: 150,		//interval between the sending of packets, ms
	packetSize: 500	//packet length, characters
};

function RTCPeerConnection(options) {
	var PeerConnection = window.mozRTCPeerConnection || 
			window.webkitRTCPeerConnection || window.RTCPeerConnection;
	var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
	var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
	var Peer;
	var channel = options.channel;
	var iceServers = { iceServers: Servers };
	var optional = { optional: peerOptional };
	var bandwidth = peerBandwidth;
	var dataChannel;
	
	Peer = new PeerConnection(iceServers, optional);
	
	function createDataChannel() {
		if (Peer && Peer.createDataChannel) {
			console.log("createDataChannel");
			dataChannel = Peer.createDataChannel("data-channel", dataChannelOptions.optional);
			
			dataChannel.onerror = function(err) {
				console.warn("dataChannel error:", err);
			};
			dataChannel.onmessage = function(ev) {
				console.log("dataChannel onmessage", ev.data.substr(0, 20) + "...");
				if (options.onReceiveData) {
					options.onReceiveData(ev.data);
				}
			};
			dataChannel.onopen = function() {
				console.log("dataChannel opened");
			};
		}
		else console.warn("your browser does not support dataChannel");
	}
	createDataChannel();
	
	Peer.onicecandidate = function(event) {
		//console.log(event);
		if (event.candidate) {
			options.onNewICE(event.candidate);
		}
	};
	
	if (options.attachStream) {
		console.log("Peer.addStream");
		Peer.addStream(options.attachStream);
	}
	
	Peer.onaddstream = function(event) {
		//console.log("onaddstream", event);
		var stream = event.stream;
		
		if (options.onRemoteStream) {
			options.onRemoteStream(stream);
		}
		
		stream.onended = function() {
			if (options.onRemoteStreamEnded) {
				options.onRemoteStreamEnded(stream);
			}
		};
	};
	
	var constraints = options.constraints || {
		optional: [],
		mandatory: {
			OfferToReceiveAudio: true,
			OfferToReceiveVideo: true
		}
	};
	
	function createOffer() {
		if (options.onOfferSDP) {
			Peer.createOffer(function(sessionDescription) {
					sessionDescription.sdp = setBandwidth(sessionDescription.sdp);
					Peer.setLocalDescription(sessionDescription);
					options.onOfferSDP(sessionDescription);
				}, onSdpError, constraints);
		}
	}
	
	function createAnswer() {
		if (options.onAnswerSDP) {
			Peer.setRemoteDescription(new SessionDescription(options.offerSDP),
				onSdpSuccess, onSdpError);
			Peer.createAnswer(function(sessionDescription) {
					sessionDescription.sdp = setBandwidth(sessionDescription.sdp);
					Peer.setLocalDescription(sessionDescription);
					options.onAnswerSDP(sessionDescription);
				}, onSdpError, constraints);
		}
	}
	
	createOffer();
	createAnswer();
	
	function setBandwidth(sdp) {
		//console.debug("sdp", sdp);
		if (!moz && bandwidth) {
			sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, '');
			if (bandwidth.audio) {
				sdp = sdp.replace(/a=mid:audio\r\n/g,
						'a=mid:audio\r\nb=AS:' + bandwidth.audio + '\r\n');
			}
			if (bandwidth.video) {
				sdp = sdp.replace(/a=mid:video\r\n/g,
						'a=mid:video\r\nb=AS:' + bandwidth.video + '\r\n');
			}
		}
		
		return sdp;
	}
	
	function onSdpSuccess() {
		//
	}
	function onSdpError(e) {
		console.warn("sdp error:", JSON.stringify(e));
	}
	
	
	/* Parsing IP from ICE candidate: */
	var IP = "";
	var localIP = "";
	function parseExternalIP(candidate) {
		var addr = undefined;
		var regexpCandidate = /^(.*)(udp |tcp )[0-9]*[ ]([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})[ ](.*)(typ relay raddr )([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})(.*)/;
		var regexpRaddrIp = /(typ relay raddr )[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/;
		var regexpIp = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/g;
		
		if (candidate.search(regexpCandidate) + 1) {
			var start = candidate.search(regexpRaddrIp);
			start = (candidate.substring(start)).search(regexpIp) + start;
			var end = new RegExp(regexpIp);
			end.exec(candidate.substring(start));
			end = end.lastIndex + start;
			
			addr = candidate.substring(start, end);
			if (!(addr.search(regexpIp) + 1)) {
				addr = undefined;
			}
			else console.debug("external IP:", addr);
		}
		return addr;
	}
	function parseLocalIP(candidate) {
		var addr = undefined;
		var regexpCandidate = /^(.*)( udp | tcp )[0-9]*[ ]([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})[ ](.*)( typ host )(.*)/;
		var regexpHostIp = /([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})[ ](.*)( typ host )(.*)/;
		var regexpIp = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/g;
		
		if (candidate.search(regexpCandidate) + 1) {
			var start = candidate.search(regexpHostIp);
			var end = new RegExp(regexpIp);
			end.exec(candidate.substring(start));
			end = end.lastIndex + start;
			
			addr = candidate.substring(start, end);
			if (!(addr.search(regexpIp) + 1)) {
				addr = undefined;
			}
			else console.debug("local IP:", addr);
		}
		return addr;
	}
	
	return {
		addAnswerSDP: function(sdp) {
			Peer.setRemoteDescription(new SessionDescription(sdp), onSdpSuccess, onSdpError);
		},
		addICE: function(candidate) {
			//Save IP addresses of remote user:
			if (!IP) {
				var ip = parseExternalIP(candidate.candidate);
				if (ip) {
					IP = ip;
				}
			}
			if (!localIP) {
				var ip = parseLocalIP(candidate.candidate);
				if (ip) {
					localIP = ip;
				}
			}
			
			Peer.addIceCandidate(new IceCandidate({
					sdpMLineIndex: candidate.sdpMLineIndex,
					candidate: candidate.candidate
				}));
		},
		peer: Peer,
		channel: channel,
		getIP: function() {
			return IP || localIP || "";
		},
		
		dataChannel: dataChannel,
		sendData: function(data) {
			if (dataChannel.send) {
				dataChannel.send(data);
			}
			else {
				console.warn("sendData error: dataChannel is not opened");
			}
		}
	};
}



var Broadcasting = function (config) {
	var self = { userToken: "user-" + generateRandomToken() };
	console.info("userToken", self.userToken);
	var channels = [];
	var roomList = new Object();
	var peerList = {};
	var isImAdmin = false;
	var createNewRoom = true;
	var defaultSocket = {};
	var isConnected = false;
	
	if (!config.constraints) {
		config.constraints = defaultConstraints;
	}
	
	function getPeerCount() {
		return (Object.keys(peerList).length + 1);
	}
	
	function disconnect() {
		console.log("disconnect");
		isConnected = false;
		
		try {
			config.attachStream.stop();
		} catch(e) {}
		
		if (defaultSocket) {
			defaultSocket.send({
					userToken: self.userToken,
					disconnect: true
				});
			
			//If admin close room: 
			if (isImAdmin) {
				defaultSocket.send({
						roomToken: self.roomToken,
						broadcaster: self.userToken,
						closed: true
					});
				
				//and clear socket: 
				if (defaultSocket.removeSocket) {
					defaultSocket.removeSocket();
				}
			}
		}
		
		for (var token in peerList) {
			try {
				peerList[token].peer.close();
				delete peerList[token];
				console.log("close peer", token);
			} catch(e) {
				console.warn("leaveRoom", "Need to have a connection for disconnecting, lol");
			}
		}
		
		defaultSocket = null;
	}
	addEventListener("beforeunload", function() {
			disconnect();
		});

	function openDefaultSocket() {
		defaultSocket = config.openSocket({
				onmessage: onDefaultSocketSignaling,
				callback: function(socket) {
					defaultSocket = socket;
				}
			});
	}
	
	function onDefaultSocketSignaling(message) {
		if (message.userToken != self.userToken) {
			//Somebody left the room: 
			if (message.disconnect) {
				var token = message.userToken;
				//console.log("user leave room:", token);
				try {
					peerList[token].peer.close();
					delete peerList[token];
					
					console.log("remains " + getPeerCount() + " users in room");
				} catch(e) {}
			}
			
			//Room closed: 
			if (message.closed) {
				var room = message.roomToken;
				var broadcaster = message.broadcaster;
				if (roomList[broadcaster]) {
					console.log("room closed:", room, "broadcaster:", broadcaster);
					//delete roomList[broadcaster];
				}
				if (config.onRoomClosed) {
					config.onRoomClosed(room, broadcaster);
				}
			}
			
			//Room founded: 
			if (createNewRoom && message.roomToken && message.broadcaster && !message.closed) {
				var token = message.roomToken;
				var broadcaster = message.broadcaster;
				if (!roomList[broadcaster]) {
					console.log("roomList new", token, "broadcaster: " + broadcaster);
					roomList[broadcaster] = token;
					
					if (config.onRoomFounded) {
						config.onRoomFounded(token, broadcaster);
					}
				}
			}
			
			if (message.newParticipant && self.joinedARoom && (self.broadcasterid == message.userToken)) {
				onNewMember(message.newParticipant);
			}
			
			if (message.userToken && (message.joinUser == self.userToken) && message.participant && 
					(channels.indexOf(message.userToken) == -1)) {
				channels.push(message.userToken);
				openSubSocket({
						isOffered: true,
						channel: message.channel || message.userToken,
						peerToken: message.userToken
					});
			}
		}
	}
	
	function openSubSocket(nConfig) {
		if (nConfig.channel != undefined) {
			var isOffered = nConfig.isOffered;
			var streamed = false;
			var SDP;
			var peer;
			
			var onSubSocketSignaling = function(message) {
				if (message.userToken != self.userToken) {
					
					if (message.sdp) {
						SDP = JSON.parse(message.sdp);
						selfInvoker();
					}
					
					if (message.candidate && !streamed) {
						if (peer) {
							peer.addICE({
									sdpMLineIndex: message.candidate.sdpMLineIndex,
									candidate: JSON.parse(message.candidate.candidate)
								});
						}
					}
				}
			};
			
			var peerCreate = function(offerSDP) {
				if (!offerSDP) {
					peerConfig.onOfferSDP = sendSDP;
				}
				else {
					peerConfig.offerSDP = offerSDP;
					peerConfig.onAnswerSDP = sendSDP;
				}

				peer = RTCPeerConnection(peerConfig);
				
				peerList[nConfig.peerToken] = peer;
				console.debug(peer);
			};
			
			var socketConfig = {
				channel: nConfig.channel,
				onmessage: onSubSocketSignaling,
				onopen: function() {
					if (isOffered && !peer) {
						peerCreate();
					}
				}
			};
			socketConfig.callback = function(nSocket) {
				socket = nSocket;
				this.onopen();
			};
			
			var socket = config.openSocket(socketConfig);
			
			var peerConfig = {
				channel: nConfig.channel,
				peerToken: nConfig.peerToken,
				
				attachStream: config.attachStream,
				onNewICE: function(candidate) {
					socket.send({
							userToken: self.userToken,
							candidate: {
								sdpMLineIndex: candidate.sdpMLineIndex,
								candidate: JSON.stringify(candidate.candidate)
							}
						});
				},
				onRemoteStream: function(stream) {
					if (stream) {
						console.log("onRemoteStream", nConfig.peerToken, stream);
						var media;
						nConfig.stream = stream;
						nConfig.stream.userToken = nConfig.peerToken;
						/*Checking stream starting: */
						var mediaStartFlow = function() {
							//console.log("mediaStartFlow", (media.currentTime <= 0), (media.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA));
							if (!(media.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA)) {
								streamed = true;
								if (isImAdmin && channels.length > 1) {
									defaultSocket.send({
											newParticipant: socket.channel,
											userToken: self.userToken
										});
								}
								
								nConfig.IP = peer.getIP();
								
								if (config.onUserConnected) {
									var token = stream.userToken || "HUITA";
									console.log("mediaStartFlow", stream.userToken);
									media.id = token;
									
									config.onUserConnected(token, media, nConfig.IP);
									media.play();
								}
							}
							else setTimeout(mediaStartFlow, 200);
						};
						
						/* Video or audio element: */
						if (config.constraints.video) {
							media = document.createElement("video");
							media.video = true;
						}
						else {
							media = document.createElement("audio");
							media.audio = true;
						}
						appendStream(media, stream);
						
						mediaStartFlow();
					}
				},
				onRemoteStreamEnded: function(stream) {
					if (stream) {
						console.log("onRemoteStreamEnded", stream.userToken, stream);
						if (config.onUserDisconnected) {
							var token = stream.userToken || "XyuTebe";
							config.onUserDisconnected(token, nConfig.IP);
						}
					}
				},
				
				onReceiveData: function(data) {
					if (config.onReceiveData || config.onReceiveFile) {
						if (data != undefined) {
							var dataObj = JSON.parse(data);
							
							//Receive message: 
							if (dataObj.type === "message") {
								if (config.onReceiveData) {
									config.onReceiveData(dataObj.data, nConfig.peerToken);
								}
							}
							
							//Receive file: 
							else if (dataObj.type === "file") {
								if (config.onReceiveFile) {
									/*Check file metadata: */
									var isMetaData = false;
									var metaData;
									try {
										metaData = JSON.parse(dataObj.data);
										if (metaData.name, metaData.mimeType, metaData.size) {
											isMetaData = true;
										}
									} catch(e) {}
									
									//Start or end of file: 
									if (isMetaData) {
										if (metaData.start) {
											Files[nConfig.peerToken] = new receiveFile(nConfig.peerToken,
													metaData.name, 
													config.onReceiveFile
												);
										}
										else {
											Files[nConfig.peerToken].end();
										}
									}
									//File content saving: 
									else {
										if (Files[nConfig.peerToken] && dataObj.data) {
											Files[nConfig.peerToken].append(dataObj.data);
										}
										else {
											console.debug("receiveFile", "file not found");
										}
									}
								}
							}
						}
					}
				}
			};
			
			var sendSDP = function(sdp) {
				socket.send({
						userToken: self.userToken,
						sdp: JSON.stringify(sdp)
					});
			};
			
			var invoked = false;
			var selfInvoker = function() {
				if (!invoked) {
					invoked = true;
					
					if (isOffered) {
						peer.addAnswerSDP(SDP);
					}
					else peerCreate(SDP);
				}
			};
		}
	}
	
	
	function sendFile(file, onSuccess, onError, onProgress) {
		if (file.name && file.size) {
			var metaData = {
					start: true,
					name: file.name,
					mimeType: file.type || "text/plain",
					size: file.size
				};
			console.log("sendFile:", metaData);
			sendDataChannelMessage(JSON.stringify(metaData), "file");
			
			getBase64AsArray(file, function(arr, error) {
					if (!error) {
						var delay = dataChannelOptions.delay;
						var counter = 0;
						var n = arr.length;
						var attemptsCounter = 0;
						
						var finish = function() {
							var metaData = {
									start: false,
									name: file.name,
									mimeType: file.type,
									size: file.size
								};
							sendDataChannelMessage(JSON.stringify(metaData), "file");
							
							onSuccess();
						};
						var sending = function() {
							//Try to send 3 times: 
							try {
								sendDataChannelMessage(arr[counter], "file");
								//console.log("sending, packets counter:", counter);
								counter++;
								onProgress(Math.round(counter * 100 / n));
								if (counter < n) {
									window.setTimeout(function() {
											sending();
										}, delay);
								}
								else {
									finish();
								}
								attemptsCounter = 0;
							} catch(err) {
								if (attemptsCounter < 3) {
									console.warn("packet sending unsuccessful attempt:", err.message);
									attemptsCounter++;
									window.setTimeout(function() {
										sending();
									}, delay);
								}
								else {
									console.warn("sending file error:", err.message);
									onError("sending file error:", err);
								}
							}
						};
						
						sending();
					}
					else {
						console.warn("getBase64AsArray error:", error);
						onError(error);
					}
				});
		}
		else {
			onError("sendFile error: could not get file metadata");
		}
	}
	
	var Files = new Object();
	function receiveFile(userToken, fileName, success) {
		var th = this;
		th.file = "";
		th.fileName = fileName;
		th.user = userToken;
		
		th.append = function(data) {
			th.file += data;
		};
		
		th.end = function() {
			success(th.file, th.fileName, th.user);
			
			console.log("removing received file object", th.fileName, th.user);
			delete Files[th.user];
		};
		console.log("receiveFile:", th);
	}
	
	/*Split file base64 into an array: */
	function getBase64AsArray(thFile, callback) {
		var packetSize = dataChannelOptions.packetSize;
		var reader = new FileReader();
		
		reader.onloadend = function(ev) {
			var res = ev.target.result;
			if (res) {
				var arr = [];
				
				if (packetSize < res.length) {
					var pckts = Math.ceil(res.length / packetSize);
					var start = 0;
					var stop = res.length;
					console.log("getBase64AsArray, packets:", pckts);
					for (var i = 0; i < pckts; i++) {
						var packet = res.substr(start, packetSize);
						arr.push(packet);
						start += packetSize;
					}
				}
				else {
					arr.push(res);
				}
				
				callback(arr);
			}
		};
		reader.onerror = function(ev) {
			console.warn("error on reading file:", ev);
			callback(null, ev.target.error.name + ": " + ev.target.error.message);
		};
		
		reader.readAsDataURL(thFile);
	}
	
	function sendDataChannelMessage(data, type) {
		if (data != undefined) {
			var Data = JSON.stringify({
					data: data,
					type: type
				});
			
			if (getPeerCount() > 1) {
				for (var key in peerList) {
					peerList[key].sendData(Data);
				}
			}
			else {
				console.warn("could not send data because list of datachannels is empty");
			}
		}
		else {
			console.log("could not send \"undefined\"");
		}
	}
	
	
	function startBroadcasting() {
		console.log("startBroadcasting", "roomToken: " + self.roomToken);
		isImAdmin = true;
		function broadcasting() {
			if (defaultSocket) {
				defaultSocket.send({
						roomToken: self.roomToken,
						broadcaster: self.userToken
					});
				//Intervar sending offer for new connected user: 
				//setTimeout(broadcasting, 5000);
			}
		}
		broadcasting();
	}

	function onNewMember(channel) {
		console.log("onNewMember", channel);
		if (channel && (channels.indexOf(channel) == -1) && (channel != self.userToken)) {
			channels.push(channel);

			var subChannel = generateRandomToken();
			openSubSocket({
					channel: subChannel,
					peerToken: channel
				});

			defaultSocket.send({
					participant: true,
					userToken: self.userToken,
					joinUser: channel,
					channel: subChannel
				});
		}
	}
	
	/* getUserMedia: */
	function appendStream(mediElem, stream) {
		var moz = !!navigator.mozGetUserMedia;
		if (moz) mediElem.mozSrcObject = stream;
		else {
			mediElem.src = window.URL.createObjectURL(stream) || stream;
		}
		mediElem.play();
	}
	
	var myMediaStream;
	function captureMedia(constraints, onSuccess, onError) {
		console.log("captureMedia");
		if (!onError) {
			onError = function(e) {
				console.warn("captureMedia error:", e);
			};
		}
		if (!constraints) {
			constraints = defaultConstarints;
		}
		
		var s = checkSupport();
		if (s.res) {
			var streaming = function(stream) {
				var token = self.userToken;
				console.log("captureMedia streaming", token);
				stream.userToken = token;
				config.attachStream = stream;
				myMediaStream = stream;
				var media;
				
				defaultSocket.send({
						streaming: true,
						userToken: token
					});
				
				/* Video or audio element: */
				if (constraints.video) {
					media = document.createElement("video");
					media.video = true;
				}
				else {
					media = document.createElement("audio");
					media.audio = true;
				}
				appendStream(media, stream);
				media.id = token;
				media.setAttribute("muted", "true");
				media.setAttribute("autoplay", "true");
				media.play();
				
				if (onSuccess) onSuccess(token, media);
			};
			
			navigator.getUserMedia(constraints, streaming, onError);
		}
		else {
			onError(s.message);
		}
	}
	
	/* Turn on/off audio or video: */
	function switchAudio(state) {
		console.log("switchAudio", state);
		var res = false;
		if (config.attachStream) {
			var tracks = config.attachStream.getAudioTracks();
			for (var i = 0; i < tracks.length; i++) {
				tracks[i].enabled = state;
				res = state;
			}
		}
		
		return res;
	}
	function switchVideo(state) {
		console.log("switchVideo", state);
		var res = false;
		if (config.attachStream) {
			var tracks = config.attachStream.getVideoTracks();
			for (var i = 0; i < tracks.length; i++) {
				tracks[i].enabled = state;
				res = state;
			}
		}
		
		return res;
	}
	
	openDefaultSocket();
	
	
	var Broadcast = {
		create: function() {
			console.log("create");
			if (!isConnected) {
				if (defaultSocket) {
					captureMedia(config.constraints, function(token, video) {
							createNewRoom = false;
							self.roomToken = generateRandomToken();
							
							startBroadcasting();
							
							isConnected = true;
							if (config.onGetMediaSuccess) {
								config.onGetMediaSuccess(token, video);
							}
						}, config.onError);
				}
				else console.warn("after disconnect() need to recreate Broadcast object");
			}
			else console.warn("already connected, try to recreate Broadcast object");
		},
		connect: function(roomToken, broadcaster) {
			console.log("connect", roomToken, broadcaster);
			if (!isConnected) {
				if (defaultSocket) {
					captureMedia(config.constraints, function(token, video) {
							createNewRoom = false;
							self.joinedARoom = true;
							self.roomToken = roomToken;
							self.broadcasterid = broadcaster;
			
							openSubSocket({
									channel: self.userToken,
									peerToken: broadcaster
								});
			
							defaultSocket.send({
									participant: true,
									userToken: self.userToken,
									joinUser: broadcaster
								});
							
							isConnected = true;
							if (config.onGetMediaSuccess) {
								config.onGetMediaSuccess(token, video);
							}
						}, config.onError);
				}
				else console.warn("after disconnect() need to recreate Broadcast object");
			}
			else console.warn("already connected, try to recreate Broadcast object");
		},
		restart: function() {
			console.log("restart broadcasting!");
			startBroadcasting();
		},
		disconnect: function() {
			disconnect();
		},
		userCount: function() {
			return getPeerCount();
		},
		
		switchAudio: function(state) {
			return switchAudio(state);
		},
		switchVideo: function(state) {
			return switchVideo(state);
		},
		
		sendData: function(data) {
			console.log("sendData:", data.substr(0, 20) + "...");
			sendDataChannelMessage(data, "message");
		},
		sendFile: function(fileObject, onSuccess, onError, onProgressChanged) {
			sendFile(fileObject, onSuccess, onError, onProgressChanged);
		}
	};
	
	return Broadcast;
};


