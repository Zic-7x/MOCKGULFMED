# Migration Guide: Updating Components to Use Supabase

All components need to be updated to use Supabase queries instead of API calls. Here's what needs to change:

## Pattern Changes

### Before (API):
```javascript
import api from '../../utils/api';

const { data } = useQuery(['key'], async () => {
  const response = await api.get('/endpoint');
  return response.data;
});
```

### After (Supabase):
```javascript
import { getFunction } from '../../utils/supabaseQueries';
import { useAuth } from '../../contexts/AuthContext';

const { user } = useAuth();
const { data } = useQuery(['key'], async () => {
  return await getFunction(user.id);
});
```

## Files to Update

1. **AdminDashboard.jsx** - Use `getAdminStats()`
2. **UserManagement.jsx** - Use `getUserProfiles()`, `createUserProfile()`, etc.
3. **ExamManagement.jsx** - Use `getExams()`, `createExam()`, etc.
4. **AccessManagement.jsx** - Use `getExamAccess()`, `createExamAccess()`, etc.
5. **ProfessionManagement.jsx** - Use profession functions
6. **HealthAuthorityManagement.jsx** - Use health authority functions
7. **UserDashboard.jsx** - Use `getUserDashboard(userId)`
8. **ExamList.jsx** - Use `getAvailableExams(userId)`
9. **TakeExam.jsx** - Use `getExam(examId, userId)`, `submitExam()`
10. **ExamResults.jsx** - Use `getUserAttempts(userId, examId)`

## Key Changes

- Remove `import api from '../../utils/api'`
- Add `import { ... } from '../../utils/supabaseQueries'`
- Add `const { user } = useAuth()` where needed
- Replace API calls with Supabase query functions
- Update error handling (Supabase errors are different format)
- Update data structure (field names may differ: snake_case vs camelCase)
