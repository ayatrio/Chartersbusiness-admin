# Routing Throwback Bug & Fix Details

This document explains why logged-in, unenrolled users were previously "thrown back" to the Main Application's Home screen when trying to access the Dashboard, and how we resolved it.

---

## 1. The Redirection Loop (Why it threw back to the Home screen)

When a user logged in on Port 3000 (Main Application) and clicked the **Dashboard** link (pointing to Port 3001), they were immediately bounced back to the Main Application's Home Screen (`http://localhost:3000/home`).

### The Cause Chain:
1. **Auth Context Loader Hung (`loading: true`)**:
   In `frontend/src/context/AuthContext.js` under `fetchCurrentUser`, the code correctly loaded user profile data, but had a bug where it returned early without setting the loading state to `false` (missing `setLoading(false)`).
2. **Route Guard Interception**:
   Because `loading` remained stuck on `true` forever, the frontend route guards (`ProtectedRoute` / `EnrolledRoute` in `App.js`) never finished loading. On page refresh or route check, the guards assumed the session was invalid or not ready, and redirected the browser back to the Main App's login route:
   ```javascript
   window.location.href = "http://localhost:3000/login";
   ```
3. **Auto-Home Redirection**:
   When the browser hit the Main App's `/login` route on port 3000, the Main App detected that the user **was already logged in** on Port 3000. It instantly auto-redirected the user away from `/login` to `/home` (their Home Screen).
4. **The Result**: To the user, clicking "Dashboard" simply flashed a page loader and immediately returned them to the main app home screen.

---

## 2. The Code Changes

Here are the exact code modifications made to resolve this issue:

### Change A: Resolving the Loading Spinner Hang
* **File**: `frontend/src/context/AuthContext.js`
* **Code Changed**:
  ```diff
      try {
        console.log('PRIMARY PATH:', primaryPath);
        const { data } = await api.get(primaryPath, { skipAuthRedirect: true });
        if (data?.user) {
          setUser({
            ...data.user,
            role: data.user.role || data.user.userCategory || 'user',
          });
+         setLoading(false); // <-- ADDED: Stop the loader spinner and finalize session
          return;
        }
      }
  ```

### Change B: Resolving User/Candidate Category Mapping on Backend
* **File**: `backend/middleware/auth.js`
* **Code Changed**:
  Added lookup logic in the auth middleware so that regular users from the `users` collection get promoted to `'candidate'` role if they have active access records in the `CandidateAccess` collection:
  ```diff
+   if (!user) {
+     const rawUser = await UserModel.findById(decoded.id);
+     if (rawUser) {
+       user = rawUser.toObject();
+       const CandidateAccess = require('../models/CandidateAccess');
+       const access = await CandidateAccess.findOne({ chartersUserId: String(rawUser._id) });
+       if (access) {
+         user.permissions = access.permissions || {};
+         user.userCategory = access.userCategory || 'user';
+         if (access.status) {
+           user.status = access.status;
+         }
+         if (access.userCategory === 'candidate') {
+           user.role = 'candidate';
+         }
+       } else {
+         user.permissions = {};
+         user.userCategory = 'user';
+       }
+     }
+   }
  ```

---

## 3. Explaining it to the Team (Standup Script / Reply Cheat Sheet)

Copy-paste or say this to your team tomorrow:

> "The throwback issue was caused by a frontend bug where the auth context (`AuthContext.js`) loaded the user profile successfully but returned early without setting `loading` to `false`. 
>
> This left the loading state stuck at `true` permanently. Because of this, the route guards in `App.js` redirected the user to the Main App's login route (`/login`). But since the user was already logged in there, the Main App instantly redirected them to their home page (`/home`), creating the throwback loop.
>
> We fixed it by:
> 1. Adding `setLoading(false)` before the early return in the auth context, which resolves the loading hang.
> 2. Updating the backend auth middleware (`auth.js`) to fetch the candidate's active category from the `CandidateAccess` collection and set their role to `'candidate'` so they can access the student dashboard routes instead of getting locked out."


  main summary 
  

"How did we fix the routing issue and the throwback to the home screen for new candidates?"
You can explain it to your team in 3 simple points:

1. The Main Cause: The Loading State was Stuck (loading: true)
"In the frontend AuthContext.js, when a user successfully logged in and their profile was fetched via /auth/me, the code had an early return but forgot to set the loading state to false.

What happened: The app got stuck in loading: true forever, showing a blank/loading screen.
The Throwback: Because the loading state never resolved, the route guards assumed the session was incomplete and redirected the user to the Main App's login screen (http://localhost:3000/login). But since the user was already logged in, the Main App instantly auto-redirected them back to /home.
The Fix: We added setLoading(false) inside AuthContext.js right before the early return so the loading spinner stops and the app finishes loading the page."
2. Separating Unenrolled (user) vs. Enrolled (candidate)
"Previously, new unenrolled users did not have their permissions or roles loaded correctly, so they were redirected to locked routes.

The Fix: In the backend auth middleware (auth.js), we added a database query to the CandidateAccess collection. When a regular user authenticates, the backend checks if they have access configuration. If they are enrolled, their role is dynamically promoted to 'candidate' (which routes them to the dashboard /home workspace). If they are unenrolled, they remain as 'user' (which routes them to the /apply-form screen)."
3. Resolving the Split Database Accounts
"We found that candidate accounts (like raj.connects@gmail.com) existed in both the admins collection (with a 'candidate' role) and the users collection with different ObjectIDs. This was causing the SSO code exchange to mismatch keys and drop the session.

The Fix: We ran a database migration to remove duplicate candidates from the admins collection and linked their active applications, permissions, and LinkedIn scoring histories directly to their real User ID in the users collection."
File & Code Summary (If they ask for exact files):
frontend/src/context/AuthContext.js: Added setLoading(false) on line 84 inside fetchCurrentUser.
backend/middleware/auth.js: Added a CandidateAccess collection lookup to fetch and merge permissions/roles for regular users.
backend/controllers/authController.js: Refactored exchangeCode to check the users collection first and map the SSO token to the correct ID.
backend/controllers/adminController.js: Updated local and mirrored user mapping routines to fetch candidate properties from the real User schema (like phoneNumber instead of phone).
