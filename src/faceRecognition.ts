/** @format */

import * as faceapi from "face-api.js";
import { knownFaces } from "./faceData";

let faceMatcher: faceapi.FaceMatcher;

export async function loadModels() {
	const MODEL_URL = "/models";

	await Promise.all([
		faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
		faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
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
				new faceapi.LabeledFaceDescriptors(person.name, [detection.descriptor]),
			);
		} catch (error) {
			console.error(
				`Failed loading reference image for ${person.name}:`,
				error,
			);
		}
	}

	// Fallback descriptor if no known faces were loaded successfully
	if (labeledDescriptors.length === 0) {
		console.error(
			"No known faces were successfully initialized. Face matching will fail.",
		);
		return;
	}

	faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
}

// FIX: Changed type to TNetInput to universally support Images, Canvases, and Videos
export async function recognizeFace(inputElement: faceapi.TNetInput) {
	if (!faceMatcher) {
		throw new Error(
			"FaceMatcher is not initialized. Call initializeKnownFaces() first.",
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
