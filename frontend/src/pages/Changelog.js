import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTemplate from '../components/layout/PageTemplate';
import { 
  GitCommit, Tag, Plus, AlertCircle, Code, 
  Settings, Zap, ChevronDown, ChevronUp, Filter, X, Search, GitBranch, Sparkles, Bug, Wrench
} from 'lucide-react';

// Common styles
const activeClass = "bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900";
const hoverClass = "hover:bg-black-100 hover:text-black-900 dark:hover:bg-white-900 dark:hover:text-white-100";
const textClass = "text-black-900 dark:text-white-100";
const borderClass = "border-black-900 dark:border-white-100";
const cardClass = `bg-white dark:bg-black-800/50 shadow-sm border-2 ${borderClass} p-6`;

const CHANGELOG = [
  {
    version: '1.0.0',
    codename: 'Phoenix',
    date: 'August 15, 2025',
    highlights: [
      'Initial public release of Shard',
      'Project management dashboard',
      'Deployment pipeline',
      'Environment variable management',
      'Real-time deployment logs',
    ],
    changes: [
      { type: 'feature', text: 'Initial public release of Shard' },
      { type: 'feature', text: 'Project management dashboard with team collaboration' },
      { type: 'feature', text: 'Automated deployment pipeline with rollback support' },
      { type: 'feature', text: 'Environment variable management with encryption' },
      { type: 'feature', text: 'Real-time deployment logs with search and filtering' },
      { type: 'improvement', text: 'Enhanced deployment performance by 40%' },
      { type: 'improvement', text: 'Reduced cold start times for serverless functions' },
      { type: 'fix', text: 'Resolved issue with deployment timeouts' },
      { type: 'fix', text: 'Fixed environment variable sync in CI/CD pipeline' },
      { type: 'chore', text: 'Updated dependencies to latest stable versions' },
    ]
  },
  {
    version: '0.5.0',
    codename: 'Nebula',
    date: 'July 30, 2025',
    highlights: [
      'Team collaboration features',
      'Improved deployment performance',
      'Enhanced logging system',
    ],
    changes: [
      { type: 'feature', text: 'Added team member invitations and permissions' },
      { type: 'feature', text: 'Deployment activity feed with user attribution' },
      { type: 'improvement', text: 'Optimized deployment process for large applications' },
      { type: 'improvement', text: 'Enhanced logging with structured JSON output' },
      { type: 'improvement', text: 'Added deployment notifications via email and webhooks' },
      { type: 'fix', text: 'Resolved issue with environment variable precedence' },
      { type: 'fix', text: 'Fixed race condition in concurrent deployments' },
      { type: 'chore', text: 'Improved test coverage for deployment service' },
    ]
  },
  {
    version: '0.2.0',
    codename: 'Pioneer',
    date: 'July 15, 2025',
    highlights: [
      'Beta release with core functionality',
      'Basic project management',
      'Initial deployment system',
    ],
    changes: [
      { type: 'feature', text: 'Initial beta release of Shard' },
      { type: 'feature', text: 'Project creation and management' },
      { type: 'feature', text: 'Basic deployment functionality' },
      { type: 'feature', text: 'Simple environment variable support' },
      { type: 'improvement', text: 'Improved deployment reliability' },
      { type: 'fix', text: 'Fixed issues with deployment status updates' },
      { type: 'chore', text: 'Initial test suite setup' },
    ]
  },
];

const CHANGE_TYPES = [
  { id: 'all', label: 'All Changes', icon: <GitBranch className="h-4 w-4" /> },
  { id: 'feature', label: 'Features', icon: <Plus className="h-4 w-4 text-green-500" /> },
  { id: 'improvement', label: 'Improvements', icon: <Zap className="h-4 w-4 text-yellow-500" /> },
  { id: 'fix', label: 'Bug Fixes', icon: <Bug className="h-4 w-4 text-red-500" /> },
  { id: 'chore', label: 'Maintenance', icon: <Wrench className="h-4 w-4 text-gray-500" /> },
];

const ChangeTypeBadge = ({ type }) => {
  const typeConfigs = {
    feature: { 
      icon: <Plus className="h-3 w-3" />, 
      bg: 'bg-green-100 dark:bg-green-900/30', 
      text: 'text-green-800 dark:text-green-200',
      label: 'New Feature'
    },
    improvement: { 
      icon: <Zap className="h-3 w-3" />, 
      bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
      text: 'text-yellow-800 dark:text-yellow-200',
      label: 'Improvement'
    },
    fix: { 
      icon: <Bug className="h-3 w-3" />, 
      bg: 'bg-red-100 dark:bg-red-900/30', 
      text: 'text-red-800 dark:text-red-200',
      label: 'Bug Fix'
    },
    chore: { 
      icon: <Wrench className="h-3 w-3" />, 
      bg: 'bg-gray-100 dark:bg-gray-700/50', 
      text: 'text-gray-700 dark:text-gray-300',
      label: 'Maintenance'
    },
  };

  const config = typeConfigs[type] || { 
    bg: 'bg-gray-100 dark:bg-gray-800', 
    text: 'text-gray-800 dark:text-gray-200',
    label: 'Change',
    icon: <GitCommit className="h-3 w-3" />
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5  text-xs font-medium ${config.bg} ${config.text} mr-2 mb-1`}>
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </span>
  );
};

const VersionBadge = ({ version, isLatest = false }) => (
  <div className="flex items-center">
    <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
      v{version}
      {isLatest && (
        <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-500 text-white ">Latest</span>
      )}
    </span>
  </div>
);

const ChangeItem = ({ type, text }) => (
  <div className="flex items-start py-2">
    <div className="mt-0.5 mr-3 flex-shrink-0">
      <ChangeTypeBadge type={type} />
    </div>
    <p className="text-gray-700 dark:text-gray-300 text-sm">{text}</p>
  </div>
);

const VersionCard = ({ version, codename, date, changes, isLatest = false, isExpanded = false, onToggle }) => {
  const features = changes.filter(c => c.type === 'feature');
  const otherChanges = changes.filter(c => c.type !== 'feature');
  
  return (
    <div className={`${cardClass} overflow-hidden transition-all duration-200`}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <VersionBadge version={version} isLatest={isLatest} />
            {codename && (
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                "{codename}"
              </div>
            )}
          </div>
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Released on {date}
          </div>
          
          {isExpanded && features.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
                What's New
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                {features.map((feature, i) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                    {feature.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <button
          onClick={onToggle}
          className="mt-4 md:mt-0 inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          {isExpanded ? 'Show Less' : 'View Details'}
          {isExpanded ? (
            <ChevronUp className="ml-1 h-4 w-4" />
          ) : (
            <ChevronDown className="ml-1 h-4 w-4" />
          )}
        </button>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                All Changes
              </h4>
              <div className="space-y-2">
                {changes.map((change, i) => (
                  <ChangeItem key={i} type={change.type} text={change.text} />
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                <p>For a complete history of changes, visit our <a href="https://github.com/utsav-mistry/shard/releases" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">GitHub releases page</a>.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Changelog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedVersions, setExpandedVersions] = useState([0]); // Expand the latest version by default

  const toggleVersion = (index) => {
    setExpandedVersions(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const filteredChangelog = CHANGELOG.map(release => ({
    ...release,
    changes: release.changes.filter(change => {
      const matchesSearch = change.text.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' || change.type === activeFilter;
      return matchesSearch && matchesFilter;
    })
  })).filter(release => release.changes.length > 0);

  return (
    <PageTemplate title="Changelog" icon={<GitCommit className="h-6 w-6" />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Changelog</h1>
            <p className="text-gray-600 dark:text-gray-300">
              All notable changes to Shard are documented here. Subscribe to our{' '}
              <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">RSS feed</a> to stay updated.
            </p>
          </div>
          
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black-800 text-gray-900 dark:text-white-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Search changes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mr-2">
            <Filter className="h-4 w-4 mr-1" />
            <span>Filter by:</span>
          </div>
          {CHANGE_TYPES.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`inline-flex items-center px-3 py-1 text-xs font-medium transition-colors ${
                activeFilter === filter.id
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {filter.icon}
              <span className="ml-1">{filter.label}</span>
            </button>
          ))}
        </div>

        {/* Version List */}
        <div className="space-y-4">
          {filteredChangelog.length > 0 ? (
            filteredChangelog.map((release, index) => (
              <VersionCard
                key={release.version}
                version={release.version}
                codename={release.codename}
                date={release.date}
                changes={release.changes}
                isLatest={index === 0}
                isExpanded={expandedVersions.includes(index)}
                onToggle={() => toggleVersion(index)}
              />
            ))
          ) : (
            <div className={`${cardClass} text-center py-8`}>
              <div className="text-gray-400 dark:text-gray-500">
                <p>No changes match your search criteria.</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  className="mt-2 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Want to see what's coming next? Check out our{' '}
            <a 
              href="https://github.com/utsav-mistry/shard/milestones" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              development roadmap
            </a>.
          </p>
        </div>
      </div>
    </PageTemplate>
  );
}
