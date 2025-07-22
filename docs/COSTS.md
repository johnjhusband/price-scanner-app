# Flippi.ai Cost Breakdown

## Monthly Recurring Costs

### 1. Infrastructure (DigitalOcean)
**Estimated: $20-40/month**

Current setup (single droplet hosting 3 environments):
- Basic Droplet (2GB RAM, 1 CPU): $18/month
- Standard Droplet (4GB RAM, 2 CPU): $24/month  
- General Purpose (8GB RAM, 2 CPU): $48/month

*Note: Actual droplet size needs verification on DigitalOcean dashboard*

Includes:
- 1-3 TB bandwidth (depending on plan)
- Automated backups: +20% of droplet cost (optional)
- Snapshots: $0.06/GB/month (if enabled)

### 2. OpenAI API Usage
**Estimated: $10-100/month** (highly variable)

Pricing for GPT-4o-mini:
- Input: $0.150 per 1M tokens (~750k words)
- Output: $0.600 per 1M tokens (~750k words)

Typical usage per scan:
- Input: ~500 tokens (image + prompt)
- Output: ~200 tokens (analysis)
- Cost per scan: ~$0.0002 (0.02 cents)

Monthly estimates:
- 1,000 scans/month: ~$0.20
- 10,000 scans/month: ~$2
- 100,000 scans/month: ~$20
- 500,000 scans/month: ~$100

### 3. Domain Names  
**Fixed: $36/year per domain** (~$3/month each)

Three domains:
- app.flippi.ai: $36/year
- green.flippi.ai: $36/year  
- blue.flippi.ai: $36/year
- **Total**: $108/year ($9/month)

## One-Time or Annual Costs

### SSL Certificates
**Cost: $0** (Let's Encrypt - free forever)
- Auto-renewing every 90 days
- No manual intervention needed

### GitHub
**Cost: $0** (public repository)
- Unlimited public repositories
- GitHub Actions included (2,000 minutes/month)
- No charges for current usage

## Potential Future Costs

### If Scaling Up:

1. **CDN/Asset Delivery**
   - Cloudflare: Free tier likely sufficient
   - AWS CloudFront: ~$0.085/GB transferred

2. **Monitoring/Analytics**
   - Basic: Free (PM2 monitoring)
   - Advanced: DataDog (~$15/host/month)

3. **Email Service (for notifications)**
   - SendGrid: Free tier (100 emails/day)
   - Paid: Starting at $15/month

4. **Database (if adding persistence)**
   - PostgreSQL on DigitalOcean: +$15/month
   - Managed database: +$60/month

5. **Load Balancer (if needed)**
   - DigitalOcean Load Balancer: +$12/month

## Cost Optimization Tips

### Reduce Infrastructure Costs:
1. Use single environment droplet for dev/staging
2. Downsize droplet if CPU/RAM usage is low
3. Use snapshots instead of automated backups

### Reduce OpenAI Costs:
1. Implement response caching
2. Rate limit per IP address
3. Add authentication to limit usage
4. Use shorter prompts/responses

### Monitor Usage:
1. Set up DigitalOcean billing alerts
2. Monitor OpenAI usage dashboard
3. Track bandwidth consumption
4. Review PM2 metrics for resource usage

## Total Cost Summary

### Current Estimated Monthly Costs:
- **Minimum** (low usage): ~$30/month
  - Droplet: $20
  - OpenAI: $1
  - Domains: $9

- **Typical** (moderate usage): ~$60/month
  - Droplet: $30
  - OpenAI: $20
  - Domains: $9

- **Maximum** (high usage): ~$150/month
  - Droplet: $40
  - OpenAI: $100
  - Domains: $9

### Annual Projection:
- **Minimum**: ~$360/year
- **Typical**: ~$720/year
- **Maximum**: ~$1,800/year

## Payment Methods & Billing

### DigitalOcean
- Billing cycle: Monthly
- Payment methods: Credit card, PayPal
- Billing date: Based on signup date

### OpenAI
- Billing cycle: Monthly
- Payment methods: Credit card
- Usage-based: Pay for what you use
- No minimum commitment

### Domains
- Billing cycle: Annual
- Payment methods: Varies by registrar
- Auto-renewal recommended

---
*Last updated: July 2025*  
*Note: Costs are estimates based on typical pricing. Actual costs may vary.*