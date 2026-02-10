---
layout: note
title:  "Dictionaries in Bash"
date:   2023-07-03
permalink: /notes/dictionaries-in-bash
description: "a way to associate two values in a Bash array"
---

Rather than creating multiple arrays in Bash and using an index to reference associated data in each array, you can store key-value pairs in a single array. This is useful when you want to associate two values together.

```bash
#!/usr/bin/env bash

# Create an array of pairs
declare -A my_dictionary=(
  [key1]=value1
  [key2]=value2
  [key3]=value3
)

# Iterate over the array
for key in "${!my_dictionary[@]}"; do
  echo "key: $key, value: ${my_dictionary[$key]}"
done
```
