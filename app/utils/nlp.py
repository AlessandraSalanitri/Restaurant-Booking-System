from __future__ import annotations
import re
from typing import Optional

from app.utils.dates import resolve_dates 

# Regex used by normalizers 
DATE_ISO_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
TIME_ANY_RE = re.compile(r'^\d{1,2}(:\d{2}){0,2}(\s*[ap]m)?$', re.I)
TIME_AMPM_RE = re.compile(r'\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b', re.I)

PARTY_DIGIT_RE = re.compile(
    r"\b(?:party\s*(?:size)?\s*of|table\s*for|for)\s*(\d{1,2})\b",
    re.IGNORECASE,
)
PARTY_TRAILING_DIGIT_RE = re.compile(
    r"\b(\d{1,2})\s*(?:people|persons?|guests?|pax)\b",
    re.IGNORECASE,
)

_NUM_WORDS = {
    "one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,"eight":8,"nine":9,"ten":10,
    "eleven":11,"twelve":12,"thirteen":13,"fourteen":14,"fifteen":15,"sixteen":16,"seventeen":17,
    "eighteen":18,"nineteen":19,"twenty":20,
}
PARTY_WORD_RE = re.compile(
    r"\b(?:party\s*(?:size)?\s*of|table\s*for|for)\s*(%s)\b" % "|".join(_NUM_WORDS.keys()),
    re.IGNORECASE,
)

# KV parser 
def parse_input(input_text: str) -> dict:
    """Parse 'Key: Val, Key2: Val2' into a dict with lowercase keys."""
    data = {}
    for part in input_text.split(","):
        if ":" in part:
            key, val = part.split(":", 1)
            data[key.strip().lower()] = val.strip()
    return data

# normalizers used by tools 
def normalize_date(value: Optional[str], full_text: str) -> Optional[str]:
    """
    Return YYYY-MM-DD if possible (prefer explicit ISO; fallback to natural language via resolve_dates).
    Picks Saturday first for 'weekend' (labels include 'weekend-sat' / 'weekend-sun').
    """
    if value and DATE_ISO_RE.match(value):
        return value

    for source in (value or '', full_text):
        if not source:
            continue
        rs = resolve_dates(source)
        if rs:
            for r in rs:
                if 'sat' in r.label:
                    return r.iso_date
            return rs[0].iso_date
    return None

def normalize_time(value: Optional[str], full_text: str) -> Optional[str]:
    """
    Return HH:MM:SS; accepts '7pm', '7:30 pm', '19:00', or '19'.
    """
    text = (value or '').strip() or full_text
    if not text:
        return None

    m = TIME_AMPM_RE.search(text)  # '7pm', '7:30 pm'
    if m:
        h = int(m.group(1))
        minute = int(m.group(2) or 0)
        ampm = m.group(3).lower()
        if ampm == 'pm' and h != 12:
            h += 12
        if ampm == 'am' and h == 12:
            h = 0
        return f"{h:02d}:{minute:02d}:00"

    if value and TIME_ANY_RE.match(value):  # '19', '19:00', '19:00:00'
        parts = value.split(':')
        if len(parts) == 1:
            return f"{int(parts[0]):02d}:00:00"
        if len(parts) == 2:
            return f"{int(parts[0]):02d}:{int(parts[1]):02d}:00"
        if len(parts) == 3:
            return f"{int(parts[0]):02d}:{int(parts[1]):02d}:{int(parts[2]):02d}"
    return None

def normalize_party_size(value: Optional[str], full_text: str, min_size: int = 1, max_size: int = 20) -> Optional[str]:
    """
    Return a numeric party size as a string ('4'), or None if not found/invalid.
    Prefers an explicit numeric value; falls back to parsing the full text (digits or words).
    """
    if value and str(value).isdigit():
        n = int(value)
        if min_size <= n <= max_size:
            return str(n)

    text = full_text or ""

    m = PARTY_DIGIT_RE.search(text)  # 'for 4', 'party of 6'
    if m:
        n = int(m.group(1))
        if min_size <= n <= max_size:
            return str(n)

    m = PARTY_TRAILING_DIGIT_RE.search(text)  # '4 people'
    if m:
        n = int(m.group(1))
        if min_size <= n <= max_size:
            return str(n)

    m = PARTY_WORD_RE.search(text)  # 'for two', 'party of five'
    if m:
        n = _NUM_WORDS[m.group(1).lower()]
        if min_size <= n <= max_size:
            return str(n)

    return None
