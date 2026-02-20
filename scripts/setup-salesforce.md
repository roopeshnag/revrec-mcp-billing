# Salesforce Setup Guide

Step-by-step guide to configure Salesforce for the Billing Agent.

## Part 1: Create Custom Objects

### 1. Invoice Object (Invoice__c)

**Navigation:** Setup → Object Manager → Create → Custom Object

**Object Settings:**
```
Label: Invoice
Plural Label: Invoices
Object Name: Invoice__c
Record Name: Invoice Number
Data Type: Auto Number
Display Format: INV-{0000}
Starting Number: 1
```

**Custom Fields:**

1. **Invoice_Number__c** (Text)
   - Length: 50
   - Unique: Yes
   - External ID: Yes

2. **Account__c** (Lookup)
   - Related To: Account
   - Required: Yes

3. **Amount__c** (Currency)
   - Length: 16, Decimal Places: 2
   - Required: Yes

4. **Status__c** (Picklist)
   - Values: Draft, Pending, Paid, Overdue, Cancelled
   - Default: Draft

5. **Invoice_Date__c** (Date)
   - Required: Yes

6. **Due_Date__c** (Date)
   - Required: Yes

---

### 2. Usage Record Object (Usage_Record__c)

**Object Settings:**
```
Label: Usage Record
Plural Label: Usage Records
Object Name: Usage_Record__c
Record Name: Usage Record Number
Data Type: Auto Number
Display Format: USG-{00000}
```

**Custom Fields:**

1. **Account__c** (Lookup)
   - Related To: Account
   - Required: Yes

2. **Service_Type__c** (Picklist)
   - Values: GPT-4, GPT-3.5, Claude, Embeddings, Fine-tuning, Other
   - Required: Yes

3. **Usage_Amount__c** (Number)
   - Length: 18, Decimal Places: 2
   - Required: Yes

4. **Unit_Price__c** (Currency)
   - Length: 16, Decimal Places: 4

5. **Total_Cost__c** (Currency)
   - Length: 16, Decimal Places: 2
   - Formula: Usage_Amount__c * Unit_Price__c

6. **Usage_Date__c** (Date)
   - Required: Yes

---

### 3. Payment Object (Payment__c)

**Object Settings:**
```
Label: Payment
Plural Label: Payments
Object Name: Payment__c
Record Name: Payment Number
Data Type: Auto Number
Display Format: PAY-{00000}
```

**Custom Fields:**

1. **Payment_Number__c** (Text)
   - Length: 50
   - Unique: Yes
   - External ID: Yes

2. **Invoice__c** (Lookup)
   - Related To: Invoice__c
   - Required: Yes

3. **Account__c** (Lookup)
   - Related To: Account
   - Required: Yes

4. **Amount__c** (Currency)
   - Length: 16, Decimal Places: 2
   - Required: Yes

5. **Payment_Date__c** (Date)
   - Required: Yes

6. **Payment_Method__c** (Picklist)
   - Values: Credit Card, Bank Transfer, Check, PayPal, Other
   - Required: Yes

7. **Status__c** (Picklist)
   - Values: Completed, Pending, Failed, Refunded
   - Default: Pending

---

## Part 2: Create Connected App

### Step 1: Create Connected App

**Navigation:** Setup → Apps → App Manager → New Connected App

**Basic Information:**
```
Connected App Name: Bedrock Billing Agent
API Name: Bedrock_Billing_Agent
Contact Email: your-email@example.com
```

**API (Enable OAuth Settings):**
```
✅ Enable OAuth Settings
Callback URL: https://login.salesforce.com/services/oauth2/callback

Selected OAuth Scopes:
- Access and manage your data (api)
- Perform requests on your behalf at any time (refresh_token, offline_access)
- Full access (full)
```

### Step 2: Get Credentials

After saving:
1. Click "Manage Consumer Details"
2. Verify your identity
3. Copy **Consumer Key** (Client ID)
4. Copy **Consumer Secret** (Client Secret)

### Step 3: Get Security Token

**Navigation:** Personal Settings → Reset My Security Token

1. Click "Reset Security Token"
2. Check your email for the new token
3. Save this token securely

---

## Part 3: Create Sample Data

### Sample Accounts

```sql
// Create in Developer Console or Data Loader
Account acc1 = new Account(
    Name = 'Acme Corporation',
    Industry = 'Technology',
    BillingStreet = '123 Main St',
    BillingCity = 'San Francisco',
    BillingState = 'CA',
    BillingPostalCode = '94105',
    BillingCountry = 'USA'
);
insert acc1;

Account acc2 = new Account(
    Name = 'Global Tech Inc',
    Industry = 'Software',
    BillingStreet = '456 Tech Ave',
    BillingCity = 'Seattle',
    BillingState = 'WA',
    BillingPostalCode = '98101',
    BillingCountry = 'USA'
);
insert acc2;
```

### Sample Invoices

```sql
Invoice__c inv1 = new Invoice__c(
    Invoice_Number__c = 'INV-0001',
    Account__c = acc1.Id,
    Amount__c = 5000.00,
    Status__c = 'Paid',
    Invoice_Date__c = Date.today().addDays(-30),
    Due_Date__c = Date.today().addDays(-15)
);

Invoice__c inv2 = new Invoice__c(
    Invoice_Number__c = 'INV-0002',
    Account__c = acc1.Id,
    Amount__c = 3500.00,
    Status__c = 'Overdue',
    Invoice_Date__c = Date.today().addDays(-60),
    Due_Date__c = Date.today().addDays(-30)
);

insert new List<Invoice__c>{inv1, inv2};
```

### Sample Usage Records

```sql
Usage_Record__c usage1 = new Usage_Record__c(
    Account__c = acc1.Id,
    Service_Type__c = 'GPT-4',
    Usage_Amount__c = 1000000,
    Unit_Price__c = 0.03,
    Usage_Date__c = Date.today().addDays(-15)
);

Usage_Record__c usage2 = new Usage_Record__c(
    Account__c = acc1.Id,
    Service_Type__c = 'Claude',
    Usage_Amount__c = 500000,
    Unit_Price__c = 0.025,
    Usage_Date__c = Date.today().addDays(-10)
);

insert new List<Usage_Record__c>{usage1, usage2};
```

### Sample Payments

```sql
Payment__c pay1 = new Payment__c(
    Payment_Number__c = 'PAY-0001',
    Invoice__c = inv1.Id,
    Account__c = acc1.Id,
    Amount__c = 5000.00,
    Payment_Date__c = Date.today().addDays(-20),
    Payment_Method__c = 'Credit Card',
    Status__c = 'Completed'
);

insert pay1;
```

---

## Part 4: Set Permissions

### Create Permission Set

**Navigation:** Setup → Permission Sets → New

**Permission Set Settings:**
```
Label: Bedrock Agent Access
API Name: Bedrock_Agent_Access
```

**Object Permissions:**
- Invoice__c: Read, Create, Edit
- Usage_Record__c: Read, Create, Edit
- Payment__c: Read, Create, Edit
- Account: Read

**Assign to Integration User:**
1. Go to Permission Set
2. Click "Manage Assignments"
3. Add your integration user

---

## Part 5: Test Connection

### Using Workbench

1. Go to https://workbench.developerforce.com
2. Login with your credentials
3. Go to Queries → SOQL Query
4. Test queries:

```sql
SELECT Id, Name, Invoice_Number__c, Amount__c, Status__c 
FROM Invoice__c 
LIMIT 10

SELECT Id, Name, Account__r.Name, Service_Type__c, Total_Cost__c 
FROM Usage_Record__c 
LIMIT 10

SELECT Id, Name FROM Account LIMIT 10
```

---

## Part 6: Configure MCP Server

Update your `.env` file:

```bash
SALESFORCE_USERNAME=your-username@example.com
SALESFORCE_PASSWORD=your-password
SALESFORCE_SECURITY_TOKEN=your-security-token
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_CLIENT_ID=your-consumer-key
SALESFORCE_CLIENT_SECRET=your-consumer-secret
```

**For Sandbox:**
```bash
SALESFORCE_LOGIN_URL=https://test.salesforce.com
```

---

## Troubleshooting

### "INVALID_LOGIN" Error
- Check username and password
- Ensure security token is appended to password
- Verify login URL (production vs sandbox)

### "INSUFFICIENT_ACCESS" Error
- Check user permissions
- Verify permission set assignment
- Ensure API access is enabled

### "INVALID_FIELD" Error
- Verify custom field API names
- Check field-level security
- Ensure fields are accessible to user

---

## Next Steps

1. ✅ Test Salesforce connection from MCP server
2. ✅ Run sample queries
3. ✅ Verify data is returned correctly
4. ✅ Configure Bedrock Agent
5. ✅ Test end-to-end flow

---

**Salesforce Setup Complete! 🎉**
