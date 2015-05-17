var connection;

function connect(url) {
	try {
		log('[instantiating]')
		connection = new WebSocket('ws://' + url, ['soap', 'xmppp']);
		log('[instantiated]');
	}
	catch (e) {
		log('[failed instantiation] ' + e);
	}
	
	// binaryType: Blob / ArrayBuffer / DOMString
	// bufferedAmount: 0
	// extensions: ''
	// protocol: ''
	// close()
	// send()
	connection.onopen = function(event) {
		log('[connection.opened]');
	};

	connection.onerror = function(event) {
		log('[connection.errored]');
	};

	connection.onclose = function(closeEvent) {
		log('[connection.closed] code: ' + closeEvent.code + 
			' (' + closeReason(closeEvent.code) + ')' + 
			' reason: ' + closeEvent.reason + 
			' wasClean: ' + closeEvent.wasClean);
	};

	connection.onmessage = function(messageEvent) {
		log('[connection.messaged] ' + messageEvent.data);
	};
}

function closeReason(code) {
	
	if(code < 1000) return 'Reserved and not used.';
	if(code === 1000) return 'CLOSE_NORMAL';
	if(code === 1001) return 'CLOSE_GOING_AWAY';
	if(code === 1002) return 'CLOSE_PROTOCOL_ERROR';
	if(code === 1003) return 'CLOSE_UNSUPPORTED';
	if(code === 1004) return 'Reserved.';
	if(code === 1005) return 'CLOSE_NO_STATUS';
	if(code === 1006) return 'CLOSE_ABNORMAL';
	if(code === 1007) return 'Terminated by endpoint. Message contains inconsisten data.';
	if(code === 1008) return 'Terminated by endpoint. Message voilates policy.';
	if(code === 1009) return 'CLOSE_TOO_LARGE';
	if(code === 1010) return 'Terminated by client. Server did not negotiate one or more extensions.';
	if(code === 1011) return 'Terminated by server. Unexpected condition.';
	if(code >= 1012 && code <= 1014) return 'Reserved.';
	if(code === 1015) return 'Reserved. Failure to perform a TLS handshake.';
	if(code >= 1016 && code <= 1999) return 'Reserved.';
	if(code >= 2000 && code <= 2999) return 'Reserved for extensions.';
	if(code >= 3000 && code <= 3999) return 'Available for libraries and frameworks.';
	if(code >= 4000 && code <= 4999) return 'Available for applications.';
	return 'Unexpected Code';
}

function clickConnectButton() {
	var server = serverTextBox.value;
	connect(server);
}

function update() {
	if(typeof connection === 'undefined') return;
	var state = ['Connecting', 'Open', 'Closing', 'Closed'][connection.readyState];
	readyStateLabel.innerHTML = state;
}

function log(message) {
	logTextArea.value+= '\n' + message;
	update();
}

logTextArea.value = 'Ready';

var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
//var DataConnection = window.RTCDatarConnection || window.mozRTCDataConnection || window.webkitRTCDataConnection;
var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
var GET_USER_MEDIA = navigator.getUserMedia ? "getUserMedia" :
                     navigator.mozGetUserMedia ? "mozGetUserMedia" :
                     navigator.webkitGetUserMedia ? "webkitGetUserMedia" : "getUserMedia";
var v = document.createElement("video");
var SRC_OBJECT = 'srcObject' in v ? "srcObject" :
                 'mozSrcObject' in v ? "mozSrcObject" :
                 'webkitSrcObject' in v ? "webkitSrcObject" : "srcObject";

var servers = {
	iceServers: [
		{
			url: "stun:stun.l.google.com:19302"
		}
	]
};

// http://www.html5rocks.com/en/tutorials/webrtc/basics/
// http://w3c.github.io/webrtc-pc/#rtcdatachannel
// http://simpl.info/rtcpeerconnection/

//var pc = new PeerConnection(configuration);
var dataChannelName = 'MyAwesomeChannel';
var servers = null;
var options = {optional: [{RtpDataChannels: true}]};
var localPeer = new window.webkitRTCPeerConnection(servers, options);
var remotePeer = new window.webkitRTCPeerConnection(servers, options);

var remoteChannel;
var localChannel;

console.log(localPeer)

//var pc = new DataConnection(configuration);
localPeer.onicecandidate = function(event) {

	if(!event || !event.candidate) {
		console.log('local.Received Ice Candidate', event.candidate);
		return;
	}
	var rtcIceCandidate = event.candidate;
	console.log('local.Received Ice Candidate', rtcIceCandidate.sdpMLineIndex, rtcIceCandidate.sdpMid, rtcIceCandidate.candidate);
	
	remotePeer && remotePeer.addIceCandidate(rtcIceCandidate);

	//localChannel.send('good god');
};
remotePeer.onicecandidate = function() {

	if(!event || !event.candidate) {
		console.log('remote.Received Ice Candidate: no candidate', event.candidate);
		return;
	}
	var rtcIceCandidate = event.candidate;
	console.log('remote.Received Ice Candidate', rtcIceCandidate.sdpMLineIndex, rtcIceCandidate.sdpMid, rtcIceCandidate.candidate);
	
	localPeer && localPeer.addIceCandidate(rtcIceCandidate);
};

localPeer.onconnecting = function() {
	console.log('local.onconnection', arguments);
};
remotePeer.onconnecting = function() {
	console.log('remote.onconnection', arguments);
};

localPeer.onopen = function() {
	console.log('local.onopen', arguments);

};
remotePeer.onopen = function() {
	console.log('remote.onopen', arguments);
};
localPeer.onaddstream = function() {
	console.log('local.onaddstream', arguments);
};
remotePeer.onaddstream = function() {
	console.log('remote.onaddstream', arguments);
};
localPeer.onremovestream = function() {
	console.log('local.onremovestream', arguments);
};
remotePeer.onremovestream = function() {
	console.log('remote.onremovestream', arguments);
};

function remoteAnswering(rtcSessionDescription) {
	console.log('remote.' + rtcSessionDescription.type + ' SDP', rtcSessionDescription.sdp);

	remotePeer.setLocalDescription(rtcSessionDescription);
	localPeer.setRemoteDescription(rtcSessionDescription);
}

function localOffering(rtcSessionDescription) {
	console.log('local.' + rtcSessionDescription.type + ' SDP', rtcSessionDescription.sdp);
	
	localPeer.setLocalDescription(rtcSessionDescription);

	remoteChannel = remotePeer.createDataChannel(dataChannelName, {reliable: false});
	setupChannel(remoteChannel, 'remote');

	remotePeer.setRemoteDescription(rtcSessionDescription);
	remotePeer.createAnswer(remoteAnswering);
};

localChannel = localPeer.createDataChannel(dataChannelName, {reliable: false});
//localChannel.binaryType = 'blob';
setupChannel(localChannel, 'local');
localPeer.createOffer(localOffering, null, null);

function setupChannel(channel, type) {

	channel.onopen = function(event) {
		console.log(type + '.opened: ');
		channel.send('This message is from the  ' + type + ' channel');
	};

	channel.onmessage = function(messageEvent) {
		console.log(type + '.messaged: ' + messageEvent.data);
		channel.send("i got '" + messageEvent.data + "'");
	};

	channel.onerror = function() {
		console.log(type + '::error: ', arguments);
	};

	channel.onclose = function() {
		console.log(type + '.closing: ', arguments);
	};

}