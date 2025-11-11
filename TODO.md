# TODO: Fix Exam Errors

## Backend Fixes
- [ ] Modify `/api/exam/start` route to find exam by examCode and use its _id for session creation.

## Frontend Fixes
- [ ] Update Navbar.js to use correct URL `/api/auth/verify-token` for token verification.
- [ ] Update ExamPage.js to add Authorization header to exam fetch request.
- [ ] Update ExamPage.js to use `/api/exam/join/${examId}` endpoint instead of `/api/exam/${examId}` for fetching exam data.
