# API Documentation

The Maths Portal API is built with FastAPI. It auto-generates OpenAPI documentation.

## Accessing the Documentation
When running the backend locally, you can access the interactive Swagger UI at:
`http://127.0.0.1:8000/docs`

Or the ReDoc alternative at:
`http://127.0.0.1:8000/redoc`

## Main Flows

### Authentication
- `POST /auth/token` : Obtain a JWT access token using email and password.
- `GET /auth/me` : Get current user profile.
- `POST /api/v1/login` : JSON-based login that also sets a cookie.

### Content Tree
- `GET /api/tree` : Get the full directory tree of the content root.
- `GET /api/tree/{subpath}` : Get a specific subtree.

### Groups & Users
- `GET /groups/` : List all groups (Teacher only).
- `GET /groups/{code}/students` : List students in a specific group.
- `GET /groups/my` : List groups for the current user.
- `POST /auth/reset-student-password` : Reset a student's password to a secure temporary value (Teacher only).
