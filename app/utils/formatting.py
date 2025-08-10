import datetime as dt

def pretty_time(hms: str) -> str:
    return dt.datetime.strptime(hms, "%H:%M:%S").strftime("%I:%M %p").lstrip("0")

def pretty_date(iso_date: str) -> str:
    return dt.datetime.strptime(iso_date, "%Y-%m-%d").strftime("%A %b %d, %Y")
