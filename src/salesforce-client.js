import jsforce from 'jsforce';
import dotenv from 'dotenv';

dotenv.config();

class SalesforceClient {
  constructor() {
    this.conn = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected && this.conn) {
      return this.conn;
    }

    try {
      this.conn = new jsforce.Connection({
        loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com',
        version: '58.0'
      });

      const username = process.env.SALESFORCE_USERNAME;
      const password = process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_SECURITY_TOKEN;

      await this.conn.login(username, password);
      this.isConnected = true;
      
      console.log('✅ Connected to Salesforce successfully');
      return this.conn;
    } catch (error) {
      console.error('❌ Salesforce connection error:', error.message);
      throw new Error(`Failed to connect to Salesforce: ${error.message}`);
    }
  }

  async queryInvoices(params = {}) {
    await this.connect();

    const { accountId, startDate, endDate, status, limit = 100 } = params;
    
    let query = 'SELECT Id, Name, Invoice_Number__c, Account__c, Account__r.Name, Amount__c, Status__c, Invoice_Date__c, Due_Date__c, CreatedDate FROM Invoice__c';
    
    const conditions = [];
    
    if (accountId) {
      conditions.push(`Account__c = '${accountId}'`);
    }
    
    if (startDate) {
      conditions.push(`Invoice_Date__c >= ${startDate}`);
    }
    
    if (endDate) {
      conditions.push(`Invoice_Date__c <= ${endDate}`);
    }
    
    if (status) {
      conditions.push(`Status__c = '${status}'`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY Invoice_Date__c DESC LIMIT ${limit}`;

    try {
      const result = await this.conn.query(query);
      return {
        success: true,
        totalSize: result.totalSize,
        records: result.records.map(record => ({
          id: record.Id,
          invoiceNumber: record.Invoice_Number__c,
          accountId: record.Account__c,
          accountName: record.Account__r?.Name,
          amount: record.Amount__c,
          status: record.Status__c,
          invoiceDate: record.Invoice_Date__c,
          dueDate: record.Due_Date__c,
          createdDate: record.CreatedDate
        }))
      };
    } catch (error) {
      console.error('Query error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async queryAccounts(params = {}) {
    await this.connect();

    const { accountName, accountId, limit = 50 } = params;
    
    let query = 'SELECT Id, Name, BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry, Phone, Industry, AnnualRevenue, Type FROM Account';
    
    const conditions = [];
    
    if (accountId) {
      conditions.push(`Id = '${accountId}'`);
    }
    
    if (accountName) {
      conditions.push(`Name LIKE '%${accountName}%'`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY Name ASC LIMIT ${limit}`;

    try {
      const result = await this.conn.query(query);
      return {
        success: true,
        totalSize: result.totalSize,
        records: result.records.map(record => ({
          id: record.Id,
          name: record.Name,
          billingAddress: {
            street: record.BillingStreet,
            city: record.BillingCity,
            state: record.BillingState,
            postalCode: record.BillingPostalCode,
            country: record.BillingCountry
          },
          phone: record.Phone,
          industry: record.Industry,
          annualRevenue: record.AnnualRevenue,
          type: record.Type
        }))
      };
    } catch (error) {
      console.error('Query error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async queryUsageRecords(params = {}) {
    await this.connect();

    const { accountId, startDate, endDate, serviceType, limit = 100 } = params;
    
    let query = 'SELECT Id, Name, Account__c, Account__r.Name, Service_Type__c, Usage_Amount__c, Unit_Price__c, Total_Cost__c, Usage_Date__c, CreatedDate FROM Usage_Record__c';
    
    const conditions = [];
    
    if (accountId) {
      conditions.push(`Account__c = '${accountId}'`);
    }
    
    if (startDate) {
      conditions.push(`Usage_Date__c >= ${startDate}`);
    }
    
    if (endDate) {
      conditions.push(`Usage_Date__c <= ${endDate}`);
    }
    
    if (serviceType) {
      conditions.push(`Service_Type__c = '${serviceType}'`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY Usage_Date__c DESC LIMIT ${limit}`;

    try {
      const result = await this.conn.query(query);
      return {
        success: true,
        totalSize: result.totalSize,
        records: result.records.map(record => ({
          id: record.Id,
          name: record.Name,
          accountId: record.Account__c,
          accountName: record.Account__r?.Name,
          serviceType: record.Service_Type__c,
          usageAmount: record.Usage_Amount__c,
          unitPrice: record.Unit_Price__c,
          totalCost: record.Total_Cost__c,
          usageDate: record.Usage_Date__c,
          createdDate: record.CreatedDate
        }))
      };
    } catch (error) {
      console.error('Query error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async queryPayments(params = {}) {
    await this.connect();

    const { accountId, invoiceId, startDate, endDate, status, limit = 100 } = params;
    
    let query = 'SELECT Id, Name, Payment_Number__c, Invoice__c, Invoice__r.Invoice_Number__c, Account__c, Account__r.Name, Amount__c, Payment_Date__c, Payment_Method__c, Status__c, CreatedDate FROM Payment__c';
    
    const conditions = [];
    
    if (accountId) {
      conditions.push(`Account__c = '${accountId}'`);
    }
    
    if (invoiceId) {
      conditions.push(`Invoice__c = '${invoiceId}'`);
    }
    
    if (startDate) {
      conditions.push(`Payment_Date__c >= ${startDate}`);
    }
    
    if (endDate) {
      conditions.push(`Payment_Date__c <= ${endDate}`);
    }
    
    if (status) {
      conditions.push(`Status__c = '${status}'`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY Payment_Date__c DESC LIMIT ${limit}`;

    try {
      const result = await this.conn.query(query);
      return {
        success: true,
        totalSize: result.totalSize,
        records: result.records.map(record => ({
          id: record.Id,
          paymentNumber: record.Payment_Number__c,
          invoiceId: record.Invoice__c,
          invoiceNumber: record.Invoice__r?.Invoice_Number__c,
          accountId: record.Account__c,
          accountName: record.Account__r?.Name,
          amount: record.Amount__c,
          paymentDate: record.Payment_Date__c,
          paymentMethod: record.Payment_Method__c,
          status: record.Status__c,
          createdDate: record.CreatedDate
        }))
      };
    } catch (error) {
      console.error('Query error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getBillingSummary(params = {}) {
    await this.connect();

    const { accountId, startDate, endDate } = params;
    
    if (!accountId) {
      return {
        success: false,
        error: 'Account ID is required for billing summary'
      };
    }

    try {
      const invoicesPromise = this.queryInvoices({ accountId, startDate, endDate, limit: 1000 });
      const paymentsPromise = this.queryPayments({ accountId, startDate, endDate, limit: 1000 });
      const usagePromise = this.queryUsageRecords({ accountId, startDate, endDate, limit: 1000 });

      const [invoices, payments, usage] = await Promise.all([
        invoicesPromise,
        paymentsPromise,
        usagePromise
      ]);

      const totalInvoiced = invoices.records?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
      const totalPaid = payments.records?.reduce((sum, pay) => sum + (pay.amount || 0), 0) || 0;
      const totalUsage = usage.records?.reduce((sum, use) => sum + (use.totalCost || 0), 0) || 0;
      const outstandingBalance = totalInvoiced - totalPaid;

      return {
        success: true,
        summary: {
          accountId,
          period: { startDate, endDate },
          totalInvoiced,
          totalPaid,
          outstandingBalance,
          totalUsage,
          invoiceCount: invoices.totalSize || 0,
          paymentCount: payments.totalSize || 0,
          usageRecordCount: usage.totalSize || 0
        }
      };
    } catch (error) {
      console.error('Summary error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async disconnect() {
    if (this.conn) {
      await this.conn.logout();
      this.isConnected = false;
      console.log('Disconnected from Salesforce');
    }
  }
}

export default SalesforceClient;
