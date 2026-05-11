# Security Specification for BioScan Verde

## Data Invariants
1. A user can only access their own profile and history subcollection.
2. Every history item must belong to the authenticated user (`userId` match).
3. Timestamps must be server-generated (`request.time`).
4. Document IDs must be validated (`isValidId`).
5. Users cannot elevate their own privileges or modify immutable fields like `email` or `createdAt` after creation.

## The "Dirty Dozen" Payloads (Denial Tests)

1. **Identity Spoofing**: Creating a history item with another user's `userId`.
2. **Path Poisoning**: Creating a document with a junk-character ID of 2KB.
3. **Ghost Field Update**: Updating a user profile with an extra `isAdmin` field.
4. **Timestamp Manipulation**: Providing a client-side `timestamp` instead of `request.time`.
5. **Orphaned Writes**: Writing to history without an authenticated session.
6. **Cross-User Leak**: Attempting to `list` another user's history collection.
7. **Resource Poisoning**: Sending a 5MB base64 string in the `image` field (Rules limit to 2MB).
8. **Malicious Schema**: Omitting required fields in a `User` creation.
9. **Update Gap**: Changing the `userId` of an existing history item.
10. **Shadow Read**: Attempting to `get` a user document of another user.
11. **PII Leak**: Unauthenticated read of the `users` collection.
12. **Recursive Access**: Trying to access `users/user1/history/item1/secrets/junk`.

## Conflict Report

| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
|------------|-------------------|-------------------|--------------------|
| users      | Blocked via uid   | N/A               | Blocked via size   |
| history    | Blocked via userId| N/A               | Blocked via length |
