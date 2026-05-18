# 💰 StatVision Cost Estimation Report (May 2026)

This report provides an estimated cost structure for the StatVision project based on current pricing for May 2026. Costs are divided into two scenarios: **Alpha (Low Volume)** and **Growth (Medium Volume)**.

---

## 1. Infrastructure Cost Components

| Service | Component | Unit Price | Included Free Tier (Monthly) |
| :--- | :--- | :--- | :--- |
| **Gemini 2.5 Flash** | Video Analysis | **~$0.0046 / minute** | Varies (Free in AI Studio) |
| **GCP Cloud Run** | Compute & Requests | $0.000024 / vCPU-s | 180,000 vCPU-seconds |
| **GCP Storage** | Storage & Egress | $0.02 / GB & $0.12 / GB | 5 GB Storage |
| **Supabase** | Database & Auth | $25 / month (Pro) | 500 MB DB / 50k MAUs (Free) |
| **Vercel** | Frontend Hosting | $20 / month (Pro) | 100 GB Bandwidth (Hobby) |

---

## 2. Estimated Cost Scenarios

### Scenario A: Alpha / Stealth Mode (Low Volume)
*Focus: Personal testing and initial prototype validation.*
- **Usage**: 10 users, 50 videos/month (avg. 10 mins each = 500 mins).
- **Storage**: 10 GB total (Source videos + results).
- **Compute**: Within GCP Free Tier limits.

| Category | Item | Calculation | Estimated Cost |
| :--- | :--- | :--- | :--- |
| **AI** | Gemini Analysis | 500 mins × $0.0046 | $2.30 |
| **Storage** | GCS Storage & Egress | (10GB × $0.02) + (5GB × $0.12) | $0.80 |
| **Backend** | Cloud Run | All usage within Free Tier | $0.00 |
| **Platform** | Vercel & Supabase | Using Free/Hobby Tiers | $0.00 |
| **Total** | | | **~$3.10 / month** |

---

### Scenario B: Growing Product (Medium Volume)
*Focus: Active regional club or multiple team subscriptions.*
- **Usage**: 1,000 users, 500 videos/month (5,000 mins total).
- **Storage**: 100 GB total (Source videos retained for 30 days).
- **Bandwidth**: 150 GB egress (Video streaming and API traffic).

| Category | Item | Calculation | Estimated Cost |
| :--- | :--- | :--- | :--- |
| **AI** | Gemini Analysis | 5,000 mins × $0.0046 | $23.00 |
| **Storage** | GCS Storage & Egress | (100GB × $0.02) + (150GB × $0.12) | $20.00 |
| **Backend** | Cloud Run | (300k vCPU-s - 180k free) × Rate | $2.88 |
| **Platform** | Vercel Pro | Commercial license requirement | $20.00 |
| **Database** | Supabase Pro | Required for 100% uptime | $25.00 |
| **Total** | | | **~$90.88 / month** |

---

## 3. Strategic Cost Optimization

To keep costs low as you scale, we should prioritize the following:

1.  **Retention Policies**: Automatically delete or move source videos to "Archive" (Coldline) storage after 14-30 days to reduce GCS costs.
2.  **Batch Processing**: Use Gemini's **Batch API** for non-real-time analysis to save **50%** on token costs.
3.  **Context Caching**: For users re-watching or re-analyzing the same matches, implementing Context Caching can reduce input token costs by up to **90%**.
4.  **Local Development**: Continue using the **LocalStorageProvider** and **Pub/Sub Emulator** to ensure 100% of development/testing time remains at **$0 cost**.

---

## Verdict
The current architecture is extremely affordable for an Alpha launch. You can run the entire system for **less than $5/month** during your initial testing phase while maintaining a clear path to scale to thousands of users for under $100/month.
