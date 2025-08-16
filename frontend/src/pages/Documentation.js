import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTemplate from '../components/layout/PageTemplate';
import {
    HelpCircle, Code, Zap, Settings, Box, Terminal, GitCommit, Shield, Info,
    ChevronDown, ChevronRight, Copy, Check, ArrowRight, ExternalLink, Download, Server,
    Database, Cpu, CpuIcon, CpuOff, CpuIcon as CpuOn, Cpu as CpuChip, Cpu as CpuProcessor,
    FileText, FileCode, FileJson, FileInput, FileOutput, FileCheck, FileX, FileSearch,
    Wrench, Sliders, GitBranch, GitCommit as GitCommitIcon, GitMerge, GitPullRequest, GitBranchPlus,
    Lock, Unlock, Eye, EyeOff, Key, Hash, Slash, Bell, BellOff, Mail, MessageSquare, AlertTriangle,
    FolderTree, Docker
} from 'lucide-react';

// Common styles
const activeClass = "bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900";
const hoverClass = "hover:bg-black-100 hover:text-black-900 dark:hover:bg-white-900 dark:hover:text-white-100";
const textClass = "text-black-900 dark:text-white-100";
const borderClass = "border-black-900 dark:border-white-100";
const cardClass = `bg-white dark:bg-black-800/50 shadow-sm border-2 ${borderClass} p-6`;

const DocumentationSection = ({ title, icon, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="mb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-4 ${hoverClass} transition-colors`}
            >
                <div className="flex items-center space-x-3">
                    {icon}
                    <h2 className="text-lg font-semibold">{title}</h2>
                </div>
                {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
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
                        <div className="pl-2 ml-6 border-l-2 border-gray-300 dark:border-gray-700 py-4">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const CodeBlock = ({ code, language = 'bash' }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative my-4">
            <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm">
                <code>{code}</code>
            </pre>
            <button
                onClick={copyToClipboard}
                className={`absolute top-2 right-2 p-1.5 ${hoverClass} transition-colors`}
                title="Copy to clipboard"
            >
                {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
        </div>
    );
};

const QuickLink = ({ title, description, icon, href, external = false }) => (
    <a
        href={href}
        target={external ? "_blank" : "_self"}
        rel={external ? "noopener noreferrer" : ""}
        className={`block p-4 ${cardClass} ${hoverClass} transition-colors`}
    >
        <div className="flex items-start">
            <div className="p-2 bg-black-900/5 dark:bg-white/10 mr-4">
                {icon}
            </div>
            <div className="flex-1">
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
            </div>
            {external && <ExternalLink size={16} className="text-gray-400 mt-1" />}
        </div>
    </a>
);

export default function Documentation() {
    const [activeTab, setActiveTab] = useState('getting-started');

    return (
        <PageTemplate title="Documentation" icon={<HelpCircle className="h-6 w-6" />}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <div className={`${cardClass} sticky top-6`}>
                        <h2 className="text-lg font-semibold mb-4">Documentation</h2>
                        <nav className="space-y-1">
                            {[
                                { id: 'getting-started', title: 'Getting Started', icon: <Zap size={16} /> },
                                { id: 'deployment', title: 'Deployment', icon: <Box size={16} /> },
                                { id: 'configuration', title: 'Configuration', icon: <Settings size={16} /> },
                                { id: 'cli', title: 'CLI Reference', icon: <Terminal size={16} /> },
                                { id: 'api', title: 'File Structure', icon: <Code size={16} /> },
                                { id: 'troubleshooting', title: 'Troubleshooting', icon: <HelpCircle size={16} /> },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full text-left px-4 py-2 flex items-center space-x-2 ${activeTab === item.id
                                        ? activeClass
                                        : `${textClass} ${hoverClass}`
                                        }`}
                                >
                                    {item.icon}
                                    <span>{item.title}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Quick Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    </div>

                    {/* Main Content Area */}
                    <div className={cardClass}>
                        {activeTab === 'getting-started' && (
                            <div>
                                <h1 className="text-2xl font-bold mb-6">Getting Started with Shard</h1>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    Welcome to Shard! This guide will help you set up your development environment and deploy your first application.
                                </p>

                                <DocumentationSection
                                    title="System Requirements"
                                    icon={<Server size={18} className="mr-2 text-blue-500" />}
                                    defaultOpen={true}
                                >
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium mb-2">Development Environment</h4>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>Node.js 16.x or later</li>
                                                <li>npm 7.x or later, or Yarn 1.22.x or later</li>
                                                <li>Git 2.13 or later</li>
                                                <li>Modern web browser (Chrome, Firefox, Safari, or Edge)</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Production Environment</h4>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>Node.js 16.x or later</li>
                                                <li>1GB RAM (minimum), 2GB or more recommended</li>
                                                <li>1 CPU core (minimum), 2+ cores recommended</li>
                                                <li>1GB free disk space (minimum)</li>
                                            </ul>
                                        </div>
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="Installation"
                                    icon={<Download size={18} className="mr-2 text-green-500" />}
                                    defaultOpen={true}
                                >
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="font-medium mb-2">1. Install Shard CLI</h4>
                                            <p className="mb-2">Install the Shard CLI globally using npm or Yarn:</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <p className="text-sm font-mono mb-1">Using npm</p>
                                                    <CodeBlock code="npm install -g @shard/cli" language="bash" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-mono mb-1">Using Yarn</p>
                                                    <CodeBlock code="yarn global add @shard/cli" language="bash" />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">2. Verify Installation</h4>
                                            <p className="mb-2">Check that Shard CLI was installed correctly:</p>
                                            <CodeBlock code="shard --version" language="bash" />
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                You should see the version number of the installed CLI (e.g., 1.0.0).
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">3. Login to Your Account</h4>
                                            <p className="mb-2">Authenticate with your Shard account:</p>
                                            <CodeBlock code="shard login" language="bash" />
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                This will open your default web browser to complete authentication.
                                            </p>
                                        </div>
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="Create Your First Project"
                                    icon={<Zap size={18} className="mr-2 text-yellow-500" />}
                                    defaultOpen={true}
                                >
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="font-medium mb-2">1. Initialize a New Project</h4>
                                            <p className="mb-2">Create a new directory and initialize a Shard project:</p>
                                            <CodeBlock
                                                code="mkdir my-shard-app\ncd my-shard-app\nshard init"
                                                language="bash"
                                            />
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">2. Project Structure</h4>
                                            <p className="mb-2">After initialization, your project will have the following structure:</p>
                                            <CodeBlock
                                                code={"my-shard-app/\n├── .gitignore\n├── package.json\n├── shard.config.js    # Shard configuration\n├── public/            # Static files\n├── src/               # Application source code\n│   ├── components/    # Reusable components\n│   ├── pages/         # Page components\n│   ├── styles/        # Global styles\n│   └── utils/         # Utility functions\n└── README.md"}
                                                language="bash"
                                            />
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">3. Start Development Server</h4>
                                            <p className="mb-2">Run the development server:</p>
                                            <CodeBlock code="shard dev" language="bash" />
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                Your application will be available at <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 ">http://localhost:3000</code>
                                            </p>
                                        </div>
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="Next Steps"
                                    icon={<ArrowRight size={18} className="mr-2 text-purple-500" />}
                                >
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium mb-2">Explore the Dashboard</h4>
                                            <p className="mb-2">Access the Shard dashboard to manage your projects, view metrics, and configure settings:</p>
                                            <CodeBlock code="shard dashboard" language="bash" />
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Deploy Your Application</h4>
                                            <p className="mb-2">When you're ready to deploy:</p>
                                            <CodeBlock code="shard deploy" language="bash" />
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                This will build your application and deploy it to the Shard cloud.
                                            </p>
                                        </div>

                                    </div>
                                </DocumentationSection>
                            </div>
                        )}

                        {activeTab === 'cli' && (
                            <div>
                                <h1 className="text-2xl font-bold mb-6">CLI Reference</h1>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    Comprehensive reference for all Shard CLI commands and their options.
                                </p>

                                <DocumentationSection
                                    title="shard init"
                                    icon={<Terminal size={18} className="mr-2 text-blue-500" />}
                                    defaultOpen={true}
                                >
                                    <div className="space-y-4">
                                        <p>Initialize a new Shard project in the current directory.</p>
                                        <CodeBlock
                                            code="shard init [options]"
                                            language="bash"
                                        />
                                        <h4 className="font-medium mt-4">Options:</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-start">
                                                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded mr-2">--template &lt;name&gt;</code>
                                                <span>Specify a template to use (default: default)</span>
                                            </li>
                                            <li className="flex items-start">
                                                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded mr-2">--typescript</code>
                                                <span>Initialize with TypeScript support</span>
                                            </li>
                                            <li className="flex items-start">
                                                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded mr-2">--use-npm</code>
                                                <span>Use npm as package manager (default: yarn if available)</span>
                                            </li>
                                        </ul>
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="shard dev"
                                    icon={<Zap size={18} className="mr-2 text-green-500" />}
                                >
                                    <div className="space-y-4">
                                        <p>Start the development server with hot-reloading.</p>
                                        <CodeBlock
                                            code="shard dev [options]"
                                            language="bash"
                                        />
                                        <h4 className="font-medium mt-4">Options:</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-start">
                                                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded mr-2">-p, --port &lt;port&gt;</code>
                                                <span>Port to run on (default: 3000)</span>
                                            </li>
                                            <li className="flex items-start">
                                                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded mr-2">-H, --host</code>
                                                <span>Expose the server to the network</span>
                                            </li>
                                        </ul>
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="shard build"
                                    icon={<Settings size={18} className="mr-2 text-yellow-500" />}
                                >
                                    <div className="space-y-4">
                                        <p>Create an optimized production build of your application.</p>
                                        <CodeBlock
                                            code="shard build [options]"
                                            language="bash"
                                        />
                                        <h4 className="font-medium mt-4">Options:</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-start">
                                                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded mr-2">--analyze</code>
                                                <span>Generate bundle analysis</span>
                                            </li>
                                            <li className="flex items-start">
                                                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded mr-2">--profile</code>
                                                <span>Enable React profiling in production</span>
                                            </li>
                                        </ul>
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="shard deploy"
                                    icon={<Server size={18} className="mr-2 text-purple-500" />}
                                >
                                    <div className="space-y-4">
                                        <p>Deploy your application to the Shard cloud.</p>
                                        <CodeBlock
                                            code="shard deploy [options]"
                                            language="bash"
                                        />
                                        <h4 className="font-medium mt-4">Options:</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-start">
                                                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded mr-2">--prod</code>
                                                <span>Deploy to production (default: staging)</span>
                                            </li>
                                            <li className="flex items-start">
                                                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded mr-2">--team &lt;slug&gt;</code>
                                                <span>Specify team to deploy to</span>
                                            </li>
                                        </ul>
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="shard login/logout"
                                    icon={<Key size={18} className="mr-2 text-red-500" />}
                                >
                                    <div className="space-y-4">
                                        <p>Authenticate with your Shard account.</p>
                                        <div className="space-y-2">
                                            <CodeBlock
                                                code="shard login"
                                                language="bash"
                                            />
                                            <CodeBlock
                                                code="shard logout"
                                                language="bash"
                                            />
                                        </div>
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="shard help"
                                    icon={<HelpCircle size={18} className="mr-2 text-gray-500" />}
                                >
                                    <div className="space-y-4">
                                        <p>Display help for any command.</p>
                                        <CodeBlock
                                            code="shard help [command]"
                                            language="bash"
                                        />
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Example: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">shard help deploy</code>
                                        </p>
                                    </div>
                                </DocumentationSection>
                            </div>
                        )}

                        {activeTab === 'deployment' && (
                            <div>
                                <h1 className="text-2xl font-bold mb-6">Deployment Guide</h1>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    Deploy your Shard application to production with confidence using our comprehensive deployment guide.
                                </p>

                                <DocumentationSection
                                    title="Preparing for Deployment"
                                    icon={<Settings size={18} className="mr-2 text-blue-500" />}
                                    defaultOpen={true}
                                >
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium mb-2">1. Environment Variables</h4>
                                            <p className="mb-2">Create a <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5">.env.production</code> file with your production environment variables:</p>
                                            <CodeBlock
                                                code={"NODE_ENV=production\nPORT=3000\nDATABASE_URL=your_production_db_url\nJWT_SECRET=your_secure_jwt_secret\nAPI_BASE_URL=https://api.yourdomain.com"}
                                                language="bash"
                                            />
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">2. Build Your Application</h4>
                                            <p className="mb-2">Create an optimized production build:</p>
                                            <CodeBlock
                                                code="shard build"
                                                language="bash"
                                            />
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                This creates an optimized build in the <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5">.shard/build</code> directory.
                                            </p>
                                        </div>
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="Deployment Options"
                                    icon={<Server size={18} className="mr-2 text-green-500" />}
                                    defaultOpen={true}
                                >
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="font-medium mb-2 flex items-center">
                                                <span className="text-blue-500 mr-2">•</span> Shard Cloud (Recommended)
                                            </h4>
                                            <p className="mb-2">Deploy directly to Shard's managed cloud platform:</p>
                                            <CodeBlock
                                                code="shard deploy"
                                                language="bash"
                                            />
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                This will guide you through the deployment process with interactive prompts.
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2 flex items-center">
                                                <span className="text-blue-500 mr-2">•</span> Docker Container
                                            </h4>
                                            <p className="mb-2">Build and run a production Docker container:</p>
                                            <CodeBlock
                                                code={"# Build the Docker image\ndocker build -t your-app-name .\n\n# Run the container\ndocker run -p 3000:3000 --env-file .env.production your-app-name"}
                                                language="bash"
                                            />
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2 flex items-center">
                                                <span className="text-blue-500 mr-2">•</span> Traditional Server
                                            </h4>
                                            <p className="mb-2">Deploy to your own server using PM2 for process management:</p>
                                            <CodeBlock
                                                code={"# Install PM2 globally\nnpm install -g pm2\n\n# Start your application\npm2 start shard.config.js --name \"shard-app\"\n\n# Save PM2 process list\npm2 save\npm2 startup"}
                                                language="bash"
                                            />
                                        </div>
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="Custom Domain & SSL"
                                    icon={<Shield size={18} className="mr-2 text-purple-500" />}
                                >
                                    <div className="space-y-4">
                                        <p>To use a custom domain with SSL:</p>
                                        <ol className="list-decimal pl-5 space-y-2">
                                            <li>Add your domain in the Shard dashboard</li>
                                            <li>Update your DNS to point to Shard's servers</li>
                                            <li>Shard will automatically provision an SSL certificate via Let's Encrypt</li>
                                        </ol>
                                        <CodeBlock
                                            code={"# Example CNAME record\nwww.yourdomain.com CNAME your-app.shard.app"}
                                            language="dns"
                                        />
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="Environment Variables"
                                    icon={<Code size={18} className="mr-2 text-yellow-500" />}
                                >
                                    <div className="space-y-4">
                                        <p>Configure environment-specific settings:</p>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-50 dark:bg-gray-800">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Variable</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Required</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                    <tr>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">NODE_ENV</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm">Yes</td>
                                                        <td className="px-4 py-2 text-sm">Set to 'production' for production builds</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">PORT</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm">No</td>
                                                        <td className="px-4 py-2 text-sm">Port to run the server on (default: 3000)</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">DATABASE_URL</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm">Yes</td>
                                                        <td className="px-4 py-2 text-sm">Database connection string</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="CI/CD Integration"
                                    icon={<GitCommit size={18} className="mr-2 text-red-500" />}
                                >
                                    <div className="space-y-4">
                                        <p>Set up continuous deployment with GitHub Actions:</p>
                                        <CodeBlock
                                            code={"name: Deploy to Shard\non:\n  push:\n    branches: [ main ]\n\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v2\n      \n      - name: Setup Node.js\n        uses: actions/setup-node@v2\n        with:\n          node-version: '16'\n          \n      - name: Install dependencies\n        run: npm ci\n        \n      - name: Build application\n        run: npm run build\n        \n      - name: Deploy to Shard\n        run: shard deploy --token ${{ secrets.SHARD_DEPLOY_TOKEN }}"}
                                            language="yaml"
                                        />
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="Troubleshooting"
                                    icon={<HelpCircle size={18} className="mr-2 text-orange-500" />}
                                >
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium mb-1">Build Failures</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                If your build fails, check the build logs:
                                            </p>
                                            <CodeBlock
                                                code="shard logs --build"
                                                language="bash"
                                            />
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-1">Environment Issues</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Verify your environment variables:
                                            </p>
                                            <CodeBlock
                                                code="shard env list"
                                                language="bash"
                                            />
                                        </div>
                                    </div>
                                </DocumentationSection>
                            </div>
                        )}

                        {activeTab === 'configuration' && (
                            <div>
                                <h1 className="text-2xl font-bold mb-6">Configuration Guide</h1>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    Customize and optimize your Shard application with these configuration options.
                                </p>

                                <DocumentationSection
                                    title="shard.config.js"
                                    icon={<FileCode size={18} className="mr-2 text-blue-500" />}
                                    defaultOpen={true}
                                >
                                    <div className="space-y-4">
                                        <p>Your main configuration file for Shard applications. Here's a complete reference:</p>
                                        <CodeBlock
                                            code={`module.exports = {
  // Core Settings
  name: 'my-shard-app',
  version: '1.0.0',
  description: 'My Shard Application',
  
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
    trustProxy: true
  },
  
  // Database Configuration
  database: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL || {
      host: 'localhost',
      port: 5432,
      user: 'your_db_user',
      password: 'your_db_password',
      database: 'your_db_name'
    }
  },
  
  // Authentication
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '7d'
    }
  },
  
  // More configuration options...
};`}
                                            language="javascript"
                                        />
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                            Save this file as <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 ">shard.config.js</code> in your project root.
                                        </p>
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="Environment Variables"
                                    icon={<Key size={18} className="mr-2 text-green-500" />}
                                >
                                    <div className="space-y-4">
                                        <p>Shard uses environment variables for sensitive and environment-specific configuration. Create a <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5">.env</code> file in your project root:</p>
                                        <CodeBlock
                                            code={"# Application\nNODE_ENV=development\nPORT=3000\nAPP_URL=http://localhost:3000\nAPP_KEY=your-app-secret-key\n\n# Database\nDB_CONNECTION=postgres\nDB_HOST=localhost\nDB_PORT=5432\nDB_DATABASE=shard\nDB_USERNAME=postgres\nDB_PASSWORD=postgres\n\n# Authentication\nJWT_SECRET=your-jwt-secret\nJWT_EXPIRES_IN=7d\nREFRESH_TOKEN_EXPIRES_IN=30d\n\n# Email\nMAIL_DRIVER=smtp\nMAIL_HOST=smtp.mailtrap.io\nMAIL_PORT=2525\nMAIL_USERNAME=null\nMAIL_PASSWORD=null\nMAIL_ENCRYPTION=null\nMAIL_FROM_ADDRESS=hello@example.com\nMAIL_FROM_NAME=\"Shard\"\n\n# Cache\nCACHE_DRIVER=memory\nREDIS_HOST=127.0.0.1\nREDIS_PASSWORD=null\nREDIS_PORT=6379\n\n# Storage\nFILESYSTEM_DRIVER=local\nAWS_ACCESS_KEY_ID=\nAWS_SECRET_ACCESS_KEY=\nAWS_DEFAULT_REGION=us-east-1\nAWS_BUCKET=\n\n# Third Party Services\nGOOGLE_CLIENT_ID=\nGOOGLE_CLIENT_SECRET=\nGITHUB_CLIENT_ID=\nGITHUB_CLIENT_SECRET=\nFACEBOOK_CLIENT_ID=\nFACEBOOK_CLIENT_SECRET=\n\n# Feature Flags\nFEATURE_REGISTRATION=true\nFEATURE_EMAIL_VERIFICATION=true\nFEATURE_TWO_FACTOR_AUTH=false"}
                                            language="bash"
                                        />
                                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                                        Never commit your <code className="font-mono">.env</code> file to version control. Add it to <code className="font-mono">.gitignore</code>.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="Database Migrations"
                                    icon={<Database size={18} className="mr-2 text-purple-500" />}
                                >
                                    <div className="space-y-4">
                                        <p>Shard uses Knex.js for database migrations. Here are some common commands:</p>

                                        <div>
                                            <h4 className="font-medium mb-2">Create a new migration</h4>
                                            <CodeBlock
                                                code="shard make:migration create_users_table"
                                                language="bash"
                                            />
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                Creates a new migration file in <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5">database/migrations</code>
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Run pending migrations</h4>
                                            <CodeBlock
                                                code="shard migrate:latest"
                                                language="bash"
                                            />
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                Runs all pending migrations
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Rollback the latest migration</h4>
                                            <CodeBlock
                                                code="shard migrate:rollback"
                                                language="bash"
                                            />
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Reset the database</h4>
                                            <CodeBlock
                                                code="shard migrate:reset"
                                                language="bash"
                                            />
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                Rollback all migrations and then run them again
                                            </p>
                                        </div>
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="Environment-based Configuration"
                                    icon={<Sliders size={18} className="mr-2 text-blue-500" />}
                                >
                                    <div className="space-y-4">
                                        <p>Shard supports environment-based configuration out of the box. You can create separate configuration files for different environments:</p>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="border p-4">
                                                <div className="flex items-center mb-2">
                                                    <FileText className="h-5 w-5 text-green-500 mr-2" />
                                                    <h4 className="font-medium">.env</h4>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Default environment file loaded in all environments.
                                                </p>
                                            </div>

                                            <div className="border p-4">
                                                <div className="flex items-center mb-2">
                                                    <FileText className="h-5 w-5 text-blue-500 mr-2" />
                                                    <h4 className="font-medium">.env.development</h4>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Loaded when <code className="font-mono">NODE_ENV=development</code>
                                                </p>
                                            </div>

                                            <div className="border p-4">
                                                <div className="flex items-center mb-2">
                                                    <FileText className="h-5 w-5 text-red-500 mr-2" />
                                                    <h4 className="font-medium">.env.production</h4>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Loaded when <code className="font-mono">NODE_ENV=production</code>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                                        Variables in more specific files (e.g., <code className="font-mono">.env.production</code>) will override those in <code className="font-mono">.env</code>.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="Security Best Practices"
                                    icon={<Shield size={18} className="mr-2 text-red-500" />}
                                >
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium mb-2">1. Secure Your Dependencies</h4>
                                            <p>Regularly update your dependencies and audit for vulnerabilities:</p>
                                            <CodeBlock
                                                code="npm audit"
                                                language="bash"
                                            />
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">2. Enable Security Headers</h4>
                                            <p>Add security headers to your HTTP responses in <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5">shard.config.js</code>:</p>

                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">3. Rate Limiting</h4>
                                            <p>Configure rate limiting to prevent abuse:</p>
                                            <CodeBlock
                                                code={"// In shard.config.js\nmodule.exports = {\n  // ... other config\n  server: {\n    // ...\n    rateLimit: {\n      windowMs: 15 * 60 * 1000, // 15 minutes\n      max: 100, // limit each IP to 100 requests per windowMs\n      message: {\n        status: 429,\n        error: 'Too many requests, please try again later.'\n      }\n    }\n  }\n};"}
                                                language="javascript"
                                            />
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">4. CORS Configuration</h4>
                                            <p>Configure CORS to restrict which domains can access your API:</p>
                                            <CodeBlock
                                                code={"// In shard.config.js\nmodule.exports = {\n  // ... other config\n  cors: {\n    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',\n    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],\n    allowedHeaders: ['Content-Type', 'Authorization'],\n    exposedHeaders: ['Content-Range', 'X-Total-Count'],\n    credentials: true,\n    maxAge: 86400 // 24 hours\n  }\n};"}
                                                language="javascript"
                                            />
                                        </div>
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="Debugging & Logging"
                                    icon={<Wrench size={18} className="mr-2 text-yellow-500" />}
                                >
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium mb-2">1. Debug Mode</h4>
                                            <p>Enable debug mode for detailed error messages and stack traces:</p>
                                            <CodeBlock
                                                code="DEBUG=shard:* node app.js"
                                                language="bash"
                                            />
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                Or set in your <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 ">.env</code> file:
                                            </p>
                                            <CodeBlock
                                                code="DEBUG=shard:*"
                                                language="bash"
                                            />
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">2. Custom Logging</h4>
                                            <p>Configure custom logging in <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 ">shard.config.js</code>:</p>
                                            <CodeBlock
                                                code={"// In shard.config.js\nconst winston = require('winston');\n\nmodule.exports = {\n  // ... other config\n  logging: {\n    level: 'info',\n    format: winston.format.combine(\n      winston.format.timestamp(),\n      winston.format.json()\n    ),\n    transports: [\n      new winston.transports.Console(),\n      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),\n      new winston.transports.File({ filename: 'logs/combined.log' })\n    ],\n    exceptionHandlers: [\n      new winston.transports.File({ filename: 'logs/exceptions.log' })\n    ]\n  }\n};"}
                                                language="javascript"
                                            />
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">3. Request Logging</h4>
                                            <p>Enable HTTP request logging:</p>
                                            <CodeBlock
                                                code={"// In shard.config.js\nmodule.exports = {\n  // ... other config\n  server: {\n    // ...\n    requestLogging: {\n      enabled: true,\n      format: 'dev', // 'combined', 'common', 'dev', 'short', 'tiny'\n      skip: (req) => req.path === '/health' // Skip logging for health checks\n    }\n  }\n};"}
                                                language="javascript"
                                            />
                                        </div>
                                    </div>
                                </DocumentationSection>

                                <DocumentationSection
                                    title="Performance Tuning"
                                    icon={<CpuChip size={18} className="mr-2 text-purple-500" />}
                                >
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium mb-2">1. Enable Compression</h4>
                                            <p>Enable response compression to reduce bandwidth usage:</p>
                                            <CodeBlock
                                                code={"// In shard.config.js\nmodule.exports = {\n  // ... other config\n  server: {\n    // ...\n    compression: {\n      enabled: true,\n      threshold: '1kb', // Only compress responses larger than 1KB\n      level: 6 // Compression level (0-9), 6 is a good default\n    }\n  }\n};"}
                                                language="javascript"
                                            />
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">2. Caching Headers</h4>
                                            <p>Configure caching for static assets:</p>
                                            <CodeBlock
                                                code={"// In shard.config.js\nmodule.exports = {\n  // ... other config\n  static: {\n    directory: './public',\n    maxAge: '1y', // Cache for 1 year\n    immutable: true // Enable immutable caching\n  }\n};"}
                                                language="javascript"
                                            />
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">3. Database Connection Pooling</h4>
                                            <p>Optimize your database connection pool settings:</p>
                                            <CodeBlock
                                                code={"// In shard.config.js\nmodule.exports = {\n  // ... other config\n  database: {\n    // ...\n    pool: {\n      min: 2,      // Minimum number of connections\n      max: 10,     // Maximum number of connections\n      acquireTimeoutMillis: 30000, // Time to acquire a connection\n      createTimeoutMillis: 30000,  // Time to create a connection\n      idleTimeoutMillis: 60000,    // Time a connection can be idle\n      reapIntervalMillis: 1000,    // How often to check for idle connections\n      createRetryIntervalMillis: 100 // How long to wait before retrying to create a connection\n    }\n  }\n};"}
                                                language="javascript"
                                            />
                                        </div>
                                    </div>
                                </DocumentationSection>
                            </div>
                        )}

                        {activeTab === 'api' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2 flex items-center"><Code size={16} className="mr-2 text-green-600" /> MERN File Structure</h3>
                                <CodeBlock
                                    code={`frontend/               # Required: Dockerfile.mern builds this folder and copies /frontend/build
├── public/            # Static files
│   ├── index.html
│   └── favicon.ico
├── src/               # React source code (built during frontend stage)
│    ├── components/
│    ├── pages/
│    ├── App.js
│    └── index.js
│
├── backend/               # Required: copied to /app/backend in Dockerfile.mern
│    ├── models/
│    ├── routes/
│    ├── server.js          # Required entrypoint: container runs node server.js in /app/backend
│    └── package.json       # Required: npm install runs in /app/backend
│               # Injected at runtime via --env-file by deployment worker
└──package.json            # Root package if you manage workspaces/overall metadata`}
                                    language="bash"
                                />

                                <h3 className="text-lg font-semibold my-4 flex items-center"><Server size={16} className="mr-2 text-blue-600" /> Flask File Structure</h3>
                                <CodeBlock
                                    code={`
/ (repo root)\n
├── app/                 # Flask package
│   ├── static/
│   │   ├── css/
│   │   │   └── main.css
│   │   ├── js/
│   │   │   └── main.js
│   │   └── img/
│   ├── templates/
│   │   ├── base.html
│   │   └── index.html
│   ├── __init__.py             # create_app factory
│   ├── routes.py               # blueprint / view functions
│   ├── models.py               # SQLAlchemy models (optional)
│   └── extensions.py           # extension instances (db, migrate...)
├── migrations/                 # (optional) created by Flask-Migrate
├── requirements.txt
├── run.py                      # entrypoint — exports app (used by gunicorn)
├── wsgi.py                     # optional (wsgi entry if you prefer)
└── README.md`}
                                    language="bash"
                                />

                                <h3 className="text-lg font-semibold my-4 flex items-center"><FolderTree size={16} className="mr-2 text-yellow-600" /> Django File Structure</h3>
                                <CodeBlock
                                    code={`
/ (repo root)
├── requirements.txt            # required by Dockerfile.django (at repo root)
└── sample_project/            # required working dir
    ├── manage.py              # required entry (Docker runs python manage.py ...)
    ├── project/               # Django project package (name project here)
    │   ├── __init__.py
    │   ├── settings.py
    │   ├── urls.py
    │   └── wsgi.py
    ├── app/                   # optional: a minimal example app (optional but handy)
    │   ├── __init__.py
    │   ├── admin.py
    │   ├── apps.py
    │   ├── models.py
    │   ├── views.py
    │   └── urls.py
    └── static/                # collectstatic target (optional)`}
                                    language="bash"
                                />
                            </div>
                        )}

                        <DocumentationSection
                            title="Troubleshooting"
                        >
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">Common Issues</h4>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>
                                            <span className="font-medium">Database Connection Issues</span>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Ensure the database server is running and the connection string in <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5">.env</code> is correct.
                                            </p>
                                        </li>
                                        <li>
                                            <span className="font-medium">Port Conflicts</span>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Change the <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5">PORT</code> in <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5">.env</code> if the default port is already in use.
                                            </p>
                                        </li>
                                        <li>
                                            <span className="font-medium">Build Failures</span>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Make sure all dependencies are installed and the Node.js version matches the required version.
                                            </p>
                                        </li>
                                    </ul>
                                </div>


                            </div>
                        </DocumentationSection>
                    </div>
                </div>
            </div>
        </PageTemplate >
    );
}
