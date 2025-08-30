# TODO: Student Course Registration with Year Selection

## Information Gathered
- **CourseRegistration.tsx**: Current component allows course selection and registration via dropdown. Uses studentsAPI.addCourse() to register courses.
- **Student.js Model**: Already includes 'year' field (Number, 1-4) and 'courses' array for registered courses.
- **StudentDashboard.tsx**: Displays CourseRegistration component and fetches student data including courses. Student data includes admissionNo but not currently displaying year.
- **API Structure**: studentsAPI handles course addition, but may need updates for year selection.

## Plan
### Frontend Updates
- Update CourseRegistration component to include year selection dropdown (1-4)
- Add state management for selected year
- Modify registration logic to send both courseId and year to backend
- Add validation to ensure year is selected before registration
- Update StudentDashboard to display current year of study

### Backend Updates
- Update students API route to handle year updates during course registration
- Ensure Student model year field is properly updated
- Add validation for year values (1-4)

### Files to Edit
- `src/components/Courses/CourseRegistration.tsx` - Add year selection UI and logic
- `src/services/api.ts` - Update studentsAPI to support year parameter in addCourse
- `server/routes/students.js` - Update route to handle year updates
- `src/components/Dashboard/StudentDashboard.tsx` - Display current year of study

## Implementation Steps
- [x] Update CourseRegistration.tsx to add year selection dropdown
- [x] Add state for selected year and validation
- [x] Modify handleRegister to send year with course registration
- [x] Update studentsAPI in api.ts to accept year parameter
- [x] Update backend students route to handle year updates
- [x] Update StudentDashboard to display year of study
- [x] Test the complete registration flow
- [x] Verify year is properly stored and displayed

## Followup Steps
- Test course registration with year selection
- Verify backend properly updates student year
- Check StudentDashboard displays correct year
- Test error handling for invalid year values
- Consider adding year-based course filtering if needed
