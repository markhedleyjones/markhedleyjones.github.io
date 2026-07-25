#!/usr/bin/env python3
"""Fetch a local poster image for every embedded YouTube video.

_includes/video-embed.html renders a poster instead of the player, so nothing
reaches YouTube until a visitor presses play. That only works if the poster is
served from this site, which is what this script produces.

Run from the repository root after adding a video:

    ./generate_video_posters.py
"""

import re
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

DOCS = Path(__file__).parent / "docs"
POSTERS = DOCS / "media" / "video-posters"

VIDEO_INCLUDE = re.compile(r'{%-?\s*include\s+video-embed\.html[^%]*\surl="([^"]+)"')
SOURCE_GLOBS = ("_posts/*", "*.html", "*.md")

# Best first. hqdefault always exists but is 4:3 with letterbox bars baked in.
THUMBNAIL_NAMES = ("maxresdefault", "sddefault", "hqdefault")
LETTERBOXED = {"sddefault", "hqdefault"}
POSTER_WIDTH = 1280
WEBP_QUALITY = 80


def referenced_video_ids():
    found = set()
    for pattern in SOURCE_GLOBS:
        for path in DOCS.glob(pattern):
            if path.is_file():
                found.update(VIDEO_INCLUDE.findall(path.read_text(encoding="utf-8")))
    return sorted(found)


def download(video_id, destination):
    """Fetch the best available thumbnail. Returns the variant name used."""
    for name in THUMBNAIL_NAMES:
        url = f"https://i.ytimg.com/vi/{video_id}/{name}.jpg"
        result = subprocess.run(
            ["curl", "-sfL", "--max-time", "30", "-o", str(destination), url],
            capture_output=True,
        )
        if result.returncode == 0 and destination.stat().st_size > 2000:
            return name
    return None


def crop_letterbox(image):
    """Trim the black bars YouTube pads 4:3 thumbnails with, back to 16:9."""
    width, height = image.size
    target_height = round(width * 9 / 16)
    if target_height >= height:
        return image
    top = (height - target_height) // 2
    return image.crop((0, top, width, top + target_height))


def main():
    POSTERS.mkdir(parents=True, exist_ok=True)
    video_ids = referenced_video_ids()
    fetched, failed = 0, []

    for video_id in video_ids:
        poster = POSTERS / f"{video_id}.webp"
        if poster.exists():
            continue

        with tempfile.NamedTemporaryFile(suffix=".jpg") as handle:
            source = Path(handle.name)
            variant = download(video_id, source)
            if variant is None:
                failed.append(video_id)
                continue
            with Image.open(source) as image:
                if variant in LETTERBOXED:
                    image = crop_letterbox(image)
                image.thumbnail((POSTER_WIDTH, 10**6), Image.LANCZOS)
                image.save(poster, "WEBP", quality=WEBP_QUALITY, method=6)
        print(f"  {video_id}  ({variant})  {poster.stat().st_size // 1024} KB")
        fetched += 1

    print(f"{len(video_ids)} videos referenced, {fetched} posters fetched")

    unused = {p.stem for p in POSTERS.glob("*.webp")} - set(video_ids)
    if unused:
        print("\nposters no longer referenced by any page:")
        for stem in sorted(unused):
            print(f"  media/video-posters/{stem}.webp")

    if failed:
        print(f"\nno thumbnail available for: {', '.join(failed)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
