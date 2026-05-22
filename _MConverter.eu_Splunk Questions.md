**Full question format**

# Question 1: Phishing email investigation

**Scenario:**\
A user reports a suspicious email claiming their Microsoft 365 password will expire today.

**Visible evidence:**

FROM: security-update@microsoft365-support-login.com\
TO: finance.team@company.com\
SUBJECT: Your password expires today\
ATTACHMENT: Password_Reset_Form.html\
URL: https://microsoft365-secure-login.com/reset\
DELIVERY STATUS: Delivered

**Primary classification options:**

- Legitimate Email

- Phishing Attempt

- Spam & Junk

- Internal Communication

- Malware Delivery

- Security Notification

**Secondary diagnosis options:**

- Credential Harvesting

- Malware Delivery

- Business Email Compromise

- User Awareness Test

- External Spam

**Correct answer:**

Primary: Phishing Attempt\
Secondary: Credential Harvesting

**Expected SPL:**

index=email subject=\"\*password expires\*\"\
\| stats values(recipient) as recipients count by sender subject url

**Validation keywords:**

index=email\
subject\
recipient\
sender\
url\
stats

# Question 2: Password spraying

**Scenario:**\
Multiple users have failed login attempts from the same external IP.

**Visible evidence:**

SOURCE IP: 45.22.18.91\
FAILED ATTEMPTS: 350\
USERS TARGETED: 25\
TIME WINDOW: 5 minutes\
SUCCESSFUL LOGINS: 0

**Primary classification options:**

- Password Spraying

- Brute Force Attack

- VPN Failure

- Service Account Failure

- Normal Authentication Activity

**Secondary diagnosis options:**

- Credential Access

- Initial Access

- External Reconnaissance

- Insider Activity

**Correct answer:**

Primary: Password Spraying\
Secondary: Credential Access

**Expected SPL:**

index=auth action=failure\
\| stats count dc(user) as targeted_users by src_ip\
\| where count \> 100 AND targeted_users \> 10

**Validation keywords:**

index=auth\
action=failure\
stats\
dc(user)\
src_ip\
where

# Question 3: Malware attachment delivery

**Scenario:**\
An external sender delivered an invoice email with an ISO attachment.

**Visible evidence:**

FROM: billing@invoice-payment-secure.com\
TO: accounts@company.com\
SUBJECT: Invoice Payment Required Immediately\
ATTACHMENT: invoice.iso\
DELIVERY STATUS: Delivered

**Primary classification options:**

- Legitimate Invoice

- Malware Delivery

- Spam & Junk

- Internal Communication

- Vendor Notification

**Secondary diagnosis options:**

- Initial Access

- Phishing

- Malware Infection

- Credential Theft

**Correct answer:**

Primary: Malware Delivery\
Secondary: Initial Access

**Expected SPL:**

index=email attachment=\"\*.iso\"\
\| stats count by sender recipient subject attachment

**Validation keywords:**

index=email\
attachment\
.iso\
stats\
sender\
recipient

# Question 4--- Business Email Compromise (BEC) Investigation

**INCOMING MESSAGE**

CEO Requesting Urgent Wire Transfer

**EMAIL DETAILS**

FROM:\
ceo-finance@company-executive.com\
\
DISPLAY NAME:\
John Matthews (CEO)\
\
TO:\
finance.manager@company.com\
\
SUBJECT:\
Urgent Vendor Payment Needed\
\
REQUEST:\
Transfer \$48,500 immediately\
\
DELIVERY STATUS:\
Delivered

**MESSAGE BODY**

Hi,\
\
I need this payment processed urgently before the end of the day.\
\
I am currently in meetings and unavailable by phone.\
\
Please confirm once completed.\
\
Regards,\
John

**PRIMARY CLASSIFICATION**

- Legitimate Executive Request

- Business Email Compromise

- Spam & Junk

- Vendor Communication

- Internal Communication

- Phishing Attempt

**SECONDARY DIAGNOSIS**

- Financial Fraud

- Credential Harvesting

- Social Engineering

- Initial Access

- Vendor Impersonation

**CLUES**

1.  Sender domain differs from corporate domain

2.  High urgency financial request

3.  Requests secrecy and avoids phone verification

4.  Domain impersonates executive identity

**CORRECT ANSWER**

Primary: Business Email Compromise\
Secondary: Financial Fraud

**INVESTIGATION TASK**

Determine whether similar emails were sent to other employees.

**SPLUNK TASK**

Write a query to identify executive impersonation attempts.

Expected:

index=email\
\| search subject=\"\*payment\*\" OR subject=\"\*wire transfer\*\"\
\| stats count values(recipient) by sender display_name subject

**ADVANCED SPL TASK**

Find all emails where display name matches executives but sender domain is external.

Expected:

index=email\
\| eval external_sender=if(match(sender,\"@company.com\"),\"No\",\"Yes\")\
\| where external_sender=\"Yes\"\
\| search display_name=\"\*CEO\*\" OR display_name=\"\*Finance\*\"

**VALIDATION KEYWORDS**

index=email\
subject\
payment\
wire transfer\
sender\
display_name\
stats\
recipient

# Question 8 --- Multi-Stage Attack Correlation Investigation {#question-8-multi-stage-attack-correlation-investigation}

**INCOMING ALERT**

User Clicked Suspicious Email URL Followed by Malware Detection

**EMAIL DETAILS**

FROM:\
secure-documents@sharepoint-online365.com\
\
TO:\
employee@company.com\
\
SUBJECT:\
Shared Secure Document\
\
URL CLICKED:\
https://sharepoint-secure-files.com/login\
\
DELIVERY STATUS:\
Delivered

**PROXY LOG DETAILS**

USER:\
employee@company.com\
\
DESTINATION DOMAIN:\
sharepoint-secure-files.com\
\
ACTION:\
URL Accessed\
\
FILE DOWNLOADED:\
update_document.zip

**EDR ALERT DETAILS**

HOST:\
EMP-LAPTOP-77\
\
PROCESS:\
update.exe\
\
NETWORK CONNECTION:\
185.199.220.15\
\
ALERT:\
Suspicious Process Injection Detected

------------------------------------------------------------------------

**PRIMARY CLASSIFICATION**

- Phishing Campaign

- Malware Infection

- Legitimate File Share

- User Awareness Test

- Internal Communication

- Software Installation

**SECONDARY DIAGNOSIS**

- Initial Access

- Malware Execution

- Command & Control

- Credential Harvesting

- Persistence

**CLUES**

1.  Fake SharePoint domain detected

2.  User clicked external URL

3.  ZIP file downloaded from suspicious domain

4.  Endpoint initiated outbound connection after execution

5.  Process injection activity observed in EDR

**INVESTIGATION TASK**

Correlate:

- Email delivery

- URL click activity

- File download

- Endpoint execution

- Outbound network connection

Determine whether the endpoint is compromised.

**CORRECT ANSWER**

Primary: Malware Infection\
Secondary: Initial Access + Malware Execution

**SPLUNK TASK**

Write a query to correlate email, proxy, and EDR logs for this user.

Expected:

(index=email OR index=proxy OR index=edr)\
user=\"employee@company.com\"\
\| stats values(index) values(sender) values(dest_domain)\
values(file_name) values(process_name) by user host

**ADVANCED SPL TASK**

Identify all users who:

- Received the phishing email

- Clicked the URL

- Downloaded the payload

- Executed the malware

Expected:

(index=email OR index=proxy OR index=edr)\
\| stats values(index) values(url) values(file_name)\
values(process_name) by user\
\| search process_name=\"update.exe\"

**RESPONSE VALIDATION LOGIC**

**Classification Validation**

{\
\"primary_answer\": \"Malware Infection\",\
\"secondary_answers\": \[\
\"Initial Access\",\
\"Malware Execution\"\
\]\
}

**SPL Validation Keywords**

{\
\"required_terms\": \[\
\"index=email\",\
\"index=proxy\",\
\"index=edr\",\
\"stats\",\
\"user\",\
\"process_name\"\
\],\
\"optional_terms\": \[\
\"dest_domain\",\
\"file_name\",\
\"values\",\
\"host\"\
\]\
}

# Sample SPL query validation

Validate the SPL using required keywords instead of exact match.

Example:

{\
\"question_id\": \"Q1\",\
\"required_terms\": \[\
\"index=email\",\
\"subject\",\
\"recipient\",\
\"sender\",\
\"stats\"\
\],\
\"optional_terms\": \[\
\"url\",\
\"values\",\
\"count\"\
\],\
\"blocked_terms\": \[\
\"delete\",\
\"outputlookup\",\
\"collect\"\
\]\
}
