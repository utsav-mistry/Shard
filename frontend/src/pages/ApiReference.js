import React, { useState } from 'react';
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
const cardClass = `bg-white-100 dark:bg-black-700 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow p-6`;

const CodeBlock = ({ code, language = 'bash' }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative my-4">
            <pre className="bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 p-4 overflow-x-auto text-sm rounded-none border-2 border-black-900 dark:border-white-100">
                <code>{code}</code>
            </pre>
            <button
                onClick={copyToClipboard}
                className="group relative absolute top-2 right-2 p-1.5 border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 overflow-hidden rounded-none"
                title="Copy to clipboard"
            >
                <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                <span className="relative z-10">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                </span>
            </button>
        </div>
    );
};

const Endpoint = ({ method, path, description, request, response, params = [] }) => {
    const [expanded, setExpanded] = useState(false);

    const getMethodColor = () => {
        switch (method) {
            case 'GET': return 'bg-blue-600 dark:bg-blue-500 text-white-100 border-2 border-blue-600 dark:border-blue-500';
            case 'POST': return 'bg-green-600 dark:bg-green-500 text-white-100 border-2 border-green-600 dark:border-green-500';
            case 'PUT': return 'bg-yellow-600 dark:bg-yellow-500 text-white-100 border-2 border-yellow-600 dark:border-yellow-500';
            case 'DELETE': return 'bg-red-600 dark:bg-red-500 text-white-100 border-2 border-red-600 dark:border-red-500';
            default: return 'bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 border-2 border-black-900 dark:border-white-100';
        }
    };

    return (
        <div className="mb-6">
            <button
                onClick={() => setExpanded(!expanded)}
                className="group relative w-full text-left p-4 border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 overflow-hidden rounded-none"
            >
                <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-bold rounded-none ${getMethodColor()}`}>
                            {method}
                        </span>
                        <code className="font-mono text-sm font-bold">{path}</code>
                        <span className="text-sm font-medium">{description}</span>
                    </div>
                    <div className="transition-transform duration-200" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <ChevronDown size={18} />
                    </div>
                </div>
            </button>

            <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pl-4 ml-6 border-l-2 border-black-900 dark:border-white-100 py-4 space-y-6">
                            {params.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-black-900 dark:text-white-100 mb-2">Parameters</h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-black-900 dark:divide-white-100 border-2 border-black-900 dark:border-white-100">
                                            <thead className="bg-black-900 dark:bg-white-100">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-white-100 dark:text-black-900 uppercase tracking-wider">Name</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-white-100 dark:text-black-900 uppercase tracking-wider">Type</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-white-100 dark:text-black-900 uppercase tracking-wider">Required</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-white-100 dark:text-black-900 uppercase tracking-wider">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-black-900 dark:divide-white-100 bg-white-100 dark:bg-black-900">
                                                {params.map((param, index) => (
                                                    <tr key={index}>
                                                        <td className="px-3 py-2 whitespace-nowrap text-sm font-mono font-bold text-black-900 dark:text-white-100">{param.name}</td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-black-900 dark:text-white-100">{param.type}</td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-black-900 dark:text-white-100">
                                                            {param.required ? 'Yes' : 'No'}
                                                        </td>
                                                        <td className="px-3 py-2 text-sm font-medium text-black-900 dark:text-white-100">{param.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {request && (
                                <div>
                                    <h4 className="text-sm font-bold text-black-900 dark:text-white-100 mb-2">Request</h4>
                                    <CodeBlock code={request} language="json" />
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-bold text-black-900 dark:text-white-100 mb-2">Response</h4>
                                <CodeBlock code={response} language="json" />
                            </div>

                            <div className="flex space-x-2">
                                <button className="group relative text-xs px-3 py-1.5 border-2 border-blue-600 bg-blue-600 text-white-100 hover:text-blue-600 transition-all duration-200 overflow-hidden rounded-none font-bold flex items-center">
                                    <span className="absolute inset-0 w-full h-full bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                                    <span className="relative z-10 flex items-center">
                                        <Terminal size={12} className="mr-1.5" /> Try in Terminal
                                    </span>
                                </button>
                                <button className="group relative text-xs px-3 py-1.5 border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 overflow-hidden rounded-none font-bold flex items-center">
                                    <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                                    <span className="relative z-10 flex items-center">
                                        <ExternalLink size={12} className="mr-1.5" /> Open in API Client
                                    </span>
                                </button>
                            </div>
                </div>
            </div>
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
                        <h2 className="text-xl font-bold text-black-900 dark:text-white-100 mb-4">API Reference</h2>
                        <div className="space-y-1">
                            <div className="p-3 bg-black-900 dark:bg-white-100 rounded-none border-2 border-black-900 dark:border-white-100 mb-4">
                                <div className="text-xs font-bold text-white-100 dark:text-black-900 mb-1">Base URL</div>
                                <div className="font-mono text-sm font-bold text-white-100 dark:text-black-900 break-all">{baseUrl}</div>
                            </div>

                            <div className="space-y-1">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`group relative w-full text-left px-3 py-2 rounded-none border-2 transition-all duration-200 overflow-hidden flex items-center space-x-2 ${activeSection === section.id
                                                ? 'border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900'
                                                : 'border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900'
                                            }`}
                                    >
                                        {activeSection !== section.id && (
                                            <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                                        )}
                                        <span className="relative z-10 flex items-center space-x-2">
                                            {section.icon}
                                            <span className="font-bold">{section.title}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 pt-4 border-t-2 border-black-900 dark:border-white-100">
                                <a
                                    href="https://github.com/utsav-mistry/shard"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative flex items-center space-x-2 text-sm px-3 py-2 border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 overflow-hidden rounded-none"
                                >
                                    <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                                    <span className="relative z-10 flex items-center space-x-2 font-bold">
                                        <GitBranch size={14} />
                                        <span>API Source Code</span>
                                        <ExternalLink size={12} className="ml-auto" />
                                    </span>
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
                                <h1 className="text-4xl font-extrabold text-black-900 dark:text-white-100 mb-6">Authentication</h1>
                                <p className="mb-6 text-lg text-black-600 dark:text-white-400">
                                    All API requests require authentication using a Bearer token in the Authorization header.
                                    You can obtain a token by authenticating with your email and password.
                                </p>

                                <div className="bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-600 p-4 mb-6 rounded-none">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <Lock className="h-5 w-5 text-yellow-600" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                                                <strong>Important:</strong> Never expose your API tokens in client-side code or public repositories.
                                                Use environment variables and server-side code to make authenticated requests.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-black-900 dark:text-white-100 mb-4 mt-8">Authentication Flow</h2>
                                <ol className="list-decimal pl-5 space-y-4 mb-8 text-lg text-black-600 dark:text-white-400">
                                    <li>Send a POST request to <code className="bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 px-2 py-1 rounded-none font-bold">/auth/login</code> with your email and password</li>
                                    <li>Receive a JWT token in the response</li>
                                    <li>Include the token in the <code className="bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 px-2 py-1 rounded-none font-bold">Authorization</code> header for subsequent requests</li>
                                </ol>

                                <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-4">Example Request</h3>
                                <CodeBlock code={`curl -X POST ${baseUrl}/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"your_secure_password"}'`} />

                                <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-4 mt-8">Example Response</h3>
                                <CodeBlock code={endpoints.authentication[0].response} />

                                <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-4 mt-8">Making Authenticated Requests</h3>
                                <p className="mb-4 text-lg text-black-600 dark:text-white-400">
                                    Include the token in the <code className="bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 px-2 py-1 rounded-none font-bold">Authorization</code> header:
                                </p>
                                <CodeBlock code={`curl -X GET ${baseUrl}/projects \
  -H "Authorization: Bearer your_jwt_token_here"`} />
                            </div>
                        )}

                        {activeSection !== 'authentication' && (
                            <div>
                                <h1 className="text-4xl font-extrabold text-black-900 dark:text-white-100 mb-6">{sections.find(s => s.id === activeSection)?.title} API</h1>
                                <p className="mb-6 text-lg text-black-600 dark:text-white-400">
                                    {activeSection === 'projects' && 'Manage your projects and their configurations.'}
                                    {activeSection === 'deployments' && 'Deploy your applications and check deployment status.'}
                                </p>

                                <div className="space-y-6">
                                    {endpoints[activeSection]?.map((endpoint, index) => (
                                        <Endpoint key={index} {...endpoint} />
                                    )) || (
                                            <div className="text-center py-12">
                                                <div className="inline-block p-4 bg-black-900 dark:bg-white-100 rounded-none mb-4">
                                                    <Code size={32} className="text-white-100 dark:text-black-900" />
                                                </div>
                                                <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-2">Documentation in Progress</h3>
                                                <p className="text-lg text-black-600 dark:text-white-400">
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
