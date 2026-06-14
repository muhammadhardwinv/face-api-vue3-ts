<!-- @format -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import "./assets/style.css";
import {
	loadModels,
	initializeKnownFaces,
	recognizeFace,
	detectSleepiness,
} from "./faceRecognition";

const imagePreview = ref("");
const result = ref("No result");
const imageRef = ref<HTMLImageElement | null>(null);
const loading = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const cameraActive = ref(false);
const cameraStream = ref<MediaStream | null>(null);
const recognitionFinished = ref(false);

const sleepStatus = ref("Awake");
const closedFrames = ref(0);
const alertTriggered = ref(false);
const alarm = new Audio("/sounds/alarm.wav");

let detectionInterval: number | null = null;

onMounted(async () => {
	try {
		await loadModels();
		await initializeKnownFaces();
		console.log("AI Models and Face Datasets loaded successfully");
	} catch (error) {
		console.error("Initialization error:", error);
		result.value = "Failed to load face recognition models.";
	}
});

const handleUpload = (event: Event) => {
	const input = event.target as HTMLInputElement;

	const file = input.files?.[0];
	if (!file) return;

	if (imagePreview.value) {
		URL.revokeObjectURL(imagePreview.value);
	}

	imagePreview.value = URL.createObjectURL(file);
	result.value = "Image ready for recognition";
	recognitionFinished.value = false;
};

const identifyFace = async () => {
	if (!imageRef.value) return;
	loading.value = true;
	recognitionFinished.value = false;
	try {
		const faces = await recognizeFace(imageRef.value);
		if (!faces.length) {
			result.value = "No face detected in uploaded image";
		} else {
			result.value = JSON.stringify(faces, null, 2);
		}
		recognitionFinished.value = true;
	} catch (error) {
		console.error(error);
		result.value = "Recognition failed";
		recognitionFinished.value = true;
	} finally {
		loading.value = false;
	}
};

const showModal = ref(false);

const startCamera = async () => {
	detectionInterval = window.setInterval(async () => {
		if (!videoRef.value) return;
		const result = await detectSleepiness(videoRef.value);
		if (!result) return;

		// Update the template EAR ref (fixing the missing link in your original code)
		currentEAR.value = result.ear;

		console.log("EAR:", result.ear);
		if (result.ear < 0.3) {
			closedFrames.value++;
		} else {
			closedFrames.value = 0;
		}

		if (closedFrames.value > 30) {
			sleepStatus.value = "Drowsy";
			if (!alertTriggered.value) {
				alertTriggered.value = true;
				alarm.currentTime = 0;

				// 1. Play the alarm sound first
				alarm.loop = true; // Optional: keeps it ringing until dismissed
				alarm
					.play()
					.catch((err) => console.error("Audio playback failed:", err));

				// 2. Open our custom Vue-controlled modal instead of blocking alert()
				showModal.value = true;
			}
		} else {
			// Only reset if the user isn't currently looking at an active alert
			if (!showModal.value) {
				sleepStatus.value = "Awake";
				alertTriggered.value = false;
			}
		}
	}, 100);

	try {
		const stream = await navigator.mediaDevices.getUserMedia({
			video: {
				width: { ideal: 1920 },
				height: { ideal: 1080 },
				facingMode: "user",
			},
		});
		cameraStream.value = stream;
		if (videoRef.value) {
			videoRef.value.srcObject = stream;
		}
		cameraActive.value = true;
		result.value = "Camera started";
	} catch (error) {
		console.error(error);
		result.value = "Unable to access camera";
	}
};

const dismissAlert = () => {
	showModal.value = false;
	alarm.pause();
	alarm.currentTime = 0;
	alertTriggered.value = false;
	closedFrames.value = 0;
	sleepStatus.value = "Awake";
};

const stopCamera = () => {
	if (detectionInterval) {
		clearInterval(detectionInterval);
		detectionInterval = null;
	}

	if (cameraStream.value) {
		cameraStream.value.getTracks().forEach((track) => track.stop());
		cameraStream.value = null;
	}

	if (videoRef.value) {
		videoRef.value.srcObject = null;
	}

	cameraActive.value = false;
	sleepStatus.value = "Awake";
	closedFrames.value = 0;
	result.value = "Camera stopped";
};

const captureAndIdentify = async () => {
	if (!videoRef.value || !canvasRef.value) return;
	loading.value = true;

	try {
		const canvas = canvasRef.value;
		const video = videoRef.value;

		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		const faces = await recognizeFace(canvas);

		if (!faces.length) {
			result.value = "No face detected in camera snap";
		} else {
			result.value = JSON.stringify(faces, null, 2);
		}
	} catch (error) {
		console.error(error);
		result.value = "Recognition failed during snapshot capture";
	} finally {
		loading.value = false;
	}
};

const fileInputRef = ref<HTMLInputElement | null>(null);
const resetUpload = () => {
	if (imagePreview.value) {
		URL.revokeObjectURL(imagePreview.value);
	}
	imagePreview.value = "";
	result.value = "No result";
	recognitionFinished.value = false;
	if (fileInputRef.value) {
		fileInputRef.value.value = "";
	}
};
const currentEAR = ref(0);
</script>
<template>
	<div class="container">
		<h2>Live Camera Monitoring</h2>
		<div class="status-card">
			<h3>Sleep Status: {{ sleepStatus }}</h3>
			<p>EAR: {{ currentEAR.toFixed(3) }}</p>
			<p>Closed Frames: {{ closedFrames }}</p>
		</div>
		<video ref="videoRef" autoplay playsinline muted class="camera"></video>
		<canvas ref="canvasRef" style="display: none"></canvas>
		<div class="button-group">
			<button @click="startCamera" :disabled="cameraActive">
				📷 Activate Camera
			</button>

			<button @click="stopCamera" :disabled="!cameraActive">
				🛑 Stop Camera
			</button>
			<button @click="captureAndIdentify" :disabled="loading || !cameraActive">
				{{ loading ? "Processing..." : "Capture & Identify" }}
			</button>

			<!-- <button @click="alarm.play()">Test Alarm</button> -->
		</div>
		<hr />
		<h2>Upload Image Recognition</h2>
		<input
			ref="fileInputRef"
			type="file"
			accept="image/*"
			@change="handleUpload"
		/>
		<div v-if="imagePreview" class="preview">
			<img ref="imageRef" :src="imagePreview" alt="Uploaded Image" />
		</div>
		<div v-if="imagePreview" class="button-group">
			<button
				v-if="!recognitionFinished"
				@click="identifyFace"
				:disabled="loading"
			>
				{{ loading ? "Processing..." : "Identify Uploaded Face" }}
			</button>
			<button v-if="recognitionFinished" @click="resetUpload">
				📂 Upload New Image
			</button>
		</div>
		<div class="result-card">
			<pre>{{ result }}</pre>
		</div>
	</div>
	<div v-if="showModal" class="modal-overlay">
		<div class="modal-content">
			<h2>⚠️ Drowsiness Detected!</h2>
			<p>Please wake up and take a break if needed.</p>
			<button @click="dismissAlert" class="dismiss-btn">I am Awake</button>
		</div>
	</div>
	<footer class="footer">
		<div class="footer-left">
			<span class="status-dot"></span>
			<span>System Active • AI Drowsiness Detection & Face Recognition</span>
		</div>
		<div class="footer-right">
			<a
				href="https://github.com/muhammadhardwinv"
				target="_blank"
				rel="noopener noreferrer"
			>
				<i class="fab fa-github"></i> @muhammadhardwinv
			</a>
		</div>
	</footer>
</template>

<style scoped>
.container {
	max-width: 1600px;
	margin: 0 auto;
	padding: 40px 24px 24px;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
}

.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background: rgba(15, 23, 42, 0.6); /* Translucent dark backdrop */
	backdrop-filter: blur(8px);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 9999;
}

.modal-content {
	background: white;
	padding: 32px;
	border-radius: 24px;
	box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
	max-width: 400px;
	width: 90%;
	text-align: center;
	border: 1px solid rgba(255, 255, 255, 0.8);
}

.modal-content h2 {
	color: #ef4444; /* Eye-catching red alarm header */
	margin-bottom: 12px;
}

.modal-content p {
	color: #475569;
	margin-bottom: 24px;
}

.dismiss-btn {
	background: #ef4444;
	box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
}

.dismiss-btn:hover:not(:disabled) {
	background: #dc2626;
	box-shadow: 0 8px 24px rgba(239, 68, 68, 0.45);
}

h1 {
	font-size: 3rem;
	font-weight: 800;
	margin-bottom: 48px;
	color: #0f172a;
	letter-spacing: -0.03em;
	font-family: monospace;
}
h2 {
	font-size: 1.4rem;
	font-weight: 700;
	color: #334155;
	margin-bottom: 20px;
	font-family: monospace;
}
.card {
	width: 100%;
	max-width: 1000px;
	background: rgba(255, 255, 255, 0.75);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border-radius: 24px;
	padding: 32px;
	margin-bottom: 32px;
	box-shadow:
		0 10px 30px rgba(15, 23, 42, 0.08),
		0 4px 12px rgba(15, 23, 42, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.5);
}
.camera {
	width: 100%;
	max-width: 900px;
	height: auto;
	aspect-ratio: 16 / 9;
	object-fit: cover;
	border-radius: 16px;
	background: #000;
	display: block;
	margin: 0 auto;
	box-shadow:
		0 20px 40px rgba(0, 0, 0, 0.12),
		0 8px 16px rgba(0, 0, 0, 0.08);
}
.preview {
	margin: 24px 0;
	display: flex;
	justify-content: center;
}
.preview img {
	width: 100%;
	max-width: 700px;
	max-height: 500px;
	object-fit: contain;
	border-radius: 24px;
	box-shadow:
		0 20px 40px rgba(0, 0, 0, 0.12),
		0 8px 16px rgba(0, 0, 0, 0.08);
}
.button-group {
	display: flex;
	flex-wrap: wrap;
	flex-direction: row;
	justify-content: center;
	gap: 12px;
	margin: 24px 0;
}
button {
	border: none;
	border-radius: 14px;
	padding: 12px 22px;
	font-size: 0.95rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.25s ease;
	background: #2563eb;
	color: white;
	box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
}
button:hover:not(:disabled) {
	transform: translateY(-2px);
	box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
}
button:active:not(:disabled) {
	transform: translateY(0);
}
button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
	transform: none;
	box-shadow: none;
}
input[type="file"] {
	width: 100%;
	max-width: 500px;
	padding: 14px;
	border-radius: 16px;
	border: 2px dashed #cbd5e1;
	background: white;
	color: #475569;
	font-size: 0.95rem;
	cursor: pointer;
	transition: all 0.25s ease;
}
input[type="file"]:hover {
	border-color: #2563eb;
	background: #f8fafc;
}
pre {
	width: 100%;
	max-width: 900px;
	margin: 20px auto 0;
	padding: 20px;
	border-radius: 20px;
	background: rgba(255, 255, 255, 0.7);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border: 1px solid rgba(255, 255, 255, 0.5);
	box-shadow:
		0 10px 30px rgba(15, 23, 42, 0.08),
		0 4px 12px rgba(15, 23, 42, 0.05);
	font-size: 0.9rem;
	line-height: 1.6;
	color: #0f172a;
	overflow-x: auto;
	white-space: pre-wrap;
	word-break: break-word;
	text-align: left;
}
hr {
	width: 100%;
	max-width: 1000px;
	margin: 40px auto;
	border: none;
	height: 1px;
	background: linear-gradient(to right, transparent, #cbd5e1, transparent);
}

.footer {
	display: flex;
	justify-content: space-between; /* Pushes content to the left and right edges */
	align-items: center;
	padding: 1rem 2rem;
	background: rgba(
		15,
		23,
		42,
		0.6
	); /* Sleek, semi-transparent dark background */
	backdrop-filter: blur(8px); /* Modern glassmorphism effect */
	border-top: 1px solid rgba(255, 255, 255, 0.1); /* Subtle top divider */
	color: #94a3b8; /* Muted tech-gray text color */
	font-family:
		"Courier New", Courier, monospace; /* Use monospace for a terminal feel */
	font-size: 0.85rem;
}

/* Pulsing Status Dot for Option 1 */
.status-dot {
	display: inline-block;
	width: 8px;
	height: 8px;
	background-color: #10b981; /* Emerald Green */
	border-radius: 50%;
	margin-right: 8px;
	box-shadow: 0 0 8px #10b981;
	animation: pulse 2s infinite;
}

@keyframes pulse {
	0% {
		opacity: 0.4;
	}
	50% {
		opacity: 1;
	}
	100% {
		opacity: 0.4;
	}
}

/* Make your GitHub link turn a cool color (like cyan/neon blue) on hover */
.footer a {
	color: #38bdf8;
	text-decoration: none;
	transition: color 0.2s ease;
}

.footer a:hover {
	color: #f1f5f9;
	text-shadow: 0 0 8px #38bdf8; /* Soft neon glow on hover */
}
@media (max-width: 480px) {
	.container {
		padding: 16px 12px;
	}

	h2 {
		font-size: 1rem;
	}

	p {
		font-size: 0.9rem;
	}

	button {
		font-size: 0.9rem;
		padding: 12px;
	}

	pre {
		font-size: 0.8rem;
		padding: 12px;
	}
}
.status-card {
	width: 100%;
	max-width: 500px;
	padding: 20px;
	margin-bottom: 20px;
	border-radius: 20px;
	background: rgba(255, 255, 255, 0.2);
	backdrop-filter: blur(10px);
	box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.status-card h3 {
	margin-bottom: 10px;
	font-size: 1.4rem;
}

.status-card p {
	margin: 4px 0;
	font-size: 1rem;
}

.result-card {
	width: 100%;
	max-width: 900px;
}
</style>
