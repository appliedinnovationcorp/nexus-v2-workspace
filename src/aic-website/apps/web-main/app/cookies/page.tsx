export const metadata = {
  title: 'Cookie Policy - Applied Innovation Corporation',
  description: 'Cookie Policy for Applied Innovation Corporation. Learn about our use of cookies and tracking technologies.',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: June 26, 2025</p>
          
          <div className="prose prose-lg max-w-none">
            <h2>1. What Are Cookies</h2>
            <p>Cookies are small text files that are stored on your computer or mobile device when you visit our website.</p>
            
            <h2>2. How We Use Cookies</h2>
            <p>We use cookies to improve your experience on our website, analyze usage patterns, and provide personalized content.</p>
            
            <h2>3. Types of Cookies We Use</h2>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our website</li>
              <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
            </ul>
            
            <h2>4. Managing Cookies</h2>
            <p>You can control and manage cookies through your browser settings. However, disabling cookies may affect website functionality.</p>
            
            <h2>5. Third-Party Cookies</h2>
            <p>We may use third-party services that place cookies on your device, such as Google Analytics and social media platforms.</p>
            
            <h2>6. Updates to This Policy</h2>
            <p>We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>
            
            <h2>7. Contact Us</h2>
            <p>If you have questions about our use of cookies, please contact us at:</p>
            <p>
              Applied Innovation Corporation<br />
              Email: privacy@aicorp.com<br />
              Phone: +1 (555) 123-4567
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
