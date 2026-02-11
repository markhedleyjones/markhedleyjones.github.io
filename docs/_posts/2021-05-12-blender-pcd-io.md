---
layout: project
title:  "Import/Export Point Cloud Data in Blender"
date:   2021-05-12 09:01:13 +0000
relevance: 8
modified_date: 2025-08-16
permalink: /projects/blender-pcd-io
featureimage: feature.webp
thumb: thumb.webp
description: An add-on that enables .PCD file import/export in Blender 2.8+
keywords: Blender, point cloud, PCD files, 3D modelling, Point Cloud Library, robotics, computer vision, LiDAR data
related_projects:
  - /projects/calibration-checkerboard-collection
  - /projects/cnc-machined-stereo-camera-mount
  - /projects/bamboo-lidar-mount
excerpt_separator: "{% endhighlight %}"
---

Working with point cloud data from [PCL](https://pointclouds.org/) (Point Cloud Library) in robotics projects, I found myself constantly switching between different tools to visualise and edit .pcd files. While [Blender](https://www.blender.org/) is fantastic for mesh editing, it didn't support PCD files natively - you'd have to convert to PLY format first, which was tedious when working primarily with point clouds.

This frustration led me to create a Blender add-on that brings PCD import/export directly into Blender 2.8+. Now I can load point clouds straight from my robotics workflows, use Blender's powerful editing tools to clean up noisy data, and export back to PCD format without any intermediate conversions.

The add-on handles the most common PCD formats (ASCII, binary, and binary compressed) and integrates seamlessly with Blender's existing import/export system. While it doesn't support coloured point clouds yet (due to how Blender handles mesh vertices), it's been incredibly useful for preprocessing LiDAR data and cleaning up point clouds before feeding them into computer vision pipelines.

<p style="text-align: center;">
  <a class="github-btn" href="https://github.com/MarkHedleyJones/blender-pcd-io">
    <svg viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
    View on GitHub
  </a>
</p>

<p style="text-align: center;">
  <a href="https://github.com/MarkHedleyJones/blender-pcd-io">
  <img alt="Importing a PCD file with blender" src="/media/projects/blender-pcd-io/screenshot.webp"/>
  </a>
</p>
