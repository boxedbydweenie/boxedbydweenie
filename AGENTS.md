<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep business data in typed `src/data` modules and access it through async `src/services` functions so a future API can replace mocks without changing pages.
- Wrap public content routes with the shared `SiteShell` so navigation, footer, announcement and WhatsApp behaviour stay consistent.
- Client-persisted mock state (cart, wishlist, user, orders) lives in services via src/lib/store.ts and is read with hooks in src/hooks/use-shop.ts, so services can later be swapped for real APIs.
