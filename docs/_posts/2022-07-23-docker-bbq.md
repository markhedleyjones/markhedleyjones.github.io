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
tags: [containers]
last_modified_at: 2026-10-22
excerpt_separator: \{% endhighlight %\}
---

**Note:** Docker-BBQ has been deprecated in favour of [Container Magic](/projects/container-magic).

Docker-BBQ was my earlier approach to sharing container setups between projects. It provided templates and scripts for two different needs: an environment for editing and testing code, and a smaller image for deployment.

The user can select between a number of bundled templates, which at the time of writing are limited to:
* Ubuntu
* Debian
* ROS
* Alpine

Using docker-bbq, the user can execute `bbq-create Alpine my-test-project` to generate a new project.
That project comes with a *Makefile* that takes care of building the images.
There are two different build types: *development*, which is the default, and *production*, which is used for deployment.

In the development image, the user's code is mounted into the image at run-time.
This means that the user doesn't need to rebuild the image every time they make a change.
Docker-bbq also provides a `run` command that manages running, mounting the workspace, translating execution paths during development.
Using the `run` command, the user can seamlessly execute things in the image as if they were executing in the host machine.

The production image on the other hand is compiled with the workspace inside the image.
It is not designed to be used during development, which means the `run` command is not available for this image.
The user needs to execute the image using plain Docker commands, which is how it would be used in production.

I originally used Docker-BBQ to build this website. The site now uses [Container Magic](/projects/container-magic).

## Demonstration
This clip is a little out-of-date, but it shows the general idea of the project.

![Terminal recording of Docker-BBQ building and entering a containerised development environment](https://raw.githubusercontent.com/markhedleyjones/docker-bbq/master/media/demo.gif)

{% include github-btn.html url="https://github.com/MarkHedleyJones/docker-bbq" %}
