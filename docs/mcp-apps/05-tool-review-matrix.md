# MCP Tool Review Matrix

Last updated: 2026-06-14

This matrix is the review source of truth for Verto AI's presentation MCP tools. It mirrors the metadata registered in `src/mcp/tools/presentation/index.ts`.

## Tool Metadata

| Tool | Title | Read-only | Destructive | Idempotent | Open-world | Review notes |
| --- | --- | --- | --- | --- | --- | --- |
| `presentation_list` | List presentations | yes | no | yes | no | Reads presentation metadata only by default. |
| `presentation_get` | Get presentation | yes | no | yes | no | Reads one owned presentation; can include full slide JSON. |
| `presentation_create` | Create presentation | no | no | no | no | Creates a new owned presentation from title and outlines. |
| `presentation_generate` | Generate presentation | no | no | no | yes | Runs AI generation and may call model/image providers through Verto's backend. |
| `presentation_update_slides` | Replace presentation slides | no | no | yes | no | Replaces all slides, so clients should call `presentation_get` first. |
| `presentation_update_theme` | Update presentation theme | no | no | yes | no | Applies an existing Verto theme. |
| `presentation_publish` | Publish presentation | no | no | yes | yes | Creates or returns a public share URL. |
| `presentation_unpublish` | Unpublish presentation | no | no | yes | no | Revokes public share access. |
| `presentation_delete` | Soft-delete presentation | no | no | yes | no | Recoverable soft delete only. |
| `presentation_recover` | Recover presentation | no | no | yes | no | Restores a soft-deleted presentation. |
| `presentation_delete_permanently` | Permanently delete presentations | no | yes | yes | no | Irreversible; requires `confirm: true`. |

## Review Guardrails

- Read tools and write tools are separate.
- Permanent deletion is isolated in one tool and requires explicit confirmation.
- Tool descriptions describe Verto actions; they do not contain prompt-injection instructions.
- Every tool is user-scoped through the shared auth and ownership checks.
- Existing responses remain JSON text for backward compatibility. Tool-by-tool output schemas can be added later when we design compact structured outputs that do not duplicate large slide payloads.
