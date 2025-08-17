import React, { useState } from 'react';
import PageTemplate from '../components/layout/PageTemplate';
import { 
  GitCommit, Plus, Zap, ChevronDown, ChevronUp, Filter, X, Search, GitBranch, Sparkles, Bug, Wrench
} from 'lucide-react';

const CHANGELOG = [
  {
    version: '1.0.0',
    codename: 'Phoenix',
    date: 'August 17, 2025',
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
      bg: 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800', 
      text: 'text-green-800 dark:text-green-200',
      label: 'New Feature'
    },
    improvement: { 
      icon: <Zap className="h-3 w-3" />, 
      bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800', 
      text: 'text-yellow-800 dark:text-yellow-200',
      label: 'Improvement'
    },
    fix: { 
      icon: <Bug className="h-3 w-3" />, 
      bg: 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800', 
      text: 'text-red-800 dark:text-red-200',
      label: 'Bug Fix'
    },
    chore: { 
      icon: <Wrench className="h-3 w-3" />, 
      bg: 'bg-gray-50 dark:bg-gray-900/20 border-2 border-gray-200 dark:border-gray-800', 
      text: 'text-gray-700 dark:text-gray-300',
      label: 'Maintenance'
    },
  };

  const config = typeConfigs[type] || { 
    bg: 'bg-gray-50 dark:bg-gray-900/20 border-2 border-gray-200 dark:border-gray-800', 
    text: 'text-gray-800 dark:text-gray-200',
    label: 'Change',
    icon: <GitCommit className="h-3 w-3" />
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-bold ${config.bg} ${config.text} mr-2 mb-1`}>
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </span>
  );
};

const VersionBadge = ({ version, isLatest = false }) => (
  <div className="flex items-center">
    <span className="inline-flex items-center px-3 py-1 text-sm font-bold bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 rounded-none">
      v{version}
      {isLatest && (
        <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-none font-bold">Latest</span>
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
  
  return (
    <div className="bg-white-100 dark:bg-black-700 p-6 shadow-md border-2 border-black-900 dark:border-white-100 hover:shadow-lg transition-shadow overflow-hidden">
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
          className="group relative mt-4 md:mt-0 inline-flex items-center px-4 py-2 text-sm font-bold rounded-none border-2 border-black-900 dark:border-white-100 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 overflow-hidden"
        >
          <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
          <span className="relative z-10 flex items-center">
            {isExpanded ? 'Show Less' : 'View Details'}
            <div className="ml-1 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <ChevronDown className="h-4 w-4" />
            </div>
          </span>
        </button>
      </div>
      
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="mt-6 pt-6 border-t-2 border-black-900 dark:border-white-100">
          <h4 className="text-sm font-bold text-black-900 dark:text-white-100 mb-3">
            All Changes
          </h4>
          <div className="space-y-2">
            {changes.map((change, i) => (
              <ChangeItem key={i} type={change.type} text={change.text} />
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            <p>For a complete history of changes, visit our <a href="https://github.com/utsav-mistry/shard/releases" target="_blank" rel="noopener noreferrer" className="text-black-900 dark:text-white-100 hover:underline font-bold">GitHub releases page</a>.</p>
          </div>
        </div>
      </div>
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
            <h1 className="text-4xl font-extrabold text-black-900 dark:text-white-100 mb-2">Changelog</h1>
            <p className="text-xl text-black-600 dark:text-white-400">
              All notable changes to Shard are documented here. Subscribe to our{' '}
              <a href="#" className="text-black-900 dark:text-white-100 hover:underline font-bold">RSS feed</a> to stay updated.
            </p>
          </div>
          
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-black-900 dark:text-white-100" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border-2 border-black-900 dark:border-white-100 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
              placeholder="Search changes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:scale-110 transition-transform duration-200"
              >
                <X className="h-4 w-4 text-black-900 dark:text-white-100" />
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
              className={`group relative inline-flex items-center px-3 py-1 text-xs font-bold rounded-none border-2 transition-all duration-200 overflow-hidden ${
                activeFilter === filter.id
                  ? 'border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900'
                  : 'border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900'
              }`}
            >
              {activeFilter !== filter.id && (
                <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
              )}
              <span className="relative z-10 flex items-center">
                {filter.icon}
                <span className="ml-1">{filter.label}</span>
              </span>
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
            <div className="text-center py-12">
              <div className="bg-black-900 dark:bg-white-100 p-4 rounded-none mb-4 inline-block">
                <Search className="h-12 w-12 text-white-100 dark:text-black-900" />
              </div>
              <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-2">
                No changes found
              </h3>
              <p className="text-lg text-black-600 dark:text-white-400">
                Try adjusting your search or filter criteria.
              </p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="group relative mt-4 inline-flex items-center px-4 py-2 text-sm font-bold rounded-none border-2 border-black-900 dark:border-white-100 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                <span className="relative z-10">Clear filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-2 border-black-900 dark:border-white-100 text-center">
          <p className="text-lg text-black-600 dark:text-white-400">
            Want to see what's coming next? Check out our{' '}
            <a 
              href="https://github.com/utsav-mistry/shard/milestones" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-black-900 dark:text-white-100 hover:underline font-bold"
            >
              roadmap
            </a>{' '}
            or{' '}
            <a 
              href="https://github.com/utsav-mistry/shard/issues" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-black-900 dark:text-white-100 hover:underline font-bold"
            >
              request a feature
            </a>.
          </p>
        </div>
      </div>
    </PageTemplate>
  );
}