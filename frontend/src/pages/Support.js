import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageTemplate from '../components/layout/PageTemplate';
import {
  Mail, MessageSquare, Github, Clock, FileText,
  HelpCircle, ChevronDown, ChevronUp, ExternalLink, AlertCircle
} from 'lucide-react';

const SupportCard = ({ icon, title, description, action, actionText, actionIcon: ActionIcon }) => (
  <div className="bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 rounded-none p-6 group transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
    <div className="flex flex-col h-full">
      <div className="mb-4 p-2 w-10 h-10 flex items-center justify-center border-2 border-black-900 dark:border-white-100 rounded-none group-hover:bg-black-900 dark:group-hover:bg-white-100 group-hover:text-white-100 dark:group-hover:text-black-900 transition-all duration-200">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2 text-black-900 dark:text-white-100">{title}</h3>
      <p className="text-black-600 dark:text-white-300 text-sm mb-4 flex-grow">{description}</p>
      {action && (
        <div className="mt-auto">
          <a
            href={action}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-black-900 dark:text-white-100 hover:underline text-sm font-medium transition-all duration-200"
          >
            {actionText}
            {ActionIcon && <ActionIcon className="ml-1 h-4 w-4" />}
          </a>
        </div>
      )}
    </div>
  </div>
);

const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div className="border-b-2 border-black-900 dark:border-white-100 py-4">
    <button
      onClick={onClick}
      className="w-full flex justify-between items-start text-left hover:bg-black-50 dark:hover:bg-white-800 p-2 rounded-none transition-all duration-200"
    >
      <span className="font-bold text-black-900 dark:text-white-100">{question}</span>
      <div className="transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
        <ChevronDown className="h-5 w-5 ml-4 text-black-900 dark:text-white-100" />
      </div>
    </button>
    <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
      <p className="mt-2 text-black-600 dark:text-white-300 text-sm pl-2">{answer}</p>
    </div>
  </div>
);

export default function Support() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const supportHours = '9:00 AM - 6:00 PM IST (Monday - Friday)';

  const faqs = [
    {
      question: "How do I get started with Shard?",
      answer: "Create an account, then navigate to the Projects page and click 'New Project' to begin setting up your first project. You can deploy your application with just a few clicks once your project is configured."
    },
    {
      question: "Where can I find my API key?",
      answer: "Your API key is available in the Settings page under the 'API' section. Keep it secure and don't share it publicly as it provides access to your account."
    },
    {
      question: "How do I deploy my application?",
      answer: "Go to the Deployments page and click on 'New Deployment'. Select your project, configure the settings, and follow the deployment wizard. Connect your GitHub repository and manually trigger deployments when ready."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept UPI, net banking, and all major credit/debit cards. All transactions are processed securely in INR. You can view your billing history in the Billing section of your account."
    },
    {
      question: "How can I contribute to Shard?",
      answer: "We welcome contributions! Visit our GitHub repository to report issues, suggest features, or submit pull requests. Please read our contribution guidelines before submitting any code."
    },
    {
      question: "How do I set up a custom domain?",
      answer: "Navigate to your project settings and go to the 'Domains' section. Add your custom domain and follow the instructions to update your DNS settings. We'll handle the SSL certificate automatically."
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <PageTemplate title="Support" icon={<HelpCircle className="h-6 w-6" />}>
      {/* Grid background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[-1]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(to right, rgba(0,0,0,0.08) 0 1px, transparent 1px 32px),
            repeating-linear-gradient(to bottom, rgba(0,0,0,0.08) 0 1px, transparent 1px 32px)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[-1] dark:block"
        style={{
          backgroundImage: `
            repeating-linear-gradient(to right, rgba(255,255,255,0.08) 0 1px, transparent 1px 32px),
            repeating-linear-gradient(to bottom, rgba(255,255,255,0.08) 0 1px, transparent 1px 32px)
          `,
        }}
      />

      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className=" text-xl font-bold mb-2">Support Center</h1>
            <p className="text-black-600 dark:text-white-300">
              We're here to help you with any questions or issues you may have.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center text-sm text-black-500 dark:text-white-400">
            <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" />
            <span>{supportHours}</span>
          </div>
        </div>

        {/* Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SupportCard
            icon={<Mail className="h-5 w-5 text-black dark:text-white" />}
            title="Email Support"
            description="Get personalized help from our support team. We typically respond within 24 hours on business days."
            action="mailto:support@shard.dev"
            actionText="Email Us"
            actionIcon={ExternalLink}
          />

          <SupportCard
            icon={<Github className="h-5 w-5 text-black dark:text-white" />}
            title="GitHub Issues"
            description="Found a bug or have a feature request? Let us know on GitHub."
            action="https://github.com/utsav-mistry/shard/issues"
            actionText="Open Issues"
            actionIcon={ExternalLink}
          />

          <SupportCard
            icon={<FileText className="h-5 w-5 text-black dark:text-white" />}
            title="Documentation"
            description="Browse our comprehensive guides and API documentation."
            action="/app/docs"
            actionText="View Docs"
          />

          <SupportCard
            icon={<MessageSquare className="h-5 w-5 text-black dark:text-white" />}
            title="Community"
            description="Join discussions, ask questions, and share knowledge with other users."
            action="https://github.com/utsav-mistry/shard/discussions"
            actionText="Join Community"
            actionIcon={ExternalLink}
          />
        </div>

        {/* Status & System Alerts */}
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-none p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-bold text-green-800 dark:text-green-200">System Status</h3>
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                <p>All systems operational. No ongoing incidents reported.</p>
              </div>
              <div className="mt-4">
                <a href="#" className="text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-600 dark:hover:text-green-200 hover:underline transition-all duration-200">
                  View status page <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-black-900 dark:text-white-100">Frequently Asked Questions</h2>
            <a
              href="#"
              className="text-sm font-medium text-black-900 dark:text-white-100 hover:underline flex items-center transition-all duration-200"
            >
              View all FAQs
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaqIndex === index}
                onClick={() => toggleFaq(index)}
              />
            ))}
          </div>
        </div>

      </div>
    </PageTemplate>
  );
}
