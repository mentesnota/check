# Supabase setup

1. Create a Supabase project and open its SQL Editor.
2. Run [`schema.sql`](./schema.sql) to create the rate table and allow authenticated users to read it.
3. Copy the example file, then put the Project URL and publishable key from the project settings into `.env`:

   ```text
   Copy-Item .env.example .env
   ```

   Edit `.env` so it contains:

   ```text
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

4. Import the rate schedule from PowerShell. Use the project's **secret** key (or legacy `service_role` key) only in this local terminal; never put it in a `VITE_` variable or browser code:

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

5. Install dependencies and start the app with `npm install` and `npm run dev`. Users can create accounts and sign in with email and password. If email confirmation is enabled in Supabase Auth, they must confirm their address before signing in.
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

Vite embeds `VITE_` variables in the built frontend. Only use the publishable key there; never add the Supabase secret key to `.env` with a `VITE_` prefix or to Firebase Hosting.

The browser uses only the publishable key. Row-level security restricts rate reads to signed-in users; the secret key is only needed by the local import script.
