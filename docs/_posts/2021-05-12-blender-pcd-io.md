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
  <a style="
    background-color: #489be0;
    color: #fff;
    border: none;
    vertical-align: middle;
    line-height: 40px;
    min-height: 42px;
    font-size: 14px;
    text-decoration: none;
    text-align: center;
    display: inline-block;
    padding: 0 25px;
    margin: 20px 0;
    " href="https://github.com/MarkHedleyJones/blender-pcd-io">
    View/Download project on GitHub
  </a>
</p>

<p style="text-align: center;">
  <a href="https://github.com/MarkHedleyJones/blender-pcd-io">
  <img alt="Importing a PCD file with blender" src="/media/projects/blender-pcd-io/screenshot.webp"/>
  </a>
</p>
