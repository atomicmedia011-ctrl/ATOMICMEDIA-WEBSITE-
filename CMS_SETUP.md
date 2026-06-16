# Atomic Media CMS Setup

This project keeps the existing downloaded website UI intact and adds a CMS layer around it.

## Structure

- `serve-local.js` serves the existing static website at `http://localhost:4173`.
- `backend/` contains the Node.js, Express, MongoDB, JWT, RBAC, Cloudinary API.
- `admin/` contains the React dashboard for editing content and media.
- `lusion.co landing page(1)/lusion.co/assets/cms-bridge.js` lets the existing static pages read editable content from `/api/public/site`.

## Local Setup

1. Copy `.env.example` to `backend/.env`.
2. Set `MONGO_URI`, `JWT_SECRET`, and Cloudinary keys in `backend/.env`.
3. Install dependencies:

```powershell
npm install
npm --prefix backend install
npm --prefix admin install
```

4. Seed the first admin user:

```powershell
npm run seed
```

5. Start the CMS API:

```powershell
npm --prefix backend run dev
```

6. Start the existing website:

```powershell
node serve-local.js
```

7. Start the admin dashboard:

```powershell
npm --prefix admin run dev
```

## URLs

- Website: `http://localhost:4173`
- CMS API health: `http://localhost:5000/api/health`
- Admin dashboard: `http://localhost:5173`

## Default Seed Login

- Email: value of `ADMIN_EMAIL`, default `admin@atomicmedia.local`
- Password: value of `ADMIN_PASSWORD`, default `ChangeMe123!`

Change this immediately for production.

## Making Existing Content Editable

The CMS uses `PageContent.sections[].fields[]` to map admin-editable values onto the saved static site. A field can target any element by CSS selector:

```json
{
  "key": "headline",
  "label": "Hero headline",
  "selector": "[data-cms='home.hero.headline']",
  "type": "text",
  "value": "New headline"
}
```

Supported field types are `text`, `html`, `attr`, `styleBackground`, `image`, `video`, `link`, and `toggle`.

For downloaded pages that do not have clean selectors yet, add stable `data-cms` attributes to the existing HTML only. Do not change classes, layout, animation scripts, or CSS.

## Deployment Notes

- Build admin with `npm --prefix admin run build`.
- Run backend with `npm --prefix backend start`.
- Point the website/static host at the same API origin or set `window.ATOMIC_CMS_API`.
- Configure MongoDB Atlas and Cloudinary environment variables before deploying.
- Keep `JWT_SECRET` private and unique per environment.
