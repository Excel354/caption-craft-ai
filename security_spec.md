# Security Specification & Threat Model

## Data Invariants
1. **Identity Isolation**: All user-authored documents (profiles, saved captions, upgrade requests) exist strictly under `/users/{userId}` where `userId == request.auth.uid`. No user may read, write, or list documents of another user.
2. **Key & Type Integrity**: All writes are vetted by `isValid[Entity]` helpers verifying field types, string boundaries (`size()`), and required properties.
3. **Immutability of Identity**: `userId` and document identifiers are immutable upon creation.
4. **No Shadow Writes**: Extra untyped fields are blocked via schema validation.
5. **State Integrity**: Upgrade requests start strictly with `status == 'pending'`.

## The Dirty Dozen Payloads
1. **Unauthenticated Profile Creation**: Write to `/users/abc` with `request.auth == null`.
2. **Cross-User Profile Spoofing**: User `auth_123` attempting to write to `/users/auth_456`.
3. **Oversized String Injection**: Saving caption with 50,000 character topic to exhaust storage.
4. **Invalid Platform Injection**: Saving caption with `platform: 'malicious_platform'`.
5. **Array Exhaustion Attack**: Saving caption with 10,000 hashtags.
6. **Cross-User Caption Theft**: User `auth_123` attempting to query or read `/users/auth_456/savedCaptions`.
7. **Privilege Escalation on User Profile**: Setting `plan: 'super_admin'` or non-enum value.
8. **Malicious Document ID Poisoning**: Using 2,000-character non-alphanumeric document ID.
9. **Upgrade State Hijacking**: Creator attempting to create upgrade request directly with `status: 'approved'`.
10. **Ghost Field Injection**: Adding `isAdmin: true` into `SavedCaption` payload.
11. **Altering Immutable Owner**: Updating existing caption to change `userId` to another user.
12. **Blanket Query Scraping**: Attempting collectionGroup query across all users' saved captions.
