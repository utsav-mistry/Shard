import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTemplate from '../components/layout/PageTemplate';
import {
    Code, Key, ChevronDown, ChevronRight, Copy, Check,
    Terminal, Server, GitBranch, Settings, User, Lock, ExternalLink, Folder
} from 'lucide-react';

// Common styles
const activeClass = "bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900";
const hoverClass = "hover:bg-black-100 hover:text-black-900 dark:hover:bg-white-900 dark:hover:text-white-100";
const textClass = "text-black-900 dark:text-white-100";
const borderClass = "border-black-900 dark:border-white-100";
const cardClass = `bg-white dark:bg-black-800/50 shadow-sm border-2 ${borderClass} p-6`;

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

const Endpoint = ({ method, path, description, request, response, params = [] }) => {
    const [expanded, setExpanded] = useState(false);

    const getMethodColor = () => {
        switch (method) {
            case 'GET': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
            case 'POST': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
            case 'PUT': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
            case 'DELETE': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
        }
    };

    return (
        <div className="mb-6">
            <button
                onClick={() => setExpanded(!expanded)}
                className={`w-full text-left p-4 ${hoverClass} transition-colors`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium ${getMethodColor()}`}>
                            {method}
                        </span>
                        <code className="font-mono text-sm">{path}</code>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{description}</span>
                    </div>
                    {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="pl-4 ml-6 border-l-2 border-gray-300 dark:border-gray-700 py-4 space-y-6">
                            {params.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Parameters</h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Required</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {params.map((param, index) => (
                                                    <tr key={index}>
                                                        <td className="px-3 py-2 whitespace-nowrap text-sm font-mono">{param.name}</td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{param.type}</td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                            {param.required ? 'Yes' : 'No'}
                                                        </td>
                                                        <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{param.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {request && (
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Request</h4>
                                    <CodeBlock code={request} language="json" />
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-medium mb-2">Response</h4>
                                <CodeBlock code={response} language="json" />
                            </div>

                            <div className="flex space-x-2">
                                <button className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200  md flex items-center">
                                    <Terminal size={12} className="mr-1.5" /> Try in Terminal
                                </button>
                                <button className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200  md flex items-center">
                                    <ExternalLink size={12} className="mr-1.5" /> Open in API Client
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function ApiReference() {
    const [activeSection, setActiveSection] = useState('authentication');

    const baseUrl = `${window.location.origin}/api`;

    const endpoints = {
        authentication: [
            {
                method: 'POST',
                path: '/auth/login',
                description: 'Authenticate a user',
                params: [
                    { name: 'email', type: 'string', required: true, description: 'User\'s email address' },
                    { name: 'password', type: 'string', required: true, description: 'User\'s password' }
                ],
                request: JSON.stringify({
                    email: 'user@example.com',
                    password: 'your_secure_password'
                }, null, 2),
                response: JSON.stringify({
                    success: true,
                    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    user: {
                        id: '123',
                        email: 'user@example.com',
                        name: 'John Doe'
                    }
                }, null, 2)
            }
        ],
        projects: [
            {
                method: 'GET',
                path: '/projects',
                description: 'List all projects',
                response: JSON.stringify({
                    success: true,
                    data: [
                        { id: '1', name: 'My Project', status: 'active', createdAt: '2023-01-01T00:00:00Z' },
                        { id: '2', name: 'Another Project', status: 'inactive', createdAt: '2023-01-15T00:00:00Z' }
                    ]
                }, null, 2)
            },
            {
                method: 'POST',
                path: '/projects',
                description: 'Create a new project',
                params: [
                    { name: 'name', type: 'string', required: true, description: 'Project name' },
                    { name: 'description', type: 'string', required: false, description: 'Project description' }
                ],
                request: JSON.stringify({
                    name: 'New Project',
                    description: 'This is a new project'
                }, null, 2),
                response: JSON.stringify({
                    success: true,
                    data: {
                        id: '3',
                        name: 'New Project',
                        description: 'This is a new project',
                        status: 'active',
                        createdAt: '2023-08-16T15:30:00Z'
                    }
                }, null, 2)
            }
        ],
        deployments: [
            {
                method: 'POST',
                path: '/deploy',
                description: 'Create a new deployment',
                params: [
                    { name: 'projectId', type: 'string', required: true, description: 'ID of the project to deploy' },
                    { name: 'branch', type: 'string', required: false, description: 'Git branch to deploy (default: main)' },
                    { name: 'environment', type: 'string', required: false, description: 'Deployment environment (default: production)' }
                ],
                request: JSON.stringify({
                    projectId: '123',
                    branch: 'main',
                    environment: 'production'
                }, null, 2),
                response: JSON.stringify({
                    success: true,
                    deploymentId: 'dep_123456789',
                    status: 'queued',
                    url: 'https://deploy-preview-123--shard-example.netlify.app',
                    logs: 'https://api.shard.dev/deployments/dep_123456789/logs'
                }, null, 2)
            },
            {
                method: 'GET',
                path: '/deployments/{id}',
                description: 'Get deployment status',
                response: JSON.stringify({
                    success: true,
                    data: {
                        id: 'dep_123456789',
                        projectId: '123',
                        status: 'success',
                        url: 'https://deploy-preview-123--shard-example.netlify.app',
                        createdAt: '2023-08-16T15:30:00Z',
                        updatedAt: '2023-08-16T15:32:15Z',
                        commit: {
                            id: 'a1b2c3d',
                            message: 'Update landing page',
                            author: 'John Doe <john@example.com>'
                        }
                    }
                }, null, 2)
            }
        ]
    };

    const sections = [
        { id: 'authentication', title: 'Authentication', icon: <Key size={16} /> },
        { id: 'projects', title: 'Projects', icon: <Folder size={16} /> },
        { id: 'deployments', title: 'Deployments', icon: <Server size={16} /> },
    ];

    return (
        <PageTemplate title="API Reference" icon={<Code className="h-6 w-6" />}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <div className={`${cardClass} sticky top-6`}>
                        <h2 className="text-lg font-semibold mb-4">API Reference</h2>
                        <div className="space-y-1">
                            <div className="p-3 bg-gray-100 dark:bg-gray-800  lg mb-4">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Base URL</div>
                                <div className="font-mono text-sm break-all">{baseUrl}</div>
                            </div>

                            <div className="space-y-1">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full text-left px-3 py-2  md flex items-center space-x-2 ${activeSection === section.id
                                                ? activeClass
                                                : `${textClass} ${hoverClass}`
                                            }`}
                                    >
                                        {section.icon}
                                        <span>{section.title}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <a
                                    href="https://github.com/utsav-mistry/shard"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-2 text-sm px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-black-900 dark:hover:text-white-100"
                                >
                                    <GitBranch size={14} />
                                    <span>API Source Code</span>
                                    <ExternalLink size={12} className="ml-auto" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <div className={cardClass}>
                        {activeSection === 'authentication' && (
                            <div>
                                <h1 className="text-2xl font-bold mb-6">Authentication</h1>
                                <p className="mb-6 text-gray-600 dark:text-gray-300">
                                    All API requests require authentication using a Bearer token in the Authorization header.
                                    You can obtain a token by authenticating with your email and password.
                                </p>

                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <Lock className="h-5 w-5 text-yellow-400" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                                <strong>Important:</strong> Never expose your API tokens in client-side code or public repositories.
                                                Use environment variables and server-side code to make authenticated requests.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <h2 className="text-xl font-semibold mb-4 mt-8">Authentication Flow</h2>
                                <ol className="list-decimal pl-5 space-y-4 mb-8">
                                    <li>Send a POST request to <code>/auth/login</code> with your email and password</li>
                                    <li>Receive a JWT token in the response</li>
                                    <li>Include the token in the <code>Authorization</code> header for subsequent requests</li>
                                </ol>

                                <h3 className="text-lg font-medium mb-4">Example Request</h3>
                                <CodeBlock code={`curl -X POST ${baseUrl}/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"your_secure_password"}'`} />

                                <h3 className="text-lg font-medium mb-4 mt-8">Example Response</h3>
                                <CodeBlock code={endpoints.authentication[0].response} />

                                <h3 className="text-lg font-medium mb-4 mt-8">Making Authenticated Requests</h3>
                                <p className="mb-4 text-gray-600 dark:text-gray-300">
                                    Include the token in the <code>Authorization</code> header:
                                </p>
                                <CodeBlock code={`curl -X GET ${baseUrl}/projects \
  -H "Authorization: Bearer your_jwt_token_here"`} />
                            </div>
                        )}

                        {activeSection !== 'authentication' && (
                            <div>
                                <h1 className="text-2xl font-bold mb-6">{sections.find(s => s.id === activeSection)?.title} API</h1>
                                <p className="mb-6 text-gray-600 dark:text-gray-300">
                                    {activeSection === 'projects' && 'Manage your projects and their configurations.'}
                                    {activeSection === 'deployments' && 'Deploy your applications and check deployment status.'}
                                </p>

                                <div className="space-y-6">
                                    {endpoints[activeSection]?.map((endpoint, index) => (
                                        <Endpoint key={index} {...endpoint} />
                                    )) || (
                                            <div className="text-center py-12">
                                                <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800  full mb-4">
                                                    <Code size={32} className="text-gray-400" />
                                                </div>
                                                <h3 className="text-lg font-medium mb-2">Documentation in Progress</h3>
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    We're working on adding more detailed documentation for this section.
                                                </p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageTemplate>
    );
}
