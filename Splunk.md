**Please check Splunk query based questions on email analysis and at end of the document I did add sample SPL query validation and Question 5 has RESPONSE VALIDATION LOGIC  for both Classification Validation and  SPL Validation Keywords. You can use this document in Claude to build the logic. Please let me know if your need any help or clarification.**





**Automation Flow:**

**Candidate opens question**

**↓**

**Selects primary classification**

**↓**

**Selects secondary diagnosis**

**↓**

**Writes SPL query**

**↓**

**Adds explanation**

**↓**

**System validates:**

**1. classification**

**2. SPL keywords**

**3. explanation concepts**

**↓**

**Score generated**

**↓**

**Reviewer sees pass/fail + feedback**



**Simple scoring model**



**Primary classification: 5 points**

**Secondary diagnosis: 3 points**

**SPL query: 10 points**

**Explanation: 5 points**

**Total: 23 points**



**Recommended grading:**

**20-23 = Strong**

**15-19 = Good**

**10-14 = Needs improvement**

**Below 10 = Not ready**

