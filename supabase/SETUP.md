# Supabase setup

1. Create a Supabase project and open its SQL Editor.
2. Run [`schema.sql`](./schema.sql) to create the rate table and its authenticated add/replace functions. Every signed-in user can edit the shared rate library.
3. For the one-time rate import, open **Table Editor → direct_cost_items → Insert → Import data from CSV** and upload [`import/direct-cost-items.csv`](./import/direct-cost-items.csv). It contains all 1,273 rows and the matching `source_row` primary keys. [`import/direct-cost-items.xlsx`](./import/direct-cost-items.xlsx) is the same data in an Excel workbook; use the CSV for Supabase's importer.
4. Copy the example file, then put the Project URL and publishable key from the project settings into `.env`:

   ```text
   Copy-Item .env.example .env
   ```

   Edit `.env` so it contains:

   ```text
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

5. Alternatively, import or refresh the rate schedule from PowerShell. Use the project's **secret** key (or legacy `service_role` key) only in this local terminal; never put it in a `VITE_` variable or browser code:

   ```powershell
   $env:SUPABASE_URL = "https://your-project-id.supabase.co"
   $secureKey = Read-Host "Enter the Supabase secret/service-role key" -AsSecureString
   $keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
   try {
     $env:SUPABASE_SECRET_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)
     npm run seed:direct-costs
   } finally {
     Remove-Item Env:SUPABASE_SECRET_KEY -ErrorAction SilentlyContinue
     [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
     $secureKey.Dispose()
   }
   ```

6. Install dependencies and start the app with `npm install` and `npm run dev`. Users can create accounts and sign in with email and password. If email confirmation is enabled in Supabase Auth, they must confirm their address before signing in.
## Firebase Hosting

The Firebase configuration serves the Vite build from `dist` and rewrites app routes to `index.html`. The app uses Supabase for authentication and data; Firebase only hosts the frontend.

1. Install the Firebase CLI and sign in:

   ```powershell
   npm install -g firebase-tools
   firebase login
   ```

2. From the project root, select your Firebase project:

   ```powershell
   firebase use --add
   ```

3. Ensure `.env` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, then build and deploy:

   ```powershell
   npm run build
   firebase deploy --only hosting
   ```

4. Firebase will provide a free address such as `https://your-project-id.web.app`. In Supabase **Authentication → URL Configuration**, set that as the Site URL and add it to the allowed redirect URLs. Keep `localhost:5173` in the redirect list for local development.

The Firebase CLI has also created GitHub Actions workflows in `.github/workflows`. For automatic deploys, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under the GitHub repository's **Settings → Secrets and variables → Actions**. Confirm that the Firebase CLI-created `FIREBASE_SERVICE_ACCOUNT_BUILDWISE_CON_ESTIMATOR` secret exists. Push to `main` to deploy to production; pull requests get a preview deployment.

Vite embeds `VITE_` variables in the built frontend. Only use the publishable key there; never add the Supabase secret key to `.env` with a `VITE_` prefix or to Firebase Hosting.

The browser uses only the publishable key. Row-level security restricts access to signed-in users; the secret key is only needed by the local import script.
