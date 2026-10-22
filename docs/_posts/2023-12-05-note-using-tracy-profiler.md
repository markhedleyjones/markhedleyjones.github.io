---

layout: note
title:  "Using Tracy Profiler"
date:   2023-12-05
last_modified_at: 2026-10-22
permalink: /notes/using-tracy-profiler
description: "C++ profiling with Tracy and CMake"
tags: [cpp]
---

[Tracy Profiler](https://github.com/wolfpld/tracy) lets you mark sections of C++ code and inspect their timing in a separate viewer.

These notes cover a CMake integration and the older Makefile-based viewer build on Ubuntu 22.04. The clone command pins Tracy to v0.10 so the paths below match. For newer releases, follow the build instructions in the [Tracy repository](https://github.com/wolfpld/tracy).

Tracy consists of two components: client-side macros that you embed in your code, and a viewer application that receives and displays the profiling data in real-time.

## Project Integration

First, clone the Tracy repository into your project directory:
```bash
git clone --branch v0.10 --depth 1 https://github.com/wolfpld/tracy
```

Next, update your project's CMakeLists.txt to include Tracy:
```cmake
option(TRACY_ENABLE "Enable profiling" ON)
add_subdirectory(tracy)

# After your existing add_executable(...) call:
target_link_libraries(your_project PRIVATE Tracy::TracyClient)
```

Replace `your_project` with your target's name. Linking `Tracy::TracyClient` supplies the client implementation and include path; don't also add `TracyClient.cpp` to your executable.

Include `tracy/Tracy.hpp` in a source file and add `ZoneScoped;` inside a function or scope you want to measure. Build with optimisation and debug information so the timings reflect an optimised program while retaining useful symbols:
```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=RelWithDebInfo
cmake --build build
```

### Building the Tracy Viewer
The Tracy viewer compiles from source to ensure compatibility with your client version. First, install the required dependencies:

```bash
sudo apt install libglfw3-dev libfreetype-dev libcapstone-dev libdbus-1-dev
```

Then build the viewer. For X11 systems:
```bash
cd tracy/profiler/build/unix
make LEGACY=1
```

For Wayland systems:
```bash
cd tracy/profiler/build/unix
make
```

This creates a binary called `Tracy-release` in the build directory. Launch it with:
```bash
./Tracy-release
```

The Tracy viewer interface will appear:
{% include image.html src="/media/2023-12-05-note-using-tracy-profiler/profile_viewer.webp" alt="profile_viewer" %}


### Running Your Application
With the viewer running, start your application normally to capture the instrumented zones:

```bash
cd build
./your_project_executable
```

Once your application starts, Tracy will display real-time profiling data:

{% include image.html src="/media/2023-12-05-note-using-tracy-profiler/captured_profile.webp" alt="profile_viewer" %}
