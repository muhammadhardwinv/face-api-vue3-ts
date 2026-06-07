<!-- @format -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import "./assets/style.css";
import {
	loadModels,
	initializeKnownFaces,
	recognizeFace,
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
	if (!input.files?.length) return;
	const file = input.files[0];
	if (imagePreview.value) {
		URL.revokeObjectURL(imagePreview.value);
	}
	imagePreview.value = URL.createObjectURL(file);
	result.value = "Image ready for recognition";
	recognitionFinished.value = false;
};

// Recognition for standard uploaded static images
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

const startCamera = async () => {
	try {
		// FIX: Reduced down from 4K to 1080p.
		// Face-api models drop drastically in accuracy when fed oversized resolution frames.
		const stream = await navigator.mediaDevices.getUserMedia({
			video: {
				width: { ideal: 1920 },
				height: { ideal: 1080 },
				facingMode: "user",
			},
		});
		cameraStream.value = stream;
		const tracks = stream.getVideoTracks();
		if (!tracks.length) {
			console.error("No video track found");
			return;
		}

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

const stopCamera = () => {
	if (cameraStream.value) {
		cameraStream.value.getTracks().forEach((track) => track.stop());
		cameraStream.value = null;
	}
	if (videoRef.value) {
		videoRef.value.srcObject = null;
	}
	cameraActive.value = false;
	result.value = "Camera stopped";
};

// Recognition for live camera snaps
const captureAndIdentify = async () => {
	if (!videoRef.value || !canvasRef.value) return;
	loading.value = true;

	try {
		const canvas = canvasRef.value;
		const video = videoRef.value;

		// Sync the hidden canvas dimensions to matches the actual stream's resolution
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Draw current video stream frame onto canvas matrix
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		// FIX: Pass the canvas element directly to the recognition module.
		// This circumvents the race conditions created by asynchronous file loading / Base64 conversions.
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
</script>
<template>
	<div class="container">
		<h1>AI Face Recognition System</h1>
		<h2>Camera Recognition</h2>
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
		<pre>{{ result }}</pre>
	</div>
	<footer class="footer">
		<p>© 2026 Ahmed Hardwin</p>
		<span>AI Face Recognition System</span>
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
} /* Section Card */
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
	aspect-ratio: 16 / 9;
	object-fit: cover;
	border-radius: 24px;
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
	width: 100%;
	margin-top: 40px;
	padding: 24px 0;
	text-align: center;
	color: #64748b;
}
.footer::before {
	content: "";
	display: block;
	width: 100%;
	max-width: 1000px;
	height: 1px;
	margin: 0 auto 24px;
	background: linear-gradient(
		to right,
		transparent,
		rgba(148, 163, 184, 0.4),
		transparent
	);
}
.footer p {
	font-weight: 600;
	margin-bottom: 4px;
}
.footer span {
	font-size: 0.85rem;
	opacity: 0.8;
} /* Large desktop screens */
@media (min-width: 1600px) {
	.container {
		padding-top: 60px;
	}
	h1 {
		font-size: 3.5rem;
	}
	.card {
		max-width: 1100px;
	}
} /* Tablets */
@media (max-width: 768px) {
	.container {
		padding: 24px 16px;
	}
	h1 {
		font-size: 2rem;
		margin-bottom: 32px;
	}
	h2 {
		font-size: 1.2rem;
	}
	.card {
		padding: 20px;
	}
	.button-group {
		flex-direction: column;
	}
	button {
		width: 100%;
	}
	.camera,
	.preview img,
	pre {
		max-width: 100%;
	}
}
</style>
