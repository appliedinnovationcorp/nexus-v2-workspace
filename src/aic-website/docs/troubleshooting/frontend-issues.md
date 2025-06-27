# Frontend Issues Troubleshooting

## Common Next.js Application Issues

### 1. Application Won't Start

#### Symptoms
- `npm run dev` fails to start
- Build errors during development
- Port already in use errors

#### Diagnosis
```bash
# Check if port is in use
lsof -i :3000

# Check Node.js version
node --version

# Check npm version
npm --version

# Verify dependencies
npm ls
```

#### Solutions
```bash
# Kill process using port
kill -9 $(lsof -t -i:3000)

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use different port
PORT=3001 npm run dev
```

### 2. Build Failures

#### Symptoms
- `npm run build` fails
- TypeScript compilation errors
- Missing dependencies

#### Diagnosis
```bash
# Check build logs
npm run build 2>&1 | tee build.log

# Check TypeScript errors
npx tsc --noEmit

# Verify all dependencies
npm audit
```

#### Solutions
```bash
# Fix TypeScript errors
npx tsc --noEmit --skipLibCheck

# Update dependencies
npm update

# Clear Next.js cache
rm -rf .next

# Rebuild from scratch
npm run clean && npm run build
```

### 3. Runtime Errors

#### Symptoms
- White screen of death
- JavaScript errors in console
- Component rendering issues

#### Diagnosis
```bash
# Check browser console
# Open Developer Tools > Console

# Check Next.js error overlay
# Errors should appear in development mode

# Check server logs
npm run dev
```

#### Solutions
```bash
# Enable error boundaries
# Add error boundary components

# Check for hydration mismatches
# Ensure server and client render same content

# Verify environment variables
cat .env.local

# Check for missing imports
grep -r "import.*from" src/
```

### 4. Performance Issues

#### Symptoms
- Slow page loads
- High memory usage
- Poor Core Web Vitals scores

#### Diagnosis
```bash
# Analyze bundle size
npm run analyze

# Check performance metrics
# Use Chrome DevTools > Lighthouse

# Monitor memory usage
# Chrome DevTools > Memory tab
```

#### Solutions
```bash
# Optimize images
# Use next/image component

# Implement code splitting
# Use dynamic imports

# Enable compression
# Configure gzip in next.config.js

# Optimize fonts
# Use next/font
```

### 5. Routing Issues

#### Symptoms
- 404 errors on valid routes
- Navigation not working
- Dynamic routes failing

#### Diagnosis
```bash
# Check route structure
find src/app -name "page.tsx" -o -name "layout.tsx"

# Verify file naming
ls -la src/app/

# Check for conflicting routes
grep -r "export.*page" src/app/
```

#### Solutions
```bash
# Fix file naming
# Ensure page.tsx and layout.tsx are correct

# Check dynamic route syntax
# Use [slug] for dynamic segments

# Verify route exports
# Ensure default exports for page components

# Clear router cache
rm -rf .next/cache
```

### 6. API Route Issues

#### Symptoms
- API endpoints returning 404
- CORS errors
- Request/response issues

#### Diagnosis
```bash
# Test API endpoints
curl http://localhost:3000/api/health

# Check API route files
find src/app -name "route.ts"

# Verify HTTP methods
grep -r "export.*GET\|POST\|PUT\|DELETE" src/app/api/
```

#### Solutions
```bash
# Fix API route exports
# Ensure named exports (GET, POST, etc.)

# Configure CORS
# Add CORS headers in API routes

# Check request handling
# Verify request parsing and validation

# Test with different methods
curl -X POST http://localhost:3000/api/endpoint
```

### 7. Environment Variable Issues

#### Symptoms
- Undefined environment variables
- Configuration not loading
- Different behavior between environments

#### Diagnosis
```bash
# Check environment files
ls -la .env*

# Verify variable names
grep NEXT_PUBLIC .env.local

# Check variable loading
console.log(process.env.NEXT_PUBLIC_API_URL)
```

#### Solutions
```bash
# Fix variable naming
# Client variables must start with NEXT_PUBLIC_

# Restart development server
# Required after .env changes

# Check variable scope
# Server vs client variable access

# Verify file precedence
# .env.local overrides .env
```

### 8. Styling Issues

#### Symptoms
- CSS not loading
- Tailwind classes not working
- Style conflicts

#### Diagnosis
```bash
# Check Tailwind config
cat tailwind.config.js

# Verify CSS imports
grep -r "@tailwind" src/

# Check for style conflicts
# Use browser DevTools > Elements
```

#### Solutions
```bash
# Rebuild Tailwind
npm run build:css

# Check content paths in config
# Ensure all files are included

# Clear style cache
rm -rf .next/cache

# Verify CSS order
# Check import order in globals.css
```

### 9. Component Issues

#### Symptoms
- Components not rendering
- Props not passing correctly
- State management issues

#### Diagnosis
```bash
# Check component exports
grep -r "export.*function\|export.*const" src/components/

# Verify imports
grep -r "import.*from.*components" src/

# Check prop types
npx tsc --noEmit
```

#### Solutions
```bash
# Fix component exports
# Ensure proper default/named exports

# Check prop drilling
# Verify props are passed correctly

# Debug with React DevTools
# Install React Developer Tools extension

# Check component lifecycle
# Use useEffect for debugging
```

### 10. Deployment Issues

#### Symptoms
- Build succeeds locally but fails in production
- Environment-specific errors
- Static export issues

#### Diagnosis
```bash
# Test production build locally
npm run build && npm run start

# Check deployment logs
# Review CI/CD pipeline logs

# Verify environment variables
# Check production environment config
```

#### Solutions
```bash
# Match production environment
# Use same Node.js version

# Check static export config
# Verify next.config.js settings

# Test with production data
# Use production-like data locally

# Check for server-side dependencies
# Ensure all dependencies are available
```

## Quick Fixes Checklist

### Development Issues
- [ ] Clear `.next` cache
- [ ] Restart development server
- [ ] Check Node.js version compatibility
- [ ] Verify environment variables
- [ ] Clear npm cache

### Build Issues
- [ ] Run TypeScript check
- [ ] Update dependencies
- [ ] Check for circular dependencies
- [ ] Verify import paths
- [ ] Clear build cache

### Runtime Issues
- [ ] Check browser console
- [ ] Verify component exports
- [ ] Check for hydration mismatches
- [ ] Test API endpoints
- [ ] Verify routing structure

### Performance Issues
- [ ] Analyze bundle size
- [ ] Optimize images
- [ ] Implement code splitting
- [ ] Check for memory leaks
- [ ] Enable compression

## Prevention Tips

### Development Best Practices
- Use TypeScript for type safety
- Implement proper error boundaries
- Follow Next.js conventions
- Use ESLint and Prettier
- Write comprehensive tests

### Performance Optimization
- Optimize images with next/image
- Use dynamic imports for code splitting
- Implement proper caching strategies
- Monitor Core Web Vitals
- Use performance profiling tools

### Debugging Tools
- React Developer Tools
- Next.js DevTools
- Chrome DevTools
- VS Code debugger
- Network monitoring tools

---

**Next**: [Backend Services Issues](./backend-services.md)
