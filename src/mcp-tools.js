import SalesforceClient from './salesforce-client.js';

const sfClient = new SalesforceClient();

export const tools = [
  {
    name: 'query_invoices',
    description: 'Query Salesforce invoices by account, date range, or status. Returns invoice details including amounts, dates, and status.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'Salesforce Account ID (18-character ID)'
        },
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format'
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format'
        },
        status: {
          type: 'string',
          description: 'Invoice status (e.g., Paid, Pending, Overdue, Draft)',
          enum: ['Paid', 'Pending', 'Overdue', 'Draft']
        },
        limit: {
          type: 'number',
          description: 'Maximum number of records to return (default: 100)',
          default: 100
        }
      }
    },
    handler: async (params) => {
      return await sfClient.queryInvoices(params);
    }
  },
  {
    name: 'query_accounts',
    description: 'Search for Salesforce accounts by name or ID. Returns account details including billing address and contact information.',
    inputSchema: {
      type: 'object',
      properties: {
        accountName: {
          type: 'string',
          description: 'Account name to search for (partial match supported)'
        },
        accountId: {
          type: 'string',
          description: 'Specific Salesforce Account ID'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of records to return (default: 50)',
          default: 50
        }
      }
    },
    handler: async (params) => {
      return await sfClient.queryAccounts(params);
    }
  },
  {
    name: 'query_usage_records',
    description: 'Query AI service usage records by account, date range, or service type. Returns usage amounts, costs, and service details.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'Salesforce Account ID'
        },
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format'
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format'
        },
        serviceType: {
          type: 'string',
          description: 'Type of AI service (e.g., GPT-4, Claude, Embeddings)',
          enum: ['GPT-4', 'GPT-3.5', 'Claude', 'Embeddings', 'Fine-tuning', 'Other']
        },
        limit: {
          type: 'number',
          description: 'Maximum number of records to return (default: 100)',
          default: 100
        }
      }
    },
    handler: async (params) => {
      return await sfClient.queryUsageRecords(params);
    }
  },
  {
    name: 'query_payments',
    description: 'Query payment records by account, invoice, or date range. Returns payment details including amounts, methods, and status.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'Salesforce Account ID'
        },
        invoiceId: {
          type: 'string',
          description: 'Salesforce Invoice ID'
        },
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format'
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format'
        },
        status: {
          type: 'string',
          description: 'Payment status',
          enum: ['Completed', 'Pending', 'Failed', 'Refunded']
        },
        limit: {
          type: 'number',
          description: 'Maximum number of records to return (default: 100)',
          default: 100
        }
      }
    },
    handler: async (params) => {
      return await sfClient.queryPayments(params);
    }
  },
  {
    name: 'get_billing_summary',
    description: 'Get comprehensive billing summary for an account including total invoiced, paid, outstanding balance, and usage statistics.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'Salesforce Account ID (required)',
          required: true
        },
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format'
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format'
        }
      },
      required: ['accountId']
    },
    handler: async (params) => {
      return await sfClient.getBillingSummary(params);
    }
  }
];

export async function executeTool(toolName, params) {
  const tool = tools.find(t => t.name === toolName);
  
  if (!tool) {
    return {
      success: false,
      error: `Tool '${toolName}' not found`
    };
  }

  try {
    const result = await tool.handler(params);
    return result;
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

export function getToolDefinitions() {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema
  }));
}
