---
layout: page
title: Tags
permalink: /tags/
description: Browse technical notes and projects by topic.
---

<div class="tags-page">
{%- assign sorted_tags = site.tags | sort -%}
<p class="tags-intro">{{ site.posts | size }} posts across {{ sorted_tags | size }} topics.</p>
{%- for tag in sorted_tags -%}
  {%- assign tag_slug = tag[0] | slugify -%}
  {%- assign tag_count = tag[1] | size -%}
  <section class="tag-section">
    <h2 id="{{ tag_slug }}">{{ tag[0] }} <span class="tag-count">({{ tag_count }})</span></h2>
    <ul class="tag-posts">
    {%- for post in tag[1] -%}
      {%- if post.layout == "note" -%}
        {%- assign post_type = "note" -%}
      {%- elsif post.layout == "project" -%}
        {%- assign post_type = "project" -%}
      {%- else -%}
        {%- assign post_type = "" -%}
      {%- endif -%}
      <li>
        <a href="{{ post.url }}" class="tag-post-link">
          <span class="tag-post-title">{{ post.title }}</span>
          <span class="tag-post-meta">
            {%- if post_type -%}<span class="tag-post-type {{ post_type }}">{{ post_type }}</span>{%- endif -%}
            <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
          </span>
        </a>
      </li>
    {%- endfor -%}
    </ul>
  </section>
{%- endfor -%}
</div>
