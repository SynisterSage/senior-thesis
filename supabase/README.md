# Supabase setup

Supabase is planned for curated trail content and, later, optional account sync. Hikes and wearable marks save on the phone first. The current migration creates **only** a publicly readable catalog of published trails; it has not been applied to a remote project.

1. Create or choose a Supabase project.
2. Copy `.env.example` to `.env`. Add the Project URL and **publishable** key from the project's Connect panel. Never put a service-role or secret key in an `EXPO_PUBLIC_` variable.
3. Apply `migrations/20261113000000_create_trails.sql` in the project's SQL editor or through a linked Supabase CLI project.
4. Add a curated trail row in the dashboard and set `published = true` when its content is ready.
5. Restart Expo to pick up the environment variables.

The app can initialize the client when configured. No account screen, cloud synchronization, or live trail query is wired into the UI yet. The `listPublishedTrails` function is ready for the trail selection page when its data and empty/error states are designed.

The migration uses row level security and grants client roles read access only to published trails. Before adding personal hikes or mark uploads, design the account flow and private policies separately.

Reference: [Supabase's Expo React Native quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native).
