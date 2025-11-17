import axios from 'axios';

const detectObjects = async (imageBuffer) => {
  try {
    // Convert image buffer to base64
    const base64Image = imageBuffer.toString('base64');

    // Call Flask ML service
    const response = await axios.post('http://localhost:5001/process-ml', {
      image: base64Image
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000 // 10 second timeout
    });

    const data = response.data;

    // Return the full response including violations, detected_objects, person_count, face_count, gaze
    console.log(`🔍 Flask ML processing completed - violations: ${data.violations?.join(', ') || 'none'}`);
    return data;

  } catch (error) {
    console.error('❌ Flask ML service error:', error.message);
    // Return empty object on error to avoid breaking the flow
    return { violations: [] };
  }
};

export { detectObjects };
