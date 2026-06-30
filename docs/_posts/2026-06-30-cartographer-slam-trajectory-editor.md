---
layout: project
title: "Cartographer SLAM Trajectory Editor"
date: 2026-06-30
relevance: 11
permalink: /projects/cartographer-slam-trajectory-editor
featureimage: concept.webp
thumb: concept.webp
feature_theme: true
description: A browser-based Cartographer SLAM trajectory editor and re-optimiser for hand-fixing trajectories.
keywords: Cartographer, SLAM, pbstream, pose graph, trajectory, submaps, occupancy grid, mapping, robotics, browser tool
---

Cartographer is a SLAM system (which is fairly old now) that takes a recorded bag file (ROS terminology for a capture of a robot's sensor data) and a robot description, and it pieces together the trajectory the robot travelled by transforming and trying to align the sensor data into a coherent model of the robot's actual trajectory. From that output trajectory and the input bag file you can then dump your lidar points into a final point-cloud.

A trajectory is built from a collection of small regions (submaps) assembled into a global map. If some of those submaps aren't lined up right, the whole map can become distorted. For example, sometimes your maps are bent or contain misaligned regions. This can be due to poor sensor data (sensor glitches), sub-optimal SLAM configuration, the geometry of the environment being mapped (e.g. long featureless hallways, mirrors, poor visibility), or due to the operator (moving too fast, or sub-optimal mapping path).

This tool lets you go through the submaps and line them up by hand. It also includes a re-optimiser so you don't have to manually adjust all submaps. Instead, you can fix the alignment of some key submaps, change them from "floating" to "fixed", and let the optimiser move all the others to try and make everything consistent again. Once your map looks the way it should, you can export the corrected trajectory and run it back through your Cartographer mapping pipeline (just the assets writer and any post-processing).

<a class="launch-btn" href="/tools/cartographer-slam-trajectory-editor/" target="_blank" rel="noopener" style="margin-top: 40px"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"></path><path d="M20 4l-9 9"></path><path d="M19 13v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"></path></svg> Launch Cartographer SLAM Trajectory Editor</a>

## Things to know

1. Your `.pbstream` is parsed, edited, optimised, and re-written entirely client-side in JavaScript. Nothing is uploaded, so it is safe to use on private data.
2. It's designed for 2D trajectories and hasn't been tested with 3D trajectories yet. Also, because everything runs in the browser, very large bags with a lot of data may become heavy to work with, depending on your machine's available resources.
