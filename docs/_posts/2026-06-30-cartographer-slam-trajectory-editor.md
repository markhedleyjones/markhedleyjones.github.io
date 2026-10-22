---

layout: project
title: "Cartographer SLAM Trajectory Editor"
date: 2026-06-30
last_modified_at: 2026-10-22
relevance: 11
permalink: /projects/cartographer-slam-trajectory-editor
featureimage: concept.webp
thumb: concept.webp
feature_theme: true
description: Correct distorted robot maps by moving sections into alignment and recalculating the path, entirely in your browser.
keywords: Cartographer, SLAM, pbstream, pose graph, trajectory, submaps, occupancy grid, mapping, robotics, browser tool
tags: [slam, point-cloud, tools]
related_projects:
  - /projects/robotics-platform-kiwifruit-orchards
  - /projects/autonomous-navigation-kiwifruit-orchards
  - /projects/bamboo-lidar-mount
---

Robot maps sometimes come out bent, with duplicated walls or sections that don't line up. I built this editor to correct those problems without having to collect all the sensor data again.

[Cartographer](https://github.com/cartographer-project/cartographer) estimates a robot's path while building a map from its sensor measurements. This is called simultaneous localisation and mapping, or SLAM. It joins small local maps, called submaps, into a larger map. Poor measurements, unsuitable settings or difficult surroundings, such as long featureless corridors, can leave those submaps misaligned.

The editor lets you move and rotate submaps by hand. You can fix a few key sections in place and let the optimiser adjust the others, rather than correcting every section individually. The optimiser uses Levenberg-Marquardt least-squares optimisation, implemented in JavaScript, to reduce disagreement between the connected parts of the map.

Once the alignment looks right, export the corrected `.pbstream` file and run Cartographer's assets writer with your original sensor recording to rebuild the point cloud - the collection of measured 3D points.

<a class="launch-btn" href="/cartographer-slam-trajectory-editor/" target="_blank" rel="noopener" style="margin-top: 40px"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"></path><path d="M20 4l-9 9"></path><path d="M19 13v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"></path></svg> Launch Cartographer SLAM Trajectory Editor</a>

## Things to know

1. Your `.pbstream` is parsed, edited, optimised and rewritten in your browser. The file is not uploaded to a server.
2. The editor is designed for 2D trajectories; I haven't tested it with 3D trajectories. Large `.pbstream` files can be slow to work with or exceed the browser's available memory.

If you're working with GLIM and Ouster LiDARs, I also have a note on the [correct T_lidar_imu transform](/notes/glim-ouster-t-lidar-imu-transform): the documented one is missing a 180-degree rotation.

{% include github-btn.html url="https://github.com/markhedleyjones/cartographer-slam-trajectory-editor" %}
