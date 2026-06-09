/** @format */

import * as faceapi from "face-api.js";
import { knownFaces } from "./faceData";

let faceMatcher: faceapi.FaceMatcher;
let detectionInterval: number | null = null;

function distance(p1: any, p2: any) {
	return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function calculateEAR(eye: any[]) {
	const A = distance(eye[1], eye[5]);
	const B = distance(eye[2], eye[4]);
	const C = distance(eye[0], eye[3]);

	return (A + B) / (2 * C);
}
export async function loadModels() {
	const MODEL_URL = "/models";

	await Promise.all([
		faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
		faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
		faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
		faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
	]);
}

export async function initializeKnownFaces() {
	const labeledDescriptors: faceapi.LabeledFaceDescriptors[] = [];

	for (const person of knownFaces) {
		try {
			const img = await faceapi.fetchImage(person.image);

			const detection = await faceapi
				.detectSingleFace(img)
				.withFaceLandmarks()
				.withFaceDescriptor();

			if (!detection) {
				console.warn(`No face detected for reference image of: ${person.name}`);
				continue;
			}

			labeledDescriptors.push(
				new faceapi.LabeledFaceDescriptors(person.name, [detection.descriptor])
			);
		} catch (error) {
			console.error(
				`Failed loading reference image for ${person.name}:`,
				error
			);
		}
	}

	// Fallback descriptor if no known faces were loaded successfully
	if (labeledDescriptors.length === 0) {
		console.error(
			"No known faces were successfully initialized. Face matching will fail."
		);
		return;
	}

	faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
}

// FIX: Changed type to TNetInput to universally support Images, Canvases, and Videos
export async function recognizeFace(inputElement: faceapi.TNetInput) {
	if (!faceMatcher) {
		throw new Error(
			"FaceMatcher is not initialized. Call initializeKnownFaces() first."
		);
	}

	const detections = await faceapi
		.detectAllFaces(inputElement)
		.withFaceLandmarks()
		.withFaceDescriptors();

	return detections.map((detection) => {
		const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

		return {
			name: bestMatch.label,
			distance: bestMatch.distance,
			box: detection.detection.box,
		};
	});
}

export async function detectSleepiness(inputElement: faceapi.TNetInput) {
	const detection = await faceapi
		.detectSingleFace(inputElement)
		.withFaceLandmarks();

	if (!detection) {
		return null;
	}

	const leftEye = detection.landmarks.getLeftEye();
	const rightEye = detection.landmarks.getRightEye();

	const leftEAR = calculateEAR(leftEye);
	const rightEAR = calculateEAR(rightEye);

	const ear = (leftEAR + rightEAR) / 2;

	return {
		ear,
		sleepy: ear < 0.22,
	};
}
