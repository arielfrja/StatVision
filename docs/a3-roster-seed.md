# A3 — Rostered Squad Seed (Wave-2 modal executable)

> Scope: local/dev + shared-DB manual seeding ONLY. Do NOT run against prod.
> All names use the `A3-` prefix (shared-DB rule). Clean up afterwards (see bottom).
> Base URL for the A3 isolated API: `http://localhost:3200`
> (Mock auth is ON in the A3 workspace: `USE_MOCK_AUTH=true`, `NODE_ENV=test`.)

## 1. Create the squad team

```bash
curl -s -X POST http://localhost:3200/teams \
  -H 'Content-Type: application/json' \
  -d '{"name":"A3-Squad"}'
# → 201 { id: "<TEAM_ID>", name: "A3-Squad", ... }
```

Duplicate guard:

```bash
curl -s -X POST http://localhost:3200/teams \
  -H 'Content-Type: application/json' \
  -d '{"name":"  a3-squad  "}'
# → 409 { message: "Team name already exists." }  (trimmed + case-insensitive)
```

## 2. Add 5 rostered players

```bash
TEAM=<TEAM_ID>
for p in "A3-PG:1" "A3-SG:2" "A3-SF:3" "A3-PF:4" "A3-C:5"; do
  name="${p%%:*}"; num="${p##*:}"
  curl -s -X POST http://localhost:3200/teams/$TEAM/players \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"$name\",\"jerseyNumber\":$num}"
  echo
done
# → 201 per player (PlayerTeamHistory rows)
```

## 3. Verify roster (what the Wave-2 modal will render)

```bash
curl -s http://localhost:3200/teams/$TEAM/players
curl -s http://localhost:3200/teams/$TEAM
```

## 4. Rename / delete contract (Wave-2)

```bash
curl -s -X PUT http://localhost:3200/teams/$TEAM \
  -H 'Content-Type: application/json' \
  -d '{"name":"A3-Squad-Renamed"}'   # → 200 updated team

curl -s -X DELETE http://localhost:3200/teams/$TEAM
# → 200 { message: "Team deleted.", id } ; games pointing at the team are
#    nullified first (home/away FKs are SET NULL). Subsequent GET → 404.
```

## 5. Assignment batch contract (Wave-2 modal save)

`POST /games/:gameId/assignment` accepts:

```json
{
  "teamMappings": [{ "tempTeamId": "<uuid>", "officialTeamId": "<uuid>" }],
  "playerMappings": [{ "tempPlayerId": "<uuid>", "officialPlayerId": "<uuid>" }]
}
```

`GameAssignmentService.assignEntity` now returns per-mapping diff:

```json
{
  "movedEvents": 12,
  "newHomeAway": { "homeTeamId": "<uuid>", "awayTeamId": "<uuid>" },
  "newStatus": "COMPLETED"
}
```

> NOTE: `gameRoutes.ts` is owned outside A3 and still responds
> `{ message: "Assignment successful and stats recalculated." }`.
> One-line handoff to wire the diff through (batch loop accumulates):
>
> ```ts
> const diffs = [];
> for (const m of teamMappings || []) { ... diffs.push(await gameAssignmentService.assignEntity(...)); }
> for (const m of playerMappings || []) { ... diffs.push(await gameAssignmentService.assignEntity(...)); }
> res.status(200).json({ message: "Assignment successful and stats recalculated.", diffs });
> ```

## 6. Cleanup (mandatory on shared DB)

```bash
curl -s -X DELETE http://localhost:3200/teams/$TEAM
# Verify: GET → 404, and no A3- rows remain:
#   SELECT id, name FROM teams WHERE name ILIKE 'A3-%';
#   (run read-only check, then confirm empty)
```
