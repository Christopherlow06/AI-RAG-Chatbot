/**
 * ============================================================================
 *  !!! DEPRECATION NOTICE !!!
 * ----------------------------------------------------------------------------
 *  The following block of code has been officially retired from active duty.
 *
 *  While it may once have served a noble purpose within this application’s
 *  lifecycle, it has now been rendered obsolete, deprecated, or otherwise
 *  unnecessary due to architectural revisions, performance considerations,
 *  or sheer irrelevance.
 *
 *  PLEASE DO NOT ATTEMPT TO RESUSCITATE OR REINTEGRATE THIS CODE unless you
 *  have conducted a thorough analysis and are fully aware of the implications.
 *
 *  It remains here solely for archival, educational, or sentimental reasons.
 * 
 *  LOL
 * 
 *  code not used already since establishing direct connection to server
 * 
 *  left here in case there is a need for it in the future
 * ============================================================================
 */


process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cors = require('cors');
const multer = require('multer');
const upload = multer();
const axios = require('axios');
const FormData = require('form-data');

const PYTHON_SERVER = 'http://10.20.5.10:8080';
  
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*' }));

// Enhanced proxy handler with proper error handling
async function forwardToPython(req, res, endpoint) {
  try {
    console.log(`Forwarding to Python: ${PYTHON_SERVER}${endpoint}`);
    console.log('Request body:', req.body);

    const fetch = await import('node-fetch').then(mod => mod.default);
    
    const response = await fetch(`${PYTHON_SERVER}${endpoint}`, {
      method: req.method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Python server error:', errorData);
      return res.status(response.status).json({
        error: errorData.message || 'Request failed',
        details: errorData
      });
    }

    const data = await response.json();
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Proxy error:', {
      message: error.message,
      stack: error.stack,
      endpoint: endpoint,
      pythonServer: PYTHON_SERVER
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      endpoint: endpoint
    });
  }
}

// User management endpoints
app.post('/api/users', async (req, res) => {
  await forwardToPython(req, res, '/api/users');
});

app.post('/api/login', async (req, res) => {
  await forwardToPython(req, res, '/api/login');
});

app.post('/api/pin_login', async (req, res) => {
  await forwardToPython(req, res, '/api/pin_login');
});

// Modified Upsert Endpoint (now forwards to Python)
app.post('/api/upsert', async (req, res) => {
  const { entries } = req.body;
  console.log("Received upsert request from client");

  try {
    // Forward to Python service
    const pythonResponses = await Promise.all(
      entries.map(async (entry) => {
        const response = await fetch('http://10.20.5.59:8000/api/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        });
        return response.json();
      })
    );

    // Check for errors
    const errors = pythonResponses.filter(r => r.status !== 'success');
    if (errors.length > 0) {
      return res.status(500).json({ 
        error: 'Partial failure', 
        details: errors 
      });
    }

    res.status(200).json({ message: 'All entries processed successfully' });
  } catch (error) {
    console.error('Upsert error:', error);
    res.status(500).json({ error: 'Failed to process upsert' });
  }
});

// New PDF upsert route for base64-encoded uploads
app.post('/api/upsert_pdf', upload.single('file'), async (req, res) => {
  try {
    console.log("JSserver: Received PDF upload request");
    console.log("File:", req.file?.originalname);
    console.log("Category:", req.body.category);

    if (!req.file || !req.body.category) {
      return res.status(400).json({ error: 'Missing file or category in request' });
    }

    // Forward as multipart/form-data to FastAPI
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    formData.append('category', req.body.category);

    const response = await fetch('http://10.20.5.59:8000/api/upsert_pdf', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(), // <-- critical for setting proper multipart boundaries
    });

    const result = await response.json();

    if (result.status === "duplicate") {
      return res.status(200).json({
        status: "duplicate",
        message: result.message
      });
    }

    res.status(response.status).json(result);
  } catch (error) {
    console.error('JSserver PDF upload error:', error);
    res.status(500).json({ error: 'PDF processing failed', details: error.message });
  }
});


// Replace the existing /api/query endpoint with this:
app.post('/api/query', async (req, res) => {
  const { query_text } = req.body;
  console.log("Forwarding query to Python service...");

  try {
    // Forward to Python RAG service
    const response = await fetch('http://10.20.5.59:8000/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: query_text })
    });

    if (!response.ok) {
      throw new Error('Python service error: ${response.status}');
    }

    const result = await response.json();
    console.log("Received response from Python:", result);
    
    res.status(200).json({
      answer: result.answer,
      question: result.question || query_text,
      category: result.category || "General"
    });
    
  } catch (error) {
    console.error("Query forwarding error:", error);
    res.status(500).json({ 
      answer: "I don't know.",
      error: error.message 
    });
  }
});

// Questions and categories with proper response formatting
app.get('/api/pdfs_from_category', async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ error: 'Category parameter is required' });
    }

    const response = await axios.get(`${PYTHON_SERVER}/api/pdfs_from_category`, {
      params: { category }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    if (error.response) {
      // Forward the error from the Python server
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const response = await fetch('http://10.20.5.59:8000/api/categories');
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Unable to fetch categories' });
  }
});


// Proxy /history endpoint to FastAPI
app.get('/history', async (req, res) => {
  try {
    const response = await fetch('http://10.20.5.59:8080/history');
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error proxying /history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`JS Proxy Server running on port ${PORT}`))
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
      // Try alternative port
      const altPort = PORT + 1;
      console.log(`Trying port ${altPort}...`);
      app.listen(altPort, () => console.log(`JS Proxy Server running on port ${altPort}`));
    } else {
      console.error('Server error:', err);
    }
  });