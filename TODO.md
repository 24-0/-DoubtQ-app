# TODO - Show All Connected Portals View

## Steps to complete:

1. Update `src/components/Navbar.tsx`
   - Add a new navigation item "All Portals" to the navItems array.
   - Ensure clicking it sets `currentView` to "all-portals".

2. Update `src/App.tsx`
   - Add a new case "all-portals" in the `renderCurrentView` function.
   - Create a new component or inline JSX to render all main views together:
     - QuestionFeed
     - PostQuestion
     - StudyTable
     - Groups
     - Community
     - Profile
   - Ensure proper layout and styling for combined view.

3. Test the new "All Portals" view:
   - Verify navigation from Navbar.
   - Verify all components render correctly.
   - Check user authentication gating.
   - Test interaction and UI responsiveness.

4. Perform thorough testing of the entire app flow to ensure no regressions.

---

I will start with step 1: updating Navbar.tsx to add the "All Portals" nav item.
