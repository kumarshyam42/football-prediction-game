# Known Issues, Troubleshooting & Testing

## Known Issues

### Browser Caching
- **Problem**: Browsers aggressively cache JavaScript/CSS files
- **Symptom**: Users see old version even after deployment
- **Solution**: Hard refresh (Cmd+Shift+R / Ctrl+Shift+R) or incognito mode
- **Prevention**: Consider adding cache-busting query params in future

### Preview Deployments Share Production Database
- **Warning**: Feature branches use the SAME database as production
- **Impact**: Testing database changes can affect live data
- **Mitigation**: Be very careful with migrations, test locally first
- **Safe to test**: UI changes, read-only operations

### LocalStorage Limitations
- Player identity stored in browser localStorage
- Clearing browser data = losing player association
- No way to "transfer" identity to another device
- No password/authentication = anyone can predict as anyone

### Timezone Handling
- All times stored in database without timezone
- Kickoff times displayed in user's local timezone
- Potential confusion if game creator and player are in different timezones

## Troubleshooting

### "Internal Server Error" on Prediction Submission
**Likely causes:**
1. Database column missing (check schema via diagnose endpoint with x-admin-key header)
2. Player doesn't exist (localStorage corrupted)
3. Game doesn't exist
4. Kickoff time has passed

**Debug steps:**
1. Check Vercel function logs
2. Verify database schema with diagnose endpoint
3. Try clearing localStorage and re-entering name

### Players Not Appearing on Leaderboard
**Likely causes:**
1. Player has no predictions
2. No games have final scores yet
3. Database query error

**Debug steps:**
1. Check if player exists in database
2. Check if they have predictions
3. Verify at least one game has final score

### Predictions Not Locking at Kickoff
**Check:**
1. Kickoff time in database is correct
2. Server time vs. local time (use Date.now() to compare)
3. Prediction API logic for time comparison

## Testing Checklist

Before approving changes to production:

### Critical User Flows
- [ ] New user can enter name and see home page
- [ ] User can submit prediction before kickoff
- [ ] User can update prediction before kickoff
- [ ] Prediction is locked after kickoff
- [ ] All predictions visible on game detail page
- [ ] Leaderboard displays correctly after final scores entered
- [ ] Admin can create games
- [ ] Admin can enter final scores

### UI Testing
- [ ] Test on mobile viewport
- [ ] Test on desktop viewport
- [ ] Check all links work
- [ ] Verify no console errors
- [ ] Confirm no visual glitches
