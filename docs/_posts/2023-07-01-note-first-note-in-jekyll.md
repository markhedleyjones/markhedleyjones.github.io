---
layout: note
title:  "Separating posts by category in Jekyll"
date:   2023-07-01
permalink: /notes/separating-posts-by-category-in-jekyll
description: "how I've separated Notes & Projects on this site"
---
Jekyll can generate a static website from posts contained in the `_posts` folder.
This is good for example if you want to display a portfolio of projects (as I do on this website). However, if you also want to be able to have a separate list of things, like notes, how do you do that?

## Categorising your posts

Because I use a different layout for my pages between notes and projects, it was convenient to separate my posts using the `layout` field. For example, this post has the header

```
---
layout: note
title:  "Separating posts into categories in Jekyll"
date:   2023-07-01
permalink: /notes/separating-posts-by-category-in-jekyll
description: "for example, lists of projects and a page of notes"
---
```

## Filtering your posts

In the page where you list all the posts you can change your assignment statement from

```
assign posts = site.posts
```
to
```
assign notes = site.posts | where: "layout","note"
```
and
```
assign projects = site.posts | where: "layout","project"
```
