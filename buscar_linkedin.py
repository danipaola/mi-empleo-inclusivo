#!/usr/bin/env python3
"""
Busca publicaciones públicas indexadas en Bing de las personas configuradas
en personas_linkedin.json y actualiza linkedin.json.

Limitación: LinkedIn puede ocultar publicaciones o impedir su indexación.
Este proceso encuentra únicamente resultados públicos visibles para el buscador.
"""

from __future__ import annotations

import html
import json
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PEOPLE_FILE = ROOT / "personas_linkedin.json"
OUTPUT_FILE = ROOT / "linkedin.json"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0 Safari/537.36"
)

MAX_RESULTS_PER_PERSON = 8
REQUEST_DELAY_SECONDS = 2


def fetch(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept-Language": "es-AR,es;q=0.9,en;q=0.6",
        },
    )
    with urllib.request.urlopen(req, timeout=25) as response:
        return response.read().decode("utf-8", errors="replace")


def clean_text(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def extract_results(page: str) -> list[dict]:
    results: list[dict] = []

    blocks = re.findall(
        r'<li class="b_algo".*?</li>',
        page,
        flags=re.I | re.S,
    )

    for block in blocks:
        link_match = re.search(
            r'<h2>\s*<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>',
            block,
            flags=re.I | re.S,
        )
        if not link_match:
            continue

        url = html.unescape(link_match.group(1))
        title = clean_text(link_match.group(2))

        snippet_match = re.search(
            r'<p[^>]*>(.*?)</p>',
            block,
            flags=re.I | re.S,
        )
        snippet = clean_text(snippet_match.group(1)) if snippet_match else ""

        results.append({"url": url, "title": title, "snippet": snippet})

    return results


def is_linkedin_post(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    host = parsed.netloc.lower()
    path = parsed.path.lower()

    if "linkedin.com" not in host:
        return False

    return (
        "/posts/" in path
        or "/feed/update/" in path
        or "activity-" in path
        or "/pulse/" in path
    )


def relevant(text: str, keywords: list[str]) -> bool:
    normalized = text.casefold()
    return any(keyword.casefold() in normalized for keyword in keywords)


def load_existing() -> list[dict]:
    if not OUTPUT_FILE.exists():
        return []
    try:
        data = json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except Exception:
        return []


def main() -> None:
    people = json.loads(PEOPLE_FILE.read_text(encoding="utf-8"))
    existing = load_existing()
    by_url = {item.get("post"): item for item in existing if item.get("post")}

    checked_at = datetime.now(timezone.utc).isoformat()

    for person in people:
        if not person.get("active", True):
            continue

        name = str(person.get("name", "")).strip()
        profile = str(person.get("profile", "")).strip()
        keywords = person.get("keywords") or [
            "oportunidad laboral",
            "vacante",
            "empleo",
            "inclusión",
            "discapacidad",
        ]

        keyword_query = " OR ".join(f'"{k}"' for k in keywords)
        query = f'site:linkedin.com/posts "{name}" ({keyword_query})'
        search_url = "https://www.bing.com/search?" + urllib.parse.urlencode(
            {"q": query, "count": str(MAX_RESULTS_PER_PERSON)}
        )

        try:
            page = fetch(search_url)
            candidates = extract_results(page)
        except Exception as exc:
            print(f"No se pudo buscar a {name}: {exc}")
            time.sleep(REQUEST_DELAY_SECONDS)
            continue

        added = 0
        for result in candidates:
            url = result["url"]
            combined = f'{result["title"]} {result["snippet"]}'

            if not is_linkedin_post(url):
                continue
            if name.casefold() not in combined.casefold():
                continue
            if not relevant(combined, keywords):
                continue
            if url in by_url:
                continue

            item = {
                "id": re.sub(r"[^a-z0-9]+", "-", f"{name}-{added}".casefold()).strip("-"),
                "name": name,
                "profile": profile,
                "type": "Publicación pública encontrada",
                "job": result["title"] or "Oportunidad laboral",
                "company": "LinkedIn",
                "location": "No informada",
                "date": datetime.now().strftime("%d/%m/%Y"),
                "post": url,
                "description": result["snippet"],
                "source": "busqueda-publica",
                "checked_at": checked_at,
            }
            existing.insert(0, item)
            by_url[url] = item
            added += 1

        print(f"{name}: {added} publicación(es) nueva(s)")
        time.sleep(REQUEST_DELAY_SECONDS)

    # Keep the most recent 100 links and preserve initial manual items.
    OUTPUT_FILE.write_text(
        json.dumps(existing[:100], ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
