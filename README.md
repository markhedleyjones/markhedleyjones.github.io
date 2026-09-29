This repository contains the source code for my personal website.
The site is hosted on GitHub Pages and can be accessed from
[markhedleyjones.com](https://markhedleyjones.com).

The Jekyll source lives in `docs/`. A GitHub Actions workflow builds it from
`master` in safe mode, checks internal links, and deploys the resulting site to
GitHub Pages. Only plugins on the
[GitHub Pages allow-list](https://pages.github.com/versions/) take effect.

# Development

This repository uses [container-magic](https://github.com/markhedleyjones/container-magic)
to build a container with the right Ruby and gem versions.

```sh
./build.sh          # build the image (needed once, and after Gemfile changes)
./run.sh serve      # dev server on http://localhost:4111, live reload on 4112
```

Edit anything under `docs/` and the server rebuilds automatically.

# Media

Content images are added through an include rather than a raw `<img>` tag, so
that every image carries its intrinsic size and a set of responsive candidates:

```liquid
{% include image.html src="/media/projects/<project>/photo.webp" alt="What it shows" %}
{% include video-embed.html url="<youtube-id>" caption="What it shows" %}
```

After adding an image, run `./generate_responsive_images.py`. It writes narrow
variants next to the original and records every image's dimensions in
`docs/_data/image_sizes.yml`, which the include reads.

After adding a video, run `./generate_video_posters.py`. Embedded videos are
click-to-load: the page shows a local poster image and only contacts YouTube
once a visitor presses play.
