<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Theme: dark tokens live in `:root`, the light theme overrides them under `html.light` (toggled by `src/lib/theme.ts`, saved in localStorage, applied by an inline head script). Why: no flash on load and every component themes through tokens.
- Anything drawn on top of a photo uses the fixed `photo-*`/`on-photo` tokens, never theme tokens. Why: the photo's black gradient stays dark in both themes.
- Shop contact and hours shown in "Fale conosco"/"Sobre" come from `SHOP_CONTACT` in `src/components/app/brand.ts`; null fields show as "A definir". Why: one place to update contact info.
- Client WhatsApp rule lives in `src/lib/phone.ts` (tested) and is re-checked in the `bookings_before_write` trigger; phones are stored as digits only. Why: the barber relies on it and the browser alone can be bypassed.
