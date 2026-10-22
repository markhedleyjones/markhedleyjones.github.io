---

layout: project
title:  "Import/Export Point Cloud Data in Blender"
date:   2021-05-12 09:01:13 +0000
relevance: 8
last_modified_at: 2026-10-22
permalink: /projects/blender-pcd-io
featureimage: feature.webp
thumb: thumb.webp
description: Import, edit and export 3D point clouds in Blender without converting them to another file format.
keywords: Blender, point cloud, PCD files, 3D modelling, Point Cloud Library, robotics, computer vision, LiDAR data
tags: [point-cloud, tools]
related_projects:
  - /projects/autonomous-navigation-kiwifruit-orchards
  - /projects/calibration-checkerboard-collection
  - /projects/bamboo-lidar-mount
excerpt_separator: "{% endhighlight %}"
---

Laser scanners produce point clouds: collections of 3D points describing the surfaces around them. I often needed to clean up these measurements in [Blender](https://www.blender.org/), but first had to convert files from the PCD format used by the [Point Cloud Library](https://pointclouds.org/) to PLY.

I wrote this add-on to import and export PCD files directly. It lets me use Blender's editing tools to remove unwanted points, then save the result for use in the robotics software.

The add-on imports ASCII, binary and binary-compressed PCD files, and exports binary PCD files. It represents points as mesh vertices and does not preserve point colours or labels. See the repository for installation instructions and supported Blender versions.

{% include github-btn.html url="https://github.com/MarkHedleyJones/blender-pcd-io" %}

[{% include image.html src="/media/projects/blender-pcd-io/screenshot.webp" alt="Importing a PCD file with blender" %}](https://github.com/MarkHedleyJones/blender-pcd-io)
