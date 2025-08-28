# Authentication Endpoints Documentation

This document describes the authentication endpoints implemented in the Atlas-WD frontend application.

## Base URL
```
http://34.239.228.72/api
```

## Authentication Flow

The authentication system follows a 3-step registration process:

### Step 1: Initial Registration - Request OTP
**Endpoint:** `POST /auth/register/initial/`

**Request Body:**
```json
{
    "email": "user@example.com"
}
```

**Description:** Initiates the registration process by sending an OTP to the provided email address.

### Step 2: Verify OTP
**Endpoint:** `POST /auth/register/verify-otp/`

**Request Body:**
```json
{
    "email": "user@example.com",
    "otp": "1248"
}
```

**Description:** Verifies the OTP sent to the user's email address.

### Step 3: Complete Registration
**Endpoint:** `POST /auth/register/complete/`

**Request Body:**
```json
{
    "password": "your_secure_password",
    "confirm_password": "your_secure_password",
    "title": "MR",
    "full_name": "John Doe",
    "company_name": "Your Company Ltd",
    "state": "Lagos",
    "country": "NG",
    "phone_number": "+2341234567890",
    "business_type": "RETAILER"
}
```

**Field Requirements:**
- `title`: Enum - ["MR", "MRS", "MS", "MISS", "DR"]
- `country`: Two-letter country code (ISO 3166-1 alpha-2)
- `phone_number`: Must match country code of selected country
- `business_type`: Enum - ["ASSOCIATION", "RETAILER", "MANUFACTURER", "DISTRIBUTOR", "AGENT"]
 - `state`: Optional string (e.g., "Lagos"). If provided, it will be stored with the profile.

## Additional Endpoints

### Login
**Endpoint:** `POST /auth/login/`

**Request Body:**
```json
{
    "email": "rule4real67@gmail.com",
    "password": "StrongPass123!"
}
```

### Resend OTP (Registration)
**Endpoint:** `POST /auth/register/resend-otp/`

**Request Body:**
```json
{
    "email": "obijurumagnus@gmail.com"
}
```

### Forgot Password Flow

#### Request Forgot Password OTP
**Endpoint:** `POST /auth/forgot-password/`

**Request Body:**
```json
{
    "email": "obijurumagnus@gmail.com"
}
```

#### Verify Forgot Password OTP
**Endpoint:** `POST /auth/verify-forgot-password-otp/`

**Request Body:**
```json
{
    "email": "test@example.com",
    "otp": "1234"
}
```

#### Reset Password
**Endpoint:** `POST /auth/reset-password/`

**Request Body:**
```json
{
    "new_password": "NewStrongPass123!",
    "confirm_password": "NewStrongPass123!"
}
```

### Change Password (Profile)
**Endpoint:** `POST /auth/change-password/`

**Request Body:**
```json
{
    "old_password": "CurrentPass123!",
    "new_password": "NewStrongPass123!",
    "confirm_password": "NewStrongPass123!"
}
```

## Implementation Details

### Frontend Components
- `SignupEmailVerification`: Handles Step 1 (email input and OTP request)
- `VerifyOTP`: Handles Step 2 (OTP verification) - supports both registration and forgot password flows
- `CompleteRegistration`: Handles Step 3 (user information collection)
- `Login`: Handles user login
- `RequestOTP`: Handles forgot password OTP request
- `NewPassword`: Handles password reset after OTP verification
- `ChangePassword`: Handles password change for logged-in users

### API Service
The `authApi.js` service provides:
- Type-safe API calls
- Error handling
- Enum validation
- Country code mapping
- Support for all authentication flows:
  - Registration (initial, verify, complete)
  - Login
  - Forgot password (request, verify, reset)
  - Change password (for logged-in users)
  - Resend OTP

### Constants
- `TITLE_OPTIONS`: ["MR", "MRS", "MS", "MISS", "DR"]
- `BUSINESS_TYPE_OPTIONS`: ["ASSOCIATION", "RETAILER", "MANUFACTURER", "DISTRIBUTOR", "AGENT"]
- `COUNTRY_OPTIONS`: Array of country objects with code, name, and flag

## Testing
Use the `AuthTestPage` component to test different authentication flows:
- Registration flow
- Login flow
- Password reset flow

## Error Handling
All API calls include proper error handling with user-friendly error messages. The frontend validates:
- Email format
- Password confirmation
- Required fields
- Enum values
- Country code validity
