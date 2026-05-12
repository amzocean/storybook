# StoryNook: Vercel → Render.com Migration Plan

## Status: ON HOLD — No longer needed for timeout reasons

### Update (May 2026)

The original motivation for this migration was a belief that Vercel Hobby caps serverless functions at 10s, which would cause DALL-E image generation (12-17s per image) to timeout. **This turned out to be incorrect.**

**Findings:**
- Vercel Hobby's **Proxied Request Timeout is 120 seconds** (verified from Vercel's limits page, updated March 2026)
- The `maxDuration = 300` export in route.ts may or may not be respected on Hobby, but the 120s proxy timeout is more than sufficient
- Actual image generation timing (from production logs): **12-17s per page** — well within the 120s limit
- The actual image generation failure we encountered was **DALL-E content policy rejections** (real children's names in prompts), not timeouts. This was fixed by sanitizing names from image prompts.

**Conclusion:** There is no timeout problem on Vercel Hobby. This migration plan is preserved for reference but is not needed unless other Vercel limitations arise (e.g., hitting the 100 deployments/day limit, 4 CPU-hrs/month, or 1M invocations/month).

---

## Original Problem (Debunked)

~~DALL-E 3 image generation takes 20-40s per image, but Vercel Hobby caps serverless functions at 10s.~~ Vercel Hobby actually allows 120s proxy timeout. Render.com ($7/mo Starter) would run a persistent Node.js server with no timeout limits, but this is unnecessary given the actual limits.

## Approach

Migrate the Next.js deployment from Vercel to Render.com. The database (Supabase Postgres) and image storage (Supabase Storage) are external and unchanged. Only the compute layer moves.

---

## Todos

### 1. prepare-render-config
**Prepare Render deployment config**
- render.yaml blueprint already created and pushed
- Verify build/start commands work: `npm install && npm run build` / `npm run start`
- Confirm Node.js version compatibility (add engines field to package.json if needed)

### 2. clean-up-vercel-artifacts
**Remove Vercel-specific code**
- Remove `maxDuration` export from `app/api/generate/route.ts` (no longer needed on persistent server)
- Review next.config.ts for any Vercel-specific settings (currently clean)
- Check for any Vercel-specific env vars or edge runtime declarations

### 3. deploy-to-render
**Deploy on Render.com**
- Go to render.com/dashboard -> New -> Blueprint
- Connect the `amzocean/storybook` GitHub repo
- Select Starter plan ($7/mo)
- Enter env vars: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- Set NODE_ENV=production
- Verify build succeeds and app starts

### 4. smoke-test-render
**Verify the app works on Render**
- Test homepage loads and shows published stories
- Test story reader works (existing stories + images render)
- Test story creation end-to-end (outline -> images -> publish)
- Confirm images generate without timeout
- Test admin dashboard (PIN, moderation queue)

### 5. migrate-dns
**Point storysparks.fun to Render**
- Get Render's IP / CNAME from the Render dashboard
- Update GoDaddy DNS records:
  - A record `@` -> Render IP (currently `216.198.79.1` for Vercel)
  - CNAME `www` -> Render CNAME (currently `a19d443c46f74f61.vercel-dns-017.com.`)
- Wait for DNS propagation (up to 48h, usually minutes)
- Verify SSL auto-provisions on Render

### 6. update-documentation
**Update DOCUMENTATION.md**
- Change "Deployed on Vercel" to "Deployed on Render.com"
- Update deployment section with Render instructions
- Update DNS records table with Render values
- Update troubleshooting section (remove Vercel cold-start notes, rate limit reset caveat)
- Note that rate limiting now persists across requests (no cold start resets)

### 7. decommission-vercel
**Remove Vercel deployment**
- Verify storysparks.fun resolves to Render and works
- Remove custom domain from Vercel project
- Optionally delete the Vercel project (the fallback URL storybook-three-lime.vercel.app will stop working)

---

## Dependencies

- 2 (clean-up-vercel) depends on 1 (prepare-render-config)
- 3 (deploy-to-render) depends on 2
- 4 (smoke-test) depends on 3
- 5 (migrate-dns) depends on 4 (only switch DNS after confirming Render works)
- 6 (update-docs) depends on 5
- 7 (decommission-vercel) depends on 5

## Notes

- Zero downtime approach: deploy on Render first, smoke test via Render URL, then switch DNS
- All data lives in Supabase (external) -- nothing to migrate
- Keep Vercel running until DNS fully propagates and Render is confirmed working
- Render Starter: 512MB RAM, 0.5 CPU -- sufficient for a family/small-audience app
