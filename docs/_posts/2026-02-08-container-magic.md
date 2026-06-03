---
layout: project
title: "Container Magic"
date: 2026-02-08
relevance: 6
permalink: /projects/container-magic
featureimage: logo.webp
thumb: logo.webp
description: A tool for rapidly creating containerised development environments from a single YAML configuration
keywords: Docker, Podman, containers, development environment, YAML, DevOps, reproducible builds, GPU, multi-stage builds
related_projects:
  - /projects/docker-bbq
---

Container-magic is a successor to [Docker-BBQ](/projects/docker-bbq). It takes a single YAML configuration file and generates everything needed to build and run a containerised project: a Dockerfile and standalone build and run scripts. It works with any Docker Hub image as a starting point and supports both Docker and Podman.

## Getting Started

```bash
pip install container-magic

cm init python:3.11-slim my-project
cd my-project
```

This creates a `cm.yaml`, generates a Dockerfile and standalone scripts, and sets up a workspace directory. From there:

```bash
cm build                  # Build the development image
cm run python --version   # Run a command inside the container
cm run                     # Drop into an interactive shell
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

One benefit of generating Dockerfiles rather than writing them by hand is that container-magic enforces best practices automatically. Generated Dockerfiles always clean up package manager caches after installation (`rm -rf /var/lib/apt/lists/*` for APT, `--no-cache` for APK, `dnf clean all` for DNF), use `--no-install-recommends` to avoid pulling in unnecessary packages, and pass `--no-cache-dir` to pip. Related operations are combined into single `RUN` statements to minimise layers. These are things that are easy to forget or get wrong when writing Dockerfiles by hand.

Container-magic is also a development-only tool. The generated Dockerfile, build script, and run script are standalone and only require Docker or Podman - there's no lock-in. Anyone can use your project without ever installing container-magic.

## Use Cases

I use container-magic across a few projects:

**This website** uses it to run Jekyll with live reload inside a container, keeping Ruby and its dependencies off the host machine.

**SLAM and robotics** - a couple of ROS2 projects use container-magic for LiDAR SLAM processing. These pull in GPU support for CUDA-accelerated processing, mount serial devices for IMU and LiDAR hardware, and define commands for recording sensor data, running SLAM, and exporting maps.

**GPU-accelerated text-to-speech** - a TTS service uses a PyTorch CUDA base image with audio support enabled, allowing the container to access PulseAudio on the host for playback.

## Other Features

* **Backend agnostic** - works with both Docker and Podman
* **Automatic user handling** - your host user in development, a dedicated user in production, with no manual setup
* **GPU, display, and audio support** - enabled via the runtime config
* **Multi-stage builds** - separate base, development, and production stages
* **Data volumes** - shorthand for sibling folders that persist across runs without entering the image
* **Asset caching** - download large files (ML models, datasets) once and reuse across builds
* **SELinux support**
* **Jinja templating** - generated files use Jinja, making the system easier to maintain and extend

{% include github-btn.html url="https://github.com/MarkHedleyJones/container-magic" %}
