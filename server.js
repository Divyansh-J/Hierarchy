require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const HierarchyService = require('./services/hierarchyService');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create a new hierarchy
app.post('/api/hierarchies', async (req, res) => {
  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    
    if (!req.body) {
      console.error('No request body received');
      return res.status(400).json({ error: 'Request body is required' });
    }
    
    const { userInput, version, data, userFeedback, status } = req.body; // Extract status
    
    // Validate required fields
    if (!userInput || !data) {
      console.error('Missing required fields:', { userInput, data });
      return res.status(400).json({ 
        error: 'userInput and data are required',
        received: { userInput: !!userInput, data: !!data, version: !!version }
      });
    }
    // Pass status to the service
    const result = await HierarchyService.createHierarchy({ userInput, version, data, userFeedback, status });
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating hierarchy:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a hierarchy by ID
app.get('/api/hierarchies/:id', async (req, res) => {
  try {
    const hierarchy = await HierarchyService.getHierarchy(req.params.id);
    if (!hierarchy) {
      return res.status(404).json({ error: 'Hierarchy not found' });
    }
    res.json(hierarchy);
  } catch (error) {
    console.error('Error getting hierarchy:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update hierarchy status
app.patch('/api/hierarchies/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['in-draft', 'approved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "in-draft" or "approved"' });
    }
    const metadata = await HierarchyService.updateMetadata(req.params.id, { status });
    res.json(metadata);
  } catch (error) {
    console.error('Error updating hierarchy status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add data to a hierarchy
app.post('/api/hierarchies/:id/data', async (req, res) => {
  try {
    const data = req.body;
    const result = await HierarchyService.addHierarchyData(req.params.id, data);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding hierarchy data:', error);
    res.status(500).json({ error: error.message });
  }
});

// List hierarchies with pagination
app.get('/api/hierarchies', async (req, res) => {
  try {
    const { status, version, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const result = await HierarchyService.listHierarchies(
      { status, version },
      parseInt(limit),
      parseInt(offset)
    );
    res.json({
      data: result.items,
      pagination: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    console.error('Error listing hierarchies:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, async () => {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }
});

module.exports = app;
