# Atomic Media Live Deployment

This repo is now ready to run as one Node service: the backend serves the API, uploaded media, `/admin`, and the public website.

## Required Production Environment Variables

Set these in your hosting provider. Do not commit real secrets.

```env
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb://atomicmedia011_db_user:<db_password>@ac-085nzuw-shard-00-00.ks3ngb9.mongodb.net:27017,ac-085nzuw-shard-00-01.ks3ngb9.mongodb.net:27017,ac-085nzuw-shard-00-02.ks3ngb9.mongodb.net:27017/atomic_media_cms?ssl=true&replicaSet=atlas-z91yt0-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=<admin-login-email>
ADMIN_PASSWORD=<strong-admin-password>
ADMIN_NAME=Atomic Admin
CORS_ORIGIN=https://<your-live-domain>
PUBLIC_SITE_ORIGIN=https://<your-live-domain>
API_ORIGIN=https://<your-live-domain>
CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>
```

Cloudinary needs the `cloud_name`, API key, and API secret. The label `atomic media` is not enough if it is not the actual cloud name shown in Cloudinary Dashboard > Programmable Media > API Keys.

## Render

1. Push this repo to GitHub.
2. In Render, create a new Blueprint from the repo.
3. Add the environment variables above in the Render dashboard.
4. Deploy.
5. Visit:
   - Website: `https://<render-service>.onrender.com`
   - Admin: `https://<render-service>.onrender.com/admin`
   - API health: `https://<render-service>.onrender.com/api/health`

## First Admin User

After deployment, run the seed command once from the Render shell:

```bash
npm run seed
```

Then log in at `/admin` with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Security Note

Rotate any Cloudinary API secret or database password that has been pasted into chat, terminals, screenshots, or documents. Use new secrets only inside the hosting provider environment settings.
