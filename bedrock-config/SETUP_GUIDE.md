# Amazon Bedrock Agent Setup Guide

Complete step-by-step guide to configure Amazon Bedrock Agent with your MCP Server.

## Prerequisites Checklist

- [ ] AWS Account with Bedrock access
- [ ] Bedrock model access enabled (Claude 3 Sonnet)
- [ ] MCP Server running and accessible
- [ ] Salesforce Connected App configured
- [ ] IAM permissions for Bedrock Agent creation

---

## Part 1: Enable Bedrock Model Access

### Step 1: Navigate to Bedrock Console

1. Log into AWS Console
2. Search for "Bedrock" in services
3. Select your region (e.g., us-east-1, us-west-2)

### Step 2: Request Model Access

1. Click **"Model access"** in left navigation
2. Click **"Manage model access"**
3. Select models:
   - ✅ **Anthropic Claude 3 Sonnet** (recommended)
   - ✅ **Anthropic Claude 3 Haiku** (optional, faster)
4. Click **"Request model access"**
5. Wait for approval (usually instant)

### Step 3: Verify Access

- Status should show **"Access granted"** in green
- Note the model ID: `anthropic.claude-3-sonnet-20240229-v1:0`

---

## Part 2: Create Bedrock Agent

### Step 1: Create New Agent

1. Go to **Bedrock Console → Agents**
2. Click **"Create Agent"**

### Step 2: Configure Agent Details

**Agent Configuration:**
```
Agent name: SalesforceBillingAgent
Description: AI agent for querying Salesforce billing records
```

### Step 3: Select Foundation Model

**Model Selection:**
```
Model: Anthropic Claude 3 Sonnet
Model ID: anthropic.claude-3-sonnet-20240229-v1:0
```

### Step 4: Add Agent Instructions

Copy and paste from `agent-instructions.txt`:

```
You are a Salesforce Billing Assistant powered by Amazon Bedrock. 
Your role is to help users query and understand billing information 
stored in Salesforce.

CAPABILITIES:
- Query invoices by account, date range, or status
- Search for account information
- Retrieve AI service usage records
- Query payment history
- Generate billing summaries with totals and outstanding balances

[... rest of instructions ...]
```

### Step 5: Configure Advanced Settings (Optional)

```
Idle session TTL: 600 seconds (10 minutes)
Enable trace: Yes (for debugging)
```

### Step 6: Create Agent

Click **"Create"** - this creates the agent without action groups yet.

---

## Part 3: Add Action Group

### Step 1: Navigate to Action Groups

1. In your agent, scroll to **"Action groups"** section
2. Click **"Add"**

### Step 2: Configure Action Group

**Basic Information:**
```
Action group name: SalesforceQueryActions
Description: Tools for querying Salesforce billing data
Action group state: Enabled
```

### Step 3: Define API Schema

**Schema Type:** Select **"Define with API schemas"**

**Schema Method:** Choose one:

#### Option A: Upload Schema File (Recommended)
1. Select **"Upload schema file"**
2. Upload `openapi-schema.json` from bedrock-config folder

#### Option B: Inline Schema
1. Select **"Define inline schema"**
2. Copy entire contents of `openapi-schema.json`
3. Paste into schema editor

### Step 4: Configure Action Group Executor

Choose your execution method:

#### Option A: Custom Control (Recommended for MCP)
```
Action group executor: Custom control
Control method: RETURN_CONTROL
```

**Why this option?**
- Agent returns control to your application
- Your app invokes MCP server
- More flexible for custom logic
- Better error handling

#### Option B: Lambda Function
```
Action group executor: Lambda function
Lambda function: [Create or select existing]
```

**Lambda Code Example:**
```javascript
export const handler = async (event) => {
  const { actionGroup, apiPath, httpMethod, parameters } = event;
  
  // Call your MCP server
  const response = await fetch('http://your-mcp-server:3000/api/invoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.MCP_API_KEY
    },
    body: JSON.stringify({
      tool: apiPath.replace('/tools/', ''),
      parameters: parameters
    })
  });
  
  const data = await response.json();
  
  return {
    response: {
      actionGroup,
      apiPath,
      httpMethod,
      httpStatusCode: 200,
      responseBody: {
        'application/json': {
          body: JSON.stringify(data)
        }
      }
    }
  };
};
```

### Step 5: Save Action Group

Click **"Add"** to save the action group.

---

## Part 4: Prepare Agent

### Step 1: Prepare Working Draft

1. Click **"Prepare"** button at top of agent page
2. Wait for preparation to complete (1-2 minutes)
3. Status should show **"Prepared"**

### Step 2: Review Configuration

Verify:
- ✅ Agent instructions loaded
- ✅ Action group enabled
- ✅ API schema validated
- ✅ Model selected

---

## Part 5: Test Agent

### Step 1: Open Test Panel

1. Click **"Test"** button in top right
2. Test panel opens on right side

### Step 2: Enable Trace

Toggle **"Show trace"** to see:
- Agent reasoning
- Tool invocations
- API calls
- Responses

### Step 3: Test Queries

Try these sample queries:

**Query 1: Search Accounts**
```
Find accounts with name containing "Acme"
```

**Query 2: Query Invoices**
```
Show me all overdue invoices from last month
```

**Query 3: Billing Summary**
```
What's the billing summary for account 001XXXXXXXXXXXXXXX?
```

**Query 4: Usage Records**
```
Show me GPT-4 usage for account 001XXXXXXXXXXXXXXX in January 2024
```

### Step 4: Review Trace

Check trace for:
- ✅ Tool selection
- ✅ Parameter extraction
- ✅ API invocation
- ✅ Response formatting

---

## Part 6: Create Alias for Production

### Step 1: Create Alias

1. Go to **"Aliases"** tab
2. Click **"Create alias"**

### Step 2: Configure Alias

```
Alias name: production
Description: Production version of billing agent
Version: [Select prepared version]
```

### Step 3: Note IDs

Save these for API calls:
```
Agent ID: XXXXXXXXXX
Alias ID: YYYYYYYYYY
```

---

## Part 7: Invoke Agent from Application

### Using AWS SDK (Node.js)

```javascript
import { 
  BedrockAgentRuntimeClient, 
  InvokeAgentCommand 
} from "@aws-sdk/client-bedrock-agent-runtime";

const client = new BedrockAgentRuntimeClient({ 
  region: "us-east-1" 
});

async function queryBilling(userInput) {
  const command = new InvokeAgentCommand({
    agentId: "YOUR_AGENT_ID",
    agentAliasId: "YOUR_ALIAS_ID",
    sessionId: `session-${Date.now()}`,
    inputText: userInput
  });

  const response = await client.send(command);
  
  // Process streaming response
  for await (const event of response.completion) {
    if (event.chunk) {
      const chunk = event.chunk;
      const decodedResponse = new TextDecoder().decode(chunk.bytes);
      console.log(decodedResponse);
    }
  }
}

// Example usage
await queryBilling("Show me overdue invoices for Acme Corp");
```

### Using AWS SDK (Python)

```python
import boto3
import json

client = boto3.client('bedrock-agent-runtime', region_name='us-east-1')

def query_billing(user_input):
    response = client.invoke_agent(
        agentId='YOUR_AGENT_ID',
        agentAliasId='YOUR_ALIAS_ID',
        sessionId=f'session-{int(time.time())}',
        inputText=user_input
    )
    
    # Process streaming response
    for event in response['completion']:
        if 'chunk' in event:
            chunk = event['chunk']
            print(chunk['bytes'].decode('utf-8'))

# Example usage
query_billing("Show me overdue invoices for Acme Corp")
```

---

## Part 8: Handle Custom Control (If Using RETURN_CONTROL)

### Application Flow

```
1. User sends query to Bedrock Agent
2. Agent determines which tool to use
3. Agent returns control to your application with tool details
4. Your application calls MCP server
5. Your application returns result to Bedrock Agent
6. Agent formats final response
```

### Implementation Example

```javascript
async function handleAgentResponse(response) {
  for await (const event of response.completion) {
    // Check if agent is requesting tool invocation
    if (event.returnControl) {
      const { invocationId, invocationInputs } = event.returnControl;
      
      // Extract tool details
      const toolInput = invocationInputs[0];
      const toolName = toolInput.apiInvocationInput.apiPath.replace('/tools/', '');
      const parameters = toolInput.apiInvocationInput.requestBody.content['application/json'];
      
      // Call your MCP server
      const mcpResponse = await fetch('http://localhost:3000/api/invoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.MCP_API_KEY
        },
        body: JSON.stringify({
          tool: toolName,
          parameters: JSON.parse(parameters)
        })
      });
      
      const result = await mcpResponse.json();
      
      // Return result to agent
      await client.send(new InvokeAgentCommand({
        agentId: "YOUR_AGENT_ID",
        agentAliasId: "YOUR_ALIAS_ID",
        sessionId: sessionId,
        sessionState: {
          invocationId: invocationId,
          returnControlInvocationResults: [{
            apiResult: {
              responseBody: {
                'application/json': {
                  body: JSON.stringify(result)
                }
              },
              httpStatusCode: 200
            }
          }]
        }
      }));
    }
    
    // Handle final response
    if (event.chunk) {
      console.log(new TextDecoder().decode(event.chunk.bytes));
    }
  }
}
```

---

## Troubleshooting

### Agent Not Finding Tools

**Problem:** Agent doesn't invoke any tools

**Solutions:**
1. Verify OpenAPI schema is valid JSON
2. Check action group is **Enabled**
3. Ensure agent is **Prepared** after schema changes
4. Review agent instructions for clarity

### Tool Invocation Fails

**Problem:** Tool is invoked but returns error

**Solutions:**
1. Check MCP server is running and accessible
2. Verify API key authentication
3. Test MCP endpoint directly with cURL
4. Review Salesforce connection in MCP server logs

### Agent Returns Generic Responses

**Problem:** Agent doesn't use tools, gives generic answers

**Solutions:**
1. Improve agent instructions with specific examples
2. Add more detailed tool descriptions
3. Use lower temperature (0.0) for more deterministic behavior
4. Test with explicit tool-triggering queries

### Authentication Errors

**Problem:** 401/403 errors from MCP server

**Solutions:**
1. Verify `x-api-key` header is set
2. Check API key matches `.env` configuration
3. Ensure Lambda has correct environment variables
4. Test authentication with cURL first

---

## Next Steps

1. ✅ Test all tools individually
2. ✅ Test complex multi-step queries
3. ✅ Monitor agent performance and costs
4. ✅ Set up CloudWatch logging
5. ✅ Configure alerts for errors
6. ✅ Document common queries for users
7. ✅ Create user-facing documentation

---

## Cost Optimization

**Bedrock Agent Costs:**
- Model inference: ~$0.003 per 1K input tokens
- Model generation: ~$0.015 per 1K output tokens

**Tips:**
- Use Claude 3 Haiku for faster, cheaper responses
- Set appropriate session TTL
- Cache common queries
- Monitor usage with CloudWatch

---

## Security Best Practices

1. **API Keys:** Store in AWS Secrets Manager
2. **Network:** Use VPC for MCP server
3. **IAM:** Principle of least privilege
4. **Logging:** Enable CloudWatch logs
5. **Monitoring:** Set up CloudWatch alarms
6. **Encryption:** Use TLS for all communications

---

**Setup Complete! 🎉**

Your Bedrock Agent is now ready to query Salesforce billing records through your MCP Server.
