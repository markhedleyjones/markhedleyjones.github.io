---
layout: project
title: "Container Magic"
date: 2026-02-08
relevance: 6
permalink: /projects/container-magic
featureimage: logo.webp
thumb: logo.webp
description: A tool that generates Docker and Podman container setups from a single YAML file - a Dockerfile plus standalone build and run scripts for development and production.
keywords: Docker, Podman, Dockerfile generator, containers, dev containers, development environment, YAML, DevOps, reproducible builds, BuildKit, GPU, multi-stage builds, conda
related_projects:
  - /projects/docker-bbq
---

Container-magic takes a single YAML configuration file and generates everything needed to build and run a containerised project: a Dockerfile and standalone build and run scripts. It works with any Docker Hub image as a starting point and supports both Docker and Podman.

Full documentation - the configuration reference, build steps, user handling, and more - is at [markhedleyjones.com/container-magic](/container-magic/).

## Getting Started

```bash
pip install container-magic

cm init python:3.11 my-project
cd my-project
```

This creates a `cm.yaml`, generates a Dockerfile and standalone scripts, and sets up a workspace directory. From there:

```bash
cm build                  # Build the development image
cm run python --version   # Run a command inside the container
cm run                     # Drop into an interactive shell
```

On Nix you can run it without installing anything, or add it as a flake input:

```bash
nix run github:markhedleyjones/container-magic -- init python:3.11 my-project
```

Your code lives in the `workspace/` directory. During development it's mounted into the container, so any changes you make on the host are immediately available without rebuilding.

## Configuration

The `cm.yaml` is the only file you edit. The Dockerfile, build script, and run script are all generated downstream from it. After editing, run `cm update` to regenerate them.

```
cm.yaml (you edit this)
    │
    │  cm update
    │
    ├──► Dockerfile        (committed to git)
    └──► build.sh / run.sh (committed, standalone)
```

A typical configuration defines a base image, system and pip packages, and separate development and production stages:

```yaml
names:
  image: my-project
  workspace: workspace
  user: nonroot

stages:
  base:
    from: python:3.11-slim
    steps:
      - apt-get:
          install:
            - git
            - build-essential
      - pip:
          install:
            - numpy
            - pandas

  development:
    from: base

  production:
    from: base
```

You can also define custom commands in the YAML. These work in both development (`cm run <name>`) and production (`./run.sh <name>`), with support for publishing ports and setting environment variables.

```yaml
commands:
  train:
    command: python workspace/train.py
    description: Train the model

  serve:
    command: python -m http.server 8000
    ports:
      - "8000:8000"
```

## Why Generate Dockerfiles?

One benefit of generating Dockerfiles rather than writing them by hand is that container-magic enforces best practices automatically. Generated Dockerfiles always clean up package manager caches after installation (`rm -rf /var/lib/apt/lists/*` for APT, `--no-cache` for APK, `dnf clean all` for DNF), use `--no-install-recommends` to avoid pulling in unnecessary packages, pass `--no-cache-dir` to pip, and combine related operations into single `RUN` statements to minimise layers. These are easy to forget or get wrong when writing Dockerfiles by hand.

It can also make builds more reproducible and faster: base images can be pinned to their content digest, BuildKit cache mounts let package managers reuse downloaded packages across rebuilds, and Python bytecode is precompiled after pip installs. Build-time secrets are passed via BuildKit secret mounts, so credentials never end up baked into an image layer.

Container-magic is also a development-only tool. The generated Dockerfile, build script, and run script are standalone and only require Docker or Podman - there's no lock-in. Anyone can use your project without ever installing container-magic.

## What I Use It For

I reach for container-magic across a wide range of projects: local development environments, GPU-accelerated AI and machine-learning workloads, web scrapers, and services that run in production. The same single-file workflow scales from a quick throwaway environment to a reproducible production image, which is why it ends up in almost everything I build.

## Other Features

* **Backend agnostic** - works with both Docker and Podman
* **Automatic user handling** - your host user in development, a dedicated user in production, with no manual setup
* **Package managers** - apt, apk, dnf, pip, and conda/mamba/micromamba
* **GPU, display, and audio support** - NVIDIA passthrough, X11/Wayland forwarding, and PulseAudio/PipeWire
* **Multi-stage builds** - shared steps across separate base, development, and production stages
* **Production entrypoint and command** - set a stage's `entrypoint` and `cmd`, emitted as a signal-safe exec form
* **Dev Container support** - generate a `.devcontainer/devcontainer.json` to open the same image in VS Code or Codespaces
* **Build secrets** - pass credentials at build time via BuildKit secret mounts, never baked into image layers
* **Reproducible, cacheable builds** - opt-in base-image digest pinning and BuildKit cache mounts
* **Data volumes** - shorthand for sibling folders that persist across runs without entering the image
* **Asset caching** - download large files (ML models, datasets) once and reuse across builds
* **AWS credential forwarding** - mount host AWS config into the container
* **SELinux support**

Container-magic is the successor to my earlier [Docker-BBQ](/projects/docker-bbq) project, which solved the same problem with a more rigid, template-based approach.

{% include github-btn.html url="https://github.com/markhedleyjones/container-magic" %}
