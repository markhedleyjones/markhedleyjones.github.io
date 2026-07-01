---

layout: note
title:  "Compile C++ With Warnings"
date:   2023-12-10
permalink: /notes/compile-cpp-with-warnings
description: "How to set up strict compiler warnings in CMake as an error"
tags: [cpp, CMake]
---

For CMake projects, add the following to your CMakeLists.txt:

```cmake
target_compile_options(<executable_name> PRIVATE -Wall -Wextra -Wpedantic)
```

For non-CMake projects, add the following to your Makefile:

```makefile
CXXFLAGS += -Wall -Wextra -Wpedantic
```
