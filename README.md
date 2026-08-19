# Student Portal

A student management system: register, sign in, and browse a directory of
students with their department, semester and CGPA. You can edit or delete your
own record; everyone else's is read-only.

This is a web port of a NetBeans **Java Swing + MySQL desktop app**. Swing draws
native windows through the JVM, so the original could never be a website — it
had to be rebuilt rather than deployed. The data model and the three operations
(`getAllUsers`, `updateUser`, `deleteUser`) are carried over intact.

## What changed from the Java version

| Original | Here | Why |
|---|---|---|
| Swing windows (`LoginForm`, `RegisterForm`, `UserManagementForm`) | three HTML pages | browsers can't run Swing |
| MySQL on `localhost:3306` | Supabase (hosted Postgres) | a website needs a reachable database |
| `DBConnection.java` with `root` / `1234` hardcoded | `config.js` with the public anon key | no admin credentials in client code |
| `u_pass VARCHAR(20)`, compared as plain text | Supabase Auth | **passwords are now salted and hashed** |
| `u_id INT AUTO_INCREMENT` | `uuid` matching the auth user | a profile and a login are the same person by construction |
| any running copy could edit any row | Row Level Security | you can only change your own record |

The plain-text password column was the one thing that could not come along. On a
desktop app against your own MySQL it costs you marks; on a public website it's
a breach waiting to happen.

## Setup

**1. Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is fine).

**2. Create the table.** Dashboard → SQL Editor → New query → paste all of
[`schema.sql`](schema.sql) → Run. This also switches on Row Level Security and
adds the four policies — don't skip it, it's what makes publishing the anon key safe.

**3. Add your keys.** Dashboard → Project Settings → API. Copy the **Project URL**
and the **anon public** key into `config.js`:

```js
window.SUPABASE_CONFIG = {
  url: "https://xxxxxxxx.supabase.co",
  anonKey: "eyJhbGciOi...",
};
```

Never put the `service_role` key here — it bypasses RLS entirely.

**4. Run it.** It's a static site, no build step:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. (Opening `index.html` as a `file://` URL won't
work — the Supabase client needs a real origin.)

If you forget step 3 the pages show setup instructions instead of failing silently.

### Email confirmation

By default Supabase emails a confirmation link before a new account can sign in.
Registration handles this: the profile is held and saved on first successful
sign-in. To skip it while testing, turn off **Confirm email** under
Authentication → Providers → Email.

## Deploying

Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new).
Framework preset **Other**, no build command. `config.js` is committed on
purpose — the anon key is meant to be public, and RLS is what protects the data.

## Files

```
index.html      sign in
register.html   create account + student profile
dashboard.html  student directory, edit and delete
app.js          Supabase client, auth guard, shared helpers
dashboard.js    the directory: read, update, delete
style.css       design tokens, light + dark
schema.sql      table, constraints and RLS policies
config.js       your project URL and anon key
```

## Notes & limits

- CGPA is on a 0.00–4.00 scale, enforced both in the form and by a database
  `CHECK` constraint, so a bad value can't get in through either door.
- The directory is visible to any signed-in user. If you'd rather students only
  saw themselves, change the select policy in `schema.sql` to
  `using (auth.uid() = id)`.
- Deleting your record removes you from the directory but leaves your login. To
  remove the account itself you'd delete the auth user from the Supabase dashboard.
- There are no roles. Everyone is a student; there's no admin who can edit others.
  Adding that means a `role` column and a policy that checks it.
