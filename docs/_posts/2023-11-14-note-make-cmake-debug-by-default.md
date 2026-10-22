---

layout: note
title:  "Make CMake Debug by Default"
date:   2023-11-14
last_modified_at: 2026-10-22
permalink: /notes/make-cmake-debug-by-default
description: "Default Debug builds in CMake"
tags: [cmake, cpp]
---

For single-configuration generators such as Makefiles or Ninja, add this to your `CMakeLists.txt`:

```cmake
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Debug)
endif()
```

This leaves an explicitly selected build type alone. Multi-configuration generators choose the configuration at build time instead.
