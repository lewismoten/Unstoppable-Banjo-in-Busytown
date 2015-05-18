var connection;
var dataChannelName = 'myChannelName';
var peerServer;
var peerClient;
var serverChannel;
var clientChannel;

var PeerConnection = window.RTCPeerConnection || 
	window.mozRTCPeerConnection || 
	window.webkitRTCPeerConnection;

var SessionDescription = window.RTCSessionDescription || 
	window.mozRTCSessionDescription || 
	window.webkitRTCSessionDescription;

var IceCandidate = window.RTCIceCandidate ||
	window.mozRTCIceCandidate ||
	window.webkitRTCIceCandidate;

function peerError() {
	console.log('error', arguments);
}

function wireUpConnectionEvents(name, connection) {
	var iceCandidates = [];
	connection.onaddstream = function() { console.log(name, 'add stream'); }
	connection.onconnecting = function() { console.log(name, 'connecting'); }
	connection.ondatachannel = function() { console.log(name, 'data channel'); }
	connection.onicecandidate = function(rtcIceCandidateEvent) {
		console.log(name, 'ice candidate'); 
		if(!rtcIceCandidateEvent.candidate) {
			if(connection.iceGatheringState === "complete") {
				var input = document.getElementById(name + 'Candidates');
				input.value = JSON.stringify(iceCandidates);
			}
			return;
		}
		iceCandidates.push(rtcIceCandidateEvent.candidate);
	}
	connection.oniceconnectionstatechange = function() { console.log(name, 'ice connection state change:', connection.iceConnectionState); }
	connection.onnegotiationStatechange = function() { console.log(name, 'negotiation state change'); }
	connection.onopen = function() { console.log(name, 'open'); }
	connection.onremovestream = function() { console.log(name, 'remove stream'); }
	connection.onsignalingstatechange = function() { console.log(name, 'signaling state change:', connection.signalingState); }
	connection.onnegotiationneeded = function() { console.log(name, 'negotiation needed');};
}

function wireUpChannelEvents(name, channel) {

	channel.onopen = function() { console.log(name, 'channel open');};
	channel.onmessage = function(messageEvent) { 
		console.log(name, 'channel message', messageEvent.data);
		var input = document.getElementById(name + 'Received');
		input.innerHTML = messageEvent.data;

	};
	channel.onerror = function() { console.log(name, 'channel error');};
	channel.onclose = function() { console.log(name, 'channel close');};

}

function startServerButton() {

	var servers = null;
	var options = {optional: [{RtpDataChannels: true}]};

	peerServer = new PeerConnection(servers, options);
	wireUpConnectionEvents('server', peerServer);

	serverChannel = peerServer.createDataChannel(dataChannelName, {reliable: false});
	wireUpChannelEvents('server', serverChannel);

	peerServer.createOffer(serverOffering, peerError);

}

function serverOffering(description) {
	peerServer.setLocalDescription(description);
	localOffer.value = description.sdp;
}

function sendOffer() {
	remoteOffer.value = localOffer.value;
}

function acceptOfferButton() {
	var offer = {
		sdp: remoteOffer.value,
		type: 'offer'
	};

	var description = new SessionDescription(offer);
	var servers = null;
	var options = {optional: [{RtpDataChannels: true}]};

	peerClient = new PeerConnection(servers, options);
	wireUpConnectionEvents('client', peerClient);

	clientChannel = peerClient.createDataChannel(dataChannelName, {reliable: false});
	wireUpChannelEvents('client', clientChannel);

	peerClient.setRemoteDescription(description, peerError);
	peerClient.createAnswer(clientAnswering, peerError);
}

function clientAnswering(description) {
	clientAnswer.value = description.sdp;
	peerClient.setLocalDescription(description);
}

function sendAnswer() {
	serverAnswer.value = clientAnswer.value;
}

function acceptAnswerButton() {
	var answer = {
		sdp: serverAnswer.value,
		type: 'answer'
	};

	var description = new SessionDescription(answer);
	peerServer.setRemoteDescription(description);
}

function sendIceCandidatesToClient() {
	serverCandidateOffer.value = serverCandidates.value;
}

function addServersIceCandidates() {
	var candidates = JSON.parse(serverCandidateOffer.value);
	for(var i = 0; i < candidates.length; i++) {
		var candidate = new IceCandidate(candidates[i]);
		peerClient.addIceCandidate(candidate);
	}
}

function sendIceCandidatesToServer() {
	clientCandidateOffer.value = clientCandidates.value;
}

function addClientsIceCandidates() {
	var candidates = JSON.parse(clientCandidateOffer.value);
	for(var i = 0; i < candidates.length; i++) {
		var candidate = new IceCandidate(candidates[i]);
		peerServer.addIceCandidate(candidate);
	}
}

function sendMessageToClient() {
	var message = serverMessageTextBox.value;
	serverChannel.send(message);
}

function sendMessageToServer() {
	var message = clientMessageTextBox.value;
	clientChannel.send(message);
}