# Deploy the Doginal Dogs Notebook to Netlify

You have two files. Pick **ONE** path.

- `doginal-notebook-dist.zip` — already built. Fastest. Drag, drop, done.
- `doginal-notebook-project.zip` — the source code. Use this if you want easy updates later.

Your database (Supabase) is already live and connected — nothing to set up there.

---

## PATH A — Drag & drop (fastest, ~2 minutes)

Best for getting a link into Discord *today*.

1. Unzip **`doginal-notebook-dist.zip`**. You'll get a folder called `dist`.
2. Go to **https://app.netlify.com/drop** (sign up / log in — free; you can use your GitHub or email).
3. Drag the **`dist`** folder onto the drop zone.
4. Wait ~20 seconds. Netlify gives you a live link like `https://random-name-1234.netlify.app`.
5. That's it — open it, sign in with your X handle, and it works.

**Downside of Path A:** to push an update later, you drag a new `dist` folder each time. Fine for now; Path B is nicer long-term.

---

## PATH B — Connect to GitHub (auto-updates, ~10 minutes)

Best if you'll keep improving it. Every change auto-deploys.

1. Unzip **`doginal-notebook-project.zip`** → folder `ddn-app`.
2. Create a free GitHub account if you don't have one (github.com).
3. Make a new repository (name it e.g. `doginal-notebook`), then upload the
   **contents of `ddn-app`** to it (GitHub's web uploader works, or GitHub Desktop).
   - Make sure `package.json`, `index.html`, the `src` folder, and `netlify.toml` are at the repo root.
4. Go to **https://app.netlify.com** → **Add new site** → **Import an existing project** → **GitHub** → pick your repo.
5. Netlify reads `netlify.toml` automatically, so the settings are already correct:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click **Deploy**. First build takes ~1–2 minutes. You get a live link.
7. From now on, any change you push to GitHub redeploys automatically.

---

## Give it a real name (optional, both paths)

The default URL is ugly (`random-name-1234.netlify.app`). To fix:

- **Free Netlify subdomain:** Site settings → *Domain management* → *Options* →
  *Edit site name* → type `doginal-notebook` → your link becomes
  `https://doginal-notebook.netlify.app`.
- **Your own domain** (e.g. `notebook.doginaldogs.com`): Domain management →
  *Add a custom domain* → follow the DNS steps. Needs access to the doginaldogs.com
  DNS settings.

---

## Share it in Discord

Once you have the link, just paste it in your Discord. Anyone who clicks:

1. Enters their **X handle** + a **passcode** (they pick it the first time — that
   creates their account).
2. Sees notebooks they own or that someone shared with them.
3. You (as a notebook owner) use the **Share** button to grant each handle
   **Can edit** or **Can view**.

> Note: someone must sign in **once** before you can grant them access — signing in
> is what registers their handle in the system.

---

## Two things to remember

1. **Passcode, not verified X login.** The first person to type a handle claims it.
   Fine for a trusted community. Verified "prove you own this X account" login needs
   the paid X API and can be added later.
2. **Attachments cap at ~700 KB each** (they're stored in the database). Photos and
   small files are fine; large videos won't embed. Moving to Supabase Storage lifts
   this when you want it.

---

## If something goes wrong

- **Blank page after deploy:** make sure you deployed the `dist` folder (Path A) or
  that Publish directory is `dist` (Path B). The `netlify.toml` handles this if it's
  at the repo root.
- **"Page not found" on refresh:** the `netlify.toml` redirect fixes this — confirm
  that file made it into your upload.
- **Login error:** the database is live and tested; a login error almost always means
  a typo in the handle/passcode, or the passcode is under 4 characters.
