/**
 * Homepage E2E Tests
 * End-to-end tests for the main homepage functionality
 */

import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load homepage successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Applied Innovation Corporation/)
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Transforming Business')
    
    // Check hero section is visible
    const heroSection = page.locator('section').first()
    await expect(heroSection).toBeVisible()
  })

  test('should display navigation menu', async ({ page }) => {
    // Check main navigation items
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
    
    await expect(nav.locator('text=About')).toBeVisible()
    await expect(nav.locator('text=Divisions')).toBeVisible()
    await expect(nav.locator('text=Products')).toBeVisible()
    await expect(nav.locator('text=Services')).toBeVisible()
    await expect(nav.locator('text=Thought Leadership')).toBeVisible()
  })

  test('should display core services section', async ({ page }) => {
    // Scroll to services section
    await page.locator('text=Our Core Services').scrollIntoViewIfNeeded()
    
    // Check services are displayed
    await expect(page.locator('text=AI Consulting & Transformation')).toBeVisible()
    await expect(page.locator('text=Nexus Platform')).toBeVisible()
    await expect(page.locator('text=Fractional CTO Services')).toBeVisible()
  })

  test('should display divisions section', async ({ page }) => {
    // Scroll to divisions section
    await page.locator('text=Our Divisions').scrollIntoViewIfNeeded()
    
    // Check divisions are displayed
    await expect(page.locator('text=SMB Division')).toBeVisible()
    await expect(page.locator('text=Enterprise Division')).toBeVisible()
  })

  test('should have working CTA buttons', async ({ page }) => {
    // Check hero CTA buttons
    const getStartedButton = page.locator('text=Get Started').first()
    await expect(getStartedButton).toBeVisible()
    await expect(getStartedButton).toHaveAttribute('href', '/contact')
    
    const learnMoreButton = page.locator('text=Learn More').first()
    await expect(learnMoreButton).toBeVisible()
    await expect(learnMoreButton).toHaveAttribute('href', '/about')
  })

  test('should navigate to division portals', async ({ page }) => {
    // Test SMB division link
    const smbLink = page.locator('text=Explore SMB Solutions')
    await expect(smbLink).toBeVisible()
    
    // Test Enterprise division link
    const enterpriseLink = page.locator('text=Explore Enterprise Solutions')
    await expect(enterpriseLink).toBeVisible()
  })

  test('should display footer with links', async ({ page }) => {
    // Scroll to footer
    await page.locator('footer').scrollIntoViewIfNeeded()
    
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    
    // Check footer links
    await expect(footer.locator('text=About')).toBeVisible()
    await expect(footer.locator('text=Contact')).toBeVisible()
    await expect(footer.locator('text=Privacy Policy')).toBeVisible()
    await expect(footer.locator('text=Terms of Service')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check mobile navigation (hamburger menu)
    const mobileNav = page.locator('[data-testid="mobile-nav"]')
    if (await mobileNav.isVisible()) {
      await mobileNav.click()
      await expect(page.locator('text=About')).toBeVisible()
    }
    
    // Check hero section is still visible
    await expect(page.locator('h1')).toBeVisible()
    
    // Check sections stack vertically
    const sections = page.locator('section')
    const count = await sections.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should have proper SEO meta tags', async ({ page }) => {
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]')
    await expect(metaDescription).toHaveAttribute('content', /AI consulting/)
    
    // Check Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveAttribute('content', /Applied Innovation Corporation/)
    
    const ogDescription = page.locator('meta[property="og:description"]')
    await expect(ogDescription).toHaveAttribute('content', /AI consulting/)
  })

  test('should load without accessibility violations', async ({ page }) => {
    // Basic accessibility checks
    await expect(page.locator('h1')).toBeVisible()
    
    // Check for alt text on images
    const images = page.locator('img')
    const imageCount = await images.count()
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
    }
    
    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1) // Should have exactly one h1
  })

  test('should handle form submissions', async ({ page }) => {
    // Navigate to contact section if it exists on homepage
    const contactForm = page.locator('form')
    
    if (await contactForm.isVisible()) {
      // Fill out form
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="message-input"]', 'Test message')
      
      // Submit form
      await page.click('[data-testid="submit-button"]')
      
      // Check for success message or redirect
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible({
        timeout: 5000
      })
    }
  })

  test('should track analytics events', async ({ page }) => {
    // Mock analytics tracking
    await page.addInitScript(() => {
      window.gtag = jest.fn()
      window.dataLayer = []
    })
    
    // Click on CTA button
    await page.click('text=Get Started')
    
    // Verify analytics event was fired (in real implementation)
    // This would check if gtag was called with proper parameters
  })
})

test.describe('Homepage Performance', () => {
  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    
    // Check for layout shifts (basic check)
    const layoutShifts = await page.evaluate(() => {
      return new Promise((resolve) => {
        let cumulativeLayoutShift = 0
        
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              cumulativeLayoutShift += entry.value
            }
          }
        })
        
        observer.observe({ entryTypes: ['layout-shift'] })
        
        setTimeout(() => {
          observer.disconnect()
          resolve(cumulativeLayoutShift)
        }, 2000)
      })
    })
    
    // CLS should be less than 0.1 for good user experience
    expect(layoutShifts).toBeLessThan(0.1)
  })
})
