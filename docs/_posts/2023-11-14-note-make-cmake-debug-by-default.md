---
layout: note
title:  "Make a CMake build debug by default"
date:   2023-11-14
permalink: /notes/make-cmake-debug-by-default
description: "set debug as default build type instead of release"
---

Add this to your CMakeLists.txt:

```cmake
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Debug)
endif()
```
