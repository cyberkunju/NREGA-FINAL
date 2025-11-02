# TODO - Future Improvements

## Performance Optimization (Later)

### Quick Wins (15-20 min)
- [ ] Reduce GeoJSON precision (5.4 MB → 2.5 MB)
- [ ] Add loading skeleton UI for better UX
- [ ] Enable Service Worker for offline support

### Professional Setup (30-45 min)
- [ ] Enable Cloudflare CDN (orange cloud proxy)
- [ ] Convert GeoJSON to TopoJSON format (5.4 MB → 1.2 MB)
- [ ] Add HTTP/3 and Brotli compression

### Enterprise Level (2-3 hours)
- [ ] Lazy load districts by state (load on demand)
- [ ] Add Redis caching for API responses
- [ ] Implement virtual scrolling for long lists
- [ ] Database query optimization with indexes

---

## Features to Add

### High Priority
- [ ] User authentication and accounts
- [ ] Save favorite districts
- [ ] Export reports as PDF
- [ ] Mobile app version (React Native)

### Medium Priority
- [ ] Multi-language support improvements
- [ ] Dark mode theme
- [ ] Comparison tool (compare multiple districts)
- [ ] Historical trend charts
- [ ] Share district reports via link

### Low Priority
- [ ] Email notifications for new data
- [ ] API documentation for third-party developers
- [ ] Admin dashboard for data management
- [ ] User analytics and tracking

---

## Bug Fixes / Issues

- [ ] None currently

---

## Code Review Findings (Nov 2, 2025)

### 🔴 CRITICAL Security Issues
- [ ] Remove hardcoded password `postgres123` from docker-compose.yml
- [ ] Update CORS origin from `*` to specific domain in production
- [ ] Verify .env is not committed to Git
- [ ] Add security headers to Nginx (X-Frame-Options, CSP, HSTS)
- [ ] Remove `enable-password-ssh.sh` script (security risk)

### 🟡 HIGH Priority
- [ ] Implement proper logging library (Winston/Pino) - remove 100+ console.logs
- [ ] Add input validation middleware for API endpoints
- [ ] Setup automated database backups
- [ ] Add CI/CD pipeline (GitHub Actions)
- [ ] Increase test coverage to 80%+ (currently minimal frontend tests)

### 🟢 MEDIUM Priority
- [ ] Add foreign key constraints to database
- [ ] Implement Redis caching (replace in-memory cache)
- [ ] Add database migrations (Knex.js or node-pg-migrate)
- [ ] Split large components (MapView.jsx 600+ lines)
- [ ] Add React Error Boundaries
- [ ] Fix commented-out perfect mapping code in MapView.jsx
- [ ] Add API versioning (/api/v1/...)

### 🔵 LOW Priority
- [ ] Migrate to TypeScript for type safety
- [ ] Add monitoring (Prometheus + Grafana)
- [ ] Convert GeoJSON to TopoJSON (50-80% size reduction)
- [ ] Add WCAG 2.1 AA compliance for accessibility
- [ ] Implement PWA features
- [ ] Add database partitioning for monthly_performance table
- [ ] Setup load balancing for horizontal scaling

### Code Quality Improvements
- [ ] Extract magic numbers to constants
- [ ] Standardize on async/await (inconsistent patterns)
- [ ] Remove duplicate error handling code
- [ ] Add audit trail columns (created_by, updated_by)
- [ ] Implement soft deletes (is_active column)

### Performance Optimizations
- [ ] Review bundle size (framer-motion is large dependency)
- [ ] Add code splitting and lazy loading
- [ ] Setup CDN for static assets (CloudFlare/CloudFront)
- [ ] Add read replicas for database

**Overall Assessment:** 7/10 - Production-ready with critical security fixes needed
**Estimated Effort:** 1-2 weeks for critical fixes, 1-2 months for all high-priority items

---

## Infrastructure

- [ ] Set up automated backups for database
- [ ] Add monitoring and alerting (Uptime Robot, etc.)
- [ ] Set up staging environment
- [ ] Configure automatic SSL renewal (already done via certbot)
- [ ] Add CI/CD pipeline (GitHub Actions)
- [ ] Set up error tracking (Sentry)

---

## Documentation

- [ ] API documentation
- [ ] User guide / Help section
- [ ] Developer setup guide
- [ ] Architecture diagram

---

## Notes

**Current Status (Nov 2, 2025):**
- ✅ Production deployed on GCP (district-map-vm)
- ✅ SSL/HTTPS enabled (Let's Encrypt)
- ✅ Domain: https://mgnrega.cyberkunju.dev
- ✅ GeoJSON compression enabled (84% reduction)
- ✅ 740 districts loaded from government API
- ✅ Docker containerized deployment

**Next Session Priority:**
1. Performance optimizations from above
2. User features based on feedback
3. Mobile responsiveness improvements
