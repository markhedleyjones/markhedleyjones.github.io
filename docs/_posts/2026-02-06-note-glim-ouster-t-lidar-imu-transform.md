---
layout: note
title:  "GLIM T_lidar_imu for Ouster LiDARs"
date:   2026-02-06
permalink: /notes/glim-ouster-t-lidar-imu-transform
description: "- the documented transform is missing a 180° rotation"
---

[GLIM](https://github.com/koide3/glim)'s documented `T_lidar_imu` transform for Ouster LiDARs is wrong. Using it causes the trajectory to fly off within seconds of starting.

The [config_sensors.json](https://github.com/koide3/glim/blob/c764baa/config/config_sensors.json#L35) comment suggests:

```json
"T_lidar_imu": [0.006, -0.012, 0.008, 0.0, 0.0, 0.0, 1.0]
```

That's `[x, y, z, qx, qy, qz, qw]` - a small translation with identity rotation. The problem is Ouster's LiDAR frame has a 180° Z-rotation relative to the IMU frame. You can see this in the [Ouster SDK source](https://github.com/ouster-lidar/ouster_example/blob/483206f/ouster_client/src/sensor_info.cpp#L136-L142):

```cpp
// IMU to sensor - identity rotation
extern const mat4d default_imu_to_sensor_transform =
    (mat4d() << 1, 0, 0, 6.253, 0, 1, 0, -11.775, 0, 0, 1, 7.645, 0, 0, 0, 1)
        .finished();

// LiDAR to sensor - note the -1s (180° Z-rotation)
extern const mat4d default_lidar_to_sensor_transform =
    (mat4d() << -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 36.18, 0, 0, 0, 1)
        .finished();
```

The correct transform needs that 180° Z-rotation (quaternion `[0, 0, 1, 0]`):

```json
"T_lidar_imu": [-0.006253, 0.011775, -0.028535, 0.0, 0.0, 1.0, 0.0]
```

This is computed from `T_lidar_imu = inverse(T_sensor_lidar) * T_sensor_imu`.

GLIM [expects](https://github.com/koide3/glim/blob/c764baa/docs/parameters.md) the IMU Z-axis to point upward with gravity reading `[0, 0, +9.81]`. Without the rotation, the X/Y axes are flipped and IMU preintegration goes haywire.
