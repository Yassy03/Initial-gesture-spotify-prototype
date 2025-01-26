//Variable 
let ellipseColor = "gray";
let lastGesture = null;
let lastActionTime = 0;
let isProcessingAction = false; 
let lastVideoTime = -1; 
let results = undefined; 
// Store last detections to reduce flickering
let detections = [];


// Placeholder for gesture recognition results
// Initialize the variable
// Add a flag to track if an action is being processed
const actionDelay = 1000; // 1-second delay
//placeholder name to keep count of the ellipse pulses
let pulsingInterval;

// Select the canvas and its context
//Refers to the HTML canvas element with the ID gestureCanvas also in css
const canvas = document.getElementById("gestureCanvas");
const canvasContext = canvas.getContext("2d");

const faceCanvas = document.getElementById("face_canvas");
const faceCtx = faceCanvas.getContext("2d");


async function loadFaceAPIModels() {
  try {
    console.log("Loading Face-API.js models...");
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]);
    console.log("Face-API.js models loaded!");
  } catch (error) {
    console.error("Error loading Face-API.js models:", error);
  }
}

setInterval(async () => {
  if (video.readyState === 4) {
    const options = new faceapi.TinyFaceDetectorOptions();
    const displaySize = { width: video.videoWidth, height: video.videoHeight };

    // Detect faces and scale results to canvas size
    const detectedResults = await faceapi
      .detectAllFaces(video, options)
      .withFaceLandmarks()
      .withFaceExpressions();

    detections = faceapi.resizeResults(detectedResults, displaySize);
  }
}, 100);



// Function to draw face detection results
function drawFaceDetections() {
  // Match faceCanvas size with video size
  faceCanvas.width = video.videoWidth;
  faceCanvas.height = video.videoHeight;

  // Clear the faceCanvas before drawing
  faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

  if (detections.length > 0) {
    detections.forEach((detection) => {
      const { x, y, width, height } = detection.detection.box;

      // Draw bounding box
      faceCtx.strokeStyle = "rgb(0, 255, 0)";
      faceCtx.lineWidth = 2;
      faceCtx.strokeRect(x, y, width, height);

      // Draw landmarks
      const landmarks = detection.landmarks.positions;
      faceCtx.fillStyle = "rgb(255, 0, 0)";
      landmarks.forEach((point) => {
        faceCtx.beginPath();
        faceCtx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        faceCtx.fill();
      });

      // Display the dominant emotion
      const expressions = detection.expressions;
      const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
      const dominantEmotion = sorted[0][0] || "unknown";
      if (["neutral", "happy", "sad", "surprised"].includes(dominantEmotion)) {
        currentMood = dominantEmotion; // Update current mood
        console.log(`Detected mood: ${currentMood}`);
      }
      

      faceCtx.fillStyle = "white";
      faceCtx.font = "20px Arial";
      faceCtx.fillText(`Emotion: ${dominantEmotion}`, x, y - 10);
    });
  }
  requestAnimationFrame(drawFaceDetections);
}

// Load models, start face detection, and drawing
loadFaceAPIModels().then(() => {
  drawFaceDetections();
});

// Function to adjust canvas resolution for sharp rendering
function adjustCanvasResolution() {
  //Device Pixel Ratio (dpr): Ensures the canvas renders crisply on high-resolution screens.
  const dpr = window.devicePixelRatio || 1; // Get device pixel ratio

  // Use CSS dimensions to set the internal resolution
  const canvasWidth = 480; // Match your desired width
  const canvasHeight = 360; // Match your desired height

  // Set the canvas element's width and height attributes (internal resolution)
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;

  // Scale the context to match the device pixel ratio
  canvasContext.scale(dpr, dpr);

  // Apply the CSS width and height for rendered size
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;
}


// Function to draw an ellipse with adjustable size
function drawEllipseWithSize(color, size) {
  // Clear the canvas
  

  // Set the fill style and draw the ellipse
  canvasContext.fillStyle = color;
  canvasContext.beginPath();
  canvasContext.ellipse(
    canvas.width / (2 * window.devicePixelRatio),
    canvas.height / (2 * window.devicePixelRatio),
    size,
    size,
    0,
    0,
    2 * Math.PI
  );
  canvasContext.fill();
}

// Default ellipse rendering
function drawEllipse() {
  const minSize = Math.min(canvas.width, canvas.height) / 4;
  drawEllipseWithSize(ellipseColor, minSize / window.devicePixelRatio);
}

// Function to trigger the pulsing effect
function triggerPulsingEffect() {
  if (pulsingInterval) return; // Prevent multiple intervals

  pulsingInterval = setInterval(() => {
    let ringRadius = 30; // Start radius for the rings

    const pulseAnimation = setInterval(() => {
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the expanding ring
      canvasContext.beginPath();
      canvasContext.strokeStyle = `rgba(0, 255, 0, ${1 - ringRadius / 100})`; // Fading effect
      canvasContext.lineWidth = 2 * window.devicePixelRatio;
      canvasContext.arc(
        canvas.width / (2 * window.devicePixelRatio),
        canvas.height / (2 * window.devicePixelRatio),
        ringRadius,
        0,
        2 * Math.PI
      );
      canvasContext.stroke();

      ringRadius += 5;

      // Stop the pulse when the ring fades out
      if (ringRadius > 100) {
        clearInterval(pulseAnimation);
      }
    }, 50);
  }, 500); // Pulse every 500ms
}

// Function to stop the pulsing effect
function stopPulsingEffect() {
  if (pulsingInterval) {
    clearInterval(pulsingInterval);
    pulsingInterval = null;
    drawEllipse(); // Restore the default ellipse
  }
}

// Resize and adjust canvas on window resize
function resizeCanvas() {
  adjustCanvasResolution(); // Adjust resolution
  drawEllipse(); // Redraw the default ellipse
}

// Set up the canvas initially
adjustCanvasResolution();
drawEllipse();

// Listen for window resize
window.addEventListener("resize", resizeCanvas);


import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";

console.log("MediaPipe Gesture Recognizer initialized");

const demosSection = document.getElementById("demos");
let gestureRecognizer;
let customGestureRecognizer; 
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
// let lastVideoTime = -1;

const videoHeight = "360px";
const videoWidth = "480px";

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.


const createGestureRecognizers = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );


  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU",
    },
    runningMode: runningMode,
  });

   // Load the custom model
   const customModelPath = "/models/gesture_recognizer_model (1).tflite"; // Path to your custom model
   customGestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
     baseOptions: {
       modelAssetPath: customModelPath,
       delegate: "GPU",
     },
     runningMode: runningMode,
   });

   console.log("Both models loaded successfully!");

};
createGestureRecognizers();
drawEllipse();
loadFaceAPIModels(); // Load Face-API models



/********************************************************************
// Demo 1: Detect hand gestures in images
********************************************************************/

const imageContainers = document.getElementsByClassName("detectOnClick");

for (let i = 0; i < imageContainers.length; i++) {
  imageContainers[i].children[0].addEventListener("click", handleClick);
}

async function handleClick(event) {
  if (!gestureRecognizer) {
    alert("Please wait for gestureRecognizer to load");
    return;
  }

  if (runningMode === "VIDEO") {
    runningMode = "IMAGE";
    await gestureRecognizer.setOptions({ runningMode: "IMAGE" });
  }
  // Remove all previous landmarks
  const allCanvas = event.target.parentNode.getElementsByClassName("canvas");
  for (var i = allCanvas.length - 1; i >= 0; i--) {
    const n = allCanvas[i];
    n.parentNode.removeChild(n);
  }

  const results = gestureRecognizer.recognize(event.target);

  // View results in the console to see their format
  console.log(results);
  if (results.gestures.length > 0) {
    const p = event.target.parentNode.childNodes[3];
    p.setAttribute("class", "info");

    const categoryName = results.gestures[0][0].categoryName;
    const categoryScore = parseFloat(
      results.gestures[0][0].score * 100
    ).toFixed(2);
    const handedness = results.handednesses[0][0].displayName;

    p.innerText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore}%\n Handedness: ${handedness}`;
    p.style =
      "left: 0px;" +
      "top: " +
      event.target.height +
      "px; " +
      "width: " +
      (event.target.width - 10) +
      "px;";

    const canvas = document.createElement("canvas");
    canvas.setAttribute("class", "canvas");
    canvas.setAttribute("width", event.target.naturalWidth + "px");
    canvas.setAttribute("height", event.target.naturalHeight + "px");
    canvas.style =
      "left: 0px;" +
      "top: 0px;" +
      "width: " +
      event.target.width +
      "px;" +
      "height: " +
      event.target.height +
      "px;";

    event.target.parentNode.appendChild(canvas);
    const canvasCtx = canvas.getContext("2d");
    const drawingUtils = new DrawingUtils(canvasCtx);
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5,
        }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 1,
      });
    }
  }
}

/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("gesture_canvas", "face_canvas");
const canvasCtx = canvasElement.getContext("2d");
const gestureOutput = document.getElementById("gesture_output", "face_output");




// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}






// Enable the live webcam view and start detection.
function enableCam(event) {
  if (!gestureRecognizer) {
    alert("Please wait for gestureRecognizer to load");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "ENABLE PREDICTIONS";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "DISABLE PREDICTIONS";
  }

  // getUsermedia parameters.
  const constraints = {
    video: true,
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream;
    video.addEventListener("loadeddata", () => {
      adjustCanvasResolution(canvasElement, canvasCtx); // Adjust canvas resolution for gesture canvas
      predictWebcam(); // Start gesture prediction
    });
  });
  

video.addEventListener("loadeddata", () => {
  adjustCanvasResolution(faceCanvas, faceCtx, video.videoWidth, video.videoHeight);
  adjustCanvasResolution(canvasElement, canvasCtx, video.videoWidth, video.videoHeight);
  predictWebcam(); // Start gesture prediction
});

window.addEventListener("resize", () => {
  adjustCanvasResolution(faceCanvas, faceCtx, video.videoWidth, video.videoHeight);
  adjustCanvasResolution(canvasElement, canvasCtx, video.videoWidth, video.videoHeight);
});



}


async function predictWebcam() {
  const webcamElement = document.getElementById("webcam");

  // Start detecting the stream
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
  }

  let nowInMs = Date.now();
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime; // Update the last processed video time
    results = gestureRecognizer.recognizeForVideo(video, nowInMs);
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  const drawingUtils = new DrawingUtils(canvasCtx);

  canvasElement.style.height = videoHeight;
  webcamElement.style.height = videoHeight;
  canvasElement.style.width = videoWidth;
  webcamElement.style.width = videoWidth;

  // Draw landmarks if they exist
  // Draw landmarks if they exist
  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 2, // Fixed line width
        }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        radius: 3, // Fixed radius for points
      });
    }
  }
  


  canvasCtx.restore();

  // Check if gestures and handedness data are available
  if (results.gestures && results.gestures.length > 0) {
    const categoryName = results.gestures[0][0]?.categoryName || "Unknown";
    const categoryScore = parseFloat(
      results.gestures[0][0]?.score * 100 || 0
    ).toFixed(2);
    const currentTime = Date.now();
    gestureOutput.style.display = "block";
    gestureOutput.style.width = videoWidth;

    if (
      categoryName !== lastGesture ||
      currentTime - lastActionTime > actionDelay
    ) {
      if (!isProcessingAction) {
        isProcessingAction = true;
        lastGesture = categoryName;
        lastActionTime = currentTime;

        if (categoryName === "Open_Palm") {
          triggerPulsingEffect();
          console.log("Playing playlist...");
          await playPlaylist();
        } else if (categoryName === "Closed_Fist") {
          stopPulsingEffect();
          drawEllipseWithSize("green", 30);
          console.log("Pausing playlist...");
          await pausePlaylist();
        } else {
          stopPulsingEffect();
          ellipseColor = "gray";
          drawEllipse();
        }
        isProcessingAction = false;
      }
    }

    gestureOutput.innerText = `Gesture: ${categoryName}\nConfidence: ${categoryScore}%`;

    if (results.handednesses && results.handednesses[0]) {
      const handedness = results.handednesses[0][0]?.displayName || "Unknown";
      gestureOutput.innerText += `\nHandedness: ${handedness}`;
    }
  } else {
    stopPulsingEffect();
    ellipseColor = "gray";
    drawEllipse();
    gestureOutput.style.display = "none";
    lastGesture = null;
  }

  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam);
  }
}

window.addEventListener("resize", () => {
  adjustCanvasResolution(faceCanvas, faceCtx);
  adjustCanvasResolution(canvasElement, canvasCtx);
});


// Set up an interval for face detection (every 500ms)

