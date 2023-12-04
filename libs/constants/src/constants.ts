import type { CommitVerificationReason } from '@klave/db';

export const permissiblePeers = [
    /^chrome-extension:\/\//,
    /^http:\/\/localhost/,
    /^http:\/\/127.0.0.1/,
    /\.klave\.network$/,
    /\.klave\.dev$/,
    /\.klave\.com$/,
    /\.secretarium\.com$/,
    /\.secretarium\.org$/
];

export const commitVerificationReasons: Record<CommitVerificationReason, string> = {
    expired_key: 'Expired Key',
    not_signing_key: 'Not Signing Key',
    gpgverify_error: 'GPGVerify Error',
    gpgverify_unavailable: 'GPGVerify Unavailable',
    unsigned: 'Unsigned',
    unknown_signature_type: 'Unknown Signature Type',
    no_user: 'No User',
    unverified_email: 'Unverified Email',
    bad_email: 'Bad Email',
    unknown_key: 'Unknown Key',
    malformed_signature: 'Malformed Signature',
    invalid: 'Invalid',
    valid: 'Valid',
    unknown: 'Unknown'
};

export const reservedNames = [
    // Base
    '300',
    '301',
    '302',
    '400',
    '401',
    '402',
    '403',
    '404',
    '405',
    '406',
    '407',
    '408',
    '409',
    '410',
    '411',
    '412',
    '413',
    '414',
    '415',
    '416',
    '417',
    '418',
    '419',
    '420',
    '421',
    '422',
    '423',
    '424',
    '425',
    '426',
    '427',
    '428',
    '429',
    '430',
    '431',
    '500',
    '501',
    '502',
    '503',
    '504',
    '505',
    '506',
    '507',
    '508',
    '509',
    '510',
    '511',
    '693',
    '694',
    '695',
    '900',
    'about',
    'access',
    'access',
    'account',
    'accounts',
    'admin',
    'admins',
    'administration',
    'administrations',
    'administrator',
    'administrators',
    'advisory',
    'advisories',
    'anonymous',
    'any',
    'api',
    'apis',
    'app',
    'apps',
    'application',
    'applications',
    'attributes',
    'auth',
    'billing',
    'blob',
    'blog',
    'blogs',
    'bounty',
    'branche',
    'branches',
    'business',
    'businesses',
    'cache',
    'case-studies',
    'categories',
    'central',
    'cert',
    'certs',
    'certificate',
    'certificates',
    'certification',
    'certifications',
    'changelog',
    'chain',
    'chains',
    'chat',
    'cli',
    'cloud',
    'codereview',
    'collection',
    'collections',
    'comments',
    'commit',
    'commits',
    'community',
    'communities',
    'company',
    'companies',
    'compare',
    'confidentiality',
    'confidential',
    'contact',
    'contacts',
    'contribution',
    'contributions',
    'contributing',
    'cookbook',
    'coupons',
    'customer-stories',
    'customer',
    'customers',
    'dashboard-feed',
    'dashboard',
    'dashboards',
    'design',
    'develop',
    'developer',
    'developers',
    'deploy',
    'deployment',
    'deployments',
    'diff',
    'discover',
    'discussions',
    'docs',
    'downloads',
    'downtime',
    'editor',
    'editors',
    'edu',
    'enterprise',
    'events',
    'explore',
    'featured',
    'features',
    'files',
    'fixtures',
    'forked',
    'funds',
    'funding',
    'garage',
    'ghost',
    'gist',
    'gists',
    'graphs',
    'guide',
    'guides',
    'help',
    'help-wanted',
    'home',
    'honest',
    'honestdev',
    'hooks',
    'hosting',
    'hovercards',
    'identity',
    'images',
    'inbox',
    'individual',
    'info',
    'integration',
    'interfaces',
    'introduction',
    'invalid-email-address',
    'investors',
    'issues',
    'jobs',
    'join',
    'journal',
    'journals',
    'klave',
    'klaveai',
    'klaive',
    'lab',
    'labs',
    'languages',
    'launch',
    'layouts',
    'learn',
    'legal',
    'library',
    'linux',
    'listings',
    'lists',
    'login',
    'logos',
    'logout',
    'log',
    'logs',
    'logchain',
    'mac',
    'maintenance',
    'malware',
    'man',
    'marketplace',
    'mention',
    'mentioned',
    'mentioning',
    'mentions',
    'migrating',
    'milestones',
    'mine',
    'mirrors',
    'mobile',
    'navigation',
    'network',
    'new',
    'news',
    'none',
    'nonprofit',
    'nonprofits',
    'notices',
    'notifications',
    'no-reply',
    'noreply',
    'oidc',
    'oauth',
    'oauth2',
    'offer',
    'open-source',
    'organisation',
    'organisations',
    'organization',
    'organizations',
    'org',
    'orgs',
    'page',
    'pages',
    'partners',
    'pay',
    'payment',
    'payments',
    'personal',
    'plans',
    'platform',
    'public',
    'public-network',
    'plugins',
    'policy',
    'policies',
    'popular',
    'popularity',
    'posts',
    'press',
    'pricing',
    'private',
    'privacy',
    'profile',
    'profiles',
    'product',
    'products',
    'professional',
    'project',
    'projects',
    'pulls',
    'raw',
    'readme',
    'recommendations',
    'redeem',
    'release',
    'releases',
    'render',
    'reply',
    'replies',
    'repository',
    'repositories',
    'resource',
    'resources',
    'restore',
    'revert',
    'roadmap',
    'save-net-neutrality',
    'saved',
    'scraping',
    'search',
    'security',
    'services',
    'sessions',
    'settings',
    'setup',
    'shareholders',
    'shop',
    'showcases',
    'signin',
    'signup',
    'site',
    'sla',
    'slas',
    'sre',
    'sres',
    'solution',
    'solutions',
    'spam',
    'sponsors',
    'ssh',
    'staff',
    'starred',
    'stars',
    'static',
    'status',
    'statuses',
    'storage',
    'store',
    'stories',
    'styleguide',
    'submit',
    'subscribe',
    'subscription',
    'subscriptions',
    'suggest',
    'suggestion',
    'suggestions',
    'support',
    'suspended',
    'talks',
    'teach',
    'teacher',
    'teachers',
    'teaching',
    'team',
    'teams',
    'tech',
    'technology',
    'ten',
    'terms',
    'timeline',
    'topic',
    'topics',
    'tos',
    'tour',
    'train',
    'training',
    'translate',
    'translations',
    'tree',
    'trending',
    'trust',
    'trust-center',
    'updates',
    'username',
    'user',
    'users',
    'visualization',
    'watching',
    'whitepaper',
    'whitepapers',
    'wiki',
    'windows',
    'works-with',
    'www0',
    'www1',
    'www2',
    'www3',
    'www4',
    'www5',
    'www6',
    'www7',
    'www8',
    'www9',
    // GAFAM
    'amazon',
    'google',
    'microsoft',
    'twitter',
    'apple',
    'instagram',
    'facebook',
    'meta',
    // Domains
    'amlyse',
    'amlytic',
    'cleandataroom',
    'collaborativecomputing',
    'confidant-app',
    'confidentialbenchark',
    'confidentialbenchmark',
    'confidentialbenchmarks',
    'confidentialcomputing',
    'confidentialinsight',
    'confidentialinsights',
    'confidentialpoll',
    'confidentialpolls',
    'confidentialprocessing',
    'confidentialvoting',
    'confista',
    'cryptweb',
    'danie',
    'datacleanroom',
    'datalign',
    'filevet',
    'klave',
    'moai-app',
    'moaiapp',
    'monilytics',
    'salus-app',
    'secretarium',
    'secrethereum',
    'secretivebenchmarks',
    'secretivecomputing',
    'secretiveinsight',
    'secretivevoting',
    'secretpolls',
    'secretprocessing',
    'secretsurveys',
    'secureinsight',
    'secureroom',
    'speakout-app',
    'stts',
    'thesecurecloud',
    'trustroom',
    'trustless',
    'zero-trust',
    'confidential-computing',
    'privacy-preserving',
    'privacy-enabling',
    'jellyfish',
    'seaslug'
];