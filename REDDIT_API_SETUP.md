# Reddit API Setup Instructions

To switch over to the official, free Reddit API and bypass datacenter IP bans, follow these steps to generate a "Personal Use Script" credential.

### 1. Register as a Developer
Reddit now requires all users to register as developers before creating an app.
1. Go to the Reddit Apps page: [https://www.reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. At the very top of the page, click the blue link that says **"register to use the API"**.
3. Fill out the quick developer registration form and agree to their Developer Terms.

### 2. Create the App
1. Go back to [https://www.reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Scroll to the bottom and click the **"are you a developer? create an app..."** button.
3. Fill out the form with these details:
   - **name:** `CreatorFeed Scraper` (or any name you prefer)
   - **App type:** Select the **"script"** radio button (This is required for server automation).
   - **description:** (Leave blank)
   - **about url:** (Leave blank)
   - **redirect uri:** `http://localhost:3000` (Required by Reddit, but won't be used).
4. Check the **"I'm not a robot"** reCAPTCHA box.
5. Click **"create app"**.

### 3. Copy the Credentials
Once created, you will see a box with your new app details:
- **Client ID:** The random string of characters directly under your app name (e.g., `CreatorFeed Scraper`) and next to the icon.
- **Client Secret:** The random string of characters next to the label `secret`.

### 4. Provide Credentials
Paste the following details back into the chat:
1. `Client ID`
2. `Client Secret`
3. The `Reddit Username` and `Password` for the account you used to create the app. *(Reddit's API requires a user account to authenticate a "script" type app).*

Once provided, the scraper will be rewritten to use the official NodeJS Reddit API wrapper (`snoowrap`), permanently fixing the IP ban issue!
