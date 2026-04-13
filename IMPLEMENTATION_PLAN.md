# SMS-LMS Authentication & Authorization Fixes Implementation Plan

## Overview
This document records all the authentication/authorization fixes implemented to resolve issues with the SMS-LMS application deployed on Vercel.

---

## Issues Fixed

### 1. Server-Side Auth Routes Broken (`request` parameter missing)
**Problem:** The `/api/auth/me` and `/api/auth/verify` routes used `request.headers.get()` without defining `request`, causing auth to always fail.

**Files Fixed:**
- `src/app/api/auth/me/route.ts` - Added `headers` import from `next/headers`
- `src/app/api/auth/verify/route.ts` - Added `headers` import from `next/headers`

**Solution:** Used `await headers()` instead of `request.headers` to properly retrieve authorization header.

---

### 2. School Dashboard Returning Mock Data
**Problem:** `/api/school/dashboard` was returning zeros instead of actual database counts.

**Files Fixed:**
- `src/app/api/school/dashboard/route.ts` - Added proper auth with `getAuthUser()` and now fetches real data from Prisma

**Solution:** Added authentication check using `getAuthUser()` and queries student/teacher counts from database.

---

### 3. Frontend Pages Not Including Auth Headers
**Problem:** Most frontend pages used raw `fetch()` without Authorization header, relying only on cookies which weren't always sent.

**Files Fixed (main pages):**
- `src/app/(dashboard)/analytics/page.tsx`
- `src/app/(dashboard)/page.tsx` (main dashboard)
- `src/app/(dashboard)/school/dashboard/page.tsx`

**Solution:** Added token from localStorage to Authorization header in fetch calls.

---

### 4. All SMS Pages Missing Auth Headers
**Problem:** All SMS data pages (Students, Teachers, Academic Years, Classes, Subjects, etc.) weren't fetching with auth headers.

**Files Fixed (all pages now use `authFetch`):**
- `sms/academic-years/page.tsx`
- `sms/classes/page.tsx`
- `sms/subjects/page.tsx`
- `sms/teachers/page.tsx`
- `sms/students/page.tsx`
- `sms/staff/page.tsx`
- `sms/terms/page.tsx`
- `sms/tiers/page.tsx`
- `sms/departments/page.tsx`
- `sms/fees/page.tsx`
- `sms/announcements/page.tsx`
- `sms/attendance/page.tsx`
- `sms/leave/page.tsx`
- `sms/announcements/page.tsx`
- `sms/payroll/page.tsx`
- `sms/transport/page.tsx`
- `sms/hostel/page.tsx`
- `sms/library/page.tsx`
- `sms/documents/page.tsx`
- `sms/applications/page.tsx`
- `sms/report-cards/page.tsx`
- `sms/id-cards/page.tsx`
- `sms/leaderboard/page.tsx`
- `sms/parents/page.tsx`
- `sms/import/page.tsx`
- `sms/setup/page.tsx`
- `sms/leave/page.tsx`
- `sms/academic-records/page.tsx`
- And more...

**Solution:** Created `authFetch` utility in `src/lib/auth-fetch.ts` that automatically adds Authorization header from localStorage token.

---

### 5. LMS Pages Auth Issues
**Problem:** All LMS pages using custom `examApi` in `src/lib/api.ts` weren't including auth headers.

**Files Fixed:**
- `src/lib/api.ts` - Added `getAuthHeaders()` function to include token in all API calls

**Solution:** Central API module now reads token from localStorage and includes in all requests.

---

### 6. Student/Teacher Detail Pages (View)
**Problem:** Detail pages used raw fetch without auth.

**Files Fixed:**
- `sms/students/[id]/page.tsx`
- `sms/teachers/[id]/page.tsx`

**Solution:** Changed to use `authFetch`.

---

### 7. Student/Teacher Edit Pages
**Problem:** Edit pages used raw fetch without auth.

**Files Fixed:**
- `sms/students/[id]/edit/page.tsx`
- `sms/teachers/[id]/edit/page.tsx`

**Solution:** Changed to use `authFetch`.

---

### 8. School Settings Page - "Session Expired"
**Problem:** School settings page used raw fetch.

**Files Fixed:**
- `school/settings/page.tsx`

**Solution:** Changed to use `authFetch` with timestamp cache-buster to prevent caching.

---

### 9. Logout Not Clearing LocalStorage
**Problem:** Logout cleared cookies but not localStorage token, causing stale token issues.

**Files Fixed:**
- `layout.tsx` - Added `localStorage.removeItem('auth_token')` on logout click
- `admin/layout.tsx` - Added `localStorage.removeItem('auth_token')` in handleLogout

**Solution:** Added explicit localStorage clearing on logout.

---

### 10. Branding Not Persisting After Logout
**Problem:** Settings saved but branding reverted on re-login because brand theme provider fetched from wrong endpoint.

**Files Fixed:**
- `components/brand-theme-provider.tsx` - Changed to fetch from `/api/school/settings` instead of `/api/auth/me`

**Solution:** Get branding from the actual settings endpoint where data is saved.

---

### 11. Login Page - Race Condition
**Problem:** Redirected immediately after login before cookies were set.

**Files Fixed:**
- `login/page.tsx` - Added 100ms delay before redirect

**Solution:** Added delay to ensure cookies are set before navigation.

---

### 12. Logout API - Hardcoded URL
**Problem:** Logout API had hardcoded Vercel URL, not detecting localhost.

**Files Fixed:**
- `api/auth/logout/route.ts` - Dynamic URL detection

**Solution:** Now detects host and builds URL dynamically.

---

### 13. Students/Teachers List Response Parsing
**Problem:** API returns direct array but frontend expected `data.students` wrapper.

**Files Fixed:**
- `sms/students/page.tsx` - Handle both `data.students` and direct array
- `sms/teachers/page.tsx` - Handle both `data.teachers` and direct array

**Solution:** Updated to handle both formats: `const studentList = data.students || data`

---

### 14. Academic Records API - Wrong Auth Method
**Problem:** Used `getServerSession` (NextAuth) instead of custom JWT auth.

**Files Fixed:**
- `api/sms/students/[id]/academic-records/route.ts` - Now uses `getAuthUser()`

**Solution:** Changed to use `getAuthUser()` for custom JWT auth.

---

### 15. Duplicate Import Error
**Problem:** Build failed due to duplicate import of lucide-react icons.

**Files Fixed:**
- `sms/classes/page.tsx` - Removed duplicate import line

**Solution:** Cleaned up imports.

---

### 16. Wrong Import Path Error
**Problem:** Some files used `@/lib/authFetch` (wrong) instead of `@/lib/auth-fetch` (correct).

**Files Fixed:**
- Multiple pages - Changed import path to `@/lib/auth-fetch`

**Solution:** Fixed all import paths.

---

## Utility Functions Created

### `src/lib/auth-fetch.ts`
Created a central auth fetch utility that:
- Reads token from localStorage automatically
- Adds `Authorization: Bearer <token>` header
- Always includes `credentials: 'include'` for cookies
- Provides `logout()` function for clean logout

### `src/lib/auth-server.ts`
Enhanced to accept both Authorization header and cookies.

---

## Files Created/Modified Summary

| Category | Files Modified |
|----------|-------------|
| API Routes | ~15 files |
| Frontend Pages | ~40+ files |
| Utilities | 2 files |
| Components | 1 file |

---

## Testing Recommendations

After deploying these fixes:

1. **Clear browser cache** or use incognito window for fresh session
2. **Login fresh** - don't reuse old session
3. Test all pages:
   - Main dashboard shows data
   - School dashboard shows counts
   - Analytics loads
   - Students/Teachers list
   - Create new academic year
   - Save/load school settings
   - Logout and login again - settings should persist
   - Branding should persist after re-login

---

## Known Remaining Issues

1. **Academic History Page** - Still have auth issues in some edge cases (API uses temp bypass for testing)
2. **Select component Empty Value** - Some pages have Select component warnings (non-blocking UI issue)

---

## Date Implemented
April 2026

## Status
Most issues resolved. Academic history page needs additional investigation.