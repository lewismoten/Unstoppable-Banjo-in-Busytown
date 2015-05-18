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

function peerError(error) {
	console.log('error', error);
}
function peerSuccess() {
	console.log('success');
}

function wireUpConnectionEvents(name, connection) {
	var iceCandidates = [];
	connection.onaddstream = function() { console.log('connection', name, 'add stream'); }
	connection.onconnecting = function() { console.log('connection', name, 'connecting'); }
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
	channel.onerror = function() { console.error(name, 'channel error');};
	channel.onclose = function() { console.log(name, 'channel close');};

}

function startServerButton() {

	var servers = null;
	var options = {optional: [{RtpDataChannels: true}]};

	peerServer = new PeerConnection(servers, options);
	wireUpConnectionEvents('server', peerServer);

	serverChannel = peerServer.createDataChannel(dataChannelName, {reliable: false});
	wireUpChannelEvents('server', serverChannel);

	console.log('creating an offer on the server');
	peerServer.createOffer(serverOffering, 
		function(error) { console.error('error: server creating offer', error); }
		);

}

function serverOffering(description) {
	console.log('setting servers local description');
	peerServer.setLocalDescription(description, 
		function() { console.log('success: set servers local description');},
		function(error) { console.error('error: set servers local description', error);}
		);
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

	console.log('setting clients remote description');
	peerClient.setRemoteDescription(description,
		clientRemoteDescriptionSetSuccessfully,
		function(error) { console.error('failed to set clients remote description', error); } 
		);

}

function clientRemoteDescriptionSetSuccessfully() {
	console.log('creating an answer on the client');
	peerClient.createAnswer(clientAnswering, 
		function() { console.log('success: client created answer'); }, 
		function(error) { console.error('failed: client trying to create an answer', error); }
		);
}

function clientAnswering(description) {
	clientAnswer.value = description.sdp;
	console.log('setting clients local description');
	peerClient.setLocalDescription(description,
		function() { console.log('success: client set local description'); }, 
		function(error) { console.error('failed: client trying to set a local description', error); }
		);
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
	console.log('setting servers remote description');
	peerServer.setRemoteDescription(description, peerSuccess, peerError);
}

function sendIceCandidatesToClient() {
	serverCandidateOffer.value = serverCandidates.value;
}

function addServersIceCandidates() {
	var candidates = JSON.parse(serverCandidateOffer.value);
	for(var i = 0; i < candidates.length; i++) {
		var candidate = new IceCandidate(candidates[i]);
		console.log('adding candidate to client', candidate);
		peerClient.addIceCandidate(candidate, peerSuccess, peerError);
	}
}

function sendIceCandidatesToServer() {
	clientCandidateOffer.value = clientCandidates.value;
}

function addClientsIceCandidates() {
	var candidates = JSON.parse(clientCandidateOffer.value);
	for(var i = 0; i < candidates.length; i++) {
		var candidate = new IceCandidate(candidates[i]);
		console.log('adding candidate to server', candidate);
		peerServer.addIceCandidate(candidate, peerSuccess, peerError);
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