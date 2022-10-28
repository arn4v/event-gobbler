# @initflow/event-gobbler

This package contains the event ingestion routes and the core Clickhouse logic. It at the core of Initflow, but can be hosted as a standalone

## Event Schema

```json
{
  "type": "track",
  // ISO String
  "captured_at": "2020-01-01T00:00:00.000Z",
  // Id of the user that was identified by the client SDK
  "user_id": "123",
  "properties": {
    // Properties prefixed with `$` are automatically captured by the SDK
    "$os": "",
    "$browser": "",
    "$browser_version": "",
    "$current_url": "",
    "$user_agent": ""
  }
}
```

## Identify Schema

```json
{
  "type": "identify",
  // ISO String
  "captured_at": "2020-01-01T00:00:00.000Z",
  // Id of the user that was identified by the client SDK
  "user_id": "123",
  "properties": {
    // Properties prefixed with `$` are automatically captured by the SDK
    "$os": "",
    "$browser": "",
    "$browser_version": "",
    "$current_url": "",
    "$user_agent": ""
  }
}
```
