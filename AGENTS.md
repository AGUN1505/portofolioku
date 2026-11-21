<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Worker Lifecycle & Teardown Rule

- **Immediate Worker Teardown:** Ketika sebuah supervised worker (Orca worker, subagent, atau worker terminal) telah menyelesaikan pekerjaannya (`worker_done`, `succeeded`, status selesai) dan tidak ada pekerjaan tambahan yang ditugaskan, segera tutup/release worker tersebut (`orca orchestration worker-release --dispatch <dispatch_id>`, close terminal tab, atau terminate subagent).
- Jangan biarkan worker yang sudah selesai tetap menggantung atau retain di memori / terminal panel.

