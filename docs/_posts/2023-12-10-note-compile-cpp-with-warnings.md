---

layout: note
title:  "Compile C++ With Warnings"
date:   2023-12-10
last_modified_at: 2026-10-22
permalink: /notes/compile-cpp-with-warnings
description: "GCC and Clang warning flags"
tags: [cpp, cmake]
---

With GCC or Clang, add the following to your `CMakeLists.txt`:

```cmake
target_compile_options(<executable_name> PRIVATE -Wall -Wextra -Wpedantic)
```

For non-CMake projects, add the following to your Makefile:

```makefile
CXXFLAGS += -Wall -Wextra -Wpedantic
```

These options enable warnings; they do not turn warnings into errors. Add `-Werror` if that is the policy you want for your build.
