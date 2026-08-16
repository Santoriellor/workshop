# Workshop Web Application (Dockerized)

This is a full-stack Job Card management app with:

- Django + MySQL (Backend)
- React 18 + JavaScript (Frontend)
- Docker + Docker Compose (Containerized)

---

## Requirements

Install the following:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/)

---

## 🚀 Build & Run

From the project root :

```bash
docker compose up --build
```

This will:

- Build backend and frontend containers
- Set up MySQL
- Run Django migrations and populate the DB via `entrypoint.sh`

---

## 🌐 Access the App

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **Backend Django Admin**: http://localhost:8000/admin/
- **MySQL**: port 3306 (internal)

---

## 🛠 Useful Commands

### Run Django management commands:

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py test
```

### Run npm test:

To run the tests for the frontend, you need to change to run :

```bash
docker compose -f docker-compose.test.yml up --build
```

Once the container is up, you can access the bash within the frontend container with :

```bash
docker compose exec frontend sh
```

then inside the bash run the command :

```bash
npm test
```

### Restart containers:

```bash
docker-compose down
docker-compose up --build
```

---

## 📁 Folder Structure (simplified)

```
workshop/
├── back/               # Django backend
│   ├── backend/        # Django project
│   ├── api/            # Django app
│   ├── manage.py
│   ├── .env
│   ├── Dockerfile
│   └── entrypoint.sh   # Handles migrations + populate_db
│
├── front/              # React frontend
│   ├── src/
│   ├── .env
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
└── README.md
```

---

## ✅ Ready to Go

Once up and running:

- Log into the frontend on localhost
- Backend handles API + DB
- Everything is containerized — no need for manual Python/Node installs!

---

## Configuration

No credentials are stored in this repository.

**Local development:** copy `back/.env.example` to `back/.env` and fill in your own
values, then create the files listed in `secrets/README.md`. Both paths are
gitignored.

**Production:** secrets live on the deployment host at `/srv/secrets/workshop/`,
outside the deploy directory so the deployment rsync cannot overwrite them.
`docker-compose.yml` references them by absolute path — Docker secrets for the
database and Django keys, and `env_file` for the rest.

`front/.env` *is* committed deliberately: it contains only `VITE_API_URL`, which
Vite inlines into the public browser bundle at build time.

---
