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

4. Import the rate schedule from PowerShell. Use the project's **service_role** key only in this local terminal; never put it in a `VITE_` variable or browser code:

   ```powershell
   $env:SUPABASE_URL = "https://your-project-id.supabase.co"
   $secureKey = Read-Host "Enter the Supabase service role key" -AsSecureString
   $keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
   try {
     $env:SUPABASE_SERVICE_ROLE_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)
     npm run seed:direct-costs
   } finally {
     Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY -ErrorAction SilentlyContinue
     [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
     $secureKey.Dispose()
   }
   ```

5. Install dependencies and start the app with `npm install` and `npm run dev`. Users can create accounts and sign in with email and password. If email confirmation is enabled in Supabase Auth, they must confirm their address before signing in.
6. When deploying to Vercel or Netlify, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as the site's environment variables, then redeploy.

The browser uses only the publishable key. Row-level security restricts rate reads to signed-in users; the secret key is only needed by the local import script.
