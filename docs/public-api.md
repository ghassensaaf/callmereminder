# Dialcues Public REST API (v1)

The public API is REST-first and versioned under `/api/public/v1`.

- Auth: `Authorization: Bearer <api_key>`
- Format: JSON request/response bodies
- Errors: stable shape `{ "error": { "code", "message", "details" } }`

## 1) Create an API key

API keys are managed from the private app API (session cookie auth), by org `owner/admin` users.

- `GET /api/public-api-keys`
- `POST /api/public-api-keys`
- `POST /api/public-api-keys/:id/revoke`

`POST /api/public-api-keys` request:

```json
{
  "name": "Production integration",
  "expires_at": "2027-01-01T00:00:00Z"
}
```

Response includes `api_key` only once; store it securely.

## 2) Public API base

- Base URL: `https://<your-api-host>/api/public/v1`
- Required header:

```http
Authorization: Bearer dc_live_xxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

## 3) Endpoints

- `GET /me`
- `GET /reminders`
- `POST /reminders`
- `GET /reminders/:id`
- `PATCH /reminders/:id`
- `DELETE /reminders/:id`
- `GET /executions`

## 4) Language examples

### cURL

```bash
curl -X POST "https://api.yourapp.com/api/public/v1/reminders" \
  -H "Authorization: Bearer $DIALCUES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Take medication",
    "message": "Please take your medication now.",
    "phone_number": "+14155552671",
    "scheduled_at": "2026-03-25T09:00:00",
    "timezone": "America/New_York",
    "recurrence_type": "daily"
  }'
```

### JavaScript (Node 18+ / fetch)

```js
const API_KEY = process.env.DIALCUES_API_KEY;
const BASE = "https://api.yourapp.com/api/public/v1";

const res = await fetch(`${BASE}/reminders`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Standup reminder",
    message: "Daily standup in 5 minutes",
    phone_number: "+14155552671",
    scheduled_at: "2026-03-25T09:25:00",
    timezone: "America/New_York",
    recurrence_type: "daily",
  }),
});

if (!res.ok) throw new Error(await res.text());
console.log(await res.json());
```

### Python (requests)

```python
import os
import requests

base = "https://api.yourapp.com/api/public/v1"
headers = {
    "Authorization": f"Bearer {os.environ['DIALCUES_API_KEY']}",
    "Content-Type": "application/json",
}
payload = {
    "title": "Doctor appointment",
    "message": "Appointment in 30 minutes",
    "phone_number": "+14155552671",
    "scheduled_at": "2026-03-25T13:30:00",
    "timezone": "America/New_York"
}

r = requests.post(f"{base}/reminders", json=payload, headers=headers, timeout=20)
r.raise_for_status()
print(r.json())
```

### Go

```go
package main

import (
  "bytes"
  "fmt"
  "io"
  "net/http"
  "os"
)

func main() {
  body := []byte(`{
    "title":"Water break",
    "message":"Drink water now.",
    "phone_number":"+14155552671",
    "scheduled_at":"2026-03-25T15:00:00",
    "timezone":"America/New_York"
  }`)

  req, _ := http.NewRequest("POST", "https://api.yourapp.com/api/public/v1/reminders", bytes.NewBuffer(body))
  req.Header.Set("Authorization", "Bearer "+os.Getenv("DIALCUES_API_KEY"))
  req.Header.Set("Content-Type", "application/json")

  resp, err := http.DefaultClient.Do(req)
  if err != nil { panic(err) }
  defer resp.Body.Close()
  out, _ := io.ReadAll(resp.Body)
  fmt.Println(resp.StatusCode, string(out))
}
```

### PHP

```php
<?php
$ch = curl_init("https://api.yourapp.com/api/public/v1/reminders");
$payload = json_encode([
  "title" => "Team sync",
  "message" => "Join the sync call now.",
  "phone_number" => "+14155552671",
  "scheduled_at" => "2026-03-25T16:00:00",
  "timezone" => "America/New_York"
]);

curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer " . getenv("DIALCUES_API_KEY"),
    "Content-Type: application/json"
  ],
  CURLOPT_POSTFIELDS => $payload,
  CURLOPT_RETURNTRANSFER => true,
]);

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

echo $status . PHP_EOL . $response . PHP_EOL;
```

### Ruby

```ruby
require "net/http"
require "json"

uri = URI("https://api.yourapp.com/api/public/v1/reminders")
req = Net::HTTP::Post.new(uri)
req["Authorization"] = "Bearer #{ENV.fetch("DIALCUES_API_KEY")}"
req["Content-Type"] = "application/json"
req.body = {
  title: "Pay rent",
  message: "Rent is due today",
  phone_number: "+14155552671",
  scheduled_at: "2026-03-25T08:00:00",
  timezone: "America/New_York"
}.to_json

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == "https") do |http|
  http.request(req)
end

puts "#{res.code} #{res.body}"
```

## 5) Common request models

Create reminder:

```json
{
  "title": "string",
  "message": "string",
  "phone_number": "+14155552671",
  "scheduled_at": "2026-03-25T09:00:00",
  "timezone": "America/New_York",
  "vapi_line_id": "optional line id",
  "recurrence_type": "daily | weekly | custom | null",
  "recurrence_config": "{\"interval_days\":3} or {\"weekdays\":[1,3,5]}",
  "recurrence_end_at": "2026-06-01T09:00:00"
}
```

List reminders query params:

- `status`: `scheduled|paused|completed|failed|in_progress`
- `search`: text search on title/message
- `date_from`: ISO date/time
- `date_to`: ISO date/time
- `sort`: `scheduled_at_asc|scheduled_at_desc|updated_at_desc`
- `page`: default `1`
- `page_size`: default `20`, max `100`

## 6) Error handling

Example:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Scheduled time must be in the future.",
    "details": null
  }
}
```

Recommended handling:

- Retry only on `internal_error` (with backoff)
- Treat auth errors (`invalid_api_key`, `api_key_expired`, `api_key_revoked`) as non-retryable
- Validate phone/timezone/required fields client-side to reduce 400s
