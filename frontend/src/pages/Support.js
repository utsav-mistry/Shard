import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageTemplate from '../components/layout/PageTemplate';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, MessageSquare, Github, Clock, FileText, 
  HelpCircle, ChevronDown, ChevronUp, ExternalLink, Zap, 
  Code, Settings, User, Bell, AlertCircle, CheckCircle
} from 'lucide-react';

// Common styles
const activeClass = "bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900";
const hoverClass = "hover:bg-black-100 hover:text-black-900 dark:hover:bg-white-900 dark:hover:text-white-100";
const textClass = "text-black-900 dark:text-white-100";
const borderClass = "border-black-900 dark:border-white-100";
const cardClass = `bg-white dark:bg-black-800/50 shadow-sm border-2 ${borderClass} p-6`;

const SupportCard = ({ icon, title, description, action, actionText, actionIcon: ActionIcon }) => (
  <div className={`${cardClass} group transition-all duration-200 hover:shadow-md`}>
    <div className="flex flex-col h-full">
      <div className="mb-4 p-2 w-10 h-10 flex items-center justify-center border-2 border-black-900 dark:border-white-100 group-hover:bg-black-900 dark:group-hover:bg-white-100 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-grow">{description}</p>
      {action && (
        <div className="mt-auto">
          <a
            href={action}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center  text-black-600 dark: text-black-400 hover:underline text-sm font-medium"
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
  <div className="border-b border-black-900/10 dark:border-white/10 py-4">
    <button
      onClick={onClick}
      className="w-full flex justify-between items-start text-left"
    >
      <span className="font-medium text-black-900 dark:text-white-100">{question}</span>
      {isOpen ? <ChevronUp className="h-5 w-5 ml-4" /> : <ChevronDown className="h-5 w-5 ml-4" />}
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm">{answer}</p>
        </motion.div>
      )}
    </AnimatePresence>
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
      answer: "Go to the Deployments page and click on 'New Deployment'. Select your project, configure the settings, and follow the deployment wizard. You can connect your GitHub repository for automatic deployments."
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
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Support Center</h1>
            <p className="text-gray-600 dark:text-gray-300">
              We're here to help you with any questions or issues you may have.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" />
            <span>{supportHours}</span>
          </div>
        </div>

        {/* Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SupportCard
            icon={<Mail className="h-5 w-5 text-black-900 dark:text-white-100" />}
            title="Email Support"
            description="Get personalized help from our support team. We typically respond within 24 hours on business days."
            action="mailto:support@shard.dev"
            actionText="Email Us"
            actionIcon={ExternalLink}
          />
          
          <SupportCard
            icon={<Github className="h-5 w-5 text-black-900 dark:text-white-100" />}
            title="GitHub Issues"
            description="Found a bug or have a feature request? Let us know on GitHub."
            action="https://github.com/utsav-mistry/shard/issues"
            actionText="Open Issues"
            actionIcon={ExternalLink}
          />
          
          <SupportCard
            icon={<FileText className="h-5 w-5 text-black-900 dark:text-white-100" />}
            title="Documentation"
            description="Browse our comprehensive guides and API documentation."
            action="/dashboard/docs"
            actionText="View Docs"
          />
          
          <SupportCard
            icon={<MessageSquare className="h-5 w-5 text-black-900 dark:text-white-100" />}
            title="Community"
            description="Join discussions, ask questions, and share knowledge with other users."
            action="https://github.com/utsav-mistry/shard/discussions"
            actionText="Join Community"
            actionIcon={ExternalLink}
          />
        </div>

        {/* Status & System Alerts */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5  text-black-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium  text-black-800 dark: text-black-200">System Status</h3>
              <div className="mt-2 text-sm  text-black-700 dark: text-black-300">
                <p>All systems operational. No ongoing incidents reported.</p>
              </div>
              <div className="mt-4">
                <a href="#" className="text-sm font-medium  text-black-700 dark: text-black-300 hover: text-black-600 dark:hover: text-black-200">
                  View status page <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
            <a 
              href="#" 
              className="text-sm font-medium  text-black-600 dark: text-black-400 hover:underline flex items-center"
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
