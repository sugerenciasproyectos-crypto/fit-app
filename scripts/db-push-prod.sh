#!/usr/bin/env sh
# Aplica las migraciones pendientes en calorias-prod y vuelve a enlazar dev.
set -e
npx supabase link --project-ref qizmwwulrqxnurxuerlf >/dev/null
npx supabase db push --remote --yes
npx supabase link --project-ref jgugebrqcfdrxprswlyd >/dev/null
