# Enfield Garage Vietnam Frontend

Static-first bilingual product catalog for `enfieldgaragevietnam.vn`.

## Run locally

```bash
python -m http.server 8080
```

Open:

```text
http://localhost:8080
http://localhost:8080/admin.html
```

Demo admin password:

```text
admin123
```

## Production hosting

Upload this folder to GitHub Pages. Configure custom domain:

```text
enfieldgaragevietnam.vn
```

Add a `CNAME` file containing:

```text
enfieldgaragevietnam.vn
```

## Important

The admin page is a static JSON editor/export tool. It is not secure production authentication.
Use Cloudflare Worker or Google Cloud Run for real login, image uploads, ZaloPay order creation and callbacks.

## ZaloPay

Do not put merchant secret keys in GitHub Pages JavaScript.
The frontend should call a backend endpoint:

```text
POST /api/create-zalopay-order
POST /api/zalopay-callback
```

