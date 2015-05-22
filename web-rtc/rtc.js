var connection;
var dataChannel;
var dataChannelName = 'myChannelName';

var iceCandidates = [];

var PeerConnection = window.RTCPeerConnection || 
	window.mozRTCPeerConnection || 
	window.webkitRTCPeerConnection;

var SessionDescription = window.RTCSessionDescription || 
	window.mozRTCSessionDescription || 
	window.webkitRTCSessionDescription;

var IceCandidate = window.RTCIceCandidate ||
	window.mozRTCIceCandidate ||
	window.webkitRTCIceCandidate;

function log(message) {
	displayStates();

	var div = document.createElement('div');
	var text = document.createTextNode(message);
	div.appendChild(text);
	logWindow.appendChild(div);
	logWindow.scrollTop = logWindow.scrollHeight;
}

function reset() {
	logWindow.innerHTML = 'Ready';
	chatWindow.innerHTML = 'Channel Not Open';
	iceCandidates = [];
	localIceCandidates.value = '(none)';
	remoteIceCandidates.value = '';
	localSessionDescription.value = '';
	iceConnectionState.innerHTML = 'Unknown';
	iceGatheringState.innerHTML = 'Unknown';
	signalingState.innerHTML = 'Unknown';
}

function displayChat(isLocal, message) {
	var div = document.createElement('div');

	if(isLocal === null) {
		div.className = 'channel';
	} else {
		div.className = isLocal ? 'local' : 'remote';
	}

	var text = document.createTextNode(message);
	div.appendChild(text);
	chatWindow.appendChild(div);
	chatWindow.scrollTop = chatWindow.scrollHeight;
}

function createPeer() {

	var servers = null;
	var options = {optional: [{RtpDataChannels: true}]};
	options = undefined;

	log('Instantiating Peer Connection object');

	connection = new PeerConnection(servers, options);

	displayStates();

	connection.onaddstream = onConnectionAddStream;
	connection.onconnecting = onConnectionConnecting;
	connection.ondatachannel = onConnectionDataChannel;
	connection.onicecandidate = onConnectionIceCandidate;
	connection.oniceconnectionstatechange = onConnectionIceConnectionStateChange;
	connection.onopen = onConnectionOpen;
	connection.onremovestream = onConnectionRemoveStream;
	connection.onsignalingstatechange = onConnectionSignalingStateChange;
	connection.onnegotiationneeded = onConnectionNegotiationNeeded;
}

function createChannel() {

	log('Creating data channel: ' + dataChannelName);

	dataChannel = connection.createDataChannel(dataChannelName, {reliable: false});
	dataChannel.onopen = onChannelOpen;
	dataChannel.onmessage = onChannelMessage;
	dataChannel.onerror = onChannelError;
	dataChannel.onclose = onChannelClose;

}

function onAcceptOffer() {
	reset();

	log('initializing');

	createPeer();

	var offer = JSON.parse(remoteSessionDescription.value);

	var description = new SessionDescription(offer);

	log('Assigning offer as remote description');

	connection.setRemoteDescription(
		description, 
		onSetRemoteDescriptionSuccess, 
		onSetRemoteDescriptionError);
}

function onCreateOffer() {

	reset();
	remoteSessionDescription.value = '';

	log('initializing');

	createPeer();
	createChannel();

	log('Creating an offer...');
	connection.createOffer(onCreateOfferSuccess, onCreateOfferError);
}

function displayStates() {
	if(typeof connection === 'undefined') {
		iceConnectionState.innerHTML = 'n/a';
		iceGatheringState.innerHTML = 'n/a';
		signalingState.innerHTML = 'n/a';
		return;
	}
	
	iceConnectionState.innerHTML = connection.iceConnectionState;
	iceGatheringState.innerHTML = connection.iceGatheringState;
	signalingState.innerHTML = connection.signalingState;
}

function onChannelOpen() {
	displayChat(null, 'Channel has opened');
	displayChat(true, '*joined the channel*');
	dataChannel.send('*joined the channel*');
}

function onChannelMessage(messageEvent) {
	displayChat(false, messageEvent.data);
}

function onChannelError(error) {
	displayChat(null, 'Error');
	displayChat(null, error);
}

function onChannelClose() {
	displayChat(null, 'Closed');
}

function onConnectionAddStream() { 
	log('connection. on add stream'); 
}

function onConnectionConnecting() { 
	log('connection. on connecting'); 
}

function onConnectionDataChannel(dataChannelEvent) {
	log('A data channel was added to the connection');

	dataChannel = dataChannelEvent.channel;
	log(dataChannel.label);

	dataChannel.onopen = onChannelOpen;
	dataChannel.onmessage = onChannelMessage;
	dataChannel.onerror = onChannelError;
	dataChannel.onclose = onChannelClose;

}

function onConnectionIceCandidate(rtcIceCandidateEvent) {

	if(!rtcIceCandidateEvent.candidate) {
		return;
	}

	log('local ' + rtcIceCandidateEvent.candidate.candidate);
	
	iceCandidates.push(rtcIceCandidateEvent.candidate);

}

function onConnectionIceConnectionStateChange() {
	log('ICE Connection State Changed: ' + connection.iceConnectionState + ' (gathering=' + connection.iceGatheringState +')');

	if(connection.iceGatheringState === 'complete') {

		localIceCandidates.value = JSON.stringify(iceCandidates);

	}

	displayStates();
}

function onConnectionOpen() {
	log('The connection is open');
}

function onConnectionRemoveStream() {
	log('The connection removed a stream');
}

function onConnectionSignalingStateChange() {
	log('The connections signaling state has changed: ' + connection.signalingState);
	displayStates();
}

function onConnectionNegotiationNeeded() {
	log('Connection needs negotiation');
}

function onCreateOfferError(error) {
	log('failed to create offer');
	log(error);
}

function onCreateOfferSuccess(rtcSessionDescription) {
	
	log('Successfully created an offer.');

	localSessionDescription.value = JSON.stringify(rtcSessionDescription);

	log('Assigning offer as the local description...');

	connection.setLocalDescription(
		rtcSessionDescription, 
		onSetLocalDescriptionSuccess,
		onSetLocalDescriptionError);
}

function onSetLocalDescriptionError(error) {

	log('Failed to set local description');
	log(error);
}

function onSetLocalDescriptionSuccess() {
	log('Sucessfully set local description');
}

function onAcceptAnswer() {

	var answer = JSON.parse(remoteSessionDescription.value);
	var description = new SessionDescription(answer);

	log('Assigning answer as remote description');

	connection.setRemoteDescription(
		description, 
		onSetRemoteDescriptionSuccess, 
		onSetRemoteDescriptionError);
}

function onSetRemoteDescriptionError(error) {

	log('Failed to set remote description');
	log(error);
}

function onSetRemoteDescriptionSuccess() {

	log('Sucessfully set remote description');

	if(connection.remoteDescription.type === "offer") {

		log('Creating Answer');

		connection.createAnswer(onCreateAnswerSuccess, onCreateAnswerError);
	}
}

function onCreateAnswerSuccess(rtcSessionDescription) {
	log('Successfully created an answer.');

	localSessionDescription.value = JSON.stringify(rtcSessionDescription);

	log('setting local description');

	connection.setLocalDescription(
		rtcSessionDescription, 
		onSetLocalDescriptionSuccess,
		onSetLocalDescriptionError);
}

function onCreateAnswerError(error) {
	log('Failed to create an answer.');
}

function onAddIceCandidates() {
	var candidates = JSON.parse(remoteIceCandidates.value);
	for(var i = 0; i < candidates.length; i++) {
		var candidate = new IceCandidate(candidates[i]);
		connection.addIceCandidate(
			candidate, 
			onAddIceCandidateSuccess, 
			onAddIceCandidateError);
	}
}

function onAddIceCandidateSuccess() {
	log('Added ICE candidate');
}

function onAddIceCandidateError(error) {
	log('Error adding ICE candidate');
	log(error);
}

function onSendMessage() {

	var message = messageTextBox.value;
	messageTextBox.value = '';

	var state = dataChannel.readyState; 
	switch(state) {
		case 'connecting':
		case 'closing':
		case 'closed':
			displayChat(null, 'Error: Channel state is: ' + state);
			return;
		case 'open':
			dataChannel.send(message);
			displayChat(true, message);
			return;
		default:
			displayChat(null, 'Unknown state: ' + state);
	}	
}

reset();