let audioSocket = io.connect("/audio", { path: "/socket.io" });
let groupVoice = document.querySelector(".group_voice");
//let voiceInputSelect = document.querySelector(".voice_input");
let myNick = document.querySelector(".user_nick").dataset.nick;
let myVoice = document.querySelector(".myVoice");

let myStream;
let myPeerConnection;
let groupId;
let peerNick;
let curPeer;


// async function getVoiceInputs() {
// 	try {
// 		const devices = await navigator.mediaDevices.enumerateDevices();
// 		const voiceInputs = devices.filter((device) => device.kind === "audioinput");
// 		const currentVoiceInput = myStream.getAudioTracks()[0];
// 		voiceInputs.forEach((vi) => {
// 			const option = document.createElement("option");
// 			option.value = vi.deviceId;
// 			option.innerText = vi.label;
// 			if (currentVoiceInput.label === vi.label) {
// 				option.selected = true;
// 			}
// 			voiceInputSelect.appendChild(option);
// 		});
// 	} catch (err) {
// 		console.log(err);
// 	}
// }

async function getMedia(deviceId) {
	const initConstraints = {
		audio: true,
	};
	const deviceConstraints = {
		audio: { deviceId: { exact: deviceId }},
	};
	try {
		myStream = await navigator.mediaDevices.getUserMedia(initConstraints);
		//myVoice.srcObject = myStream;
		if (!deviceId) {
			//await getVoiceInputs();
		}
	} catch (err) {
		console.log(err);
	}
}

// voiceInputSelect.addEventListener("input", async () => {
// 	console.log(voiceInputSelect.innerText, " : ", voiceInputSelect.value);
// 	await getMedia(voiceInputSelect.value);
// })



// audioSocket

async function initCall() {
	await getMedia();
	await makeConnection();
}

// <div class="voice peer_voice">
// 		<label>남 마이크</label>
// 		<audio class="peerVoice" autoplay></audio>
// 	</div>

async function addPeer(nick) {
	let create = true;
	document.querySelectorAll("audio").forEach((voice) => {
		if (voice.classList.contains(nick)) {
			console.log("중복 처리 완료");
			create = false;
		}
	});
	if (create) {
		const peer = document.createElement("div");
		const label = document.createElement("label");
		label.textContent = nick;
		peer.appendChild(label);
		const peerVoice = document.createElement("audio");
		peerVoice.classList.add("peerVoice");
		peerVoice.classList.add(nick);
		peerVoice.autoplay = "autoplay";
		peer.appendChild(peerVoice);
		peer.classList.add("voice");
		peer.classList.add("peer_voice");
		peer.classList.add(nick);
		groupVoice.appendChild(peer);
		curPeer = peerVoice;
	}
}

function deleteVoice(nick) {
	if (nick === myNick) {
		myVoice.srcObject = null;
		document.querySelectorAll(".peer_voice").forEach((peer) => {
			peer.remove();
		});
		showGroupVoice();
	} else {
		document.querySelectorAll(".peer_voice").forEach((peer) => {
			if (peer.classList.contains(nick)) {
				peer.remove();
			}
		});
	}
}

function showGroupVoice() {
	const state = groupVoice.style.display;
	if (state !== "block") {
		groupVoice.style.display = "block";
	} else {
		groupVoice.style.display = "none";
	}
}

audioSocket.on("join", async (id) => {
	try {
		groupId = id;
		await initCall();
		const myOffer = await myPeerConnection.createOffer();
		myPeerConnection.setLocalDescription(myOffer);
		audioSocket.emit("sendoffer", myOffer, groupId, myNick);
		console.log('send offer: ', groupId);
		showGroupVoice();
	} catch (err) {
		console.log(err);
	}
});

audioSocket.on("leave", async (nick) => {
	try {
		deleteVoice(nick);
	} catch (err) {
		console.log(err);
	}
});

audioSocket.on("getoffer", async (peerOffer, nick) => {
	try {
		console.log("offer is", peerOffer);
		console.log("get offer: ", groupId);
		await addPeer(nick);
		myPeerConnection.setRemoteDescription(peerOffer);
		const myAnswer = await myPeerConnection.createAnswer();
		myPeerConnection.setLocalDescription(myAnswer);
		audioSocket.emit("sendanswer", myAnswer, groupId, myNick);
		console.log("send answer: ", groupId);
	} catch (err) {
		console.log(err);
	}
});

audioSocket.on("getice", (ice) => {
	myPeerConnection.addIceCandidate(ice);
	console.log("get ice: ", groupId);
});

audioSocket.on("getanswer", async (peerAnswer, nick) => {
	console.log("answer is", peerAnswer);
	await addPeer(nick);
	myPeerConnection.setRemoteDescription(peerAnswer);
	console.log("get answer: ", groupId);
});


// RTC 

async function makeConnection() {
	//myPeerConnection = new RTCPeerConnection();
	const apiKey = "1f28c2089ae4ed88fbd8f8fe452a9594ceef";
	const res = await axios.get("https://groupfinding.metered.live/api/v1/turn/credentials?apiKey=" + apiKey);
	const configuration = res.data;
	configuration.push({
		urls: "stun:stun.l.google.com:19302",
	});
	console.log(configuration);
	myPeerConnection = new RTCPeerConnection({
		iceServers: configuration,
	});
	
	myPeerConnection.addEventListener("icecandidate", (data) => {
		console.log("ice is", data);
		console.log("connection state is", data.currentTarget.connectionState);
		console.log("send ice: ", groupId);
		audioSocket.emit("sendice", data.candidate, groupId);
	});
	
	// myPeerConnection.addEventListener("addstream", (peerStream) => {
	// 	console.log("peerStream is ", peerStream);
	// 	console.log(curPeer);
	// 	curPeer.srcObject = peerStream.stream;
	// });
	
	myPeerConnection.addEventListener("track", (data) => {
		console.log(data);
		curPeer.srcObject = data.streams[0];
	});

	myStream
	.getTracks()
	.forEach((track) => { myPeerConnection.addTrack(track, myStream) });
}