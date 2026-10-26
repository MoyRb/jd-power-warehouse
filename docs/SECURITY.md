# Security

Security is an ongoing engineering process, not a guarantee.

Requirements:
- Server-side authorization
- Least privilege
- Secure session management
- Input validation
- Secrets outside source control
- Dependency review
- Payment webhook verification
- Idempotency for financial operations
- Transaction-safe stock mutations
- Audit logs
- Tenant isolation if multi-tenant
- Automated security regression testing

Before production:
- Threat modeling
- Authorization and isolation tests
- Dependency and secret scanning
- Backup and recovery verification
- Independent security review
- Manual release approval
