const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 9876;
const WINDOW_SIZE = 10;

// Memory store for numbers
let windowState = [];

// Function to fetch numbers from the test server
const fetchNumbers = async (type) => {
  try {
    const url = `http://20.244.56.144/test/${type}`;
    const response = await axios.get(url, { timeout: 500 }); // 500ms timeout
    return response.data.numbers;
  } catch (error) {
    console.error("Error fetching numbers:", error.message);
    return [];
  }
};

// Function to calculate the average
const calculateAverage = (numbers) => {
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
};

// API to get numbers based on the type (prime, fibonacci, even, or random)
app.get('/numbers/:type', async (req, res) => {
  const { type } = req.params;
  const validTypes = { p: 'primes', f: 'fibo', e: 'even', r: 'rand' };

  if (!validTypes[type]) {
    return res.status(400).json({ error: 'Invalid number type' });
  }

  const newNumbers = await fetchNumbers(validTypes[type]);

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
