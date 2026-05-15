import React, { useState } from 'react'
import Layout from '../../components/layout/Layout'
import { ChevronDown, ChevronUp } from 'lucide-react'

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      question: 'How do I create an account?',
      answer: 'Click on the "Register" button in the top right corner. Fill in your details including email, username, and password. Choose your role (Buyer, Seller, Landlord, or Dual) and complete the registration process.',
    },
    {
      question: 'How does the verification process work?',
      answer: 'After registering, you need to submit required documents for your selected role(s). Our admin team reviews your documents within 2-3 business days. Once approved, you can pay the subscription fee to activate your account.',
    },
    {
      question: 'What documents are required for seller verification?',
      answer: 'Sellers need to provide: Government-issued ID, property ownership proof, tax clearance certificate, and recent property images.',
    },
    {
      question: 'What documents are required for landlord verification?',
      answer: 'Landlords need to provide: Government-issued ID, property ownership or rental authorization documents, and recent property images.',
    },
    {
      question: 'How long does verification take?',
      answer: 'Verification typically takes 2-3 business days. You will receive email notifications about your verification status.',
    },
    {
      question: 'How do I pay for subscription?',
      answer: 'We accept payments through Chapa and Telebirr (Ethiopian payment gateways), as well as bank transfer. After verification, you\'ll be redirected to the payment page.',
    },
  ]

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-gray-600">
              Find answers to common questions about our platform
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl border overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center bg-gray-50 rounded-2xl p-8">
            <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
            <p className="text-gray-600 mb-4">We're here to help. Contact our support team.</p>
            <a
              href="/contact"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default FAQPage
