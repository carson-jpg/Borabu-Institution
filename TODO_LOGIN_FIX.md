# Login Fix Plan

## Problem
Account creation works but login fails with "invalid email or password" due to double password hashing.

## Root Cause
- Registration route manually hashes password before creating User instance
- User model pre-save hook also hashes password
- This causes double hashing, making login comparison fail

## Steps to Fix
1. [x] Edit server/routes/auth.js registration route to remove manual password hashing
2. [ ] Test registration and login functionality
3. [ ] Verify login works correctly

## Files to Edit
- server/routes/auth.js (registration route)

## Current Status
- Step 1 completed: Removed manual password hashing from registration route
- Ready for testing
