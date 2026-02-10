---
layout: note
title:  "Enable extra compile warnings C++"
date:   2023-12-10
permalink: /notes/compile-cpp-with-warnings
description: "find unused variables, bad comparisons, etc."
---

For CMake projects, add the following to your CMakeLists.txt:

```cmake
target_compile_options(<executable_name> PRIVATE -Wall -Wextra -Wpedantic)
```

For non-CMake projects, add the following to your Makefile:

```makefile
CXXFLAGS += -Wall -Wextra -Wpedantic
```
