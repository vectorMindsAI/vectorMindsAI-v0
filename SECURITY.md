# Security Policy

## Supported Versions

The following versions of AI City Research Agent are currently supported with security updates:

| Version | Supported          | Status                |
| ------- | ------------------ | --------------------- |
| 0.1.x   | :white_check_mark: | Active Development    |
| < 0.1   | :x:                | Pre-release (Unsupported) |

**Note:** As this project is in active development (version 0.1.0), we recommend always using the latest commit from the `main` branch for the most recent security patches and improvements.

---

## Security Features

### Built-in Security Measures

Our application implements multiple layers of security to protect your data:

#### 1. **Bring Your Own Key (BYOK) Architecture**
- No API keys are stored on our servers
- All API calls use your own credentials
- Complete control over your data and costs
- Zero vendor lock-in

#### 2. **Authentication & Authorization**
- NextAuth.js v5 integration for secure session management
- Google OAuth 2.0 support
- Secure password hashing with bcrypt (12 rounds)
- HTTP-only cookies for session tokens
- CSRF protection enabled by default

#### 3. **Environment Security**
- All sensitive credentials stored in `.env` files (never committed)
- `.env.example` template provided for safe configuration
- Environment variable validation at runtime
- Separate production and development configurations

#### 4. **API Security**
- Rate limiting on all API endpoints (configurable)
- Request validation and sanitization
- Error messages sanitized to prevent information leakage
- CORS configuration for cross-origin security

#### 5. **Database Security**
- MongoDB connection string encryption
- Parameterized queries to prevent injection attacks
- Schema validation with Mongoose
- Secure connection options (SSL/TLS support)

#### 6. **Monitoring & Logging**
- Sentry integration for error tracking
- PostHog analytics for usage monitoring
- Activity logs for research operations
- Audit trails for sensitive operations

---

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these guidelines:

### Where to Report

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, report security issues via:

1. **Email:** [priyansh56701@gmail.com](mailto:priyansh56701@gmail.com)
   - Subject line: `[SECURITY] Brief description`
   - Include detailed steps to reproduce
   - Attach screenshots, logs, or proof-of-concept if applicable

2. **GitHub Security Advisory** (Preferred)
   - Go to: [Security Advisories](https://github.com/priyansh56701-gmailcoms-projects/AI-Research-Agent/security/advisories)
   - Click "Report a vulnerability"
   - Fill out the private disclosure form

### What to Include

When reporting a vulnerability, please provide:

- **Description:** Clear explanation of the vulnerability
- **Impact:** Potential security impact (data exposure, unauthorized access, etc.)
- **Affected Components:** Specific files, endpoints, or features affected
- **Steps to Reproduce:** Detailed reproduction steps
- **Proof of Concept:** Code snippets, screenshots, or video demonstration
- **Suggested Fix:** If you have recommendations for remediation
- **Environment Details:** Version, OS, browser, deployment method (Docker/Local)

### Response Timeline

We are committed to addressing security issues promptly:

| Timeline | Action |
| -------- | ------ |
| **24 hours** | Initial acknowledgment of your report |
| **48-72 hours** | Preliminary assessment and severity classification |
| **7 days** | Detailed response with our action plan |
| **14-30 days** | Patch development and testing (depending on severity) |
| **Post-fix** | Public disclosure coordination with reporter |

### Severity Classification

We use the following severity levels:

- **Critical:** Remote code execution, authentication bypass, data breach
- **High:** Privilege escalation, SQL/NoSQL injection, XSS with data access
- **Medium:** Information disclosure, CSRF, insecure defaults
- **Low:** Minor information leakage, non-sensitive data exposure

### What to Expect

#### If Accepted:
- Acknowledgment in release notes and `SECURITY.md`
- Credit in our Hall of Fame (if desired)
- Coordinated disclosure timeline
- Notification when patch is released
- Potential eligibility for bug bounty (if program active)

#### If Declined:
- Detailed explanation of why the issue is not considered a vulnerability
- Alternative classification (bug, feature request, etc.)
- Recommendations for proper channels if applicable

### Disclosure Policy

- **Coordinated Disclosure:** We prefer coordinated disclosure with a 90-day embargo
- **Public Disclosure:** After patching, we'll publish a security advisory
- **CVE Assignment:** Critical vulnerabilities will receive CVE identifiers
- **Credit:** We publicly credit researchers (unless anonymity requested)

---

## Security Best Practices for Users

### API Key Management

:warning: **Never commit API keys to version control**

```bash
# Correct: Use environment variables
OPENAI_API_KEY=sk-...

# Incorrect: Hardcoding in source files
const apiKey = "sk-proj-..." // NEVER DO THIS
```

**Recommendations:**
- Use `.env.local` for local development (git-ignored by default)
- Rotate API keys regularly (monthly recommended)
- Use separate keys for development and production
- Enable API key restrictions (IP whitelisting, usage limits)
- Monitor API usage dashboards for anomalies

### Authentication Setup

Generate secure secrets:

```bash
# For NEXTAUTH_SECRET and AUTH_SECRET
openssl rand -base64 32

# Example output (use this as your secret):
# 7xF2kL9mP3qR8sT5vU0wX6yZ1aC4bD7eE
```

**Checklist:**
- [ ] `AUTH_SECRET` is 32+ characters random string
- [ ] `NEXTAUTH_URL` matches your production domain
- [ ] Google OAuth credentials are from Google Cloud Console
- [ ] `.env` files are never committed to git

### Database Security

**MongoDB Connection Strings:**

```bash
# Development
MONGODB_URI=mongodb://localhost:27017/research-agent

# Production (Azure Cosmos DB or MongoDB Atlas)
AZURE_COSMOS_CONNECTION_STRING=mongodb://user:pass@host/?ssl=true&replicaSet=globaldb

# Include these options for security:
# - ssl=true (always use TLS)
# - authSource=admin (specify auth database)
# - retryWrites=true (handle transient failures)
```

**Best Practices:**
- Use Azure Cosmos DB or MongoDB Atlas in production (managed security)
- Enable IP whitelisting in database firewall rules
- Use read-only credentials for analytics/reporting
- Regularly backup database with encryption
- Enable audit logging for sensitive collections

### Deployment Security

**Docker:**

```bash
# Use secrets for sensitive values (Docker Swarm/Kubernetes)
docker secret create nextauth_secret -

# Never use --privileged flag
# Always scan images for vulnerabilities
docker scan your-image:latest
```

**Vercel/Production:**
- Set environment variables in platform dashboard (never in code)
- Enable automatic security headers (Vercel does this by default)
- Use preview deployments for testing before production
- Enable DDoS protection and rate limiting
- Configure custom domains with HTTPS only

### Rate Limiting Configuration

Adjust these based on your needs:

```bash
# .env.local
RATE_LIMIT_MAX=100          # Max requests per window
RATE_LIMIT_WINDOW=60000     # Time window in milliseconds (60s)
```

**Recommended Settings:**

| Environment | Max Requests | Window | Use Case |
| ----------- | ------------ | ------ | -------- |
| Development | Unlimited    | N/A    | Testing  |
| Staging     | 1000         | 60s    | QA       |
| Production  | 100          | 60s    | Public API |
| Enterprise  | 5000         | 60s    | High volume |

---

## Security Checklist for Contributors

Before submitting a pull request:

- [ ] No API keys, tokens, or credentials in code
- [ ] All user inputs are validated and sanitized
- [ ] Database queries use parameterized statements
- [ ] Authentication checks on protected routes
- [ ] Error messages don't expose sensitive information
- [ ] Dependencies are up-to-date (`npm audit` passes)
- [ ] HTTPS is enforced in production configuration
- [ ] CORS settings are appropriately restrictive
- [ ] Rate limiting is implemented on new endpoints
- [ ] Security headers are configured (CSP, HSTS, etc.)

---

## Dependency Security

### Automated Monitoring

We use the following tools to monitor dependencies:

- **Dependabot:** Automatic PR creation for security updates (see `.github/dependabot.yml`)
- **npm audit:** Regular scans for known vulnerabilities
- **GitHub Security Advisories:** Automatic alerts for affected packages

### Update Policy

- **Critical vulnerabilities:** Patched within 24 hours
- **High vulnerabilities:** Patched within 7 days
- **Medium vulnerabilities:** Patched in next minor release
- **Low vulnerabilities:** Patched in next major release

### Running Security Audits

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (if possible)
npm audit fix

# Force fix (may introduce breaking changes)
npm audit fix --force

# View detailed report
npm audit --json
```

---

## Security Headers

Our application implements the following security headers:

```typescript
// next.config.mjs
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]
```

---

## Incident Response Plan

In the event of a security incident:

1. **Detection:** Identify and confirm the security issue
2. **Containment:** Isolate affected systems immediately
3. **Investigation:** Assess scope, impact, and root cause
4. **Eradication:** Remove threat and patch vulnerabilities
5. **Recovery:** Restore systems to normal operation
6. **Communication:** Notify affected users if necessary
7. **Post-Mortem:** Document lessons learned and improve

**Contact for Incidents:**
- Email: [priyansh56701@gmail.com](mailto:priyansh56701@gmail.com)
- Subject: `[URGENT] Security Incident`

---

## Compliance & Standards

This project aims to comply with:

- **OWASP Top 10:** Mitigation of common web vulnerabilities
- **GDPR:** Data privacy and user consent (EU users)
- **SOC 2 Type II:** Security controls (for enterprise deployments)
- **CIS Benchmarks:** Infrastructure security hardening

---

## Security Roadmap

Planned security enhancements:

- [ ] Two-factor authentication (2FA/MFA)
- [ ] Role-based access control (RBAC)
- [ ] API key rotation automation
- [ ] Encrypted database backups
- [ ] Security audit logging dashboard
- [ ] Penetration testing results
- [ ] Bug bounty program
- [ ] SOC 2 compliance certification

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/deploying#security-headers)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
- [Auth.js Security](https://authjs.dev/reference/core#security)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

## Security Hall of Fame

We recognize and thank the following security researchers:

<!-- Add names here as vulnerabilities are reported and fixed -->

*No vulnerabilities reported yet. Be the first!*

---

## Contact

**Security Team:** [priyansh56701@gmail.com](mailto:priyansh56701@gmail.com)

**PGP Key:** (To be added for encrypted communications)

**Project Repository:** [GitHub - AI Research Agent](https://github.com/priyansh56701-gmailcoms-projects/AI-Research-Agent)

---

**Last Updated:** February 8, 2026

**Policy Version:** 1.0.0
