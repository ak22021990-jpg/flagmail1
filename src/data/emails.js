export const EMAIL_POOL = [
  {
    id: "E003",
    zone: 1,
    fromName: "Netflix",
    from: "billing@netflix.com",
    sender: "billing@netflix.com",
    replyTo: "billing@netflix.com",
    subject: "Your Netflix membership renewal for March 2026",
    auth: { spf: "Pass", dkim: "Pass", dmarc: "Pass" },
    originIp: "54.171.145.23 (US)",
    userContext: "You have an active Netflix Standard plan billed monthly.",
    body: `Hi,

Your Netflix Standard plan has been renewed successfully.

Plan: Standard (1080p)
Amount charged: $15.49
Billing date: March 14, 2026
Next billing date: April 14, 2026

You can review billing details or update your payment method at netflix.com/account.

- The Netflix Team`,
    clues: [
      "The sender, reply-to, and visible brand all match netflix.com",
      "It references a normal subscription renewal and a realistic billing amount",
      "No urgency, threats, or request to send information by email",
      "The call to action stays on netflix.com/account",
    ],
    giveawayPhrase: "You can review billing details or update your payment method at netflix.com/account.",
    level1: "Legitimate",
    level2: "Subscription Billing",
    explanation: "This is a routine Netflix billing email. The sender domain, brand, pricing, and on-domain account path all line up, and nothing in the message pressures the user to act unsafely.",
    reasoningQuestion: "What is the strongest reason this should be tagged Legitimate?",
    reasoningOptions: [
      "The sender and account link both stay on netflix.com",
      "The message mentions the next billing date",
      "The email is short and easy to read",
      "The plan name includes 1080p",
    ],
    correctReason: 0,
  },
  {
    id: "E001",
    zone: 1,
    fromName: "Orange Support",
    from: "security-alert@orange-id-support.net",
    sender: "security-alert@orange-id-support.net",
    replyTo: "unlock@orange-id-support.net",
    subject: "Your Orange ID has been LOCKED - verify in 24 HOURS",
    auth: { spf: "Fail", dkim: "Fail", dmarc: "Fail" },
    originIp: "185.220.101.42 (RU)",
    userContext: null,
    body: `Dear Orange User,

We found unusual sign in attempts on your Orange ID and have LOCKED your account for safety.

If you do not confirm your identity in 24 HOURS, your account will be closed and all photos, purchases, and backups may be removed forever.

Click below now to unlock:
[ UNLOCK MY ORANGE ID ]
orange-id-support.net/unlock

Orange Security Department`,
    clues: [
      "orange-id-support.net is not Orange's real orange.com domain",
      "The email uses all-caps urgency like LOCKED and HOURS",
      "It threatens permanent loss of photos and purchases to create panic",
      "Orange does not ask users to unlock accounts through a third-party domain",
    ],
    giveawayPhrase: "your account will be closed and all photos, purchases, and backups may be removed forever",
    level1: "Phishing & Spoofing",
    level2: "Email Phishing",
    explanation: "This is a straightforward Orange phishing email. The fake domain, panic language, and threat of irreversible data loss are classic credential-harvesting signs.",
    reasoningQuestion: "What is the single clearest phishing signal here?",
    reasoningOptions: [
      "The sender domain is orange-id-support.net instead of orange.com",
      "The email mentions unusual sign-in attempts",
      "The message says the account is locked",
      "The email asks you to click a button",
    ],
    correctReason: 0,
  },
  {
    id: "E004",
    zone: 1,
    fromName: "Best Buy Deals",
    from: "promo@bestbuy-superclearance.com",
    sender: "promo@bestbuy-superclearance.com",
    replyTo: "deals@bestbuy-superclearance.com",
    subject: "Flash sale: 90% off TVs, Android phones, and Windows PCs today",
    auth: { spf: "Fail", dkim: "Fail", dmarc: "Fail" },
    originIp: "91.109.4.28 (NL)",
    userContext: null,
    body: `Hi Shopper,

For the next 6 hours only, every top brand product is 90% OFF.

Android phone Pro - now $119
Windows PC Pro 16 - now $249
Samsung 65 inch TV - now $89

Shop now before stock is gone forever:
bestbuy-superclearance.com/today

Unsubscribe: bestbuy-superclearance.com/unsubscribe`,
    clues: [
      "The discounts are unrealistic for current electronics",
      "The domain is not bestbuy.com",
      "The 6-hour countdown is meant to stop careful thinking",
      "Even the unsubscribe path stays on the fake domain",
    ],
    giveawayPhrase: "Android phone Pro - now $119",
    level1: "Spam & Junk",
    level2: "Bulk Marketing Spam",
    explanation: "This is mass retail spam using impossible discounts and a fake branded domain. It is unsolicited junk, not a legitimate sales campaign from Best Buy.",
    reasoningQuestion: "Why does this belong in Spam & Junk rather than Legitimate promotions?",
    reasoningOptions: [
      "It uses impossible pricing and a fake retail domain",
      "It contains an unsubscribe link",
      "It lists several products in one email",
      "It says the sale lasts 6 hours",
    ],
    correctReason: 0,
  },
  {
    id: "E017",
    zone: 1,
    fromName: "Chase Rewards",
    from: "bonus@chase-bonus-center.com",
    sender: "bonus@chase-bonus-center.com",
    replyTo: "claims@chase-bonus-center.com",
    subject: "Chase Sapphire bonus: claim your $500 reward now",
    auth: { spf: "Fail", dkim: "Fail", dmarc: "Fail" },
    originIp: "103.75.190.12 (CN)",
    userContext: null,
    body: `Dear Cardmember,

Congratulations. Your Chase Sapphire account has been selected for a $500 loyalty reward.

To receive the bonus today, sign in and confirm your full card number, expiration date, and CVV:
chase-bonus-center.com/sapphire

This reward expires in 24 hours and cannot be reissued.

Chase Rewards Team`,
    clues: [
      "The sender domain is not chase.com",
      "It asks for full card details including CVV, which banks do not request by email",
      "The 24-hour expiry is artificial pressure",
      "A surprise reward is used as bait to collect financial data",
    ],
    giveawayPhrase: "confirm your full card number, expiration date, and CVV",
    level1: "Phishing & Spoofing",
    level2: "Email Phishing",
    explanation: "This is payment-card phishing disguised as a rewards email. The fake Chase domain and request for full card details make the malicious intent obvious.",
    reasoningQuestion: "Which detail most strongly confirms this is phishing?",
    reasoningOptions: [
      "It asks for the full card number and CVV through a non-Chase domain",
      "It promises a $500 reward",
      "It mentions Chase Sapphire by name",
      "It gives a 24-hour deadline",
    ],
    correctReason: 0,
  },
  {
    id: "E015",
    zone: 1,
    fromName: "Global Prize Awards",
    from: "winner@global-prize-awards.xyz",
    sender: "winner@global-prize-awards.xyz",
    replyTo: "claims@global-prize-awards.xyz",
    subject: "You won $5,000 - send your release fee to claim today",
    auth: { spf: "Fail", dkim: "Fail", dmarc: "Fail" },
    originIp: "41.185.28.7 (NG)",
    userContext: null,
    body: `CONGRATULATIONS!!!

Your email was picked as the GRAND WINNER of our international cash draw.

Prize amount: $5,000
To release the funds today, send a processing fee of $49.99 and reply with your home address, date of birth, and bank details.

Failure to respond within 48 hours means the prize will be given to another person.

Prize Desk`,
    clues: [
      "Legitimate prizes do not require a processing fee",
      "It asks for bank details and identity information in the same message",
      "The .xyz sender domain is not tied to a real recognisable company",
      "The message pressures the user with a short expiry window",
    ],
    giveawayPhrase: "send a processing fee of $49.99",
    level1: "High-Risk Fraud",
    level2: "Advance Fee Fraud",
    explanation: "This is a classic advance-fee scam. The attacker promises money, then asks for payment and sensitive data before the victim receives anything.",
    reasoningQuestion: "Why is this tagged High-Risk Fraud instead of simple spam?",
    reasoningOptions: [
      "It asks the victim to pay money and share bank details to get the prize",
      "It uses all caps and exclamation marks",
      "It says the prize expires in 48 hours",
      "It mentions an international cash draw",
    ],
    correctReason: 0,
  },
  {
    id: "E031",
    zone: 2,
    fromName: "Orange",
    from: "noreply@orange.com",
    sender: "noreply@orange.com",
    replyTo: "noreply@orange.com",
    subject: "Your receipt from the Orange Store",
    auth: { spf: "Pass", dkim: "Pass", dmarc: "Pass" },
    originIp: "17.58.36.14 (US)",
    userContext: "You recently bought a VPN app from the Orange Store.",
    body: `Dear Customer,

Thank you for your purchase.

App: ProVPN - Secure and Fast
Developer: SecureApps Ltd
Amount: $4.99
Order ID: MG4B2K9R7X
Date: March 14, 2026

If you did not authorize this purchase, you can report a problem at reportaproblem.orange.com.

Orange`,
    clues: [
      "The sender and support path both use official orange.com domains",
      "The email includes a plausible order ID and normal store receipt details",
      "It does not ask for passwords, card numbers, or verification uploads",
      "reportaproblem.orange.com is Orange's real purchase-support flow",
    ],
    giveawayPhrase: "report a problem at reportaproblem.orange.com",
    level1: "Legitimate",
    level2: "Subscription Billing",
    explanation: "This is a normal Orange Store receipt. The message contains realistic transaction details and directs the user to Orange's official purchase-support domain.",
    reasoningQuestion: "What makes this a legitimate billing email?",
    reasoningOptions: [
      "The purchase details and support path both stay on orange.com",
      "The total charge is small",
      "The email says thank you for your purchase",
      "It includes an order ID",
    ],
    correctReason: 0,
  },
  {
    id: "E032",
    zone: 2,
    fromName: "Wells Fargo Alerts",
    from: "alerts@wellsfargo.com",
    sender: "alerts@wellsfargo.com",
    replyTo: "alerts@wellsfargo.com",
    subject: "Unusual activity detected on your Wells Fargo account",
    auth: { spf: "Pass", dkim: "Pass", dmarc: "Pass" },
    originIp: "18.211.142.72 (US)",
    userContext: "You had three failed PIN attempts on your debit card this morning.",
    body: `We noticed unusual activity and temporarily placed a hold on outgoing transactions as a precaution.

Account: Checking (...7291)
Activity flagged: 3 consecutive failed PIN attempts
Date: March 14, 2026

To review the alert, sign in through wellsfargo.com or call the number on the back of your card.

For your security, do not share your PIN, password, or one-time passcode with anyone, including Wells Fargo employees.

Wells Fargo Bank, N.A.`,
    clues: [
      "The sender is on the expected wellsfargo.com domain",
      "The guidance tells the user to go to the bank site directly or call the physical card number",
      "It explicitly warns against sharing secrets, which is consistent with real fraud alerts",
      "The alert matches the user's known activity context",
    ],
    giveawayPhrase: "do not share your PIN, password, or one-time passcode with anyone",
    level1: "Legitimate",
    level2: "Bank / Financial Notification",
    explanation: "This is a credible bank fraud alert. The sender domain, on-domain guidance, and advice to use the card's physical phone number all match a legitimate Wells Fargo notification.",
    reasoningQuestion: "What is the strongest legitimacy signal in this email?",
    reasoningOptions: [
      "It tells you to go directly to wellsfargo.com or the phone number on your card",
      "It mentions failed PIN attempts",
      "It says outgoing transactions were placed on hold",
      "It uses formal bank language",
    ],
    correctReason: 0,
  },
  {
    id: "E026",
    zone: 2,
    fromName: "DocuSign",
    from: "documents@docusign-secure-portal.com",
    sender: "documents@docusign-secure-portal.com",
    replyTo: "documents@docusign-secure-portal.com",
    subject: "Document ready for signature: NDA - Service Agreement 2026",
    auth: { spf: "Pass", dkim: "Pass", dmarc: "Pass" },
    originIp: "44.210.18.63 (US)",
    userContext: "You were not expecting any NDA from James Harrington this week.",
    body: `You have a document waiting for your electronic signature.

Document title: NDA - Service Agreement 2026
Sent by: James Harrington (james.harrington@partnerfirm.com)
Expires: March 21, 2026

Review and sign:
docusign-secure-portal.com/sign/NDA2026

If this was not expected, contact the sender directly before opening.`,
    clues: [
      "The sender domain only looks like DocuSign; it is not docusign.com",
      "Authentication can pass for an attacker's own domain, so Pass is not enough",
      "The user context says the document was unexpected",
      "The message is polished, which makes the wrong domain the decisive clue",
    ],
    giveawayPhrase: "docusign-secure-portal.com/sign/NDA2026",
    level1: "Phishing & Spoofing",
    level2: "Email Phishing",
    explanation: "This is a medium-difficulty DocuSign phish. The email is professionally written and even passes auth for its own domain, but the sender domain is still not docusign.com.",
    reasoningQuestion: "What is the most important reason to reject this email?",
    reasoningOptions: [
      "The signing link is on docusign-secure-portal.com, not docusign.com",
      "The document expires on March 21, 2026",
      "It says to contact the sender directly",
      "The subject contains NDA",
    ],
    correctReason: 0,
  },
  {
    id: "E029",
    zone: 2,
    fromName: "People Operations",
    from: "hr@techcorp-review.com",
    sender: "hr@techcorp-review.com",
    replyTo: "hr@techcorp-review.com",
    subject: "Confidential: your Q4 performance review is ready",
    auth: { spf: "Pass", dkim: "Pass", dmarc: "Pass" },
    originIp: "34.194.88.17 (US)",
    userContext: "Your company uses reviews.techcorp.com, not external review portals, for performance reviews.",
    body: `Hi,

Your Q4 2025 performance review has been finalized and is ready for acknowledgement.

To view the review and submit your response, sign in with your company credentials here:
techcorp-review.com/employee-review

Please keep this information confidential until your manager discusses it with you.

People Operations`,
    clues: [
      "The sender domain is close to the brand but not the real internal review domain",
      "The email asks for company-credential login on an external portal",
      "The confidentiality note is being used to reduce verification",
      "User context confirms the company already has a different review system",
    ],
    giveawayPhrase: "sign in with your company credentials here: techcorp-review.com/employee-review",
    level1: "Phishing & Spoofing",
    level2: "Spear Phishing",
    explanation: "This is targeted credential phishing. It uses believable internal language and emotional pressure, but the login destination is an off-brand domain designed to capture company credentials.",
    reasoningQuestion: "Why is this spear phishing instead of a normal HR email?",
    reasoningOptions: [
      "It targets company credentials through a lookalike external review portal",
      "It says the review is confidential",
      "It mentions a manager discussion",
      "It uses a short subject line",
    ],
    correctReason: 0,
  },
  {
    id: "E040",
    zone: 2,
    fromName: "Contract Updates",
    from: "share@trusted-docs-share.com",
    sender: "share@trusted-docs-share.com",
    replyTo: "share@trusted-docs-share.com",
    subject: "Updated contract terms for review",
    auth: { spf: "Pass", dkim: "Pass", dmarc: "Pass" },
    originIp: "52.45.10.201 (US)",
    userContext: "You were expecting contract edits, but not a macro-enabled attachment.",
    body: `Hi,

Please review the attached file before Friday:
Contract_Terms_Updated_March2026.docm

This document contains macros required to display the redlines correctly. If prompted, click "Enable Content" after opening.

Thanks`,
    clues: [
      "The attachment is a .docm file, which supports executable macros",
      "The email explicitly instructs the user to enable content",
      "Macro-enabled attachments are a common malware delivery pattern",
      "The context says a document was expected, but not one requiring macros",
    ],
    giveawayPhrase: "If prompted, click \"Enable Content\" after opening.",
    level1: "Malicious Content",
    level2: "Macro-Embedded Attachment",
    explanation: "This email is dangerous because the attachment is a macro-enabled Office document and the sender is priming the user to execute it. That is a classic malware delivery technique.",
    reasoningQuestion: "What makes this clearly malicious?",
    reasoningOptions: [
      "It asks the recipient to open a .docm file and enable macros",
      "It mentions contract edits",
      "It asks for the file to be reviewed before Friday",
      "It comes from a generic sharing mailbox",
    ],
    correctReason: 0,
  },
  {
    id: "E046",
    zone: 3,
    fromName: "Orange",
    from: "security@orange.com",
    sender: "security@orange.com",
    replyTo: "security@orange.com",
    subject: "Your Orange ID was used to sign in to Orange Cloud on a new browser",
    auth: { spf: "Pass", dkim: "Pass", dmarc: "Pass" },
    originIp: "17.253.144.10 (US)",
    userContext: "You signed in to Orange Cloud from a Windows laptop while traveling earlier today.",
    body: `Your Orange ID was used to sign in to orangecloud.com.

Browser: Chrome
Operating system: Windows 11
Location: Austin, TX, USA
Date and time: March 14, 2026 at 9:02 AM CST

If you do not recognize this sign-in, reset your password at iforgot.orange.com.
If this sign-in looks familiar, you can disregard this message.

Orange`,
    clues: [
      "The sender is the expected orange.com security mailbox",
      "The notification includes specific device, OS, location, and time details",
      "iforgot.orange.com is an official Orange recovery domain",
      "The user context supports the sign-in as expected activity",
    ],
    giveawayPhrase: "If this sign-in looks familiar, you can disregard this message.",
    level1: "Legitimate",
    level2: "Security Notification",
    explanation: "This is a clean Orange sign-in notification. The message is specific, uses official Orange infrastructure, and matches the user's recent activity.",
    reasoningQuestion: "What is the strongest reason this is legitimate?",
    reasoningOptions: [
      "The Orange domain, recovery link, and contextual sign-in details all align",
      "The browser listed is Chrome",
      "The message is brief",
      "It mentions Windows 11",
    ],
    correctReason: 0,
  },
  {
    id: "E047",
    zone: 3,
    fromName: "Chase Alerts",
    from: "alerts@chase.com",
    sender: "alerts@chase.com",
    replyTo: "alerts@chase.com",
    subject: "Transaction alert: $3,200 charge on your Sapphire card",
    auth: { spf: "Pass", dkim: "Pass", dmarc: "Pass" },
    originIp: "18.204.201.15 (US)",
    userContext: "You booked airfare with Delta this morning using your Chase Sapphire card ending in 4821.",
    body: `A charge was made on your Chase Sapphire Preferred card.

Amount: $3,200.00
Merchant: Delta Air Lines
Date: March 14, 2026
Card ending in: 4821

If you made this purchase, no action is needed.
If you do not recognize it, call the number on the back of your card or visit chase.com/fraud.

Chase`,
    clues: [
      "The sender uses chase.com and the guidance stays on chase.com/fraud",
      "The bank tells the user to call the number on the physical card, which is a strong authenticity sign",
      "The transaction details are specific and plausible",
      "The user context confirms the Delta purchase was expected",
    ],
    giveawayPhrase: "call the number on the back of your card or visit chase.com/fraud",
    level1: "Legitimate",
    level2: "Bank / Financial Notification",
    explanation: "This is a legitimate bank alert. It uses standard anti-fraud advice, on-domain guidance, and transaction details that match the user's known activity.",
    reasoningQuestion: "What is the most reliable legitimacy signal in this email?",
    reasoningOptions: [
      "It tells you to use chase.com or the phone number on the physical card",
      "It mentions Delta Air Lines",
      "It lists the card's last four digits",
      "It says no action is needed if you recognize the charge",
    ],
    correctReason: 0,
  },
  {
    id: "E048",
    zone: 3,
    fromName: "Google One",
    from: "no-reply@accounts.google.com",
    sender: "no-reply@accounts.google.com",
    replyTo: "no-reply@accounts.google.com",
    subject: "Your Google One storage is 95% full",
    auth: { spf: "Pass", dkim: "Pass", dmarc: "Pass" },
    originIp: "209.85.220.41 (US)",
    userContext: "Your Gmail inbox has recently been bouncing large attachment uploads.",
    body: `Your Google One storage is 95% full.

Used: 14.2 GB of 15 GB

When storage is full, you will not be able to receive Gmail messages, add photos to Google Photos, or create files in Google Drive.

Manage your storage or upgrade your plan at one.google.com/storage.

Google One`,
    clues: [
      "The sender is the standard accounts.google.com notification mailbox",
      "The management path one.google.com/storage is an official Google domain",
      "The tone is informational rather than threatening",
      "The context supports a real low-storage warning",
    ],
    giveawayPhrase: "Manage your storage or upgrade your plan at one.google.com/storage.",
    level1: "Legitimate",
    level2: "Newsletter / Platform Notification",
    explanation: "This is a genuine Google storage notice. The sender, domain, and product behavior all match a standard Google One capacity warning.",
    reasoningQuestion: "Why should this be left as Legitimate?",
    reasoningOptions: [
      "The sender and storage-management link are both on real Google domains",
      "The email warns about Gmail and Drive",
      "It says storage is 95% full",
      "It offers an upgrade path",
    ],
    correctReason: 0,
  },
  {
    id: "E050",
    zone: 3,
    fromName: "Microsoft account team",
    from: "support@account-microsoft-security.com",
    sender: "support@account-microsoft-security.com",
    replyTo: "support@account-microsoft-security.com",
    subject: "Action required: unusual sign-in activity on your Microsoft account",
    auth: { spf: "Pass", dkim: "Pass", dmarc: "Pass" },
    originIp: "52.87.166.30 (US)",
    userContext: "You have not attempted any Microsoft sign-ins from Indonesia this week.",
    body: `We detected unusual activity on your Microsoft account.

What happened: Sign-in attempt from an unusual location
Where: Jakarta, Indonesia
When: March 14, 2026 at 02:14 AM UTC

We blocked this sign-in.

To review recent activity and confirm the block, open the secure review center below:
account-microsoft-security.com/review

If this was you using a VPN or traveling, you can safely ignore this message.

Microsoft account team`,
    clues: [
      "The email looks polished, but the sender domain is not microsoft.com",
      "Authentication passes only prove the attacker controls account-microsoft-security.com",
      "The fake review path imitates Microsoft's wording while staying off-domain",
      "The user context says the sign-in was not expected, so the domain mismatch becomes decisive",
    ],
    giveawayPhrase: "account-microsoft-security.com/review",
    level1: "Phishing & Spoofing",
    level2: "Clone Phishing",
    explanation: "This is a high-quality Microsoft clone phish. The body mirrors a real security alert, but the reply path and review center are on a lookalike domain instead of microsoft.com.",
    reasoningQuestion: "What exposes this as clone phishing?",
    reasoningOptions: [
      "The review center is hosted on account-microsoft-security.com instead of microsoft.com",
      "It mentions Jakarta, Indonesia",
      "It says the sign-in was blocked",
      "It mentions VPN travel as a possibility",
    ],
    correctReason: 0,
  },
  {
    id: "E049",
    zone: 3,
    fromName: "Zelle",
    from: "payments@zelle-notification-center.com",
    sender: "payments@zelle-notification-center.com",
    replyTo: "payments@zelle-notification-center.com",
    subject: "You received $1,200 from Michael Torres",
    auth: { spf: "Pass", dkim: "Pass", dmarc: "Pass" },
    originIp: "34.239.91.51 (US)",
    userContext: "Zelle deposits go straight to your linked bank account; there is no manual acceptance flow.",
    body: `You have received a Zelle payment.

From: Michael Torres
Amount: $1,200.00
Date: March 14, 2026
Message: "March rent - thanks"

To accept the payment, verify your account here within 24 hours:
zelle-notification-center.com/accept/8473921

Payments not accepted in time will be returned to the sender.

Zelle Payment Network`,
    clues: [
      "Zelle does not require recipients to accept incoming payments through a separate portal",
      "The sender domain is not zellepay.com or a bank domain integrated with Zelle",
      "The 24-hour acceptance deadline is fabricated urgency",
      "The user context directly contradicts the email's payment-acceptance claim",
    ],
    giveawayPhrase: "To accept the payment, verify your account here within 24 hours",
    level1: "Phishing & Spoofing",
    level2: "Email Phishing",
    explanation: "This phish abuses a fake Zelle payment notice. The payment-acceptance workflow is invented, and the sender domain is a lookalike rather than an official Zelle property.",
    reasoningQuestion: "Which fact most clearly proves this is phishing?",
    reasoningOptions: [
      "Zelle does not use a separate accept-payment portal, and the sender domain is unofficial",
      "The amount is $1,200",
      "The sender includes a personal note",
      "The email says the money may be returned",
    ],
    correctReason: 0,
  },
];

export const L1_CATEGORIES = [
  { id: "Legitimate", label: "Legitimate", color: "#34C759" },
  { id: "Phishing & Spoofing", label: "Phishing & Spoofing", color: "#0F7A8A" },
  { id: "Spam & Junk", label: "Spam & Junk", color: "#FF9500" },
  { id: "Malicious Content", label: "Malicious Content", color: "#BF5AF2" },
  { id: "Abuse & Harassment", label: "Abuse & Harassment", color: "#FF375F" },
  { id: "High-Risk Fraud", label: "High-Risk Fraud", color: "#C0392B" },
];

export const L2_BY_L1 = {
  Legitimate: [
    "Subscription Billing",
    "Security Notification",
    "Newsletter / Platform Notification",
    "Internal Communication",
    "Shipping Update",
    "Bank / Financial Notification",
    "Promotional Offer",
  ],
  "Phishing & Spoofing": [
    "Email Phishing",
    "Spear Phishing",
    "Spoofed Sender Address",
    "Clone Phishing",
    "Impersonation",
  ],
  "Spam & Junk": [
    "Bulk Marketing Spam",
    "Prize & Lottery Spam",
    "Chain Letter",
    "SEO / Referral Spam",
    "Newsletter Spam",
  ],
  "Malicious Content": [
    "Malware Delivery",
    "Ransomware Lure",
    "Macro-Embedded Attachment",
    "Drive-by Download Link",
    "Credential Harvesting",
  ],
  "Abuse & Harassment": [
    "Direct Harassment",
    "Stalking / Doxxing",
    "Hate Speech",
    "Coordinated Harassment",
    "Threatening Behaviour",
  ],
  "High-Risk Fraud": [
    "Business Email Compromise (BEC)",
    "Wire Fraud",
    "Advance Fee Fraud",
    "Romance Scam",
    "Job Scam",
    "Extortion & Sextortion",
    "Impersonation",
  ],
};

export const TAXONOMY = {
  Legitimate: {
    color: "#34C759",
    subcategories: [
      "Subscription Billing",
      "Security Notification",
      "Newsletter / Platform Notification",
      "Internal Communication",
      "Shipping Update",
      "Bank / Financial Notification",
      "Promotional Offer",
    ],
  },
  "Phishing & Spoofing": {
    color: "#0F7A8A",
    subcategories: [
      "Email Phishing",
      "Spear Phishing",
      "Spoofed Sender Address",
      "Clone Phishing",
      "Impersonation",
    ],
  },
  "Spam & Junk": {
    color: "#FF9500",
    subcategories: [
      "Bulk Marketing Spam",
      "Prize & Lottery Spam",
      "Chain Letter",
      "SEO / Referral Spam",
      "Newsletter Spam",
    ],
  },
  "Malicious Content": {
    color: "#BF5AF2",
    subcategories: [
      "Malware Delivery",
      "Ransomware Lure",
      "Macro-Embedded Attachment",
      "Drive-by Download Link",
      "Credential Harvesting",
    ],
  },
  "Abuse & Harassment": {
    color: "#FF375F",
    subcategories: [
      "Direct Harassment",
      "Stalking / Doxxing",
      "Hate Speech",
      "Coordinated Harassment",
      "Threatening Behaviour",
    ],
  },
  "High-Risk Fraud": {
    color: "#C0392B",
    subcategories: [
      "Business Email Compromise (BEC)",
      "Wire Fraud",
      "Advance Fee Fraud",
      "Romance Scam",
      "Job Scam",
      "Extortion & Sextortion",
      "Impersonation",
    ],
  },
};
