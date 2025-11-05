# Database Setup Instructions

## Current Status
✅ Prisma Client Generated  
✅ User Model Created  
✅ API Routes Created  
✅ Profile Page Connected (with localStorage fallback)  
⚠️ Database Connection Pending

## Database Setup Steps

### 1. Verify Database Connection
Make sure your Supabase database is accessible:
```bash
npx prisma db push
```

### 2. Run Migrations
Create the User table in the database:
```bash
npx prisma migrate dev --name add_user_model
```

### 3. Create Initial User (Optional)
You can create a test user using Prisma Studio:
```bash
npx prisma studio
```

Or create one programmatically using the API.

## Profile Page Features

### Current Implementation
- ✅ Profile data loading from localStorage (fallback)
- ✅ Profile updates saved to localStorage
- ✅ Password change validation
- 🔄 Database API integration ready (commented out)

### When Database is Connected

1. **Uncomment API calls** in `/src/app/admin/profile/page.tsx`:
   - Line ~60: `loadProfileData()` fetch call
   - Line ~95: `handleSave()` API call  
   - Line ~130: `handleChangePassword()` API call

2. **Test the connection:**
   ```bash
   # Check if Prisma can connect
   npx prisma db pull
   ```

3. **Create your first user** through Prisma Studio or API

## API Routes

### GET `/api/profile?id={userId}`
Fetch user profile data

### PUT `/api/profile`
Update user profile (FormData)

### POST `/api/profile`
Change password (JSON)

## Database Schema

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  firstName    String
  lastName     String
  mobile       String?
  bio          String?
  position     String?
  location     String?
  country      String?
  cityState    String?
  pinCode      String?
  profilePhoto String?
  password     String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## Troubleshooting

### Database Connection Issues
If you see "Can't reach database server":
1. Check your `DATABASE_URL` in `.env`
2. Verify Supabase instance is running
3. Check firewall/network settings
4. Use Supabase's connection pooler URL if needed

### Alternative: Use Supabase Direct Connection
Update your `.env`:
```
DATABASE_URL="postgresql://postgres:[password]@[project-ref].supabase.co:6543/postgres?pgbouncer=true"
```

## Next Steps
1. Fix database connection
2. Run migrations
3. Uncomment API calls in profile page
4. Test profile CRUD operations
5. Test password change functionality
