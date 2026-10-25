# FIREKEEPER Booking Assistant (optional module)

This folder is an isolated add-on proposal. It does not modify PCA stages, provider dispatch, governance gates, audit schemas, authentication, or existing booking flows.

## Safety boundary
- Feature flag: `VITE_FIREKEEPER_BOOKING_ASSISTANT`, disabled unless explicitly set to `true`.
- Reuses the existing `/api/pca/stream` endpoint and configured Firekeeper provider. No provider SDK or API key is added.
- Sends only the current booking message plus explicitly supplied service/availability context. Never send general conversation history.
- Advisory only: no booking-write capability and no automatic confirmation.
- A human must re-check the selected slot and approve the booking in the existing booking system.
- If the endpoint fails, the existing booking form remains the fallback.

## Integration note
The exact `/api/pca/stream` request/response envelope must be checked against the current repository implementation before enabling this feature. The adapter keeps request construction and stream parsing isolated for that mapping.
