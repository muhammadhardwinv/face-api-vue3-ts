# AI Face Recognition System

An AI-powered Face Recognition System built using Vue 3, TypeScript, and Face-API.js. The application can detect and recognize faces from uploaded images and live camera streams using Computer Vision and Machine Learning techniques.

---

## Project Information

| Item | Details |
|--------|--------|
| Course | Artificial Intelligence |
| Lecturer | Roy Kurniawan, S.Kom., M.M. |
| Class Code | LC11-LEC |
| Framework | Vue 3 |
| Language | TypeScript |
| AI Library | Face-API.js |
| Build Tool | Vite |

---

## Features

### Upload Image Recognition
- Upload image files
- Face detection
- Face recognition
- Recognition result display
- Upload new image workflow

### Camera Recognition
- Start camera
- Stop camera
- Capture image from webcam
- Face recognition from camera feed

### User Interface
- Modern responsive design
- Centered layout
- Image preview
- Status feedback
- Recognition result panel

---

# Screenshots

## Main Interface
![Main Interface](https://ik.imagekit.io/ta62ct70w/asset-kelas-ai/Documentation/Phase%201:%20No%20process.?updatedAt=1780825068272)

---

## Upload Image Recognition
![Upload Recognition](https://ik.imagekit.io/ta62ct70w/asset-kelas-ai/Documentation/Phase%202B:%20Uploaded%20image%20ready%20to%20identify?updatedAt=1780825167656)

---

## Camera Recognition
![Camera Recognition](https://ik.imagekit.io/ta62ct70w/asset-kelas-ai/Documentation/Phase%202A:%20Camera%20started%20ready%20to%20identify?updatedAt=1780825182669)

---

## Recognition Result
![Recognition Result from File Input](https://ik.imagekit.io/ta62ct70w/asset-kelas-ai/Documentation/Phase%203B:%20Identified%20face%20from%20file%20input.?updatedAt=1780825395184)
![Recognition Result from Camera Input](https://ik.imagekit.io/ta62ct70w/asset-kelas-ai/Documentation/Phase%203A:%20Identified%20face%20from%20camera%20input.?updatedAt=1780825366366)

---

## Camera Stopped
![Camera Stopped State](https://ik.imagekit.io/ta62ct70w/asset-kelas-ai/Documentation/Phase%203A:%20Identified%20face%20from%20camera%20input.?updatedAt=1780825366366)

---

## System Workflow

```text
User Input
    │
    ▼
Image / Camera Capture
    │
    ▼
Face Detection
    │
    ▼
Feature Extraction
    │
    ▼
Face Matching
    │
    ▼
Recognition Result
```

---

## Technologies Used

### Frontend

- Vue 3
- TypeScript
- Vite

### Artificial Intelligence

- Face-API.js
- TensorFlow.js

### Browser APIs

- MediaDevices API
- Canvas API
- File API

---

## Installation

Clone the repository:

```bash
git clone [https://github.com/muhammadhardwinv/face-api-vue3-ts.git]
```

Navigate to the project:

```bash
cd vue3-ts
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

---

## Usage

### Image Recognition

1. Upload an image.
2. Wait for the image preview.
3. Click **Identify Uploaded Face**.
4. View recognition results.
5. Click **Upload New Image** to test another image.

### Camera Recognition

1. Click **Start Camera**.
2. Allow camera permission.
3. Click **Capture & Identify**.
4. View recognition result.
5. Click **Stop Camera** when finished.

---

## AI Concepts Applied

### Artificial Intelligence

The application demonstrates how AI can recognize and identify human faces automatically.

### Machine Learning

Pre-trained facial recognition models are used to compare facial descriptors and determine identity matches.

### Deep Learning

Neural-network-based models are utilized for facial feature extraction and recognition.

### Computer Vision

The system processes images and video streams to detect and analyze human faces.

---

## Development Highlights

During development, the following improvements were implemented:

- Vue 3 Composition API architecture
- TypeScript integration
- Face recognition model loading
- Webcam integration using MediaDevices API
- Camera start/stop controls
- Image upload workflow
- Image re-upload functionality
- Responsive modern UI
- State management using Vue refs
- Error handling and recognition feedback
- Memory cleanup for uploaded image previews

---

## Future Enhancements

- Real-time face recognition
- Face bounding boxes
- Confidence score visualization
- Unknown face detection
- Face registration UI
- Attendance system
- Recognition history
- Analytics dashboard
- Liveness detection

---

## Repository Structure

```text
src/
├── App.vue
├── faceRecognition.ts
├── assets/
├── components/
└── models/
```

---

## Acknowledgements

This project was developed as part of an Artificial Intelligence coursework project. Appreciation is extended to the open-source community for providing the tools, libraries, and documentation that made this implementation possible.

Special thanks to the developers and contributors of:

- Face-API.js
- TensorFlow.js
- Vue.js
- TypeScript
- Vite

Their contributions have significantly supported the development and learning process behind this project.
---

## Author

Muhammad Hardwin V

Artificial Intelligence Project
LC11-LEC

## Lecturer
This project was developed as part of the Artificial Intelligence course under the guidance of **Roy Kurniawan, S.Kom., M.M. (LC11-LEC)**.
