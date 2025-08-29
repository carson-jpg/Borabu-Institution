# Additional Steps for Login Fix

## Resetting Existing User Passwords

Since the server is deployed on Render and existing users may have double-hashed passwords, the following options are available:

1. Use the script `server/scripts/fixDoubleHashedPasswords.js` to attempt fixing double-hashed passwords in the database.
2. Alternatively, reset all user passwords to a default value using the same script.

## Instructions to Run the Script

- SSH or connect to your Render server environment.
- Run the script with Node.js:
  ```
  node server/scripts/fixDoubleHashedPasswords.js
  ```
- The script currently runs the "fix double-hashed passwords" option by default.
- To reset all passwords instead, uncomment the relevant line in the script.

## Next Steps

- After running the script, test login functionality again.
- Inform users to reset their passwords if needed.

## Assistance

- I can help you modify or extend the script if needed.
- I can help you with instructions for running the script on Render.

Please let me know how you would like to proceed.
