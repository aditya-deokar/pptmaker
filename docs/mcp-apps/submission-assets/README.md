# Submission Assets Folder

Use this folder for screenshots, logo exports, and evidence files used during ChatGPT and Claude submission.

Recommended files:

```text
app-icon-1024.png
app-icon-512.png
chatgpt-01-connect-success.png
chatgpt-02-generate-result.png
chatgpt-03-progress-ui.png
chatgpt-04-deck-preview.png
chatgpt-05-publish-link.png
claude-01-custom-connector.png
claude-02-tool-result.png
claude-03-preview-or-fallback.png
phase7-command-output.txt
production-health-check-output.txt
phase9h-presentation-list-dark-desktop.png
phase9h-presentation-list-light-mobile.png
phase9h-generation-running-dark-desktop.png
phase9h-generation-complete-light-desktop.png
phase9h-generation-error-dark-mobile.png
phase9h-deck-preview-dark-desktop.png
phase9h-deck-publish-success-light-desktop.png
phase9h-deck-preview-light-mobile.png
phase9h-action-result-publish-dark-desktop.png
phase9h-action-result-delete-light-mobile.png
phase9h-visual-qa-report.json
phase9h-visual-qa-summary.md
```

Do not store secrets, OAuth tokens, API keys, private customer data, or real confidential presentations in this folder.

Run `npm.cmd run mcp:phase9h` to regenerate the `phase9h-*` files. These are automated local evidence assets. For public submission, also capture the live `chatgpt-*` screenshots inside ChatGPT developer mode.
