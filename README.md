
# Doubt Posting App

This is a code bundle for Doubt Posting App. The original project is available at https://www.figma.com/design/BoDmfcOdEcIkb4pkssTzvH/Doubt-Posting-App.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Full Setup Instructions

For detailed setup instructions including backend setup, authentication, and environment variables, please refer to the [SETUP.md](./SETUP.md) file.

## Backend

The backend is implemented as a Supabase Edge Function using Deno and the Hono framework. It requires environment variables for Supabase URL and service role key.

You can run the backend locally using Deno or deploy it to Supabase Edge Functions.

## Authentication

Authentication is handled via Supabase Auth. The frontend uses the Supabase client to manage user sessions and sign-in.

## Environment Variables

Create a `.env.local` file based on `.env.example` and fill in your Supabase project credentials.

## Running Locally

1. Install dependencies: `npm install`
2. Start frontend: `npm run dev`
3. (Optional) Run backend locally with Deno:
   ```bash
   cd src/supabase/functions/server
   deno run --allow-net --allow-env --allow-read index.tsx
   ```

## Additional Resources

- See [SETUP.md](./SETUP.md) for comprehensive setup guide.
- Supabase documentation: https://supabase.com/docs
- Deno documentation: https://deno.com/manual
  