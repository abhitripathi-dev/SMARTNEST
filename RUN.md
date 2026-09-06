# Society Management System

## Run
1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run `npm install`.
4. Apply both files in `supabase/migrations/` to your Supabase project (or use Supabase CLI migrations).
5. Run `npm run dev`.

## Verification
- `npm run typecheck`
- `npm run lint`
- `npm run build`

The source package does not include `node_modules` or secrets.
