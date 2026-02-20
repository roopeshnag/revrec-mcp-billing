import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 3000}`;
const API_KEY = process.env.API_KEY;

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
  }
});

async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testGetTools() {
  console.log('\n🔧 Testing Get Tools...');
  try {
    const response = await client.get('/api/tools');
    console.log('✅ Tools retrieved:', response.data.tools.length, 'tools available');
    response.data.tools.forEach(tool => {
      console.log(`   - ${tool.name}`);
    });
    return true;
  } catch (error) {
    console.error('❌ Get tools failed:', error.message);
    return false;
  }
}

async function testQueryAccounts() {
  console.log('\n👥 Testing Query Accounts...');
  try {
    const response = await client.post('/api/tools/query_accounts', {
      accountName: 'Acme',
      limit: 5
    });
    
    if (response.data.success) {
      console.log('✅ Query accounts succeeded');
      console.log(`   Found ${response.data.totalSize} accounts`);
      if (response.data.records && response.data.records.length > 0) {
        console.log('   Sample account:', response.data.records[0].name);
      }
    } else {
      console.log('⚠️  Query returned no results or error:', response.data.error);
    }
    return true;
  } catch (error) {
    console.error('❌ Query accounts failed:', error.response?.data || error.message);
    return false;
  }
}

async function testQueryInvoices() {
  console.log('\n📄 Testing Query Invoices...');
  try {
    const response = await client.post('/api/tools/query_invoices', {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      limit: 10
    });
    
    if (response.data.success) {
      console.log('✅ Query invoices succeeded');
      console.log(`   Found ${response.data.totalSize} invoices`);
      if (response.data.records && response.data.records.length > 0) {
        const invoice = response.data.records[0];
        console.log(`   Sample invoice: ${invoice.invoiceNumber} - $${invoice.amount}`);
      }
    } else {
      console.log('⚠️  Query returned no results or error:', response.data.error);
    }
    return true;
  } catch (error) {
    console.error('❌ Query invoices failed:', error.response?.data || error.message);
    return false;
  }
}

async function testBillingSummary(accountId) {
  console.log('\n💰 Testing Billing Summary...');
  
  if (!accountId) {
    console.log('⚠️  Skipping billing summary test (no account ID provided)');
    return true;
  }
  
  try {
    const response = await client.post('/api/tools/get_billing_summary', {
      accountId: accountId,
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    });
    
    if (response.data.success) {
      console.log('✅ Billing summary succeeded');
      const summary = response.data.summary;
      console.log(`   Total Invoiced: $${summary.totalInvoiced}`);
      console.log(`   Total Paid: $${summary.totalPaid}`);
      console.log(`   Outstanding: $${summary.outstandingBalance}`);
    } else {
      console.log('⚠️  Query returned error:', response.data.error);
    }
    return true;
  } catch (error) {
    console.error('❌ Billing summary failed:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting MCP Server Tests...');
  console.log('=' .repeat(50));
  
  const results = [];
  
  results.push(await testHealthCheck());
  results.push(await testGetTools());
  results.push(await testQueryAccounts());
  results.push(await testQueryInvoices());
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results:');
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`   Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check Salesforce connection and credentials.');
  }
  
  console.log('\n💡 Next steps:');
  console.log('   1. Ensure Salesforce credentials are set in .env');
  console.log('   2. Deploy MCP server to accessible endpoint');
  console.log('   3. Configure Bedrock Agent with the server URL');
  console.log('   4. Test with Bedrock Agent console');
}

runAllTests().catch(console.error);
