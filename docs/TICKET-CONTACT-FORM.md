# TICKET: Create Contact Form

**Created**: July 26, 2025  
**Priority**: Medium  
**Type**: Feature Request  
**Status**: Open

## Description

Replace the current email link (mailto:teamflippi@gmail.com) with a proper contact form to improve user experience and reduce spam.

## Current Implementation

- Footer contains a "Contact" link
- Links to `mailto:teamflippi@gmail.com`
- Opens user's default email client

## Proposed Solution

### Frontend Contact Form
Create a modal or dedicated page with:
- Name field (required)
- Email field (required, validated)
- Subject dropdown (General Inquiry, Bug Report, Feature Request, Business Partnership)
- Message field (required, min 10 characters)
- Submit button
- Success/error messaging

### Backend API Endpoint
Create `/api/contact` endpoint that:
- Validates form data
- Implements rate limiting (max 5 submissions per IP per hour)
- Sends email to teamflippi@gmail.com
- Stores submissions in database for tracking
- Returns appropriate success/error responses

### Email Integration
Options:
1. SendGrid API (recommended for reliability)
2. AWS SES (if already using AWS)
3. Nodemailer with Gmail SMTP (simplest but less scalable)

## Benefits

1. **Better UX**: Users stay on site, no email client required
2. **Data Collection**: Track inquiries, response times
3. **Spam Prevention**: CAPTCHA and rate limiting
4. **Professional**: More polished than mailto links
5. **Mobile Friendly**: Works consistently across all devices

## Implementation Steps

1. Design contact form UI matching brand guidelines
2. Create React component with form validation
3. Implement backend endpoint with email service
4. Add rate limiting and spam protection
5. Test across all environments
6. Update privacy policy if collecting data

## Acceptance Criteria

- [ ] Form validates all required fields
- [ ] Email successfully sent to teamflippi@gmail.com
- [ ] User receives confirmation message
- [ ] Rate limiting prevents spam
- [ ] Mobile responsive design
- [ ] Accessible (WCAG compliant)
- [ ] Error handling for failed submissions

## Notes

- Consider adding CAPTCHA for additional spam protection
- May want to add auto-reply functionality later
- Could expand to include file attachments for bug reports