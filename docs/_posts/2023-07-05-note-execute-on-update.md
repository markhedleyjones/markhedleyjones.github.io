---
layout: note
title:  "Execute command on file update"
date:   2023-07-05
permalink: /notes/execute-on-update
description: "- automatically re-run a script when you save it"
---

When developing scripts, the following can save a lot of time switching between terminal windows to re-run your script after making changes.
Install the package `inotify-tools` in using your Linux package manager, then you can use the `inotifywait` command to watch a file for changes and execute a command when the file is updated.

```bash
while inotifywait -e close_write <path_to_script>; do <command_to_run_script>; done
```
