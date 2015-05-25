var connection;
var dataChannel;
var dataChannelName = 'myChannelName';

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

	log('Instantiating Peer Connection object');

	var configuration = null;
	var options = undefined;
	connection = new PeerConnection(configuration, options);

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

	var rtcSessionDescription = getRemoteDescription('offer');

	log('Assigning offer as remote description');

	connection.setRemoteDescription(
		rtcSessionDescription, 
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
	var constraints = undefined;
	connection.createOffer(onCreateOfferSuccess, onCreateOfferError, constraints);
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

function displayLocalDescription() {

	localSessionDescription.value = connection.localDescription.sdp;
}

function onStoreOffer() {
	setValue('webrtc-answer', '');
	setValue('webrtc-offer', connection.localDescription.sdp);
}

function onStoreAnswer() {
	setValue('webrtc-answer', connection.localDescription.sdp);
}

function onRetrieveOffer() {
	getValue('webrtc-offer', function(data) {
		if(data.success) {
			remoteSessionDescription.value = data.value;
		}
	});
}
function onRetrieveAnswer() {
	getValue('webrtc-answer', function(data) {
		if(data.success) {
			remoteSessionDescription.value = data.value;
		}
	});
}

function getRemoteDescription(type) {
	return new SessionDescription({sdp: remoteSessionDescription.value, type: type});
}

function onConnectionIceCandidate(rtcIceCandidateEvent) {

	displayStates();
	displayLocalDescription();

	if(!rtcIceCandidateEvent.candidate) {
		// undefined candidate usually means gathering state has completed
		log('End of candidates');
		return;
	}

	log('Added local ICE candidate');
}

function onConnectionIceConnectionStateChange() {
	log('ICE Connection State Changed: ' + connection.iceConnectionState + ' (gathering=' + connection.iceGatheringState +')');

	if(connection.iceGatheringState === 'complete') {

		displayLocalDescription();

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

	displayLocalDescription();

}

function onAcceptAnswer() {

	var rtcSessionDescription = getRemoteDescription('answer');

	log('Assigning answer as remote description');

	connection.setRemoteDescription(
		rtcSessionDescription, 
		onSetRemoteDescriptionSuccess, 
		onSetRemoteDescriptionError);
}

function onSetRemoteDescriptionError(error) {

	log('Failed to set remote description');
	log(error);
}

function onSetRemoteDescriptionSuccess() {

	log('Sucessfully set remote description');

	if(connection.remoteDescription.type === 'offer') {

		log('Creating Answer');

		var constraints = undefined;;
		connection.createAnswer(onCreateAnswerSuccess, onCreateAnswerError, constraints);
	}
}

function onCreateAnswerSuccess(rtcSessionDescription) {
	log('Successfully created an answer.');

	log('setting local description');

	connection.setLocalDescription(
		rtcSessionDescription, 
		onSetLocalDescriptionSuccess,
		onSetLocalDescriptionError);
}

function onCreateAnswerError(error) {
	log('Failed to create an answer.');
}

function addNextRemoteIceCandidateInQueue() {

	log('Next ICE candidate in queue');

	connection.addIceCandidate(
			candidate, 
			onAddIceCandidateSuccess, 
			onAddIceCandidateError);
}

function onAddIceCandidateSuccess() {

	log('Added remote ICE candidate');

	addNextRemoteIceCandidateInQueue();
}

function onAddIceCandidateError(error) {
	log('Error adding remote ICE candidate');
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


// ---[ Key/Value Store ]----------------------------------

function getValue(key, callback) {

	log('getting key: ' + key);

	var pair = {
		key: key,
		value: undefined
	};

	post('/key-value-store/get.php', JSON.stringify(pair), callback);

}

function setValue(key, value) {

	log('setting key: ' + key);

	var pair = {
		key: key,
		value: value
	};

	post('/key-value-store/set.php', JSON.stringify(pair));

}


// ---[ Key/Value Store Internals ]------------------------


function onError() {
	log('Error when posting data');
}

function post(url, data, callbackSuccess) {

	var request = new XMLHttpRequest();

	request.open('POST', url, true);

	// Hack to get around servers that only support this mime type
	request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

	request.onerror = onError;
	request.onabort = onError;
	request.ontimeout = onError;

	request.onreadystatechange = function() {

		if(request.readyState === 4) {

			log('posted data returned response from ' + url);

			if(request.status === 200) {
				if(typeof callbackSuccess === 'function') {
					callbackSuccess(JSON.parse(request.responseText));
				}
			}
		}
	}

	request.send(data);

}

reset();