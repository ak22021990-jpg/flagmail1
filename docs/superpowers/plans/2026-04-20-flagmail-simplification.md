# Flagmail Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify Flagmail from a 6-category / L2-scored / 50-email game to a 3-category / L1-only / 30-email game with elevated visual design.

**Architecture:** Surgical changes only — new dataset replaces EMAIL_POOL, L2/clue logic stripped from hooks and components, ZONE_CONFIG becomes the single source of truth for zone names, inline hint UI replaces ClueSystem.jsx.

**Tech Stack:** React 18, Vite, Framer Motion, GSAP, anime.js, Matter.js

**Spec:** `docs/superpowers/specs/2026-04-20-flagmail-simplification-design.md`

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `src/data/emails.js` | Rewrite | New 30-email pool, 3 L1 categories, ZONE_CONFIG, remove L2_BY_L1/TAXONOMY |
| `src/utils/shuffle.js` | Modify | All-10 zones, remove withShuffledClues (single clue now) |
| `src/hooks/useGameState.js` | Modify | zone 3 count 5→10, hintRevealed replaces cluesRevealed, remove selectL2, perfect threshold 4→2 |
| `src/hooks/useScoring.js` | Modify | Remove L2/clue fields, hintUsed boolean, 3 categories only |
| `src/hooks/useBadges.js` | Modify | Update 6 badge conditions per spec |
| `src/App.jsx` | Modify | Remove L2/clue wiring, fix tier thresholds, fix maxZoneScore |
| `src/components/Classifier.jsx` | Modify | Remove L2 row + onSelectL2, 3-cat tooltips, chip style, label change |
| `src/components/GameRound.jsx` | Modify | Remove ClueSystem, add inline hint UI, remove onSelectL2, zone label via ZONE_CONFIG |
| `src/components/ZoneIntroCard.jsx` | Modify | Replace local ZONES array with ZONE_CONFIG import |
| `src/components/ZoneComplete.jsx` | Modify | Replace ZONE_META with ZONE_CONFIG import |
| `src/components/ExplanationCard.jsx` | Modify | Remove L2 row, add subCategory pill |
| `src/components/EmailCard.jsx` | Modify | Mail client typography tweaks (subject bold, body 15px, timestamp format) |
| `src/components/ResultsScreen.jsx` | Modify | 60pt max, tier thresholds ≥50/≥30, zone names via ZONE_CONFIG |
| `src/components/CompetencySummary.jsx` | Modify | 3 categories only |
| `src/components/TutorialScreen.jsx` | Modify | Update for 3 categories and single-hint system |
| `src/components/LandingScreen.jsx` | Audit | Remove any scoring/category count references |
| `src/components/ClueSystem.jsx` | Delete | Replaced by inline hint in GameRound |

---

## Task 1: Rewrite `src/data/emails.js`

**Files:**
- Modify: `src/data/emails.js`

This is the foundation — everything else depends on the new shape.

New email shape:
```js
{
  id: "E001",
  zone: 1,
  from: "sender@domain.com",
  subject: "Subject line",
  body: `Email body text`,
  clue: "Single hint string",
  level1: "Legitimate" | "Spam & Junk" | "Phishing & Spoofing",
  subCategory: "Sub category label",
  explanation: "Post-submit learning text",
  giveawayPhrase: "Key phrase to highlight in body",
}
```

- [ ] **Step 1: Replace the entire file**

Replace `src/data/emails.js` with the content below. The 30 emails are sourced from Dataset/Low.md (zone 1), Dataset/Medium.md (zone 2), Dataset/hard.md (zone 3). Bodies are cleaned from markdown table HTML. Explanations are written fresh per email.

```js
// Flagmail — Email Dataset v3.0
// 30 emails: 10 easy (zone 1), 10 medium (zone 2), 10 hard (zone 3)
// L1 Distribution: Legitimate ×10, Phishing & Spoofing ×10, Spam & Junk ×10

export const EMAIL_POOL = [

  // ─── ZONE 1 — EASY ─────────────────────────────────────────────────────────
  {
    id: "E001",
    zone: 1,
    from: "money.transfer772@gmail.com",
    subject: "URGENT: YOUR $100,000,000.00 IS READY",
    body: `Dearest Beloved Friend,

I am the Prince of Dubai and I am writing to you with a matter of great importance. I have been searching for a trustworthy person to help me move my family's private inheritance funds out of the country before the new government regulations take effect.

I have chosen your email address from a global database of honest citizens. I am prepared to transfer $100,000,000.00 to your account today. I will give you 10% for your help. Please click the link below to provide your bank details and ID so we can start the wire transfer immediately. This is a secret!

[Link: bit.ly/claim-dubai-cash]`,
    clue: "A Prince wouldn't use a random @gmail.com account or find a 'trustworthy person' via a random database.",
    level1: "Phishing & Spoofing",
    subCategory: "Email Phishing",
    explanation: "Classic Nigerian prince phishing. No real prince uses a Gmail address, and no inheritance requires your bank details upfront. The link to a URL shortener hides the real destination — a credential-harvesting page.",
    giveawayPhrase: "I have chosen your email address from a global database of honest citizens",
  },
  {
    id: "E002",
    zone: 1,
    from: "billing-office@techco-billing.com",
    subject: "REFUND: You have an unclaimed credit of $149.99",
    body: `Dear Customer,

Our billing department has identified a double-payment error on your recent subscription for "Cloud Storage and Music Bundle." As a result, your account has been overcharged by $149.99.

We have tried to process the refund automatically, but your current payment method on file has expired. To receive your refund, you must manually enter your bank or credit card details into our secure refund portal. If you do not claim this credit within 48 hours, the funds will be forfeited and returned to the state treasury.

Please click the link below to verify your details and receive your $149.99 refund immediately:

[Link: techco-refund-portal-secure.net/claim-funds]

Thank you,`,
    clue: "If a company owes you a refund, they send it back to your card automatically. They will never ask you to click a link and 'enter your bank details' to get a refund. Also, look at the link — it says techco-refund-portal-secure.net, not the company's real domain.",
    level1: "Phishing & Spoofing",
    subCategory: "Impersonation",
    explanation: "Brand impersonation phishing using a fake refund pretext. Legitimate refunds are processed automatically to the original payment method — no real company asks you to submit card details via email. The link domain (techco-refund-portal-secure.net) is a fake domain designed to look official.",
    giveawayPhrase: "techco-refund-portal-secure.net/claim-funds",
  },
  {
    id: "E003",
    zone: 1,
    from: "auto-confirm@amazon.com",
    subject: "Your order #112-394857 has shipped!",
    body: `Hello! We're excited to let you know that a part of your order is on its way. You can find the details of your shipment and track its progress using the link below.

Items in this shipment:

Wireless Optical Mouse (Black) - 1 unit

If you need to make any changes to your delivery preferences or view your full invoice, please visit your "Orders" page on our official website. Thank you for being a valued customer!

Regards,`,
    clue: "The sender domain is exactly @amazon.com and it references a specific order number without asking for sensitive info.",
    level1: "Legitimate",
    subCategory: "Shipping Update",
    explanation: "Genuine Amazon shipment confirmation. The verified amazon.com domain, specific order number, and direction to the official website (not a link in the email) are all consistent with real Amazon shipping notifications.",
    giveawayPhrase: "visit your \"Orders\" page on our official website",
  },
  {
    id: "E004",
    zone: 1,
    from: "no-reply@accounts.google.com",
    subject: "Security alert: New sign-in detected",
    body: `Your Google Account was recently signed in to from a new Linux device.

Details:
Date: April 17, 2026
Location: Bengaluru, India (Estimated)
Browser: Chrome

If this was you, you can safely ignore this email. If you do not recognize this activity, please review your recent devices by going to your Google Account Security settings. Google will never ask you for your password or 2-step verification code via email.`,
    clue: "It's a standard 'FYI' alert from a verified address and specifically tells you they won't ask for a password.",
    level1: "Legitimate",
    subCategory: "Security Notification",
    explanation: "Genuine Google security sign-in alert. The verified no-reply@accounts.google.com sender, specific sign-in details, and proactive reminder that Google will never ask for your password via email are all hallmarks of real Google security notifications.",
    giveawayPhrase: "Google will never ask you for your password or 2-step verification code via email",
  },
  {
    id: "E005",
    zone: 1,
    from: "no-reply@spotify.com",
    subject: "Your receipt for April 2026",
    body: `Thanks for being a Premium subscriber!

Your monthly payment of $10.99 has been successfully processed via your saved payment method. Your current billing cycle runs from April 17 to May 17. You can view your full transaction history or update your subscription plan at any time by visiting your account page on our website.

Keep on listening!
The Spotify Team`,
    clue: "The price is standard, the domain is correct, and there is no 'urgent' demand.",
    level1: "Legitimate",
    subCategory: "Subscription Billing",
    explanation: "Legitimate Spotify billing receipt. The verified no-reply@spotify.com domain, accurate subscription price, correct billing cycle dates, and zero urgency or requests for information confirm this as genuine.",
    giveawayPhrase: "Your monthly payment of $10.99 has been successfully processed",
  },
  {
    id: "E006",
    zone: 1,
    from: "newsletters@natgeo.com",
    subject: "This week's top stories: The Deep Ocean",
    body: `Welcome to your weekly digest! This week, we explore the mysterious "Midnight Zone" of the ocean, where creatures have evolved to live in total darkness.

In this issue:

How bioluminescence works in deep-sea jellyfish.

New species discovered near the Mariana Trench.

Our photographer's diary: 48 hours in a submarine.

Click "Read More" to dive into the full stories on our digital platform.`,
    clue: "It provides educational value and comes from a well-known, verified publisher.",
    level1: "Legitimate",
    subCategory: "Newsletter",
    explanation: "Legitimate National Geographic weekly newsletter. The verified natgeo.com domain, genuinely educational content, and absence of any requests for personal information or money confirm this as clean.",
    giveawayPhrase: "Click \"Read More\" to dive into the full stories on our digital platform",
  },
  {
    id: "E007",
    zone: 1,
    from: "messages-noreply@linkedin.com",
    subject: "You have 3 new notifications waiting for you",
    body: `Hi there, here's what's been happening in your network while you were away:

Sarah Miller and 2 others viewed your profile.

You have a new connection request from Mark Stevens (Recruiter).

Your post "Thinking about AI" is trending in your industry.

Stay connected and see what's new in your professional circle by visiting your feed.`,
    clue: "Uses standard LinkedIn notification formatting and a verified sender address.",
    level1: "Legitimate",
    subCategory: "Platform Notification",
    explanation: "Genuine LinkedIn activity digest. The verified messages-noreply@linkedin.com sender, standard LinkedIn notification format, and direction to the platform (not an external link) confirm this as legitimate.",
    giveawayPhrase: "Stay connected and see what's new in your professional circle by visiting your feed",
  },
  {
    id: "E008",
    zone: 1,
    from: "no-reply@chase.com",
    subject: "Your monthly statement is now available",
    body: `Dear Customer,

Your monthly credit card statement for the period ending April 15 is now ready to view. For your protection, we do not include account details or attachments in this email.

To view your statement, please log in to the Chase Mobile app or visit chase.com and navigate to the "Statements & Documents" section. If you have questions, please call the number on the back of your card.`,
    clue: "It follows the golden rule of banking: 'Don't click a link, go to our app/site yourself.'",
    level1: "Legitimate",
    subCategory: "Bank Notification",
    explanation: "Legitimate Chase statement notification. The verified no-reply@chase.com domain, no embedded links to click, and the instruction to navigate to chase.com directly are all consistent with genuine bank communication. Real banks never embed statement links in emails.",
    giveawayPhrase: "please log in to the Chase Mobile app or visit chase.com",
  },
  {
    id: "E009",
    zone: 1,
    from: "contest@marketing-blasts.xyz",
    subject: "You are our 1,000,000th Visitor! Claim Prize!",
    body: `CONGRATULATIONS! You have been selected as the 1,000,000th visitor of the day! As a result, you have won a brand new 2024 Tesla Model S or a $50,000 cash prize!

To claim your reward, you just need to complete our quick 50-page consumer preference survey. Once finished, pay a small $5 processing fee to cover the title transfer and the car will be delivered to your door! Don't wait — this offer expires when you close your browser!`,
    clue: "'1,000,000th visitor' is a legendary spam trope. Also, cars aren't 'free' if you have to pay a fee to a random site.",
    level1: "Spam & Junk",
    subCategory: "Prize Spam",
    explanation: "Classic prize spam. The '1,000,000th visitor' claim is sent to millions of people simultaneously. The $5 'processing fee' is the theft mechanism — the car never arrives. Legitimate prize draws never require a fee to claim.",
    giveawayPhrase: "pay a small $5 processing fee to cover the title transfer",
  },
  {
    id: "E010",
    zone: 1,
    from: "martha1955@yahoo.com",
    subject: "Fwd: DO NOT DELETE OR BAD LUCK!",
    body: `This is the "Golden Owl of Prosperity." It was started by a monk in 1920. If you send this to 10 people in the next 5 minutes, you will receive a large sum of money tomorrow morning.

If you break the chain and delete this email, your computer will crash and you will have 10 years of bad luck. One man ignored this and lost his job the next day! Don't take the risk! Forward this now to everyone in your contact list!`,
    clue: "This is classic 'junk' clutter that offers no value and asks for forwards.",
    level1: "Spam & Junk",
    subCategory: "Chain Letter",
    explanation: "Classic chain letter spam. No email can cause computer crashes or bad luck. The superstitious threat and forward request are the defining signals of this long-running spam format. Forwarding it only spreads junk and wastes people's time.",
    giveawayPhrase: "your computer will crash and you will have 10 years of bad luck",
  },

  // ─── ZONE 2 — MEDIUM ───────────────────────────────────────────────────────
  {
    id: "E011",
    zone: 2,
    from: "shipping@techco-store.com",
    subject: "Your order is on its way!",
    body: `Hello, Your order is heading your way! We've handed it off to the carrier and you should see it at your doorstep soon.

Order Number: W9928374
Delivery Method: Standard Shipping

You can use the tracking link below to see the latest updates on your delivery. Please note that a signature may be required upon arrival. If you won't be home, you can manage your delivery through the carrier's portal. Thank you for your purchase.`,
    clue: "The domain @techco-store.com is correct, and the language is calm and professional.",
    level1: "Legitimate",
    subCategory: "Shipping Update",
    explanation: "Genuine retailer shipping notification. The verified shipping domain, specific order number, and standard shipping language are consistent with real order confirmation emails. No suspicious links or requests for information.",
    giveawayPhrase: "You can use the tracking link below to see the latest updates on your delivery",
  },
  {
    id: "E012",
    zone: 2,
    from: "support@yourcompany.com",
    subject: "Scheduled System Maintenance: This Sunday",
    body: `Hello Team,

Please be advised that the Internal Employee Portal and the VPN service will be undergoing scheduled maintenance this Sunday, April 19, from 2:00 AM to 4:00 AM local time.

During this window, you may experience intermittent connectivity or be unable to log in to internal tools. We recommend saving all your work and logging out before the maintenance window begins. We apologize for any inconvenience this may cause.

Thank you,
IT Operations`,
    clue: "Standard corporate announcement. It doesn't ask you to 'click here to keep your access.'",
    level1: "Legitimate",
    subCategory: "Internal Communication",
    explanation: "Routine IT maintenance notice. The internal company domain, specific maintenance window, and absence of any links or credential requests are all consistent with a genuine internal IT communication.",
    giveawayPhrase: "We recommend saving all your work and logging out before the maintenance window begins",
  },
  {
    id: "E013",
    zone: 2,
    from: "news@e.starbucks.com",
    subject: "Double Star Day is tomorrow",
    body: `Hello, Get your favorite drink and earn twice the stars! Tomorrow only, every purchase made using your registered Starbucks Card or the Starbucks app will earn you 2x Stars toward your next free reward.

Whether it's a morning latte or an afternoon refresher, make sure to scan your app at the register. See you tomorrow at your local Starbucks!

Offer valid at participating stores. Double stars apply to the base stars earned on the purchase.`,
    clue: "e.starbucks.com is a legitimate marketing subdomain used by Starbucks for email campaigns.",
    level1: "Legitimate",
    subCategory: "Promotional Offer",
    explanation: "Legitimate Starbucks rewards promotion. The e.starbucks.com subdomain is Starbucks' verified email marketing domain. The promotion is a standard loyalty program offer with no requests for personal information or payment.",
    giveawayPhrase: "earn twice the stars! Tomorrow only",
  },
  {
    id: "E014",
    zone: 2,
    from: "alerts@wellsfargo.com",
    subject: "Large transaction alert on your account",
    body: `Hello, Wells Fargo Alert: A transaction of $542.10 occurred on your credit card ending in 4492 at "Electronics Plus" on April 17.

If this was you, no action is needed. We sent this alert as part of our commitment to your account security. If you do not recognize this transaction, please do not reply to this email. Instead, call the official customer service number on the back of your physical card or log in to our secure online portal to report unauthorized activity.`,
    clue: "It tells you to call the number on the back of your card — a very safe instruction.",
    level1: "Legitimate",
    subCategory: "Bank Notification",
    explanation: "Legitimate Wells Fargo transaction alert. The verified alerts@wellsfargo.com sender, specific transaction details, and the advice to call the number on the physical card (not a number in the email) are hallmarks of genuine bank security alerts.",
    giveawayPhrase: "call the official customer service number on the back of your physical card",
  },
  {
    id: "E015",
    zone: 2,
    from: "support@netfIex-payments.com",
    subject: "Your account is on hold",
    body: `Hello, We're sorry to say that we're having some trouble with your current billing information. As a result, your Netflix subscription has been put on hold and you will no longer be able to stream movies and TV shows.

To continue enjoying Netflix, please update your payment method by clicking the button below. You will need to provide a valid credit card to restore your service. If we do not hear from you within 48 hours, we will be forced to cancel your membership permanently.

[Button: Update Payment Now]`,
    clue: "Look at the sender address. The word 'Netflix' is spelled with a capital 'I' instead of a lowercase 'l' — netfIex-payments.com.",
    level1: "Phishing & Spoofing",
    subCategory: "Spoofed Address",
    explanation: "Netflix phishing using a capital 'I' to replace lowercase 'l' in the domain (netfIex vs netflix). This visual trick makes the domain look legitimate at a glance. The 48-hour cancellation threat creates pressure to click without inspecting the sender address carefully.",
    giveawayPhrase: "netfIex-payments.com",
  },
  {
    id: "E016",
    zone: 2,
    from: "service@pay-pal-notice.com",
    subject: "Unusual activity: Your account has been temporarily restricted",
    body: `Dear Member, we have noticed some unusual activity on your PayPal account that suggests an unauthorized third party may have accessed your funds.

Dear Customer,

We noticed some unusual activity on your PayPal account that suggests an unauthorized third party may have accessed your personal information. For your protection, we have temporarily restricted access to your account until you can verify your identity.

While your account is restricted, you will be unable to send money, withdraw funds, or make online purchases. To lift this restriction and secure your account, please visit our secure verification portal immediately at the address below:

Link: www.paypal.security-updates.com/login-verify

Please complete the verification process within 24 hours to avoid a permanent account suspension. We apologize for any inconvenience this may cause, but your security is our top priority.

Thank you,`,
    clue: "Look at the link provided. In a web address, the 'real' website is the part right before the .com. Here, the real website is security-updates.com, not PayPal. A real PayPal link would always be paypal.com/something.",
    level1: "Phishing & Spoofing",
    subCategory: "Clone Phishing",
    explanation: "PayPal clone phishing. The login link goes to paypal.security-updates.com — which is a subdomain of security-updates.com, not PayPal. The sender domain pay-pal-notice.com is also fake. Real PayPal links always use paypal.com as the base domain.",
    giveawayPhrase: "www.paypal.security-updates.com/login-verify",
  },
  {
    id: "E017",
    zone: 2,
    from: "Microsoft-Support-Cloud@outlook-mail.co",
    subject: "Your mailbox is full: Action Required",
    body: `Hello, Your Outlook mailbox has reached 99.5% of its 15GB storage limit. Because of this, you will no longer be able to send or receive new emails. Important messages from your contacts may be bounced back to the sender.

To avoid any service interruption, please click the button below to add 50GB of extra storage to your account for free as part of our loyalty program. You must sign in to confirm your upgrade.

[Button: Get More Storage]`,
    clue: "The sender domain is outlook-mail.co — Microsoft uses microsoft.com and outlook.com, not outlook-mail.co.",
    level1: "Phishing & Spoofing",
    subCategory: "Impersonation",
    explanation: "Microsoft impersonation phishing. The domain outlook-mail.co mimics Microsoft's branding but is a fake. Microsoft and Outlook only send from microsoft.com and outlook.com. The 'free 50GB upgrade' requiring a sign-in is a credential harvesting trap.",
    giveawayPhrase: "outlook-mail.co",
  },
  {
    id: "E018",
    zone: 2,
    from: "deals@daily-discount.net",
    subject: "RE: Your 90% discount (Expires Midnight!)",
    body: `Hey there! We noticed you were browsing our site recently and left a few items in your shopping cart. We didn't want you to miss out, so we're giving you a secret 90% discount on all designer knock-off sunglasses!

Whether you're hitting the beach or just want to look cool, our glasses are the perfect fit. Prices start at just $5.99. Use the code "CHEAP90" at checkout. Hurry, this offer is only valid for the next few hours!`,
    clue: "It uses 'RE:' in the subject to trick you into thinking you've talked to them before.",
    level1: "Spam & Junk",
    subCategory: "Bulk Marketing",
    explanation: "Deceptive marketing spam. The 'RE:' subject line prefix is designed to make the email look like a reply to a prior conversation, bypassing spam filters and tricking recipients into opening it. The sender domain daily-discount.net has no brand affiliation.",
    giveawayPhrase: "RE: Your 90% discount",
  },
  {
    id: "E019",
    zone: 2,
    from: "news@healthy-life.me",
    subject: "One weird trick to lose weight",
    body: `Hello, Are you tired of spending hours at the gym with no results? Doctors and fitness gurus are stunned by this one simple trick that helps you burn fat while you sleep!

It's not a diet, it's not a pill, and it's not surgery. It's a secret fruit discovered in the Amazon jungle that naturally boosts your metabolism by 400%. Watch the free video below to see how thousands of people are changing their lives in just 7 days!`,
    clue: "'One weird trick' and 'doctors hate this' are classic clickbait spam markers.",
    level1: "Spam & Junk",
    subCategory: "Newsletter Spam",
    explanation: "Health misinformation spam. The 'one weird trick', '400% metabolism boost', and 'doctors are stunned' phrases are documented spam copywriting patterns. The .me domain has no medical credibility and the claims are scientifically impossible.",
    giveawayPhrase: "naturally boosts your metabolism by 400%",
  },
  {
    id: "E020",
    zone: 2,
    from: "marketing@rank-first.biz",
    subject: "I found 5 critical errors on your website",
    body: `Hi, I was browsing your website this morning and I noticed several technical errors that are preventing you from appearing on the first page of Google.

If you don't fix these issues, you are losing out on thousands of potential customers every month. My agency specializes in ranking businesses #1 in less than 3 days. Would you be open to a 5-minute phone call tomorrow so I can show you exactly how to crush your competitors?`,
    clue: "Unsolicited business offers that promise 'instant' results are almost always low-quality spam.",
    level1: "Spam & Junk",
    subCategory: "SEO Spam",
    explanation: "SEO cold-outreach spam. The claim of finding 'critical errors' is automated and sent to millions of domains. No agency can guarantee Google #1 rankings in 3 days — that's not how search algorithms work. The goal is to get you on a call to sell overpriced services.",
    giveawayPhrase: "ranking businesses #1 in less than 3 days",
  },

  // ─── ZONE 3 — HARD ─────────────────────────────────────────────────────────
  {
    id: "E021",
    zone: 3,
    from: "hr-portal@yourcompany.com",
    subject: "IMPORTANT: Action Required - Annual Benefits Enrollment",
    body: `Hi Team,

It is officially time for our Annual Open Enrollment period! Between now and Friday, you must review and select your health, dental, and vision insurance plans for the 2026 calendar year.

To make your selections, please log in to our internal portal via the company SSO (Single Sign-On) dashboard and navigate to the "Workday" application. If you have any questions regarding plan changes or premiums, please attend one of our virtual Q&A sessions tomorrow at 10 AM.

Best,
HR Team`,
    clue: "It uses the term 'SSO', which is a sign of a real corporate secure login process.",
    level1: "Legitimate",
    subCategory: "Internal Communication",
    explanation: "Legitimate HR benefits enrollment notice. The internal company domain, SSO reference (a real enterprise security practice), named internal system (Workday), and specific enrollment deadline are all consistent with genuine corporate HR communications.",
    giveawayPhrase: "log in to our internal portal via the company SSO (Single Sign-On) dashboard",
  },
  {
    id: "E022",
    zone: 3,
    from: "mail@adobe.com",
    subject: "Your invoice for April 2026",
    body: `Hello, Thank you for your continued subscription to Adobe Creative Cloud.

This is a notification that your monthly payment of $52.99 has been charged to your credit card ending in 1234. Your invoice is now available for download in the "Billing" section of your Adobe ID account.

If you have any questions about this charge or need to update your payment info, please visit our official support page. Thank you for being a part of the creative community.`,
    clue: "The domain @adobe.com is correct, and it correctly shows only the last 4 digits of a card.",
    level1: "Legitimate",
    subCategory: "Subscription Billing",
    explanation: "Genuine Adobe Creative Cloud invoice. The verified mail@adobe.com domain, accurate subscription pricing, partial card number (last 4 digits only — a security best practice), and direction to the official Adobe portal confirm this as legitimate.",
    giveawayPhrase: "your credit card ending in 1234",
  },
  {
    id: "E023",
    zone: 3,
    from: "exec-office@company-internal-hr.com",
    subject: "Quick Request - Are you at your desk?",
    body: `Hi, I'm currently stuck in a back-to-back board meeting and I can't take any calls right now. I need a huge favor.

I was supposed to send gift cards to a client for their anniversary today, but I've just realized my corporate card is being declined. Can you please head to the store and purchase five $100 gift cards? Just scratch the back, take a photo of the codes, and email them to me here. I will reimburse you by the end of the day. Please keep this quiet as it's a surprise for the client.`,
    clue: "This is a 'CEO scam.' Bosses do not ask employees to buy gift cards with their own personal money.",
    level1: "Phishing & Spoofing",
    subCategory: "Spear Phishing",
    explanation: "CEO gift card scam (Business Email Compromise). The request to buy gift cards personally and 'keep it quiet' is the defining signal. The sender domain company-internal-hr.com mimics an internal address but is not the company's real domain. This scam costs businesses millions annually.",
    giveawayPhrase: "purchase five $100 gift cards? Just scratch the back, take a photo of the codes, and email them to me",
  },
  {
    id: "E024",
    zone: 3,
    from: "account-security@mircosoft.com",
    subject: "Unusual Sign-in Activity Detected",
    body: `Hello, Microsoft account security alert.

We detected an unusual sign-in to your account from an IP address located in Beijing, China. If this was not you, your account may have been compromised.

To secure your account and prevent unauthorized access to your files and emails, please click the button below to verify your identity. You will be asked to confirm your current password and your recovery phone number.

[Button: Secure Account Now]`,
    clue: "Look at the spelling in the 'From' field: 'mircosoft' instead of 'microsoft'.",
    level1: "Phishing & Spoofing",
    subCategory: "Typosquatting",
    explanation: "Microsoft typosquatting phishing. The domain mircosoft.com swaps the 'c' and 'r' in 'microsoft' — easy to miss at a glance, especially in a small font. The Beijing sign-in is chosen to trigger alarm. Microsoft security alerts come from microsoft.com only.",
    giveawayPhrase: "mircosoft.com",
  },
  {
    id: "E025",
    zone: 3,
    from: "dse@docusıgn.net",
    subject: "Action Required: Your 2026 Annual Bonus & Performance Review.pdf",
    body: `Hello,

You have a new document waiting for your electronic signature from the Finance & Payroll Department.

This document contains your confidential performance evaluation and the final calculation for your 2026 annual bonus. To ensure your bonus is included in the next pay cycle, please review the document and provide your digital signature by 5:00 PM today.

Document: Performance_Bonus_2026.pdf
Access Code: BX-992

[Button: VIEW DOCUMENT]

This is an automated message from the DocuSign Secure System. Do not reply to this email. For assistance, please contact your internal HR representative.`,
    clue: "Look extremely closely at the sender's email: dse@docusıgn.net. The 'i' in docusıgn is a Turkish 'dotless i' character — it looks identical to a normal 'i' but it is a completely different domain.",
    level1: "Phishing & Spoofing",
    subCategory: "Spoofed Sender Address",
    explanation: "Unicode homoglyph attack — one of the most sophisticated phishing techniques. The 'i' in docusıgn is a Turkish dotless-i (ı), making it visually identical to docusign.net but a completely different domain. The annual bonus subject matter creates urgency that bypasses careful reading.",
    giveawayPhrase: "dse@docusıgn.net",
  },
  {
    id: "E026",
    zone: 3,
    from: "helpdesk@yourcompany-portal.com",
    subject: "URGENT: Password Expiration Notice",
    body: `Hi, According to our security policy, your network password is set to expire in exactly 2 hours. If you do not update your password before the deadline, you will be locked out of the system and will lose access to your email, the VPN, and all internal files.

To avoid a service lockout, please click the link below to go to our password reset portal. You must enter your old password and then choose a new one.

[Link: reset-portal-login.com/secure]`,
    clue: "Creating 'False Urgency' (2 hours left!) is a classic trick to make you panic and not check the URL.",
    level1: "Phishing & Spoofing",
    subCategory: "Spoofed Address",
    explanation: "Internal IT impersonation phishing. The domain yourcompany-portal.com mimics an internal IT address and the reset link goes to reset-portal-login.com — a completely unrelated domain. Real corporate password resets always use the company's own domain. The 2-hour countdown prevents calm analysis.",
    giveawayPhrase: "reset-portal-login.com/secure",
  },
  {
    id: "E027",
    zone: 3,
    from: "mark@biz-solutions.net",
    subject: "Question about your business",
    body: `Hi, I was looking at your LinkedIn profile earlier and I was very impressed with your background.

I work with several companies in your industry and we've been able to help them get 500 new high-quality leads every single week using our proprietary software. I'll actually be in your city next week for a conference — do you have 15 minutes to grab a coffee so I can show you how we can do the same for you?`,
    clue: "This is a 'cold outreach' bot. It feels personal, but it's an automated sales pitch.",
    level1: "Spam & Junk",
    subCategory: "Referral Spam",
    explanation: "Cold-outreach spam designed to feel personal. The LinkedIn reference, the '500 leads per week' promise, and the local meeting offer are all automated scripts sent to thousands of addresses. The biz-solutions.net domain has no verifiable company behind it.",
    giveawayPhrase: "500 new high-quality leads every single week",
  },
  {
    id: "E028",
    zone: 3,
    from: "cleanup@unsubscriber.app",
    subject: "You have 4,302 unread junk emails in your inbox",
    body: `Hello, Are you tired of waking up to a messy inbox full of spam and advertisements?

Our new "Clean-Sweep" app can automatically unsubscribe you from thousands of mailing lists with just one click. To get started, simply click the button below to connect your email account to our secure server. We will analyze your inbox and clean it up for just a $1 monthly fee. Say goodbye to spam forever!`,
    clue: "Fake 'unsubscriber' services are actually used to verify your email is active so they can send you more spam.",
    level1: "Spam & Junk",
    subCategory: "Newsletter Spam",
    explanation: "Anti-spam spam — a meta-scam. Connecting your email account to an unknown 'unsubscriber' service gives the operator full access to your inbox. These services typically harvest active email addresses and sell them to other spammers, making your spam problem worse, not better.",
    giveawayPhrase: "simply click the button below to connect your email account to our secure server",
  },
  {
    id: "E029",
    zone: 3,
    from: "deals@daily-deals-inbox.com",
    subject: "Open for a massive surprise!",
    body: `Hello, You have been selected as a preferred customer for our exclusive 24-hour "Flash Sale"!

Inside this email, you will find a hidden coupon for an extra 20% off our already discounted prices. We have everything from home electronics to designer clothing. Don't let someone else grab your deals — click the link below to browse our catalog before the sale ends at midnight!`,
    clue: "Unsolicited marketing from a random 'Daily Deals' sender you never signed up for.",
    level1: "Spam & Junk",
    subCategory: "Bulk Marketing",
    explanation: "Generic bulk marketing spam. The 'preferred customer' claim is false — this is a mass send to purchased email lists. The '24-hour flash sale' is a manufactured urgency tactic. The daily-deals-inbox.com domain has no brand affiliation.",
    giveawayPhrase: "You have been selected as a preferred customer",
  },
  {
    id: "E030",
    zone: 3,
    from: "marketing@seo-experts.io",
    subject: "Your website is slow and losing money!",
    body: `Hello, I ran a performance test on your website this morning and the results were shocking. Your site is failing 3 major Google Core Web Vitals, which means Google is pushing you down in the search results.

If you don't fix this immediately, your competitors will take all your traffic. Reply to this email with the word "REPORT" and I will send you a free 20-page audit of your site and a plan to fix it.`,
    clue: "Fear-mongering about technical performance is a common tactic used by low-quality spam agencies to find victims.",
    level1: "Spam & Junk",
    subCategory: "SEO Spam",
    explanation: "SEO fear-mongering spam. The '3 failing Core Web Vitals' claim is generic and sent to every domain on a purchased list — no one has checked your specific site. The 'reply with REPORT' mechanism confirms your email is active for further targeting.",
    giveawayPhrase: "Reply to this email with the word \"REPORT\"",
  },
];

// ─── L1 Categories (trimmed to 3) ─────────────────────────────────────────────
export const L1_CATEGORIES = [
  { id: "Legitimate",          label: "Legitimate",          color: "#34C759" },
  { id: "Spam & Junk",         label: "Spam & Junk",         color: "#FF9500" },
  { id: "Phishing & Spoofing", label: "Phishing & Spoofing", color: "#FF3B30" },
];

// ─── Zone Config (single source of truth) ─────────────────────────────────────
export const ZONE_CONFIG = {
  1: { name: "The Inbox",      difficulty: "Easy",   emails: 10, icon: "📬", mission: "Clear the inbox. Trust your instincts." },
  2: { name: "The Queue",      difficulty: "Medium", emails: 10, icon: "🗂",  mission: "The queue is getting trickier. Stay sharp." },
  3: { name: "The Escalation", difficulty: "Hard",   emails: 10, icon: "🚨", mission: "These are the hardest calls. Think carefully." },
};

export const MAX_POINTS_PER_EMAIL = 2;
export const TOTAL_EMAILS = 30;
export const MAX_SCORE = MAX_POINTS_PER_EMAIL * TOTAL_EMAILS; // 60
export const MAX_POINTS_PER_ZONE = MAX_POINTS_PER_EMAIL * 10; // 20
```

- [ ] **Step 2: Verify the file parses without errors**

Run: `npx vite build --mode development 2>&1 | head -30` (or just start dev server)
Expected: No import errors from emails.js

- [ ] **Step 3: Commit**

```bash
git add src/data/emails.js
git commit -m "feat: replace email dataset with 30-email simplified pool (3 L1 categories)"
```

---

## Task 2: Update `src/utils/shuffle.js`

**Files:**
- Modify: `src/utils/shuffle.js`

The pool is now exactly 10 per zone — no selection needed, just shuffle within each zone.

- [ ] **Step 1: Replace shuffle.js**

```js
import { EMAIL_POOL as EMAILS } from '../data/emails.js';

function fisherYates(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Shuffle within each zone independently, then concatenate in order.
// All 10 emails per zone are always played (pool size == game size).
export function shuffleEmails() {
  const zone1 = fisherYates(EMAILS.filter(e => e.zone === 1));
  const zone2 = fisherYates(EMAILS.filter(e => e.zone === 2));
  const zone3 = fisherYates(EMAILS.filter(e => e.zone === 3));
  return [...zone1, ...zone2, ...zone3];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/shuffle.js
git commit -m "fix: simplify shuffle to all-10 zones, remove clue-shuffling logic"
```

---

## Task 3: Update hooks

### 3a: `src/hooks/useGameState.js`

- [ ] **Step 1: Apply all changes**

Key diffs:
1. `ZONE_EMAIL_COUNTS = { 1: 10, 2: 10, 3: 10 }` (was `3: 5`)
2. `zoneEnd = zone === 1 ? 10 : zone === 2 ? 20 : 30` (was `25`)
3. `initialRoundState`: remove `cluesRevealed`/`selectedL2`, add `hintRevealed: false`
4. Remove `revealClue`/`selectL2` actions, add `revealHint`
5. Perfect threshold: `record.points === 2` (was `=== 4`)
6. Remove `selectL2` from return

```js
import { useState, useCallback } from 'react';
import { shuffleEmails } from '../utils/shuffle.js';

export const SCREENS = {
  INTRO:         'intro',
  LANDING:       'landing',
  TUTORIAL:      'tutorial',
  ZONE_INTRO:    'zone_intro',
  ROUND:         'round',
  EXPLANATION:   'explanation',
  ZONE_COMPLETE: 'zone_complete',
  RESULTS:       'results',
  LEADERBOARD:   'leaderboard',
};

const ZONE_EMAIL_COUNTS = { 1: 10, 2: 10, 3: 10 };

function initialRoundState() {
  return {
    hintRevealed: false,
    selectedL1: null,
    submitted: false,
    timedOut: false,
    lastRecord: null,
  };
}

export function useGameState() {
  const [screen, setScreen] = useState(SCREENS.INTRO);
  const [player, setPlayer] = useState({ name: '', email: '' });
  const [emailPool, setEmailPool] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zone, setZone] = useState(1);
  const [consecutivePerfect, setConsecutivePerfect] = useState(0);
  const [earlyUnlocked, setEarlyUnlocked] = useState(false);
  const [tutorialSeen, setTutorialSeen] = useState(false);
  const [round, setRound] = useState(initialRoundState());

  const currentEmail = emailPool[currentIndex] || null;

  const zoneStart = zone === 1 ? 0 : zone === 2 ? 10 : 20;
  const zoneEnd   = zone === 1 ? 10 : zone === 2 ? 20 : 30;
  const emailInZone = currentIndex - zoneStart + 1;
  const emailsInZone = ZONE_EMAIL_COUNTS[zone];

  const startGame = useCallback((name, email) => {
    setPlayer({ name, email });
    const pool = shuffleEmails();
    setEmailPool(pool);
    setCurrentIndex(0);
    setZone(1);
    setConsecutivePerfect(0);
    setEarlyUnlocked(false);
    setRound(initialRoundState());
    if (!tutorialSeen) {
      setScreen(SCREENS.TUTORIAL);
    } else {
      setScreen(SCREENS.ZONE_INTRO);
    }
  }, [tutorialSeen]);

  const completeIntro = useCallback(() => {
    setScreen(SCREENS.LANDING);
  }, []);

  const completeTutorial = useCallback(() => {
    setTutorialSeen(true);
    setScreen(SCREENS.ZONE_INTRO);
  }, []);

  const startZone = useCallback(() => {
    setRound(initialRoundState());
    setScreen(SCREENS.ROUND);
  }, []);

  const revealHint = useCallback(() => {
    setRound(prev => ({ ...prev, hintRevealed: true }));
  }, []);

  const selectL1 = useCallback((l1) => {
    setRound(prev => ({ ...prev, selectedL1: l1 }));
  }, []);

  const handleTimeout = useCallback(() => {
    setRound(prev => ({ ...prev, timedOut: true }));
  }, []);

  const submitRound = useCallback((record) => {
    setRound(prev => ({ ...prev, submitted: true, lastRecord: record }));

    const perfect = record.points === 2;
    setConsecutivePerfect(prev => {
      const next = perfect ? prev + 1 : 0;
      if (next >= 3 && !earlyUnlocked) {
        setEarlyUnlocked(true);
      }
      return next;
    });

    setScreen(SCREENS.EXPLANATION);
  }, [earlyUnlocked]);

  const nextEmail = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= zoneEnd) {
      setScreen(SCREENS.ZONE_COMPLETE);
      return;
    }
    setCurrentIndex(nextIndex);
    setRound(initialRoundState());
    setScreen(SCREENS.ROUND);
  }, [currentIndex, zoneEnd]);

  const advanceZone = useCallback(() => {
    const nextZone = zone + 1;
    if (nextZone > 3) {
      setScreen(SCREENS.RESULTS);
      return;
    }
    setZone(nextZone);
    setCurrentIndex(zoneStart + ZONE_EMAIL_COUNTS[zone]);
    setConsecutivePerfect(0);
    setEarlyUnlocked(false);
    setRound(initialRoundState());
    setScreen(SCREENS.ZONE_INTRO);
  }, [zone, zoneStart]);

  const goToResults = useCallback(() => { setScreen(SCREENS.RESULTS); }, []);
  const goToLeaderboard = useCallback(() => { setScreen(SCREENS.LEADERBOARD); }, []);
  const goBackToResults = useCallback(() => { setScreen(SCREENS.RESULTS); }, []);

  const resetGame = useCallback(() => {
    setScreen(SCREENS.INTRO);
    setPlayer({ name: '', email: '' });
    setEmailPool([]);
    setCurrentIndex(0);
    setZone(1);
    setConsecutivePerfect(0);
    setEarlyUnlocked(false);
    setRound(initialRoundState());
  }, []);

  return {
    screen, player, emailPool, currentIndex, currentEmail,
    zone, zoneStart, zoneEnd, emailInZone, emailsInZone,
    consecutivePerfect, earlyUnlocked, round,
    startGame, completeIntro, completeTutorial, startZone,
    revealHint, selectL1, handleTimeout, submitRound,
    nextEmail, advanceZone, goToResults, goToLeaderboard,
    goBackToResults, resetGame,
  };
}
```

### 3b: `src/hooks/useScoring.js`

- [ ] **Step 2: Replace useScoring.js**

```js
import { useState, useCallback } from 'react';

export function useScoring() {
  const [totalScore, setTotalScore] = useState(0);
  const [perEmail, setPerEmail] = useState([]);
  const [zoneScores, setZoneScores] = useState({ 1: 0, 2: 0, 3: 0 });
  const [categoryCorrect, setCategoryCorrect] = useState({
    'Legitimate':          { correct: 0, total: 0 },
    'Spam & Junk':         { correct: 0, total: 0 },
    'Phishing & Spoofing': { correct: 0, total: 0 },
  });

  const scoreRound = useCallback(({ email, selectedL1, hintRevealed, timedOut }) => {
    const l1Correct = selectedL1 === email.level1;
    const points = l1Correct ? 2 : 0;

    const record = {
      emailId: email.id,
      zone: email.zone,
      selectedL1,
      correctL1: email.level1,
      l1Correct,
      hintUsed: hintRevealed,
      timedOut,
      points,
    };

    setPerEmail(prev => [...prev, record]);
    setTotalScore(prev => prev + points);
    setZoneScores(prev => ({ ...prev, [email.zone]: (prev[email.zone] || 0) + points }));
    setCategoryCorrect(prev => {
      const cat = email.level1;
      return {
        ...prev,
        [cat]: {
          correct: prev[cat].correct + (l1Correct ? 1 : 0),
          total: prev[cat].total + 1,
        },
      };
    });

    return record;
  }, []);

  const resetScoring = useCallback(() => {
    setTotalScore(0);
    setPerEmail([]);
    setZoneScores({ 1: 0, 2: 0, 3: 0 });
    setCategoryCorrect({
      'Legitimate':          { correct: 0, total: 0 },
      'Spam & Junk':         { correct: 0, total: 0 },
      'Phishing & Spoofing': { correct: 0, total: 0 },
    });
  }, []);

  return { totalScore, perEmail, zoneScores, categoryCorrect, scoreRound, resetScoring };
}
```

### 3c: `src/hooks/useBadges.js`

- [ ] **Step 3: Update badge conditions per spec**

Key changes:
- `EAGLE_EYE`: `categoriesCorrect.size >= 3` (was 6)
- `SNIPER`: remove `l2Correct`, check `!hintUsed` (was `cluesUsed === 0`)
- `PERFECT_EYE`: 30 emails, `l1Correct` only (was 25 + l2Correct)
- `ICE_COLD`: 10 hard emails, `l1Correct` only (was 5 + l2Correct + cluesUsed)
- `NO_HINTS_NEEDED`: `zoneHintsUsed === 0` (was `zoneCluesUsed === 0`)
- `GHOST_DETECTIVE`: `totalHintsUsed === 0` (was `totalCluesUsed === 0`)
- Updated badge descs

```js
import { useState, useCallback, useRef } from 'react';
import {
  ROUND_DURATION_SECONDS,
  LIGHTNING_READ_SECONDS,
  SNIPER_SECONDS,
  BEAT_THE_CLOCK_SECONDS,
} from '../config/game.js';

export const BADGES = {
  LIGHTNING_READ:   { id: 'LIGHTNING_READ',   name: 'Lightning Read',   icon: '⚡', rare: false, desc: 'Correct in under 10 seconds' },
  ON_FIRE:          { id: 'ON_FIRE',          name: 'On Fire',          icon: '🔥', rare: false, desc: '5 correct classifications in a row' },
  ZONE_CLEAR:       { id: 'ZONE_CLEAR',       name: 'Zone Clear',       icon: '✅', rare: false, desc: 'Complete a zone with no wrong answers' },
  SNIPER:           { id: 'SNIPER',           name: 'Sniper',           icon: '🎯', rare: false, desc: 'First email: correct, no hint, with time to spare' },
  BEAT_THE_CLOCK:   { id: 'BEAT_THE_CLOCK',   name: 'Beat the Clock',   icon: '⏱', rare: false, desc: 'Correct with under 5 seconds remaining' },
  EAGLE_EYE:        { id: 'EAGLE_EYE',        name: 'Eagle Eye',        icon: '🦅', rare: false, desc: 'Correctly identified all 3 email categories' },
  GHOST_DETECTIVE:  { id: 'GHOST_DETECTIVE',  name: 'Ghost Detective',  icon: '👻', rare: true,  desc: 'Full game — zero hints revealed' },
  ICE_COLD:         { id: 'ICE_COLD',         name: 'Ice Cold',         icon: '🧊', rare: true,  desc: 'All 10 Escalation emails classified correctly' },
  PERFECT_EYE:      { id: 'PERFECT_EYE',      name: 'Perfect Eye',      icon: '🔮', rare: true,  desc: 'All 30 emails classified correctly' },
  NO_HINTS_NEEDED:  { id: 'NO_HINTS_NEEDED',  name: 'No Hints Needed',  icon: '🕵', rare: true,  desc: 'Completed the full assessment without revealing any hints' },
};

export function useBadges() {
  const [earned, setEarned] = useState([]);
  const [pendingToast, setPendingToast] = useState(null);
  const streakRef = useRef(0);
  const categoriesCorrect = useRef(new Set());
  const firstEmailRef = useRef(true);
  const earnedSetRef = useRef(new Set());

  const earnBadge = useCallback((badgeId) => {
    if (earnedSetRef.current.has(badgeId)) return false;
    earnedSetRef.current.add(badgeId);
    setPendingToast(BADGES[badgeId]);
    setEarned(prev => [...prev, badgeId]);
    return true;
  }, []);

  const dismissToast = useCallback(() => setPendingToast(null), []);

  const checkAfterRound = useCallback(({ record, timeLeft, roundDuration = ROUND_DURATION_SECONDS }) => {
    const { l1Correct, hintUsed } = record;
    let unlockedAny = false;

    if (l1Correct) {
      streakRef.current += 1;
      categoriesCorrect.current.add(record.correctL1);
    } else {
      streakRef.current = 0;
    }

    if (firstEmailRef.current) {
      firstEmailRef.current = false;
      if (l1Correct && !hintUsed && timeLeft >= roundDuration - SNIPER_SECONDS) {
        unlockedAny = earnBadge('SNIPER') || unlockedAny;
      }
    }

    if (l1Correct && timeLeft >= roundDuration - LIGHTNING_READ_SECONDS) {
      unlockedAny = earnBadge('LIGHTNING_READ') || unlockedAny;
    }

    if (l1Correct && timeLeft > 0 && timeLeft <= BEAT_THE_CLOCK_SECONDS) {
      unlockedAny = earnBadge('BEAT_THE_CLOCK') || unlockedAny;
    }

    if (streakRef.current >= 5) {
      unlockedAny = earnBadge('ON_FIRE') || unlockedAny;
    }

    if (categoriesCorrect.current.size >= 3) {
      unlockedAny = earnBadge('EAGLE_EYE') || unlockedAny;
    }

    return { streak: streakRef.current, unlockedAny };
  }, [earnBadge]);

  const checkAfterZone = useCallback(({ zoneEmails, zoneHintsUsed }) => {
    if (!zoneEmails.length) return;
    const allCorrect = zoneEmails.every(r => r.l1Correct);
    if (allCorrect) earnBadge('ZONE_CLEAR');
    if (zoneHintsUsed === 0) earnBadge('NO_HINTS_NEEDED');
  }, [earnBadge]);

  const checkAfterGame = useCallback(({ perEmail, totalHintsUsed }) => {
    if (!perEmail.length) return;
    if (totalHintsUsed === 0) earnBadge('GHOST_DETECTIVE');

    const hardEmails = perEmail.filter(r => r.zone === 3);
    if (hardEmails.length === 10 && hardEmails.every(r => r.l1Correct)) {
      earnBadge('ICE_COLD');
    }

    if (perEmail.length === 30 && perEmail.every(r => r.l1Correct)) {
      earnBadge('PERFECT_EYE');
    }
  }, [earnBadge]);

  const resetBadges = useCallback(() => {
    setEarned([]);
    setPendingToast(null);
    streakRef.current = 0;
    categoriesCorrect.current = new Set();
    firstEmailRef.current = true;
    earnedSetRef.current = new Set();
  }, []);

  return { earned, pendingToast, dismissToast, checkAfterRound, checkAfterZone, checkAfterGame, resetBadges };
}
```

- [ ] **Step 4: Commit hooks**

```bash
git add src/hooks/useGameState.js src/hooks/useScoring.js src/hooks/useBadges.js src/utils/shuffle.js
git commit -m "feat: simplify game hooks — hintRevealed, 3 categories, 30-email scoring"
```

---

## Task 4: Fix `src/App.jsx` wiring

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Apply three targeted edits**

**Edit 1** — `handleSubmit`: remove `selectedL2`/`cluesRevealed`, use `hintRevealed`
```js
// Replace scoreRound call:
const record = sc.scoreRound({
  email: currentEmail,
  selectedL1: round.selectedL1,
  hintRevealed: round.hintRevealed,
  timedOut,
});
```

**Edit 2** — `handleNext`: use `zoneHintsUsed`
```js
const zoneEmails = sc.perEmail.filter(r => r.zone === gs.zone);
const zoneHintsUsed = zoneEmails.filter(r => r.hintUsed).length;
bg.checkAfterZone({ zoneEmails, zoneHintsUsed, zone: gs.zone });
```

**Edit 3** — `handleAdvanceZone`: use `totalHintsUsed`, fix tier thresholds
```js
const totalHintsUsed = sc.perEmail.filter(r => r.hintUsed).length;
bg.checkAfterGame({ perEmail: sc.perEmail, totalHintsUsed });
lb.submitScore({
  name: gs.player.name,
  email: gs.player.email,
  score: sc.totalScore,
  title: sc.totalScore >= 50 ? 'Threat Intelligence Lead' : sc.totalScore >= 30 ? 'Senior Analyst' : 'Junior Analyst',
  badges: bg.earned.length,
  zone1Score: sc.zoneScores[1],
  zone2Score: sc.zoneScores[2],
  zone3Score: sc.zoneScores[3],
});
```

**Edit 4** — `<GameRound>` render: rename `onRevealClue` → `onRevealHint`, remove `onSelectL2`
```jsx
<GameRound
  email={gs.currentEmail}
  zone={gs.zone}
  emailInZone={gs.emailInZone}
  emailsInZone={gs.emailsInZone}
  totalScore={sc.totalScore}
  round={gs.round}
  onRevealHint={gs.revealHint}
  onSelectL1={gs.selectL1}
  onSubmit={handleSubmit}
/>
```

**Edit 5** — `<ZoneComplete>` render: fix `maxZoneScore`
```jsx
maxZoneScore={20}
```
(was `gs.zone === 3 ? 20 : 40`)

- [ ] **Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "fix: remove L2/clue wiring from App, fix tier thresholds and maxZoneScore"
```

---

## Task 5: Update `src/components/Classifier.jsx`

**Files:**
- Modify: `src/components/Classifier.jsx`

Changes: Remove L2 row and `onSelectL2`, update L1_HELP to 3 categories, change section label, chip style.

- [ ] **Step 1: Replace Classifier.jsx**

```jsx
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { L1_CATEGORIES } from '../data/emails.js';

const L1_HELP = {
  'Legitimate': {
    desc: 'Genuine, authorized emails from trusted senders — receipts, alerts, and communications you actually signed up for.',
    signals: 'Verified domain, no urgency tricks, personalized, no requests for credentials.',
  },
  'Phishing & Spoofing': {
    desc: 'Deceptive emails crafted to steal credentials or personal data by impersonating trusted entities.',
    signals: 'Mismatched links, urgency, lookalike domain, asks for passwords or card details.',
  },
  'Spam & Junk': {
    desc: 'Unsolicited bulk email — promotions, prize claims, chain letters — with no targeted malicious intent.',
    signals: 'Mass send, unsolicited offer, exaggerated claims, unknown sender domain.',
  },
};

function HelpTooltip({ tooltip, color, onDismiss }) {
  const help = L1_HELP[tooltip.id];
  const { x, y, above } = tooltip.pos;

  return (
    <div style={{
      position: 'fixed',
      left: x,
      ...(above ? { bottom: window.innerHeight - y } : { top: y }),
      width: 272,
      zIndex: 9999,
      background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      border: `1.5px solid ${color}40`,
      borderRadius: 14,
      boxShadow: `0 12px 40px rgba(0,0,0,0.14), 0 0 0 1px rgba(255,255,255,0.6), 0 4px 0 ${color}`,
      padding: '14px 16px 12px',
      fontFamily: 'system-ui, sans-serif',
      animation: 'fadeSlideUp 0.18s ease',
      pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1C1C1E' }}>{tooltip.id}</span>
        <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 600, color: 'rgba(60,60,67,0.4)', letterSpacing: '0.06em' }}>
          CATEGORY
        </span>
      </div>
      <p style={{ fontSize: 12, color: '#3A3A3C', lineHeight: 1.55, margin: '0 0 8px' }}>
        {help.desc}
      </p>
      {help.signals && (
        <div style={{ fontSize: 11, color: 'rgba(60,60,67,0.6)', lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600, color: color }}>Look for: </span>
          {help.signals}
        </div>
      )}
      <div style={{ marginTop: 10, height: 2, borderRadius: 2, background: `${color}20`, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: color, borderRadius: 2, animation: 'tooltipCountdown 5s linear forwards' }} />
      </div>
    </div>
  );
}

export default function Classifier({ selectedL1, onSelectL1, disabled }) {
  const [tooltip, setTooltip] = useState(null);
  const hoverTimer   = useRef(null);
  const dismissTimer = useRef(null);

  function clearAll() {
    clearTimeout(hoverTimer.current);
    clearTimeout(dismissTimer.current);
  }

  function showAfterDelay(id, color, e) {
    clearAll();
    const rect = e.currentTarget.getBoundingClientRect();
    const above = rect.top > 180;
    const pos = {
      x: Math.min(Math.max(rect.left, 8), window.innerWidth - 280),
      y: above ? rect.top - 8 : rect.bottom + 8,
      above,
    };
    hoverTimer.current = setTimeout(() => {
      setTooltip({ id, color, pos });
      dismissTimer.current = setTimeout(() => setTooltip(null), 5000);
    }, 500);
  }

  function hide() { clearAll(); setTooltip(null); }

  const tooltipColor = tooltip
    ? L1_CATEGORIES.find(c => c.id === tooltip.id)?.color || '#0A84FF'
    : '#0A84FF';

  return (
    <div>
      {tooltip && createPortal(
        <HelpTooltip tooltip={tooltip} color={tooltipColor} onDismiss={() => setTooltip(null)} />,
        document.body
      )}

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#636366', letterSpacing: '0.08em' }}>
            CLASSIFY THIS EMAIL
          </div>
          <div style={{ fontSize: 10, color: 'rgba(60,60,67,0.65)', fontStyle: 'italic' }}>
            Hover for details
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {L1_CATEGORIES.map(cat => {
            const isSelected = selectedL1 === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => !disabled && onSelectL1(cat.id)}
                onMouseEnter={e => !disabled && showAfterDelay(cat.id, cat.color, e)}
                onMouseLeave={hide}
                disabled={disabled}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 500,
                  cursor: disabled ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                  transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                  ...(isSelected ? {
                    background: `${cat.color}1E`,
                    border: `1.5px solid ${cat.color}`,
                    color: cat.color,
                  } : {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#1C1C1E',
                  }),
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Classifier.jsx
git commit -m "feat: simplify Classifier to 3 L1 chips, remove L2 row and onSelectL2"
```

---

## Task 6: Update `src/components/GameRound.jsx`

**Files:**
- Modify: `src/components/GameRound.jsx`
- Delete: `src/components/ClueSystem.jsx`

Changes: Remove `ClueSystem` import, add inline hint UI in email column, remove `onSelectL2` prop, update zone label to use `ZONE_CONFIG`.

- [ ] **Step 1: Replace GameRound.jsx**

The key structural change: the right panel loses ClueSystem; the left (email) column gains an inline hint block below `<EmailCard>`. The zone label in the header uses `ZONE_CONFIG[zone].name`.

```jsx
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from '../hooks/useTimer.js';
import TimerBar from './TimerBar.jsx';
import EmailCard from './EmailCard.jsx';
import Classifier from './Classifier.jsx';
import gsap from 'gsap';
import { ROUND_DURATION_SECONDS } from '../config/game.js';
import { ZONE_CONFIG } from '../data/emails.js';

const glassCard = {
  background: 'rgba(255,255,255,0.62)',
  backdropFilter: 'blur(32px) saturate(180%)',
  WebkitBackdropFilter: 'blur(32px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.80)',
  borderRadius: 28,
  boxShadow: '0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)',
};

const glassDivider = {
  width: 1,
  background: 'rgba(255,255,255,0.55)',
  alignSelf: 'stretch',
  flexShrink: 0,
};

export default function GameRound({
  email, zone, emailInZone, emailsInZone, totalScore,
  round, onRevealHint, onSelectL1, onSubmit,
}) {
  const roundRef = useRef(round);
  useEffect(() => { roundRef.current = round; }, [round]);

  const scoreDisplayRef = useRef(null);
  const prevScoreRef = useRef(totalScore);
  useEffect(() => {
    if (!scoreDisplayRef.current) return;
    const from = prevScoreRef.current;
    const to = totalScore;
    if (from === to) return;
    gsap.fromTo(
      { val: from },
      { val: to, duration: 0.5, ease: 'power2.out',
        onUpdate: function () {
          if (scoreDisplayRef.current)
            scoreDisplayRef.current.textContent = Math.round(this.targets()[0].val);
        },
      }
    );
    gsap.fromTo(scoreDisplayRef.current,
      { scale: 1.25, color: '#34C759' },
      { scale: 1, color: '#1C1C1E', duration: 0.4, ease: 'back.out(2)' }
    );
    prevScoreRef.current = to;
  }, [totalScore]);

  function handleTimeout() { onSubmit(0, true); }

  const { timeLeft, phase, progress, start, stop } = useTimer(ROUND_DURATION_SECONDS, handleTimeout);

  useEffect(() => {
    start();
    return () => stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email?.id]);

  const canSubmit = !!round.selectedL1 && !round.submitted;

  function handleSubmit() {
    if (!canSubmit) return;
    stop();
    onSubmit(timeLeft, false);
  }

  const phaseColor = phase === 'green' ? '#34C759' : phase === 'amber' ? '#FF9500' : '#FF3B30';
  const urgencyLabel = phase === 'red' ? '⚠ Hurry!' : phase === 'amber' ? 'Running low' : null;
  const zoneName = ZONE_CONFIG[zone]?.name || `Zone ${zone}`;

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'stretch', justifyContent: 'center',
      padding: '20px 8vw',
      fontFamily: 'system-ui, sans-serif',
      boxSizing: 'border-box',
    }}>
      <div style={{ ...glassCard, width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Card header ── */}
        <div style={{ padding: '16px 28px 0', borderBottom: '1px solid rgba(255,255,255,0.55)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#1C1C1E', letterSpacing: '-0.02em' }}>
              Flagmail
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ display: 'flex', gap: 3 }}>
                {Array.from({ length: emailsInZone }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      background: i < emailInZone - 1 ? '#34C759' : i === emailInZone - 1 ? '#0A84FF' : 'rgba(0,0,0,0.10)',
                      scale: i === emailInZone - 1 ? 1.2 : 1,
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{ width: 18, height: 4, borderRadius: 2 }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93' }}>
                {zoneName} · {emailInZone}/{emailsInZone}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 600, letterSpacing: '0.06em' }}>SCORE</div>
              <div ref={scoreDisplayRef} style={{ fontSize: 20, fontWeight: 800, color: '#1C1C1E', lineHeight: 1, display: 'inline-block' }}>
                {totalScore}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14 }}>
            <TimerBar timeLeft={timeLeft} phase={phase} progress={progress} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 80, justifyContent: 'flex-end' }}>
              <AnimatePresence mode="wait">
                {urgencyLabel && (
                  <motion.span
                    key={urgencyLabel}
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    style={{ fontSize: 11, fontWeight: 700, color: phaseColor }}
                  >
                    {urgencyLabel}
                  </motion.span>
                )}
              </AnimatePresence>
              <span style={{ fontSize: 13, fontWeight: 700, color: phaseColor, minWidth: 30, textAlign: 'right', transition: 'color 0.3s' }}
                className={phase === 'red' ? 'anim-timerPulse' : ''}
              >
                {timeLeft}s
              </span>
            </div>
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

          {/* Left — Email + inline hint */}
          <AnimatePresence mode="wait">
            <motion.div
              key={email?.id}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{ flex: '0 0 58%', padding: '20px 24px 24px', overflowY: 'auto' }}
            >
              <EmailCard email={email} giveawayHighlight={false} />

              {/* ── Inline hint UI ── */}
              {!round.submitted && (
                <div style={{ marginTop: 12 }}>
                  {!round.hintRevealed ? (
                    <button
                      onClick={onRevealHint}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '6px 0', fontFamily: 'inherit',
                        color: 'rgba(60,60,67,0.55)', fontSize: 13,
                      }}
                    >
                      <span style={{ fontSize: 15 }}>ⓘ</span>
                      <span style={{ textDecoration: 'underline', textDecorationStyle: 'dotted' }}>Reveal Hint</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: 'rgba(60,60,67,0.35)', fontStyle: 'italic' }}>Hint shown</span>
                  )}

                  <AnimatePresence>
                    {round.hintRevealed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -6 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                        style={{
                          marginTop: 8,
                          background: 'rgba(255,193,7,0.08)',
                          borderLeft: '3px solid #FF9500',
                          borderRadius: '0 8px 8px 0',
                          padding: '10px 14px',
                          fontSize: 13,
                          color: '#3A3A3C',
                          fontStyle: 'italic',
                          lineHeight: 1.55,
                          overflow: 'hidden',
                        }}
                      >
                        {email?.clue}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div style={glassDivider} />

          {/* Right — Classifier + Submit */}
          <div style={{ flex: 1, padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
            <div style={{
              background: '#ffffff', borderRadius: 16, padding: '16px',
              border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <Classifier
                selectedL1={round.selectedL1}
                onSelectL1={onSelectL1}
                disabled={round.submitted}
              />
            </div>

            <motion.button
              onClick={handleSubmit}
              disabled={!canSubmit}
              whileHover={canSubmit ? { scale: 1.02 } : {}}
              whileTap={canSubmit ? { scale: 0.97 } : {}}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                background: canSubmit ? 'linear-gradient(135deg, #0A84FF 0%, #007AFF 100%)' : 'rgba(0,0,0,0.07)',
                color: canSubmit ? '#fff' : '#AEAEB2',
                fontSize: 15, fontWeight: 700,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                transition: 'background 0.18s ease, box-shadow 0.18s ease',
                boxShadow: canSubmit ? '0 4px 16px rgba(10,132,255,0.35)' : 'none',
                marginTop: 'auto',
              }}
            >
              Submit Classification
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Delete ClueSystem.jsx**

```bash
rm src/components/ClueSystem.jsx
```

- [ ] **Step 3: Commit**

```bash
git add src/components/GameRound.jsx
git rm src/components/ClueSystem.jsx
git commit -m "feat: replace ClueSystem with inline hint UI in GameRound"
```

---

## Task 7: Update Zone screens

### 7a: `src/components/ZoneIntroCard.jsx`

Replace local `ZONES` array with `ZONE_CONFIG` import. Update max points to `MAX_POINTS_PER_ZONE`.

- [ ] **Step 1: Replace ZoneIntroCard.jsx**

```jsx
import { motion } from 'framer-motion';
import { ZONE_CONFIG, MAX_POINTS_PER_ZONE } from '../data/emails.js';

const glass = {
  background: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.8)',
  borderRadius: 20,
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
};

const BRAND = '#0A84FF';

export default function ZoneIntroCard({ zone, onStart, earlyUnlocked }) {
  const meta = ZONE_CONFIG[zone];
  const zones = [1, 2, 3];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3, ease: 'easeOut' }}
          style={{ textAlign: 'center', marginBottom: 24 }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(60,60,67,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Veridian Security
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(10,132,255,0.1)', border: `1.5px solid ${BRAND}`,
            borderRadius: 20, padding: '6px 16px',
          }}>
            <span style={{ fontSize: 16 }}>{meta.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: BRAND, letterSpacing: '0.06em' }}>
              {meta.difficulty.toUpperCase()} · {meta.emails} EMAILS
            </span>
          </div>
        </motion.div>

        {/* Early unlock banner */}
        {earlyUnlocked && zone > 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26, delay: 0.1 }}
            style={{ ...glass, padding: '12px 20px', marginBottom: 16, borderLeft: '3px solid #FFD60A', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <motion.span animate={{ rotate: [0, -12, 12, -8, 8, 0] }} transition={{ delay: 0.4, duration: 0.55 }} style={{ fontSize: 20, display: 'inline-block' }}>⚡</motion.span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#B8860B' }}>EARLY UNLOCK</div>
              <div style={{ fontSize: 12, color: '#636366' }}>3 consecutive perfect scores unlocked this zone early!</div>
            </div>
          </motion.div>
        )}

        {/* 3-column zone grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
          {zones.map((z, idx) => {
            const zData = ZONE_CONFIG[z];
            const isCompleted = z < zone;
            const isLocked    = z > zone;
            return (
              <motion.div
                key={z}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: isLocked ? 0.55 : isCompleted ? 0.80 : 1, y: 0 }}
                transition={{ delay: 0.12 + idx * 0.07, duration: 0.3, ease: 'easeOut' }}
                style={{
                  ...glass, borderRadius: 14, padding: '16px 10px 14px', textAlign: 'center',
                  borderTop: `3px solid ${isLocked ? 'rgba(0,0,0,0.10)' : BRAND}`,
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: isLocked ? 'rgba(0,0,0,0.05)' : `${BRAND}18`,
                  border: `1.5px solid ${isLocked ? 'rgba(0,0,0,0.08)' : `${BRAND}40`}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
                }}>
                  {isLocked ? (
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                      <rect x="3" y="7" width="10" height="8" rx="2" fill="rgba(60,60,67,0.30)"/>
                      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="rgba(60,60,67,0.30)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ) : isCompleted ? (
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                      <path d="M4 8.5L7 11.5L12 5.5" stroke={BRAND} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span style={{ fontSize: 20 }}>{zData.icon}</span>
                  )}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: isLocked ? 'rgba(60,60,67,0.4)' : '#1C1C1E', lineHeight: 1.3, marginBottom: 6 }}>
                  {zData.name}
                </div>
                <div style={{
                  display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                  padding: '2px 7px', borderRadius: 6,
                  color: isLocked ? 'rgba(60,60,67,0.4)' : BRAND,
                  background: isLocked ? 'rgba(0,0,0,0.06)' : `${BRAND}18`,
                }}>
                  {isLocked ? 'LOCKED' : isCompleted ? 'DONE' : 'UP NEXT'}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mission briefing card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, type: 'spring', stiffness: 240, damping: 22 }}
          style={{ ...glass, padding: '28px 28px 24px', textAlign: 'center' }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.3 }}
            style={{ fontSize: 26, fontWeight: 800, color: '#1C1C1E', margin: '0 0 6px', letterSpacing: '-0.02em' }}
          >
            {meta.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.35 }}
            style={{ fontSize: 14, color: '#636366', margin: '0 0 24px', fontStyle: 'italic', lineHeight: 1.5 }}
          >
            {meta.mission}
          </motion.p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Emails', value: meta.emails },
              { label: 'Max Points', value: MAX_POINTS_PER_ZONE },
              { label: 'Time / Email', value: '45s' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.52 + i * 0.07, duration: 0.3, ease: 'easeOut' }}
                style={{ flex: 1, background: 'rgba(0,0,0,0.04)', borderRadius: 12, padding: '14px 8px' }}
              >
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1E' }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#636366', marginTop: 2 }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <motion.button
            onClick={onStart}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.3 }}
            style={{
              width: '100%', padding: '15px', borderRadius: 12, border: 'none',
              background: BRAND, color: '#fff', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(10,132,255,0.35)',
            }}
          >
            Start {meta.name} →
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
```

### 7b: `src/components/ZoneComplete.jsx`

Replace `ZONE_META` with `ZONE_CONFIG` import. Update CTA text and zone label.

- [ ] **Step 2: Apply targeted edits to ZoneComplete.jsx**

Remove the `ZONE_META` constant and add a `ZONE_CONFIG` import. Update two spots:

1. Top of file:
```js
import { ZONE_CONFIG } from '../data/emails.js';
// DELETE: const ZONE_META = { ... }
```

2. Where `meta` is declared:
```js
const meta = ZONE_CONFIG[zone];
```

3. CTA button text:
```jsx
{isLast ? 'View Results →' : `Continue to ${ZONE_CONFIG[zone + 1]?.name || 'Next Zone'} →`}
```

4. `ZONE {zone} COMPLETE` label → `{meta.name.toUpperCase()} COMPLETE`

- [ ] **Step 3: Commit zone screens**

```bash
git add src/components/ZoneIntroCard.jsx src/components/ZoneComplete.jsx
git commit -m "feat: use ZONE_CONFIG in ZoneIntroCard and ZoneComplete (new zone names)"
```

---

## Task 8: Update `src/components/ExplanationCard.jsx`

Remove L2 row. Add subCategory read-only pill. Simplify `buildScoreBreak`.

- [ ] **Step 1: Apply targeted edits**

**In the destructuring:**
```js
// Old:
const { l1Correct, timedOut, points, l1Points, l2Points, clueDeduction } = record;
// New:
const { l1Correct, timedOut, points } = record;
```

**Replace `buildScoreBreak`:**
```js
function buildScoreBreak() {
  if (points > 0) return `+${points} pts — L1 correct`;
  return '0 pts';
}
```

**Remove the L2 row block** (lines with `SUBCATEGORY (L2)`) — the entire second `<motion.div>` in the classification comparison section.

**After the email explanation text, add subCategory pill:**
```jsx
{email.subCategory && (
  <div style={{ marginTop: 10 }}>
    <span style={{
      fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
      color: '#636366', background: 'rgba(0,0,0,0.06)',
      border: '1px solid rgba(0,0,0,0.1)', borderRadius: 20,
      padding: '3px 10px',
    }}>
      {email.subCategory}
    </span>
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ExplanationCard.jsx
git commit -m "feat: remove L2 row from ExplanationCard, add subCategory pill"
```

---

## Task 9: Update `src/components/EmailCard.jsx`

Mail client fidelity tweaks per spec section 5.1.

- [ ] **Step 1: Apply targeted style changes**

**Subject line** (currently `fontSize: 13, fontWeight: 500`):
```js
fontSize: 15, fontWeight: 600, color: '#1C1C1E',
```

**Sender email** (currently `color: '#8E8E93'`):
```js
color: 'rgba(60,60,67,0.55)',
```

**Timestamp** (currently `new Date().toLocaleTimeString(...)`):
```js
`Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
```

**Body** (currently `fontSize: 14`):
```js
fontSize: 15, lineHeight: 1.65, color: '#3A3A3C',
```

**Header/body divider** (currently `borderBottom: '1px solid rgba(0,0,0,0.07)'`):
```js
borderBottom: '0.5px solid rgba(0,0,0,0.1)',
```

- [ ] **Step 2: Commit**

```bash
git add src/components/EmailCard.jsx
git commit -m "feat: mail client typography tweaks in EmailCard"
```

---

## Task 10: Update Results screens

### 10a: `src/components/ResultsScreen.jsx`

- [ ] **Step 1: Update tier thresholds and max score display**

Search for `70` / `40` in the file (old tier thresholds) and replace with `50` / `30`.
Update any `100` or `25` references for max score to `60` / `30`.
Replace zone number references (`Zone 1`, `Zone 2`, `Zone 3`) with `ZONE_CONFIG[n].name` (import `ZONE_CONFIG` from emails.js).

### 10b: `src/components/CompetencySummary.jsx`

- [ ] **Step 2: Audit for old categories**

Search for hardcoded category names (`Malicious Content`, `Abuse & Harassment`, `High-Risk Fraud`). Remove any mapping or display logic that references them — only `Legitimate`, `Spam & Junk`, and `Phishing & Spoofing` should appear.

- [ ] **Step 3: Commit**

```bash
git add src/components/ResultsScreen.jsx src/components/CompetencySummary.jsx
git commit -m "fix: update tier thresholds and category list in results screens"
```

---

## Task 11: Update Tutorial and Landing

### 11a: `src/components/TutorialScreen.jsx`

- [ ] **Step 1: Update tutorial content**

Replace any references to:
- 6 categories → 3 categories (Legitimate, Spam & Junk, Phishing & Spoofing)
- L2 subcategory selection → removed
- Multiple clues/hints → "1 hint per email, reveal with ⓘ button"
- 25 emails / 100 pts → 30 emails / 60 pts

### 11b: `src/components/LandingScreen.jsx`

- [ ] **Step 2: Audit for scoring/category references**

Read the file and fix any hardcoded category counts or score references.

- [ ] **Step 3: Commit**

```bash
git add src/components/TutorialScreen.jsx src/components/LandingScreen.jsx
git commit -m "fix: update Tutorial and Landing for simplified game mechanics"
```

---

## Task 12: Final verification

- [ ] **Step 1: Run dev server**

```bash
npm run dev
```

- [ ] **Step 2: Smoke test the full game flow**

Play through: Intro → Landing → Tutorial → Zone 1 intro → 3 emails → Zone 2 → 3 emails → Zone 3 → results.

Check:
- [ ] 3 classifier chips render, no L2 row
- [ ] Hint button appears in email column, reveals amber card on click
- [ ] "Hint shown" appears after reveal
- [ ] Zone names show "The Inbox", "The Queue", "The Escalation"
- [ ] ExplanationCard shows subCategory pill, no L2 row
- [ ] Results tier labels: ≥50 = Threat Intelligence Lead, ≥30 = Senior Analyst
- [ ] No console errors

- [ ] **Step 3: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "fix: post-smoke-test cleanups"
```
