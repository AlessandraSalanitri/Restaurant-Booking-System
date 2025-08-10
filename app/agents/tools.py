"""
LangChain Tools for The Hungry Unicorn.
"""

import requests
from datetime import datetime, date as _date

from langchain.agents import Tool

from app.core.config import API_BASE, BACKEND_TOKEN
from app.utils.dates import resolve_dates
from app.utils.nlp import (
    parse_input,
    normalize_date,
    normalize_time,
    normalize_party_size,
)
from app.utils.formatting import pretty_date, pretty_time
from app.services.restaurant_api import (
    availability as api_availability,
    create_booking as api_create_booking,
    get_booking as api_get_booking,
    update_booking as api_update_booking,
    cancel_booking as api_cancel_booking,
)


def check_availability_tool(input_text: str) -> str:
    """
    Accepts either:
      - VisitDate as ISO 'YYYY-MM-DD'
      - or natural language like 'this weekend', 'next Friday'
    Always needs PartySize and ChannelCode.
    """
    # Try natural-language resolution first
    resolved = resolve_dates(input_text)
    if resolved:
        dates = [r.iso_date for r in resolved]   # weekend [Sat, Sun]
    else:
        # fallback to specific date passed by the agent
        params = parse_input(input_text)
        if "visitdate" not in params:
            return "Any specific date you'd like to check availability for?."
        dates = [params["visitdate"]]

    # party size & channel required
    params = parse_input(input_text)
    if "partysize" not in params or "channelcode" not in params:
        return "Please specify for how many people you want to check availability for?."
    party = params["partysize"]
    channel = params["channelcode"]

    # Guard against past dates
    today = _date.today().isoformat()
    dates = [d for d in dates if d >= today]
    if not dates:
        return "That date looks like it's in the past. Please choose a future date."

    results = []
    for d in dates:
        resp = requests.post(
            f"{API_BASE}/api/ConsumerApi/v1/Restaurant/TheHungryUnicorn/AvailabilitySearch",
            headers={"Authorization": f"Bearer {BACKEND_TOKEN}"},
            data={"VisitDate": d, "PartySize": party, "ChannelCode": channel},
        )
        if not resp.ok:
            return "Sorry, I couldn't retrieve availability right now. Please try again later."

        slots = resp.json().get("available_slots", [])
        times = [s.get("time") for s in slots if s.get("available")]

        if times:
            def pretty(t: str) -> str:
                return datetime.strptime(t, "%H:%M:%S").strftime("%I:%M %p").lstrip("0")

            human_times = ", ".join(pretty(t) for t in times)
            daylabel = datetime.strptime(d, "%Y-%m-%d").strftime("%A %b %d, %Y")
            results.append(f"on {daylabel}: {human_times}")
        else:
            results.append(f"on {d}: no available slots")

    if len(results) == 2:
        return (
            "Available times for this weekend:\n"
            f" • {results[0]}\n"
            f" • {results[1]}\n"
            "Would you like to book one of these slots?"
        )
    else:
        return f"Available times {results[0]}. Would you like to book this slot?"


def create_booking_tool(input_text: str) -> str:
    params = parse_input(input_text)

    # Normalize from explicit params or natural language
    visit_date = normalize_date(params.get("visitdate"), input_text)
    visit_time = normalize_time(params.get("visittime"), input_text)
    party      = normalize_party_size(params.get("partysize"), input_text)
    channel    = params.get("channelcode") or "ONLINE"

    # Guardrails before hitting the APIs
    if not party:
        return "How many people is the booking for?"
    if not visit_date:
        return "I couldn’t find a valid date. Try “next Friday” or “2025-08-15”."
    if not visit_time:
        return "I couldn’t find a valid time. Try “7pm” or “19:00”."

    # Availability pre-check 
    try:
        times = api_availability(visit_date, int(party), channel)  # expects HH:MM:SS strings
    except Exception:
        return "Sorry, I couldn't check availability for your booking. Please try again later."

    if visit_time not in times:
        if not times:
            return f"Sorry, {pretty_date(visit_date)} has no available times for {party} people."
        return (
            f"That exact time isn’t available. On {pretty_date(visit_date)} we have: "
            f"{', '.join(pretty_time(t) for t in times)}. Which time would you like?"
        )

    # Proceed to booking
    form = {
        "VisitDate": visit_date,
        "VisitTime": visit_time,
        "PartySize": party,
        "ChannelCode": channel,
    }
    for fld in ("firstname", "surname"):
        if fld in params:
            form[f"Customer[{fld.capitalize()}]"] = params[fld]

    try:
        b = api_create_booking(form)
    except Exception:
        return "Sorry, I couldn't create the booking. Please check your details and try again."

    return (
        f"Your booking for {pretty_date(b['visit_date'])} at {pretty_time(b['visit_time'])} "
        f"for a party of {party} is confirmed! Reference: {b.get('booking_reference')}. "
        "Looking forward to seeing you at The Hungry Unicorn."
    )


def get_booking_tool(input_text: str) -> str:
    params = parse_input(input_text)
    ref = params.get("booking_reference") or params.get("reference")
    if not ref:
        return "Please provide your booking reference so I can look it up."

    try:
        b = api_get_booking(ref)
    except Exception:
        return "Sorry, I couldn't retrieve your booking right now. Please try again later."
    if not b:
        return f"No booking found with reference {ref}. Please check your reference number and try again."

    return (
        f"Your reservation {ref} is on {b['visit_date']} at {b['visit_time']} "
        f"for {b['party_size']} people."
    )


def update_booking_tool(input_text: str) -> str:
    params = parse_input(input_text)

    # accept both keys
    ref = params.get("booking_reference") or params.get("reference")
    if not ref:
        return "What's your booking reference?"

    # Prefer explicit params, otherwise infer from NL text.
    data: dict[str, str] = {}

    # Date
    new_date = normalize_date(params.get("visitdate"), input_text)
    if new_date:
        data["VisitDate"] = new_date

    # Time
    new_time = normalize_time(params.get("visittime"), input_text)
    if new_time:
        data["VisitTime"] = new_time  # e.g. '20:00:00'

    # Party size
    new_party = normalize_party_size(params.get("partysize"), input_text)
    if new_party:
        data["PartySize"] = new_party

    # Pass-through optional fields only if explicitly provided
    if "specialrequests" in params:
        data["SpecialRequests"] = params["specialrequests"]
    if "isleavetimeconfirmed" in params:
        data["IsLeaveTimeConfirmed"] = params["isleavetimeconfirmed"]

    if not data:
        return "No changes specified. You can update date, time, party size or special requests."

    try:
        api_update_booking(ref, data)
    except Exception:
        return "Sorry, I couldn't update your booking. Please try again."

    return f"Your booking {ref} has been updated successfully!"



def cancel_booking_tool(input_text: str) -> str:
    params = parse_input(input_text)
    ref = params.get("booking_reference")
    reason = params.get("cancellationreasonid")
    if not ref or not reason:
        return "What's your booking reference number?" # Possible future enhancement: list reasons for feedback

    try:
        api_cancel_booking(ref, int(reason))
    except Exception:
        return "Sorry, I couldn't cancel your booking. Please verify your reference and try again."

    return f"Your booking {ref} has been cancelled."


def get_tools():
    """Return LangChain Tool objects."""
    return [
        Tool(
            name="Check Availability",
            func=check_availability_tool,
            description=(
                "Check availability at TheHungryUnicorn. "
                "VisitDate may be an ISO date (YYYY-MM-DD) OR a phrase like "
                "'this weekend', 'next Friday', 'this Sunday'. "
                "Always include PartySize and ChannelCode: ONLINE."
            ),
        ),
        Tool(
            name="Create Booking",
            func=create_booking_tool,
            description=(
                "Book a table. Understands natural language like "
                "'book for 4 next Friday at 7pm'. Defaults ChannelCode to ONLINE. "
                "Optional: FirstName, Surname, Email, Mobile."
            ),
        ),
        Tool(
            name="Get Booking",
            func=get_booking_tool,
            description="Input 'Booking_Reference:XYZ'",
        ),
        Tool(
            name="Update Booking",
            func=update_booking_tool,
            description=(
                "Input 'Booking_Reference:XYZ, VisitDate:..., VisitTime:..., "
                "PartySize:..., SpecialRequests:..., IsLeaveTimeConfirmed:...'"
            ),
        ),
        Tool(
            name="Cancel Booking",
            func=cancel_booking_tool,
            description="Input 'Booking_Reference:XYZ, CancellationReasonId:N'",
        ),
    ]
