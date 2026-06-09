from datetime import datetime, timedelta, timezone

def format_last_seen(self, last_seen: datetime) -> str:
    """
    Telegram-style last seen formatter (improved real-time version)
    """

    if not last_seen:
        return "last seen recently"

    # Ensure timezone-safe comparison
    now = datetime.now(timezone.utc)

    if last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=timezone.utc)

    diff = now - last_seen
    seconds = int(diff.total_seconds())
    minutes = seconds // 60
    hours = minutes // 60
    days = diff.days

    # Less than 1 minute
    if seconds < 60:
        return "last seen just now"

    # Minutes
    if minutes < 60:
        return f"last seen {minutes} minute{'s' if minutes != 1 else ''} ago"

    # Hours
    if hours < 24:
        return f"last seen {hours} hour{'s' if hours != 1 else ''} ago"

    # Yesterday
    yesterday = now.date() - timedelta(days=1)
    if last_seen.date() == yesterday:
        return f"last seen yesterday at {last_seen.strftime('%I:%M %p').lstrip('0')}"

    # Within last 7 days
    if days < 7:
        return f"last seen {last_seen.strftime('%A')} at {last_seen.strftime('%I:%M %p').lstrip('0')}"

    # Same year
    if last_seen.year == now.year:
        return f"last seen {last_seen.strftime('%b %d')} at {last_seen.strftime('%I:%M %p').lstrip('0')}"

    # Older years
    return f"last seen {last_seen.strftime('%b %d, %Y')} at {last_seen.strftime('%I:%M %p').lstrip('0')}"