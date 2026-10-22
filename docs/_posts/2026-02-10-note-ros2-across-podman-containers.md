---

layout: note
title:  "ROS 2 across Podman containers"
date:   2026-02-10
last_modified_at: 2026-10-22
permalink: /notes/ros2-across-podman-containers
description: "Shared memory for Fast DDS"
tags: [ros, containers]
---

[Fast DDS](https://fast-dds.docs.eprosima.com/) (the default ROS2 middleware in Jazzy) uses UDP multicast to discover other nodes, but transfers data via shared memory (`/dev/shm`) when both nodes are on the same machine. This avoids serialisation overhead for high-bandwidth topics like point clouds.

Splitting ROS nodes into their own containers is a natural way to isolate subsystems: one container per sensor driver, one for localisation, etc. With `--net host`, discovery works fine across containers. But rootless [Podman](https://podman.io/) gives each container its own IPC namespace, which means its own `/dev/shm`. One container writes data to shared memory and tells another to read it, but that memory segment doesn't exist in the other container's namespace. The read silently fails: `ros2 topic list` shows everything, `ros2 topic echo` hangs forever.

The fix is to share the IPC namespace between containers using `--ipc shareable` on the first container and `--ipc container:<name>` on the rest:

```bash
podman run --net host --ipc shareable --name my-publisher ...
podman run --net host --ipc container:my-publisher --name my-subscriber ...
```

## podman-compose version support

The Docker Compose equivalent is:

```yaml
services:
  publisher:
    ipc: shareable
  subscriber:
    ipc: service:publisher
```

This works with `docker compose`. In `podman-compose` v1.5.0, the `ipc` directive appeared in `podman-compose config` output but was not passed through to `podman run`, as documented in [issue #1292](https://github.com/containers/podman-compose/issues/1292).

Upstream has since merged [support for the service-level `ipc` option](https://github.com/containers/podman-compose/pull/1452), including `service:<name>`. If your installed version does not include that change, use direct `podman run` commands as above or Docker Compose. Check the resulting namespaces rather than relying on the rendered Compose configuration alone.

## Diagnosing the problem

If you're not sure whether IPC namespaces are shared, compare the namespace IDs:

```bash
podman exec container-a ls /proc/self/ns/ipc -la
# ipc:[4026533574]
podman exec container-b ls /proc/self/ns/ipc -la
# ipc:[4026533663]  ← different = broken
```

Different IDs show that the containers have separate IPC namespaces. If Fast DDS is trying to use shared memory between them, that is the mismatch to investigate; it does not by itself rule out communication over a network transport.
