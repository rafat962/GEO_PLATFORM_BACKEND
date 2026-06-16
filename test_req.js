const axios = require('axios');

async function runTest() {
  try {
    const response = await axios.post('http://localhost:8000/api/copilotkit', {
      messages: [
        { role: 'user', content: 'What fields are available in the land parcels layer?' }
      ],
      actions: [],
      threadId: 'test-thread'
    });
    console.log("RESPONSE STATUS:", response.status);
    console.log("RESPONSE HEADERS:", response.headers);
    // Since it's a stream, the response.data might be a stream or a long string
    console.log("RESPONSE DATA START:", response.data.substring(0, 500));
  } catch (error) {
    if (error.response) {
      console.error("ERROR STATUS:", error.response.status);
      console.error("ERROR DATA:", error.response.data);
    } else {
      console.error("REQUEST FAILED:", error.message);
    }
  }
}

runTest();
