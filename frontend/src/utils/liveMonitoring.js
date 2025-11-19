import { io } from 'socket.io-client';

const socket = io('http://localhost:3000'); // Connect to the backend server

export const startLiveMonitoring = (sessionId, examId, studentId, onViolationDetected) => {
  // Request access to the user's camera and microphone
  navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.play();

    // Set up canvas for capturing frames
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 640; // Set canvas width
    canvas.height = 480; // Set canvas height

    // Function to capture and send frames to the backend for ML processing
    const captureAndSendFrame = async () => {
      if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        // Draw the current video frame onto the canvas
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Convert canvas to base64 image data
        const imageData = canvas.toDataURL('image/jpeg', 0.8); // Compress to 80% quality for efficiency

        try {
          // Send the image data to the backend for processing
          const response = await fetch('http://localhost:5001/process-ml', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData, sessionId }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log('ML Processing Result:', result); // Log the result for debugging

            // Check for violations and call the callback if any are detected
            if (result.violations && result.violations.length > 0) {
              console.log('Violations detected:', result.violations); // Log violations for debugging

              // Log specific cheat detections
              if (result.violations.includes('ml_no_face_detected')) {
                console.log('Cheat detection: No face detected');
              }
              if (result.violations.includes('ml_cell phone')) {
                console.log('Cheat detection: Cell phone detected');
              }
              if (result.violations.includes('ml_multiple_faces_detected')) {
                console.log('Cheat detection: Multiple faces detected');
              }
              if (result.violations.includes('ml_gaze_away') || result.violations.includes('gaze_away')) {
                console.log('Cheat detection: Looking away detected');
              }

              onViolationDetected(result.violations); // Call the callback with violations
            } else {
              console.log('No violations detected.'); // Log if no violations
            }
          } else {
            console.error('Failed to process ML:', response.statusText); // Log error if request fails
          }
        } catch (error) {
          console.error('Error sending frame for ML processing:', error); // Log any errors during fetch
        }
      } else {
        console.warn('Video not ready yet, skipping frame capture.'); // Warn if video is not ready
      }
    };

    // Capture and send frames every 2 seconds (adjust as needed for performance vs. accuracy trade-off)
    const intervalId = setInterval(captureAndSendFrame, 2000); // 2-second interval for frame capture

    // Return a function to stop monitoring and clean up resources
    return () => {
      clearInterval(intervalId); // Stop the interval for capturing frames
      stream.getTracks().forEach(track => track.stop()); // Stop all media tracks (camera, etc.)
      socket.disconnect(); // Disconnect the socket if needed (though not used in this function currently)
    };
  }).catch((error) => {
    console.error('Error accessing camera:', error); // Log error if camera access fails
    throw error; // Re-throw the error for handling by the caller
  });
};
