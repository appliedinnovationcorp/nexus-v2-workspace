export const metadata = {
  title: 'Terms of Service - Applied Innovation Corporation',
  description: 'Terms of Service for Applied Innovation Corporation. Review our terms and conditions for using our services.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: June 26, 2025</p>
          
          <div className="prose prose-lg max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using our services, you accept and agree to be bound by the terms and provision of this agreement.</p>
            
            <h2>2. Services</h2>
            <p>Applied Innovation Corporation provides AI consulting, development, and transformation services to businesses.</p>
            
            <h2>3. User Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.</p>
            
            <h2>4. Intellectual Property</h2>
            <p>All content and materials available through our services are protected by intellectual property rights.</p>
            
            <h2>5. Limitation of Liability</h2>
            <p>Applied Innovation Corporation shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</p>
            
            <h2>6. Termination</h2>
            <p>We may terminate or suspend your access to our services immediately, without prior notice, for any reason whatsoever.</p>
            
            <h2>7. Contact Information</h2>
            <p>For questions about these Terms of Service, please contact us at:</p>
            <p>
              Applied Innovation Corporation<br />
              Email: legal@aicorp.com<br />
              Phone: +1 (555) 123-4567
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
