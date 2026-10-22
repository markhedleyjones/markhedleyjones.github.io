---

layout: note
title:  "Execute on Update"
date:   2023-07-05
last_modified_at: 2026-10-22
permalink: /notes/execute-on-update
description: "Run a command only when a file or directory is updated"
tags: [linux, bash]
---

When developing scripts, the following can save a lot of time switching between terminal windows to re-run your script after making changes.
Install `inotify-tools` using your Linux package manager. The `inotifywait` command can then watch for a file to be closed after writing and run your command.

```bash
while inotifywait -e close_write <path_to_script>; do <command_to_run_script>; done
```
