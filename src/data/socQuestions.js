export const SOC_QUESTIONS = [
  {
    id: "Q1",
    scenario: "A user reports a suspicious email claiming their Microsoft 365 password will expire today.",
    evidence: {
      email: {
        from: "security-update@microsoft365-support-login.com",
        to: "finance.team@company.com",
        subject: "Your password expires today",
        attachment: "Password_Reset_Form.html",
        url: "https://microsoft365-secure-login.com/reset",
        deliveryStatus: "Delivered",
      },
      proxy: null,
      edr: null,
    },
    classification: {
      options: {
        primary: [
          "Legitimate Email",
          "Phishing Attempt",
          "Spam & Junk",
          "Internal Communication",
          "Malware Delivery",
          "Security Notification",
        ],
        secondary: [
          "Credential Harvesting",
          "Malware Delivery",
          "Business Email Compromise",
          "User Awareness Test",
          "External Spam",
        ],
      },
      correct: {
        primary: "Phishing Attempt",
        secondary: "Credential Harvesting",
      },
    },
    splRules: {
      tasks: [
        {
          prompt: "Write an SPL query to investigate the phishing email. Identify the sender, recipients, and subject of the suspicious message.",
          required: ["index=email", "subject", "recipient", "sender", "url", "stats"],
          optional: [{ anyOf: ["values", "values()"] }, { anyOf: ["count", "count by"] }],
          blocked: ["delete", "outputlookup", "collect", "inputlookup"],
        },
      ],
    },
    feedback: {
      primaryCorrect: "Correct. The sender domain and credential-harvesting URL are clear phishing indicators.",
      primaryIncorrect: "Look at the sender domain and URL — they impersonate Microsoft but are not microsoft.com.",
      secondaryCorrect: "Correct. The HTML attachment and fake login page target credential harvesting.",
      secondaryIncorrect: "Consider whether the attacker is trying to steal credentials via a fake login page.",
    },
    investigation_context: {
      goal: "Identify phishing emails using password expiration themes",
      analyst_focus: [
        "Suspicious sender domains",
        "Credential harvesting URLs",
        "Impacted recipients",
        "Phishing campaign scope",
      ],
      expected_outcome: [
        "Identify affected users",
        "Block phishing URL",
        "Remove malicious emails",
        "Reset compromised credentials",
      ],
    },
    task_prompt: "Write an SPL query to find similar phishing emails and identify impacted recipients.",
    hints: [
      "Look at the sender domain and embedded URL — they impersonate Microsoft but are not microsoft.com. The HTML attachment is designed to capture credentials.",
      "Use stats with values() to collect recipients by sender and URL — this reveals the campaign scope across all affected users.",
    ],
  },
  {
    id: "Q2",
    scenario: "Multiple users have failed login attempts from the same external IP address within a short time window.",
    evidence: {
      email: null,
      proxy: {
        sourceIp: "45.22.18.91",
        failedAttempts: 350,
        usersTargeted: 25,
        timeWindow: "5 minutes",
        successfulLogins: 0,
      },
      edr: null,
    },
    classification: {
      options: {
        primary: [
          "Password Spraying",
          "Brute Force Attack",
          "VPN Failure",
          "Service Account Failure",
          "Normal Authentication Activity",
        ],
        secondary: [
          "Credential Access",
          "Initial Access",
          "External Reconnaissance",
          "Insider Activity",
        ],
      },
      correct: {
        primary: "Password Spraying",
        secondary: "Credential Access",
      },
    },
    splRules: {
      tasks: [
        {
          prompt: "Write an SPL query to identify the password spraying attack. Find failed authentication attempts grouped by source IP where the count exceeds 100 and more than 10 users were targeted.",
          required: ["index=auth", "action=failure", { anyOf: ["stats count", "stats dc(user)"] }, "dc(user)", "src_ip", { anyOf: ["where count", "by src_ip"] }],
          optional: ["count", { anyOf: ["targeted_users", "values(user)"] }],
          blocked: ["delete", "outputlookup", "collect", "inputlookup", "regdelete", "outputtext", "join", "append", "transaction", "sichart", "fields", "inputcsv", "outputcsv", "eval"],
        },
      ],
    },
    feedback: {
      primaryCorrect: "Correct. The high volume of failures across many users from a single IP is classic password spraying.",
      primaryIncorrect: "This is a password-spraying pattern — many users, few passwords, single source IP, all failures.",
      secondaryCorrect: "Correct. The attacker is attempting to gain credential access through password spraying.",
      secondaryIncorrect: "Consider what the attacker gains from enumerating valid credentials across multiple accounts.",
    },
    investigation_context: {
      goal: "Detect password spraying activity targeting multiple users",
      analyst_focus: [
        "Failed login spikes",
        "Single source IP",
        "Multiple targeted accounts",
        "Authentication anomalies",
      ],
      expected_outcome: [
        "Block attacker IP",
        "Enable MFA",
        "Investigate compromised accounts",
      ],
    },
    task_prompt: "Write an SPL query to identify password spraying attempts from external IP addresses.",
    hints: [
      "Focus on the single external IP and the number of distinct users targeted — password spraying hits many accounts with few passwords to avoid lockouts.",
      "Use stats with dc(user) to count distinct users by source IP, then apply a threshold to separate malicious spraying from normal failed logins.",
    ],
  },
  {
    id: "Q3",
    scenario: "An external sender delivered an invoice email with an ISO attachment to the accounts team.",
    evidence: {
      email: {
        from: "billing@invoice-payment-secure.com",
        to: "accounts@company.com",
        subject: "Invoice Payment Required Immediately",
        attachment: "invoice.iso",
        url: null,
        deliveryStatus: "Delivered",
      },
      proxy: null,
      edr: null,
    },
    classification: {
      options: {
        primary: [
          "Legitimate Invoice",
          "Malware Delivery",
          "Spam & Junk",
          "Internal Communication",
          "Vendor Notification",
        ],
        secondary: [
          "Initial Access",
          "Phishing",
          "Malware Infection",
          "Credential Theft",
        ],
      },
      correct: {
        primary: "Malware Delivery",
        secondary: "Initial Access",
      },
    },
    splRules: {
      tasks: [
        {
          prompt: "Write an SPL query to identify the malware delivery attempt. Find emails with ISO attachments and list senders, recipients, and subjects.",
          required: ["index=email", "attachment", ".iso", "stats", "sender", "recipient"],
          optional: ["subject", { anyOf: ["count", "count by"] }],
          blocked: ["delete", "outputlookup", "collect", "inputlookup", "regdelete", "outputtext", "join", "append", "transaction", "fields", "inputcsv", "eval", "where"],
        },
      ],
    },
    feedback: {
      primaryCorrect: "Correct. ISO attachments are commonly used to deliver malware because they bypass attachment filters.",
      primaryIncorrect: "ISO attachments are a known malware delivery vector — they contain disk images that can mount and execute payloads.",
      secondaryCorrect: "Correct. The attacker is using the malware attachment to gain initial access to the environment.",
      secondaryIncorrect: "This technique is about gaining a foothold. What stage of the attack chain does that represent?",
    },
    investigation_context: {
      goal: "Identify malware delivery attempts using ISO attachments",
      analyst_focus: [
        "Suspicious attachments",
        "External senders",
        "Impacted recipients",
        "Malware delivery patterns",
      ],
      expected_outcome: [
        "Quarantine malicious emails",
        "Scan endpoints for execution",
        "Block sender domains",
      ],
    },
    task_prompt: "Write an SPL query to identify emails delivering suspicious ISO attachments.",
    hints: [
      "ISO files are often used to bypass email attachment filters — the file extension is the key indicator that distinguishes this from a legitimate invoice.",
      "Use stats to group emails by sender and attachment name — this identifies the delivery campaign and impacted recipients.",
    ],
  },
  {
    id: "Q4",
    scenario: "A finance manager received an urgent wire transfer request appearing to come from the CEO.",
    evidence: {
      email: {
        from: "ceo-finance@company-executive.com",
        to: "finance.manager@company.com",
        subject: "Urgent Vendor Payment Needed",
        attachment: null,
        url: null,
        deliveryStatus: "Delivered",
        displayName: "John Matthews (CEO)",
        body: "Hi,\n\nI need this payment processed urgently before the end of the day.\n\nI am currently in meetings and unavailable by phone.\n\nPlease confirm once completed.\n\nRegards,\nJohn",
        request: "Transfer $48,500 immediately",
      },
      proxy: null,
      edr: null,
    },
    classification: {
      options: {
        primary: [
          "Legitimate Executive Request",
          "Business Email Compromise",
          "Spam & Junk",
          "Vendor Communication",
          "Internal Communication",
          "Phishing Attempt",
        ],
        secondary: [
          "Financial Fraud",
          "Credential Harvesting",
          "Social Engineering",
          "Initial Access",
          "Vendor Impersonation",
        ],
      },
      correct: {
        primary: "Business Email Compromise",
        secondary: "Financial Fraud",
      },
    },
    splRules: {
      tasks: [
        {
          prompt: "Write an SPL query to identify executive impersonation attempts. Find emails with payment or wire transfer keywords and list recipients by sender and display name.",
          required: ["index=email", "subject", { anyOf: ["payment", "payment wire"] }, "sender", "display_name", "stats", "recipient"],
          optional: [{ anyOf: ["values", "values()"] }, "count"],
          blocked: ["delete", "outputlookup", "collect", "inputlookup", "regdelete", "outputtext", "join", "append", "transaction", "fields", "inputcsv", "eval"],
        },
        {
          prompt: "Write an advanced SPL query to find all emails where the display name matches executives but the sender domain is external to the company.",
          required: ["index=email", "eval", { anyOf: ["match(sender", "match()"] }, "sender", "display_name", "where", "external_sender"],
          optional: ["search", "values"],
          blocked: ["delete", "outputlookup", "collect", "inputlookup", "regdelete", "outputtext", "join", "append", "fields", "inputcsv", "stats", "transaction"],
        },
      ],
    },
    feedback: {
      primaryCorrect: "Correct. The spoofed CEO domain, urgency, request for secrecy, and wire transfer amount are classic BEC indicators.",
      primaryIncorrect: "Consider whether the sender domain matches the CEO's real corporate domain, and examine the urgency and payment request.",
      secondaryCorrect: "Correct. The attacker is targeting a financial payout, making this financial fraud.",
      secondaryIncorrect: "This attack has a direct financial objective. What category of fraud involves urgent wire transfers?",
    },
    investigation_context: {
      goal: "Detect executive impersonation and wire fraud attempts",
      analyst_focus: [
        "Lookalike domains",
        "Urgent payment requests",
        "Executive impersonation",
        "External senders",
      ],
      expected_outcome: [
        "Prevent wire fraud",
        "Warn finance teams",
        "Block impersonation domains",
      ],
    },
    task_prompt: "Write an SPL query to identify executive impersonation attempts and financial fraud emails.",
    hints: [
      "Compare the sender domain with the company's real corporate domain — lookalike domains with subtle typos are the main BEC indicator.",
      "Use eval with match() to tag senders as internal or external, then filter for display names matching executive roles like CEO or Finance.",
    ],
  },
  {
    id: "Q5a",
    scenario: "A user clicked a link in a phishing email, downloaded a ZIP file, and the endpoint now shows signs of compromise.",
    evidence: {
      email: {
        from: "secure-documents@sharepoint-online365.com",
        to: "employee@company.com",
        subject: "Shared Secure Document",
        url: "https://sharepoint-secure-files.com/login",
        deliveryStatus: "Delivered",
      },
      proxy: {
        user: "employee@company.com",
        destDomain: "sharepoint-secure-files.com",
        action: "URL Accessed",
        fileDownloaded: "update_document.zip",
      },
      edr: {
        host: "EMP-LAPTOP-77",
        process: "update.exe",
        networkConnection: "185.199.220.15",
        alert: "Suspicious Process Injection Detected",
      },
    },
    classification: {
      options: {
        primary: [
          "Phishing Campaign",
          "Malware Infection",
          "Legitimate File Share",
          "User Awareness Test",
          "Internal Communication",
          "Software Installation",
        ],
        secondary: [
          "Initial Access",
          "Malware Execution",
          "Command & Control",
          "Credential Harvesting",
          "Persistence",
        ],
      },
      correct: {
        primary: "Malware Infection",
        secondary: ["Initial Access", "Malware Execution"],
      },
    },
    splRules: {
      tasks: [
        {
          prompt: "Write an SPL query to correlate email, proxy, and EDR logs for the affected user. Show all data sources and collected artifacts.",
          required: ["index=email", "index=proxy", "index=edr", "stats", "user", "process_name", "by user"],
          optional: [{ anyOf: ["dest_domain", "destination_domain"] }, { anyOf: ["file_name", "file"] }, { anyOf: ["values", "values()"] }, "host"],
          blocked: ["delete", "outputlookup", "collect", "inputlookup", "regdelete", "outputtext", "join", "append", "transaction", "fields", "inputcsv", "eval", "where"],
        },
      ],
    },
    feedback: {
      primaryCorrect: "Correct. The phishing email, proxy access, file download, and EDR injection alert confirm a malware infection.",
      primaryIncorrect: "Look at the full chain: phishing email → URL click → ZIP download → process injection. That is an infection.",
      secondaryCorrect: "Correct. The attacker used the email to gain initial access, then executed malware on the endpoint.",
      secondaryIncorrect: "Two stages are involved: how the attacker got in, and what happened after. Both need to be identified.",
    },
    investigation_context: {
      goal: "Correlate multi-stage attack activity across email, proxy, and EDR logs",
      analyst_focus: [
        "Phishing delivery",
        "Malicious URL access",
        "Payload download",
        "Process execution",
        "Outbound connections",
      ],
      expected_outcome: [
        "Confirm endpoint compromise",
        "Isolate infected host",
        "Contain malware spread",
      ],
    },
    task_prompt: "Write an SPL query to correlate email, proxy, and EDR logs for the affected user to confirm the full attack chain.",
    hints: [
      "This investigation spans three log sources — email delivery, proxy access, and EDR alerts. You need all three to see the complete attack chain.",
      "Use stats with values() to collect evidence fields from multiple indexes into a single view grouped by user and host.",
    ],
  },
  {
    id: "Q5b",
    scenario: "Using the same email, proxy, and EDR evidence, identify all users who received the phishing email, clicked the URL, downloaded the payload, and executed the malware.",
    evidence: {
      email: {
        from: "secure-documents@sharepoint-online365.com",
        to: "employee@company.com",
        subject: "Shared Secure Document",
        url: "https://sharepoint-secure-files.com/login",
        deliveryStatus: "Delivered",
      },
      proxy: {
        user: "employee@company.com",
        destDomain: "sharepoint-secure-files.com",
        action: "URL Accessed",
        fileDownloaded: "update_document.zip",
      },
      edr: {
        host: "EMP-LAPTOP-77",
        process: "update.exe",
        networkConnection: "185.199.220.15",
        alert: "Suspicious Process Injection Detected",
      },
    },
    classification: null,
    splRules: {
      tasks: [
        {
          prompt: "Write an advanced SPL query to trace the full kill chain. Find all users who received the phishing email, accessed the URL, downloaded the file, and executed the payload.",
          required: ["index=email", "index=proxy", "index=edr", "stats", "process_name", "file_name", "user", "by user"],
          optional: ["url", { anyOf: ["dest_domain", "destination_domain"] }, { anyOf: ["values", "values()"] }, "host", { anyOf: ["search", "search process_name"] }],
          blocked: ["delete", "outputlookup", "collect", "inputlookup", "regdelete", "outputtext", "join", "append", "transaction", "fields", "inputcsv", "eval", "where"],
        },
      ],
    },
    feedback: {
      primaryCorrect: null,
      primaryIncorrect: null,
      secondaryCorrect: null,
      secondaryIncorrect: null,
    },
    investigation_context: {
      goal: "Correlate multi-stage attack activity across email, proxy, and EDR logs",
      analyst_focus: [
        "Phishing delivery",
        "Malicious URL access",
        "Payload download",
        "Process execution",
        "Outbound connections",
      ],
      expected_outcome: [
        "Confirm endpoint compromise",
        "Isolate infected host",
        "Contain malware spread",
      ],
    },
    task_prompt: "Write an advanced SPL query to trace the full kill chain and find all users who progressed from phishing email to malware execution.",
    hints: [
      "Focus on the final execution stage — the process name update.exe is the key indicator that separates compromised hosts from those that only received the email.",
      "Start with a query that correlates all three log sources, then use search to filter specifically for the executed process name.",
    ],
  },
];
