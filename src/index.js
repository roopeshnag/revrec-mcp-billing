import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { executeTool, getToolDefinitions } from './mcp-tools.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid API key'
    });
  }
  
  next();
};

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Bedrock Salesforce MCP Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/tools', apiKeyAuth, (req, res) => {
  const tools = getToolDefinitions();
  res.json({
    success: true,
    tools
  });
});

app.post('/api/tools/:toolName', apiKeyAuth, async (req, res) => {
  const { toolName } = req.params;
  const params = req.body;

  console.log(`📞 Tool invoked: ${toolName}`, JSON.stringify(params, null, 2));

  try {
    const result = await executeTool(toolName, params);
    
    console.log(`✅ Tool result: ${toolName}`, {
      success: result.success,
      recordCount: result.records?.length || result.totalSize || 0
    });

    res.json(result);
  } catch (error) {
    console.error(`❌ Tool execution error: ${toolName}`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/invoke', apiKeyAuth, async (req, res) => {
  const { tool, parameters } = req.body;

  if (!tool) {
    return res.status(400).json({
      success: false,
      error: 'Tool name is required'
    });
  }

  console.log(`📞 Generic invoke: ${tool}`, JSON.stringify(parameters, null, 2));

  try {
    const result = await executeTool(tool, parameters || {});
    res.json(result);
  } catch (error) {
    console.error(`❌ Invoke error: ${tool}`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: {
      health: 'GET /health',
      tools: 'GET /api/tools',
      executeTool: 'POST /api/tools/:toolName',
      invoke: 'POST /api/invoke'
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, HOST, () => {
  console.log('🚀 Bedrock Salesforce MCP Server started');
  console.log(`📍 Server running at http://${HOST}:${PORT}`);
  console.log(`🏥 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔧 Tools endpoint: http://${HOST}:${PORT}/api/tools`);
  console.log(`\n📋 Available tools:`);
  
  const tools = getToolDefinitions();
  tools.forEach(tool => {
    console.log(`   - ${tool.name}: ${tool.description}`);
  });
  
  console.log('\n✨ Ready to receive requests from Bedrock Agent\n');
});

export default app;
