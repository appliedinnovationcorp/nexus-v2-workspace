export const metadata = {
  title: 'Privacy Policy - Applied Innovation Corporation',
  description: 'Privacy Policy for Applied Innovation Corporation. Learn how we collect, use, and protect your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: June 26, 2025</p>
          
          <div className="prose prose-lg max-w-none">
            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create an account, contact us, or use our services.</p>
            
            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services, communicate with you, and comply with legal obligations.</p>
            
            <h2>3. Information Sharing</h2>
            <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
            
            <h2>4. Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
            
            <h2>5. Your Rights</h2>
            <p>You have the right to access, update, or delete your personal information. Contact us at privacy@aicorp.com for assistance.</p>
            
            <h2>6. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at:</p>
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
