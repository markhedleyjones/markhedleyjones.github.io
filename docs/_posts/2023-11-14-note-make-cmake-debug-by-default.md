---

layout: note
title:  "Make CMake Debug by Default"
date:   2023-11-14
permalink: /notes/make-cmake-debug-by-default
description: "Set CMAKE_BUILD_TYPE to Debug in CMake presets"
tags: [CMake, cpp]
---

Add this to your CMakeLists.txt:

```cmake
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Debug)
endif()
```
