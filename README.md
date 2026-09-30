# Purple's To-do list (Node.js)

A colourful task planner with a small Node.js backend. No npm packages needed.

## Run it
```bash
node server.js
```
Then open http://localhost:3000. Requires Node 18 or newer. Set a different port with `PORT=4000 node server.js`.

## Features
- Sample tasks created on first run, saved to `data.json`
- Categories, priorities, due dates and overdue warnings
- Live stats, progress bar, search, and All / Active / Completed tabs
- "Clear completed" button

## Project structure
| Path | Purpose |
|------|---------|
| `server.js` | HTTP server, REST API, static file serving |
| `data.json` | Task storage (auto-created) |
| `public/index.html` | Page structure |
| `public/styles.css` | Purple theme |
| `public/app.js` | Front-end logic calling the API |

## API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create a task (`text`, `category`, `priority`, `due`) |
| PATCH | `/api/tasks/:id` | Update `done` or `text` |
| DELETE | `/api/tasks/:id` | Delete one task |
| DELETE | `/api/tasks?completed=true` | Delete all completed tasks |

## Reset
Delete `data.json` and restart the server to restore the sample tasks.
