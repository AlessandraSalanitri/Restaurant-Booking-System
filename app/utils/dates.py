from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timedelta
import re
import zoneinfo
import dateparser  

WEEKDAYS = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6
}

@dataclass(frozen=True)
class ResolvedDate:
    iso_date: str
    label: str  # "weekend", "next weekday", "this weekday", "parser"

def _midnight(dt: datetime) -> datetime:
    return dt.replace(hour=0, minute=0, second=0, microsecond=0)

def _next_weekday(base: datetime, target: int, strict_next: bool) -> datetime:
    days = (target - base.weekday()) % 7
    if days == 0 and strict_next:
        days = 7
    return _midnight(base + timedelta(days=days))

def _upcoming_weekend(base: datetime) -> tuple[datetime, datetime]:
    sat = _next_weekday(base, WEEKDAYS["saturday"], strict_next=False)
    sun = _next_weekday(base, WEEKDAYS["sunday"], strict_next=False)
    if base.weekday() == WEEKDAYS["sunday"]:
        sat += timedelta(days=7); sun += timedelta(days=7)
    return sat, sun

def resolve_dates(text: str, *, tz: str = "Europe/London", now: datetime | None = None) -> list[ResolvedDate]:
    tzinfo = zoneinfo.ZoneInfo(tz)
    base = (now or datetime.now(tzinfo)).astimezone(tzinfo)
    t = text.lower()

    # weekend
    if "weekend" in t:
        sat, sun = _upcoming_weekend(base)
        return [
            ResolvedDate(sat.date().isoformat(), "weekend-sat"),
            ResolvedDate(sun.date().isoformat(), "weekend-sun"),
        ]

    # next <weekday>
    if m := re.search(r"\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b", t):
        wd = WEEKDAYS[m.group(1)]
        d = _next_weekday(base, wd, strict_next=True)
        return [ResolvedDate(d.date().isoformat(), "next-weekday")]

    # this <weekday>
    if m := re.search(r"\bthis\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b", t):
        wd = WEEKDAYS[m.group(1)]
        d = _next_weekday(base, wd, strict_next=False)
        return [ResolvedDate(d.date().isoformat(), "this-weekday")]

    # fallback to dateparser
    dp = dateparser.parse(
        text,
        settings={
            "RELATIVE_BASE": base,
            "PREFER_DATES_FROM": "future",
            "TIMEZONE": tz,
            "RETURN_AS_TIMEZONE_AWARE": True,
            "DATE_ORDER": "DMY",
        },
        languages=["en"],
    )
    return [ResolvedDate(_midnight(dp).date().isoformat(), "parser")] if dp else []
