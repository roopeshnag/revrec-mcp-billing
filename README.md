# Bedrock Salesforce MCP Server

AI Billing Agent using Amazon Bedrock Agents to query Salesforce billing records via MCP (Model Context Protocol) Server.

## 🏗️ Architecture

```
User Query → Amazon Bedrock Agent → MCP Server → Salesforce API
                (Claude Model)         (Tools)      (Billing Data)
```

## ✨ Features

- **Query Invoices**: Search invoices by account, date range, or status
- **Search Accounts**: Find accounts by name or ID
- **Usage Records**: Track AI service usage and costs
- **Payment History**: Query payment records and methods
- **Billing Summary**: Get comprehensive billing overview with totals

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- Salesforce account with API access
- AWS account with Bedrock access
- Salesforce Connected App configured

### 2. Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 3. Configure Environment Variables

Edit `.env` file:

```bash
# Salesforce Configuration
SALESFORCE_USERNAME=your-email@example.com
SALESFORCE_PASSWORD=your-password
SALESFORCE_SECURITY_TOKEN=your-token
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_CLIENT_ID=your-consumer-key
SALESFORCE_CLIENT_SECRET=your-consumer-secret

# MCP Server Configuration
PORT=3000
HOST=localhost
API_KEY=your-secure-api-key
```

### 4. Start the MCP Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start at `http://localhost:3000`

### 5. Test the Server

```bash
# Run test suite
npm test

# Manual health check
curl http://localhost:3000/health

# Get available tools
curl -H "x-api-key: your-api-key" http://localhost:3000/api/tools
```

## 🔧 Available Tools

### 1. query_invoices
Query Salesforce invoices by various criteria.

**Parameters:**
- `accountId` (string): Salesforce Account ID
- `startDate` (string): Start date (YYYY-MM-DD)
- `endDate` (string): End date (YYYY-MM-DD)
- `status` (string): Invoice status (Paid, Pending, Overdue, Draft)
- `limit` (number): Max records (default: 100)

### 2. query_accounts
Search for Salesforce accounts.

**Parameters:**
- `accountName` (string): Account name (partial match)
- `accountId` (string): Specific Account ID
- `limit` (number): Max records (default: 50)

### 3. query_usage_records
Query AI service usage records.

**Parameters:**
- `accountId` (string): Salesforce Account ID
- `startDate` (string): Start date
- `endDate` (string): End date
- `serviceType` (string): Service type (GPT-4, Claude, etc.)
- `limit` (number): Max records (default: 100)

### 4. query_payments
Query payment records.

**Parameters:**
- `accountId` (string): Salesforce Account ID
- `invoiceId` (string): Specific Invoice ID
- `startDate` (string): Start date
- `endDate` (string): End date
- `status` (string): Payment status
- `limit` (number): Max records (default: 100)

### 5. get_billing_summary
Get comprehensive billing summary.

**Parameters:**
- `accountId` (string, required): Salesforce Account ID
- `startDate` (string): Start date
- `endDate` (string): End date

## 🤖 Bedrock Agent Setup

### Step 1: Create Bedrock Agent

1. Go to AWS Console → Amazon Bedrock → Agents
2. Click "Create Agent"
3. Configure:
   - **Name**: SalesforceBillingAgent
   - **Model**: Anthropic Claude 3 Sonnet
   - **Instructions**: Copy from `bedrock-config/agent-instructions.txt`

### Step 2: Add Action Group

1. In your agent, click "Add Action Group"
2. Configure:
   - **Name**: SalesforceQueryActions
   - **Action group type**: Define with API schemas
   - **Schema**: Upload `bedrock-config/openapi-schema.json`
   - **Action group executor**: Lambda function OR Custom control

### Step 3: Configure Endpoint

**Option A: Using Custom Control (Recommended)**
- Select "Return control" in action group executor
- Your application handles the tool invocation
- More flexible for custom logic

**Option B: Using Lambda Function**
- Create Lambda function that calls your MCP server
- Lambda acts as proxy between Bedrock and MCP server

**Option C: Direct HTTP (if supported)**
- Point directly to your MCP server URL
- Ensure server is publicly accessible
- Add authentication headers

### Step 4: Prepare and Test

1. Click "Prepare" to create working draft
2. Use test panel to try queries:
   - "Show me all invoices for Acme Corp"
   - "What's the outstanding balance for account 001XXXXXXXXXXXXXXX?"
   - "Find overdue invoices from last month"

### Step 5: Create Alias

1. Go to "Aliases" tab
2. Create alias (e.g., "production")
3. Note Agent ID and Alias ID for API calls

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

### List Available Tools
```bash
GET /api/tools
Headers: x-api-key: your-api-key
```

### Execute Tool
```bash
POST /api/tools/:toolName
Headers: x-api-key: your-api-key
Body: { ...parameters }

# Example
POST /api/tools/query_invoices
{
  "accountId": "001XXXXXXXXXXXXXXX",
  "status": "Overdue",
  "limit": 10
}
```

### Generic Invoke
```bash
POST /api/invoke
Headers: x-api-key: your-api-key
Body: {
  "tool": "query_invoices",
  "parameters": { ...params }
}
```

## 🔐 Security

- **API Key Authentication**: All API endpoints require `x-api-key` header
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet.js**: Security headers enabled
- **CORS**: Configurable cross-origin access
- **Salesforce OAuth**: Secure authentication with Salesforce

## 📦 Deployment Options

### Local Development
```bash
npm run dev
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t bedrock-mcp-server .
docker run -p 3000:3000 --env-file .env bedrock-mcp-server
```

### AWS EC2
1. Launch EC2 instance (t3.micro or larger)
2. Install Node.js 18+
3. Clone repository
4. Configure `.env`
5. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start src/index.js --name mcp-server
pm2 save
pm2 startup
```

### AWS ECS/Fargate
1. Build Docker image
2. Push to ECR
3. Create ECS task definition
4. Deploy as Fargate service
5. Use ALB for load balancing

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Manual Testing with cURL
```bash
# Query accounts
curl -X POST http://localhost:3000/api/tools/query_accounts \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"accountName": "Acme", "limit": 5}'

# Query invoices
curl -X POST http://localhost:3000/api/tools/query_invoices \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"status": "Overdue", "limit": 10}'
```

### Testing with Bedrock Agent

Use AWS SDK to invoke agent:

```javascript
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";

const client = new BedrockAgentRuntimeClient({ region: "us-east-1" });

const command = new InvokeAgentCommand({
  agentId: "YOUR_AGENT_ID",
  agentAliasId: "YOUR_ALIAS_ID",
  sessionId: "unique-session-id",
  inputText: "Show me all overdue invoices"
});

const response = await client.send(command);
```

## 📋 Salesforce Custom Objects

This server expects the following custom objects in Salesforce:

### Invoice__c
- `Invoice_Number__c` (Text)
- `Account__c` (Lookup to Account)
- `Amount__c` (Currency)
- `Status__c` (Picklist: Paid, Pending, Overdue, Draft)
- `Invoice_Date__c` (Date)
- `Due_Date__c` (Date)

### Usage_Record__c
- `Account__c` (Lookup to Account)
- `Service_Type__c` (Picklist: GPT-4, Claude, etc.)
- `Usage_Amount__c` (Number)
- `Unit_Price__c` (Currency)
- `Total_Cost__c` (Currency)
- `Usage_Date__c` (Date)

### Payment__c
- `Payment_Number__c` (Text)
- `Invoice__c` (Lookup to Invoice__c)
- `Account__c` (Lookup to Account)
- `Amount__c` (Currency)
- `Payment_Date__c` (Date)
- `Payment_Method__c` (Picklist)
- `Status__c` (Picklist: Completed, Pending, Failed, Refunded)

## 🐛 Troubleshooting

### Connection Issues
- Verify Salesforce credentials in `.env`
- Check security token is appended to password
- Ensure Connected App has correct OAuth scopes

### Authentication Errors
- Verify API key in requests
- Check Salesforce login URL (sandbox vs production)

### No Data Returned
- Verify custom objects exist in Salesforce
- Check field API names match the code
- Ensure user has read permissions

### Bedrock Agent Issues
- Verify agent has correct OpenAPI schema
- Check action group is enabled
- Review agent trace for errors

## 📚 Resources

- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Salesforce REST API Guide](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/)
- [JSforce Documentation](https://jsforce.github.io/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

---

**Built with ❤️ using Amazon Bedrock, Salesforce, and MCP**
