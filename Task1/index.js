const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 9876;
const WINDOW_SIZE = 10;

// Memory store for numbers
let windowState = [];

// Function to obtain the authorization token
const getAuthToken = async () => {
  try {
    const response = await axios.post('http://20.244.56.144/test/auth', {
      companyName: "goMart",
      clientID: "37bb493c-73d3-47ea-8675-21f66ef9b735",
      clientSecret: "HVIQBVbqmTGEmaED",
      ownerName: "Rahul",
      ownerEmail: "rahul@abc.edu",
      rollNo: "1"
    });
    return response.data.access_token;
  } catch (error) {
    console.error("Error obtaining auth token:", {
      message: error.message,
      status: error.response ? error.response.status : 'No response status',
      data: error.response ? error.response.data : 'No response data',
      config: error.config,
    });
    return null;
  }
};

// Function to fetch numbers from the test server
const fetchNumbers = async (type, token) => {
  try {
    const url = `http://20.244.56.144/test/${type}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 1000,
    });
    return response.data.numbers;
  } catch (error) {
    console.error("Error fetching numbers:", {
      message: error.message,
      status: error.response ? error.response.status : 'No response status',
      data: error.response ? error.response.data : 'No response data',
      config: error.config,
    });
    return [];
  }
};

// Function to calculate the average
const calculateAverage = (numbers) => {
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return numbers.length > 0 ? sum / numbers.length : 0;
};

// API to get numbers based on the type (prime, fibonacci, even, or random)
app.get('/numbers/:type', async (req, res) => {
  const { type } = req.params;
  const validTypes = { p: 'primes', f: 'fibo', e: 'even', r: 'rand' };

  if (!validTypes[type]) {
    return res.status(400).json({ error: 'Invalid number type' });
  }

  // Get the authorization token
  const token = await getAuthToken();
  if (!token) {
    return res.status(500).json({ error: 'Failed to obtain authorization token' });
  }

  const newNumbers = await fetchNumbers(validTypes[type], token);

  if (newNumbers.length === 0) {
    return res.status(204).json({ message: "No numbers returned from the server." });
  }

  // Filter out duplicates and manage the window size
  newNumbers.forEach(num => {
    if (!windowState.includes(num)) {
      if (windowState.length >= WINDOW_SIZE) {
        windowState.shift(); // Remove the oldest number
      }
      windowState.push(num);
    }
  });

  const average = calculateAverage(windowState);

  res.json({
    numbers: newNumbers,
    windowPrevState: windowState.slice(0, windowState.length - newNumbers.length),
    windowCurrState: windowState,
    avg: average.toFixed(2),
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
