---
layout: note
title:  "Execute a bash command at a specific time"
date:   2023-11-12
permalink: /notes/execute-bash-command-at-specific-time
description: "schedule your bash command with this trick"
---

The following bash function, when entered into your ~/.bashrc file, will allow you to execute a command at a specific time.
The command itself simply blocks until the specified time, so it can be used conjunction with `&&` to execute a command after the sleep.
It prints timing information to stderr, so it can be used in scripts without interfering with stdout.

```bash
function sleep_until {
  echo "Sleep starting: $(date)" >&2
  local input="$*"
  local seconds=$(( $(date -d "${input}" +%s) - $(date +%s) ))
  if [ $seconds -lt 0 ]; then
    input="tomorrow $*"
    seconds=$(( $(date -d "${input}" +%s) - $(date +%s) ))
    if [ $seconds -lt 0 ]; then
      echo "Time was in past, tried assuming tomorrow $*, but duration was still negative" >&2
      return 1
    fi
  fi
  echo "Sleeping until: $(date -d "${input}") (${seconds} seconds) ..." >&2
  sleep ${seconds}
  echo "Sleep finished: $(date)" >&2
}
```

Usage example `sleep_until <time> && <command>`
Output example:
```
$ sleep_until 11:00 && echo "It's 11:00"
Sleep starting: Sun Nov 12 22:59:59 JST 2023
Sleeping until: Sun Nov 12 23:00:00 JST 2023 (1 seconds) ...
Sleep finished: Sun Nov 12 23:00:00 JST 2023
It's 11:00
```

Times can be specified in many ways, including:
- `11:00`
- `tomorrow 11:00`
- `next week 11:00`
- `next month 11:00`
- `next year 11:00`
- `2023-11-13 11:00`
