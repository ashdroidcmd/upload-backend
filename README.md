# minio-test
# MinIO File Upload API

### Libraries

* Express, Cors, Dotenv
* Multer - File Uploading
* Nodemon - Auto Restart
* Minio - File Storage
* Sharp - Image to Webp

## Setup

### Clone the repository

```bash
git clone <repo-url>
cd <repo-folder>
```

### Install dependencies

```bash
yarn install
```

### Create a `.env` file with the following variables

```env
ENDPOINT=s3.acemcbohol.dev
ACCESS_KEY=your-access-key
SECRET_KEY=your-secret-key
PORT=3002
```

> **Note:** Bucket names are dynamic and passed via URL params.

### Start the development server

```bash
yarn dev
```

The server should be running on `http://localhost:3002` (or your specified port).

### Notes

* Store returned file URLs in your database for easier retrieval.
* Bucket and folder names are dynamic, allowing multiple websites to use the same backend.
