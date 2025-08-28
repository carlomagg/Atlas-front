# Agent Create User (via Agent) – API Payload and Frontend Implementation Guide

## Endpoint
- URL: `/api/auth/agents/register-user/`
- Method: `POST`
- Auth: Required (Bearer JWT). Only active agents can call this endpoint.
- Permissions: `request.user` must satisfy `user.is_agent == True` and `user.is_agent_active == True`.

## Purpose
- Allows an authenticated, active agent to create a new user account.
- Optionally, the agent can flag the new user as intending to be an agent and submit an agent application for admin approval in the same request.

## Behavior Summary
- If the new user is NOT intended to be an agent: the backend creates ONLY the user account and returns 201 with login credentials.
- If the new user IS intended to be an agent (`is_agent` truthy OR `business_type == AGENT` OR `agent_application` provided):
  - The backend creates the user account AND also requires/accepts `agent_application` details.
  - If required `agent_application` fields are provided, an AgentApplication is created with `status = "PENDING"` for admin review.
  - If required `agent_application` fields are missing, the request fails with 400 and lists the missing fields; no user is persisted (operation is atomic).

## Frontend Decision Flow (Checklist)
- Show Agent Application section if user toggles "Make this user an Agent" OR selects `business_type = AGENT`.
- Always submit as `application/json`.
- If `agent_application.id_document` is a File, upload to Cloudinary first and include the returned URL in the JSON as `agent_application.id_document_url`.
- Map backend 400s to field errors; if response contains `agent_application.missing_fields`, highlight those.

## React Submission Examples

### JSON (no file upload)
```js
// Endpoint: POST /api/auth/agents/register-user/
// When agent_application has no id_document
import axios from 'axios';

async function registerUserJSON(token, payload) {
  // payload shape:
  // {
  //   email, password, full_name, phone_number,
  //   title?, company_name?, country?, business_type?,
  //   is_agent?, agent_application? { first_name, last_name, phone_number, address, bank_name, account_number, id_type, id_number }
  // }
  const res = await axios.post(
    '/api/auth/agents/register-user/',
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}
```

### JSON (with id_document file via Cloudinary)
```js
// Upload id_document to Cloudinary first (frontend or in service), then send JSON with id_document_url
import { agentRegisterUser } from '@/services/authApi';

async function registerUserWithFile(form) {
  const cloud_name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const upload_preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const payload = { ...form };
  if (payload?.agent_application?.id_document instanceof File) {
    payload.cloudinary = { cloud_name, upload_preset };
  }
  return agentRegisterUser(payload);
}
```

## Required Request Fields (Base User)
- `email` (string)
- `password` (string)
- `full_name` (string)
- `phone_number` (string; accepts international or local formats – normalized server-side)

## Optional User Fields
- `title` (string; default: "MR")
- `company_name` (string; default: "")
- `country` (string; ISO code; default: "NG")
- `business_type` (string; default: "RETAILER"). If set to `"AGENT"`, agent application details become required (see below).
- `is_agent` (boolean-like; accepts 1/0, true/false, yes/no). If truthy, agent application details become required (see below).
- `agent_application` (object; details below)

## When Agent Application Is Required
Agent application details become required if ANY of the following are true:
- `is_agent` is truthy ("1", "true", "yes")
- `business_type == "AGENT"`
- `agent_application` is provided (object)

## Agent Application Required Fields
- `agent_application.first_name` (string)
- `agent_application.last_name` (string)
- `agent_application.phone_number` (string)
- `agent_application.address` (string)
- `agent_application.bank_name` (string)
- `agent_application.account_number` (string)
- `agent_application.id_type` (string)
- `agent_application.id_number` (string)
- `agent_application.id_document` (file; OPTIONAL)

## Content Types
- Use `application/json` for all submissions.
- If uploading an ID document, include the Cloudinary URL as `agent_application.id_document_url`.

## Business Rules and Validations (Server-Side Behavior)
- Only authenticated, active agents can access this endpoint. Otherwise 403 with message: `"Only active agents can register new users"`.
- Base required fields: `email`, `password`, `full_name`, `phone_number`. Missing -> 400 per-missing-field error.
- Per-agent uniqueness: The same agent cannot register the same email twice. If the email exists and was created by the same agent (`user.agent_referred_by == current agent`), returns 400: `"You have already registered this user with this email"`.
- Global uniqueness: If any user already exists with the email (created by someone else), returns 400: `"A user with this email already exists"`.
- Atlas ID: Server generates a unique `atlas_id` for each new user (format `ATLXXXXXX`).
- Referral earning: On successful creation, a `ReferralEarning` entry is created for the registering agent (`earning_type = SIGNUP`, `amount = 1000`).
- If agent application is intended but required fields are missing, returns 400 with payload:
```json
{
  "agent_application": {
    "missing_fields": ["..."],
    "message": "Agent application details are required for registering an agent user"
  }
}
```
- When `agent_application` is provided and complete, server creates an `AgentApplication` with `status = "PENDING"` for admin review. New user is NOT auto-approved as an agent by this endpoint.
- Welcome email: Backend attempts to send a welcome email with login details (non-blocking; failures don’t cancel registration).

## Successful Response (201 Created)
```json
{
  "message": "User registered successfully",
  "user": {
    "email": "newuser@example.com",
    "full_name": "New User",
    "atlas_id": "ATLABC123",
    "login_credentials": {
      "email": "newuser@example.com",
      "password": "<password_sent_in_request>"
    }
  }
}
```

## Error Responses (Examples)
- 400 Bad Request (missing base field)
```json
{ "password": "password is required" }
```

- 400 Bad Request (email already exists, different agent)
```json
{ "message": "A user with this email already exists" }
```

- 400 Bad Request (same agent re-registering same email)
```json
{ "message": "You have already registered this user with this email" }
```

- 400 Bad Request (agent application required fields missing)
```json
{
  "agent_application": {
    "missing_fields": ["first_name", "id_number"],
    "message": "Agent application details are required for registering an agent user"
  }
}
```

- 403 Forbidden (caller not an active agent)
```json
{ "detail": "Only active agents can register new users" }
```

## Frontend Implementation Guide
1) **Authentication**
- Include `Authorization: Bearer <access_token>` in headers. Token must belong to an agent with `is_agent == true` and `is_agent_active == true`.

2) **Choosing Content Type**
- If NOT submitting an `id_document`: send JSON.
- If submitting `id_document`: use `multipart/form-data` with flattened keys for nested `agent_application` fields, e.g.:
  - `agent_application.first_name = "John"`
  - `agent_application.id_document = <File>`

3) **Base User Creation (JSON Example)**
```http
POST /api/auth/agents/register-user/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "buyer@example.com",
  "password": "Secur3P@ssw0rd",
  "full_name": "Buyer Name",
  "phone_number": "+2348012345678",
  "title": "MR",
  "company_name": "Buyer Co",
  "country": "NG",
  "business_type": "RETAILER"
}
```

4) **Creating a User Who Intends To Be an Agent (JSON Example; without id_document)**
```http
POST /api/auth/agents/register-user/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "prospect@example.com",
  "password": "Secur3P@ssw0rd",
  "full_name": "Prospect Agent",
  "phone_number": "+2348098765432",
  "is_agent": true,
  "business_type": "AGENT",
  "agent_application": {
    "first_name": "Prospect",
    "last_name": "Agent",
    "phone_number": "+2348098765432",
    "address": "123 Market Rd, Lagos",
    "bank_name": "GTBank",
    "account_number": "0123456789",
    "id_type": "NIN",
    "id_number": "A1B2C3D4"
  }
}
```

5) **Creating a User With Agent Application + File Upload (Multipart Example)**
- Use `multipart/form-data`. Example key-value pairs:
  - `email = prospect@example.com`
  - `password = Secur3P@ssw0rd`
  - `full_name = Prospect Agent`
  - `phone_number = +2348098765432`
  - `is_agent = true`
  - `business_type = AGENT`
  - `agent_application.first_name = Prospect`
  - `agent_application.last_name = Agent`
  - `agent_application.phone_number = +2348098765432`
  - `agent_application.address = 123 Market Rd, Lagos`
  - `agent_application.bank_name = GTBank`
  - `agent_application.account_number = 0123456789`
  - `agent_application.id_type = NIN`
  - `agent_application.id_number = A1B2C3D4`
  - `agent_application.id_document = <file>`

## UI/UX Recommendations
- Validate required base fields client-side (`email`, `password`, `full_name`, `phone_number`).
- If user toggles "Make this user an Agent" or selects `business_type = AGENT`, show the agent application section and validate its required fields.
- Handle 400 responses by mapping field-specific messages. For `agent_application`, read `missing_fields` array to highlight fields.
- After success, display `atlas_id` and advise the user to save the one-time shown password.
- Consider offering a "Copy login details" action.
- Upload `id_document` to Cloudinary first and send only the URL in JSON (`agent_application.id_document_url`).

## Edge Cases
- Phone numbers: backend accepts local or international; prefer E.164 on frontend if possible.
- Repeated submissions: handle the two uniqueness errors distinctly (same agent vs existing different owner).
- File uploads: upload to Cloudinary first and send only the URL in JSON (`agent_application.id_document_url`).

## Backend Source of Truth (for reference)
- View: `accounts/views.py` -> `AgentUserRegistrationView`
- URL mapping: `accounts/urls.py` -> `path('agents/register-user/', AgentUserRegistrationView.as_view(), name='agent-register-user')`
- Root include: `atlasbackend/atlasbackend/urls.py` -> `path('api/auth/', include('accounts.urls'))`

## Version
- Generated: 2025-08-18
