# PlotPulse - Update Recommendations

## 🔴 Critical Issues (Fix Before Production)

### 1. Environment Variables Configuration

**Issue**: Hardcoded values in source code
- API URL in frontend
- Database credentials in backend
- JWT secret in backend
- CORS origins

**Files to Update:**
- `frontend/src/services/plotService.ts` - Line 5: `const API_URL = 'http://localhost:8091/api/v1';`
- `backend/src/main/resources/application.yml` - Lines 13-15, 35-38, 58

**Solution:**
1. Create `.env.example` files
2. Use environment variables
3. Update configuration files

---

### 2. Dockerfile Uses `-DskipTests`

**Issue**: `backend/Dockerfile:8` skips tests during build
- Violates your rule: "never use `-DskipTests` unless specifically asked"

**Fix:**
```dockerfile
# Change from:
RUN mvn package -DskipTests

# To:
RUN mvn clean package
```

---

### 3. CORS Configuration

**Issue**: Only localhost origins allowed
- `backend/src/main/resources/application.yml:35-38`
- Won't work with production frontend

**Fix**: Add environment variable support for CORS origins

---

## 🟡 Important Updates

### 4. Dependency Versions Check

**Current Versions:**
- Spring Boot: 3.4.4 (released recently, likely current)
- React: 19.1.0 (latest)
- React Leaflet: 5.0.0 (check for updates)
- Vite: 6.3.5 (check for updates)

**Action**: Run dependency update checks:
```bash
# Frontend
cd frontend
npm outdated

# Backend
cd backend
mvn versions:display-dependency-updates
```

---

### 5. Security Improvements

**Issues:**
- JWT secret in application.yml (should be env variable)
- Database password in application.yml
- CSRF disabled (may be intentional for API-only)
- No rate limiting

**Recommendations:**
- Move all secrets to environment variables
- Consider adding rate limiting for API endpoints
- Review security headers

---

### 6. Production Configuration

**Missing:**
- `application-prod.yml` for production settings
- Environment-specific logging configuration
- Production database connection pooling settings

**Create:**
- `backend/src/main/resources/application-prod.yml`
- Production logging configuration
- Proper error handling for production

---

### 7. Frontend API Configuration

**Current:** Hardcoded API URL
```typescript
const API_URL = 'http://localhost:8091/api/v1';
```

**Should be:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8091/api/v1';
```

**Add to `.env`:**
```
VITE_API_URL=http://localhost:8091/api/v1
```

**Add to `.env.production`:**
```
VITE_API_URL=https://your-api-domain.com/api/v1
```

---

### 8. Debug Logging in Production

**Issue**: Debug logging enabled in `application.yml:70-71`
```yaml
logging:
  level:
    com.company.project: DEBUG
    org.springframework.security: DEBUG
```

**Fix**: Create production profile with INFO level logging

---

## 🟢 Nice-to-Have Improvements

### 9. Remove Console.log Statements

**Files with console.log:**
- `frontend/src/components/Navigation/NavbarProfile.tsx` - Multiple debug logs
- `frontend/src/services/plotService.ts` - Multiple console.log statements

**Action**: Replace with proper logging or remove in production builds

---

### 10. Mock Data in Production Code

**Issue**: `frontend/src/services/plotService.ts` has mock data fallback
- Good for development
- Should be disabled/removed in production

**Fix**: Use environment variable to control mock data usage

---

### 11. Error Handling Improvements

**Current**: Basic error handling exists
**Improvements:**
- Better user-facing error messages
- Error logging service (e.g., Sentry)
- Retry logic improvements (partially implemented)

---

### 12. Testing Coverage

**Current**: Some tests exist but limited coverage
**Improvements:**
- Add more unit tests
- Integration tests for API endpoints
- E2E tests for critical flows

---

### 13. Documentation

**Missing:**
- Comprehensive README.md
- API documentation (OpenAPI/Swagger)
- Deployment guide
- Environment setup guide

---

## 📋 Priority Action Items

### Immediate (Before Any Deployment)
1. ✅ Fix Dockerfile to remove `-DskipTests`
2. ✅ Move API URL to environment variable
3. ✅ Move database credentials to environment variables
4. ✅ Move JWT secret to environment variable
5. ✅ Configure CORS for production URLs

### High Priority (Before Production)
6. ✅ Create production configuration profile
7. ✅ Set up proper logging for production
8. ✅ Remove or disable debug console.log statements
9. ✅ Create `.env.example` files
10. ✅ Update documentation

### Medium Priority (Post-Launch)
11. ⚠️ Add rate limiting
12. ⚠️ Improve error handling
13. ⚠️ Add monitoring/error tracking
14. ⚠️ Increase test coverage
15. ⚠️ API documentation

---

## 🔧 Quick Fixes Checklist

- [ ] Update `backend/Dockerfile` - Remove `-DskipTests`
- [ ] Create `frontend/.env.example` with `VITE_API_URL`
- [ ] Create `backend/.env.example` with database and JWT config
- [ ] Update `frontend/src/services/plotService.ts` to use `import.meta.env.VITE_API_URL`
- [ ] Create `backend/src/main/resources/application-prod.yml`
- [ ] Update CORS configuration to use environment variables
- [ ] Remove debug console.log statements or replace with proper logging
- [ ] Update README.md with setup instructions

---

*Generated based on codebase analysis*


