# Google OAuth Login Implementation Guide

## Is Google OAuth Free?

**Yes!** Google OAuth is **completely free** for:
- Standard OAuth 2.0 authentication
- Up to 100 million users per year
- Basic user profile information (name, email, profile picture)

**Paid only if:**
- You exceed 100 million users/year (very rare)
- You need Google Cloud Identity features (enterprise)
- You use Google Workspace APIs (enterprise)

For a typical application, **it's 100% free**.

## What You Need

### 1. Google Cloud Console Setup

1. **Create a Google Cloud Project** (if you don't have one)
   - Go to: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Google+ API** (or Google Identity Services)
   - Go to: APIs & Services → Library
   - Search for "Google+ API" or "Google Identity Services"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to: APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "PlotPulse Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (development)
     - `https://plotpulse.syrez.co.in` (production)
     - `https://www.plotpulse.syrez.co.in` (production)
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/google/callback` (development)
     - `https://plotpulse.syrez.co.in/auth/google/callback` (production)
     - `https://www.plotpulse.syrez.co.in/auth/google/callback` (production)

4. **Save Credentials**
   - Copy the **Client ID** and **Client Secret**
   - You'll need these for configuration

### 2. Backend Dependencies

Add to `backend/pom.xml`:

```xml
<!-- Google OAuth2 Client -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>

<!-- Optional: For Google API calls if needed -->
<dependency>
    <groupId>com.google.api-client</groupId>
    <artifactId>google-api-client</artifactId>
    <version>2.2.0</version>
</dependency>
```

### 3. Database Changes

Add fields to `User` entity to support OAuth:

```sql
-- Migration: Add OAuth support to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS picture_url VARCHAR(500);

-- Make password nullable for OAuth users
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Add unique constraint for provider + provider_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_id 
ON users(provider, provider_id) 
WHERE provider IS NOT NULL AND provider_id IS NOT NULL;
```

### 4. Environment Variables

Add to Railway/your environment:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://plotpulse.syrez.co.in/auth/google/callback
```

## Implementation Steps

### Step 1: Update User Entity

```java
// Add to User.java
@Column(name = "provider")
private String provider; // "google", "local", etc.

@Column(name = "provider_id")
private String providerId; // Google user ID

@Column(name = "picture_url", length = 500)
private String pictureUrl; // Profile picture URL

// Make password nullable
@Column(nullable = true)
private String password;
```

### Step 2: Backend Configuration

**application.yml:**
```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope:
              - openid
              - profile
              - email
            redirect-uri: ${GOOGLE_REDIRECT_URI}
        provider:
          google:
            authorization-uri: https://accounts.google.com/o/oauth2/v2/auth
            token-uri: https://oauth2.googleapis.com/token
            user-info-uri: https://www.googleapis.com/oauth2/v2/userinfo
            user-name-attribute: id
```

### Step 3: Create OAuth Service

```java
@Service
@RequiredArgsConstructor
public class OAuthService {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    
    public AuthResponse handleGoogleOAuth(OAuth2User oauth2User) {
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String picture = oauth2User.getAttribute("picture");
        String providerId = oauth2User.getAttribute("sub");
        
        // Find or create user
        User user = userRepository.findByEmail(email)
            .orElseGet(() -> {
                // Create new user from Google
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setName(name);
                newUser.setUsername(email); // Use email as username
                newUser.setProvider("google");
                newUser.setProviderId(providerId);
                newUser.setPictureUrl(picture);
                newUser.setRole(User.Role.USER);
                newUser.setStatus(User.Status.ACTIVE);
                // No password for OAuth users
                return userRepository.save(newUser);
            });
        
        // Update existing user if needed
        if (user.getProvider() == null) {
            // Link existing account to Google
            user.setProvider("google");
            user.setProviderId(providerId);
            user.setPictureUrl(picture);
            userRepository.save(user);
        }
        
        // Generate JWT token
        String jwt = jwtService.generateToken(user);
        
        return AuthResponse.builder()
            .token(jwt)
            .username(user.getUsername())
            .role(user.getRole().name())
            .build();
    }
}
```

### Step 4: Create OAuth Controller

```java
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class OAuthController {
    private final OAuthService oAuthService;
    
    @GetMapping("/google")
    public void googleLogin(HttpServletResponse response) throws IOException {
        // Redirect to Google OAuth
        response.sendRedirect("/oauth2/authorization/google");
    }
    
    @GetMapping("/google/callback")
    public ResponseEntity<ApiResponse<AuthResponse>> googleCallback(
            @AuthenticationPrincipal OAuth2User oauth2User) {
        AuthResponse authResponse = oAuthService.handleGoogleOAuth(oauth2User);
        return ResponseEntity.ok(
            new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), 
                "Google login successful", authResponse)
        );
    }
}
```

### Step 5: Update Security Config

```java
// Add to SecurityConfig.java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .oauth2Login(oauth2 -> oauth2
            .userInfoEndpoint(userInfo -> userInfo
                .userService(customOAuth2UserService)
            )
            .successHandler((request, response, authentication) -> {
                // Handle successful OAuth login
                OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
                // Generate JWT and redirect to frontend
            })
        )
        // ... rest of config
}
```

### Step 6: Frontend Implementation

**Option A: Direct Google Sign-In Button (Recommended)**

```typescript
// Install: npm install @react-oauth/google

// In your main App.tsx or index.tsx
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      {/* Your app */}
    </GoogleOAuthProvider>
  );
}
```

```typescript
// In AuthModal.tsx or Login component
import { useGoogleLogin } from '@react-oauth/google';

const GoogleLoginButton = () => {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // Send token to backend
      const response = await fetch('/api/v1/auth/google/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenResponse.access_token })
      });
      const data = await response.json();
      // Store JWT and update auth context
    },
    onError: () => {
      console.error('Google login failed');
    }
  });

  return (
    <button onClick={() => login()}>
      <img src="/google-icon.svg" alt="Google" />
      Sign in with Google
    </button>
  );
};
```

**Option B: Backend Redirect Flow**

```typescript
// Simple redirect to backend endpoint
const handleGoogleLogin = () => {
  window.location.href = `${API_BASE_URL}/auth/google`;
};
```

## Security Considerations

1. **Validate Token on Backend**: Always verify Google tokens on the backend
2. **HTTPS Only**: Use HTTPS in production
3. **State Parameter**: Use OAuth2 state parameter to prevent CSRF
4. **Token Expiration**: Handle token refresh properly
5. **Account Linking**: Decide how to handle users who sign up with email then try Google (or vice versa)

## Testing

1. **Development**: Test with `http://localhost:5173`
2. **Production**: Test with your production domain
3. **Error Handling**: Test with invalid credentials, cancelled login, etc.

## Cost Summary

- **Google OAuth**: FREE (up to 100M users/year)
- **Backend Changes**: FREE (just code)
- **Frontend Library**: FREE (`@react-oauth/google` is open source)
- **Total Cost**: **$0** for typical usage

## Next Steps

1. Set up Google Cloud Console credentials
2. Add backend dependencies
3. Create database migration
4. Implement OAuth service and controller
5. Update frontend with Google login button
6. Test thoroughly
7. Deploy!

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Spring Security OAuth2](https://docs.spring.io/spring-security/reference/servlet/oauth2/index.html)
- [React Google OAuth](https://www.npmjs.com/package/@react-oauth/google)

