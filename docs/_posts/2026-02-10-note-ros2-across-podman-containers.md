---
layout: note
title:  "ROS2 across Podman containers"
date:   2026-02-10
permalink: /notes/ros2-across-podman-containers
description: "podman-compose silently breaks Fast DDS shared memory transport"
---

[Fast DDS](https://fast-dds.docs.eprosima.com/) (the default ROS2 middleware in Jazzy) uses UDP multicast to discover other nodes, but transfers data via shared memory (`/dev/shm`) when both nodes are on the same machine. This avoids serialisation overhead for high-bandwidth topics like point clouds.

Splitting ROS nodes into their own containers is a natural way to isolate subsystems — one container per sensor driver, one for localisation, etc. With `--net host`, discovery works fine across containers. But rootless [Podman](https://podman.io/) gives each container its own IPC namespace, which means its own `/dev/shm`. One container writes data to shared memory and tells another to read it, but that memory segment doesn't exist in the other container's namespace. The read silently fails — `ros2 topic list` shows everything, `ros2 topic echo` hangs forever.

The fix is to share the IPC namespace between containers using `--ipc shareable` on the first container and `--ipc container:<name>` on the rest:

```bash
podman run --net host --ipc shareable --name my-publisher ...
podman run --net host --ipc container:my-publisher --name my-subscriber ...
```

## podman-compose doesn't support this

The Docker Compose equivalent is:

```yaml
services:
  publisher:
    ipc: shareable
  subscriber:
    ipc: service:publisher
```

This works with `docker compose`, but `podman-compose` silently ignores the `ipc` directive — it appears in `podman-compose config` output but isn't passed through to `podman run`. Still an [open issue since 2020](https://github.com/containers/podman-compose/issues/218), [confirmed broken](https://github.com/containers/podman-compose/issues/1292) as of v1.5.0. For now you need a shell script with direct `podman run` commands, or use Docker Compose.

## Diagnosing the problem

If you're not sure whether IPC namespaces are shared, compare the namespace IDs:

```bash
podman exec container-a ls /proc/self/ns/ipc -la
# ipc:[4026533574]
podman exec container-b ls /proc/self/ns/ipc -la
# ipc:[4026533663]  ← different = broken
```

If they differ, the containers have separate `/dev/shm` and Fast DDS data transfer won't work between them.
