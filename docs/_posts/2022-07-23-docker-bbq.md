---
layout: project
title:  "Docker-BBQ"
date:   2022-07-23 19:12:00 +0000
relevance: 3
permalink: /projects/docker-bbq
featureimage: logo.webp
thumb: logo.webp
description: A set of bash scripts for creating and running templated docker projects
keywords: Docker, bash, development environment, containerisation, templates, DevOps
modified_date: 2026-02-08
excerpt_separator: \{% endhighlight %\}
---

**Note:** Docker-BBQ has been deprecated in favour of [Container Magic](/projects/container-magic).

Creating flexible [docker](https://www.docker.com/) images with the ability quickly and efficiently develop and execute code can be time consuming.
There are generally two competing goals, keeping images small for deployment, while making them usable during development.
On top of that, there are a number of special flags and features of docker that can be forgotten when starting a new project.
This project aims to codify a standard approach to creating and running docker based projects.

The user can select between a number of bundled templates, which at the time of writing are limited to:
* Ubuntu
* Debian
* ROS
* Alpine

Using docker-bbq, the user can simply execute `bbq-create Alpine my-test-project` to get generate a new project.
That project comes with a *Makefile* that takes care of building the images.
There are two different build types: *development*, which is the default, and *production*, which is used for deployment.

In the development image, the user's code is mounted into the image at run-time.
This means that the user doesn't need to rebuild the image every time they make a change.
Docker-bbq also provides a `run` command that manages running, mounting the workspace, translating execution paths during development.
Using the `run` command, the user can seamlessly execute things in the image as if they were executing in the host machine.

The production image on the other hand is compiled with the workspace inside the image.
It is not designed to be used during development, which means the `run` command is not available for this image.
The user needs to execute the image using plain Docker commands, which is how it would be used in production.

My local development environment for [this website](https://github.com/MarkHedleyJones/markhedleyjones.github.io) is a bbq-docker project.

## Demonstration
This clip is a little out-of-date, but it shows the general idea of the project.

![](https://raw.githubusercontent.com/markhedleyjones/docker-bbq/master/media/demo.gif)

<p style="text-align: center;">
  <a class="github-btn" href="https://github.com/MarkHedleyJones/docker-bbq">
    <svg viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
    View on GitHub
  </a>
</p>
