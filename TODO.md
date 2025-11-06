# TODO: Fix Automatic Logout on Page Refresh

## Steps to Complete
- [x] Update `frontend/src/components/Navbar.js` to modify token verification logic: Only log out on 401 status, not on other errors.
- [ ] Test the fix: Verify behavior on page refresh with valid token, invalid token (401), and network errors.
