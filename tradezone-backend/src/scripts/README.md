# Permission Management Scripts

This directory contains utility scripts for managing user permissions in the TradeZone application.

## Grant All Permissions Script

The `grant-permissions.ts` script allows you to grant all available permissions to a specific user.

### Available Permissions

- **AiChat**: Access to AI-powered chat features
- **investment**: Access to investment dashboard, positions, wallet, withdraw, and deposit features

### Usage

#### Grant All Permissions to a User

```bash
# Using npm script (recommended)
npm run grant-permissions user@example.com

# Using ts-node directly
npx ts-node src/scripts/grant-permissions.ts user@example.com

# Using node (if compiled)
node dist/scripts/grant-permissions.js user@example.com
```

#### List All Users

```bash
# Using npm script
npm run grant-permissions --list

# Using ts-node directly
npx ts-node src/scripts/grant-permissions.ts --list
```

### Examples

```bash
# Grant all permissions to a specific user
npm run grant-permissions shreyashkolhe@gmail.com

# List all users in the database
npm run grant-permissions --list
```

### What the Script Does

1. **Connects to Firebase**: Uses the Firebase Admin SDK to connect to your Firestore database
2. **Finds User**: Searches for the user by email address
3. **Updates Permissions**: Creates or updates the user's permissions document
4. **Grants All Access**: Sets all permission flags to `true`

### Output

When successful, you'll see output like:

```
🔍 Looking for user with email: shreyashkolhe@gmail.com
👤 Found user: shreyashkolhe (ID: 3oll8ZM3qAAH3wXWRD7X)
✅ Updated permissions for user 3oll8ZM3qAAH3wXWRD7X
🎉 Successfully granted all permissions to shreyashkolhe:
📋 Permissions granted:
   AiChat: ✅
   investment: ✅

🚀 User can now access:
   🤖 AI Chat
   💰 Investment Features
✅ Firebase connection closed
```

### Requirements

- Node.js and npm installed
- Firebase Admin SDK credentials configured
- User must exist in the users collection

### Troubleshooting

**Error: User not found**
- Ensure the email address is correct
- Check that the user exists in the Firebase users collection

**Error: Firebase initialization failed**
- Verify the Firebase service account key file exists
- Check the file path in the script

**Error: Permission denied**
- Ensure the Firebase service account has the necessary permissions
- Check Firestore security rules

### Security Note

This script grants **ALL** permissions to the specified user. Use it carefully and only for trusted users who should have full access to the application features.
