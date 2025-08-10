import os
import requests
from typing import List, Dict, Any

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8547")
TOKEN    = os.getenv("BACKEND_BEARER_TOKEN")

def _headers() -> Dict[str, str]:
    return {"Authorization": f"Bearer {TOKEN}"}

def availability(visit_date: str, party_size: int | str, channel: str = "ONLINE") -> List[str]:
    r = requests.post(
        f"{BASE_URL}/api/ConsumerApi/v1/Restaurant/TheHungryUnicorn/AvailabilitySearch",
        headers=_headers(),
        data={"VisitDate": visit_date, "PartySize": party_size, "ChannelCode": channel},
    )
    r.raise_for_status()
    data = r.json()
    return [s["time"] for s in data.get("available_slots", []) if s.get("available")]

def create_booking(form: Dict[str, Any]) -> Dict[str, Any]:
    r = requests.post(
        f"{BASE_URL}/api/ConsumerApi/v1/Restaurant/TheHungryUnicorn/BookingWithStripeToken",
        headers=_headers(),
        data=form,
    )
    r.raise_for_status()
    return r.json()

def get_booking(ref: str) -> Dict[str, Any]:
    r = requests.get(
        f"{BASE_URL}/api/ConsumerApi/v1/Restaurant/TheHungryUnicorn/Booking/{ref}",
        headers=_headers(),
    )
    r.raise_for_status()
    return r.json()

def update_booking(ref: str, data: Dict[str, Any]) -> Dict[str, Any]:
    r = requests.patch(
        f"{BASE_URL}/api/ConsumerApi/v1/Restaurant/TheHungryUnicorn/Booking/{ref}",
        headers=_headers(),
        data=data,
    )
    r.raise_for_status()
    return r.json()

def cancel_booking(ref: str, reason_id: int) -> Dict[str, Any]:
    r = requests.post(
        f"{BASE_URL}/api/ConsumerApi/v1/Restaurant/TheHungryUnicorn/Booking/{ref}/Cancel",
        headers=_headers(),
        data={
            "micrositeName": "TheHungryUnicorn",
            "bookingReference": ref,
            "cancellationReasonId": reason_id,
        },
    )
    r.raise_for_status()
    return r.json()



__all__ = [
    "availability",
    "create_booking",
    "get_booking",
    "update_booking",
    "cancel_booking",
]
