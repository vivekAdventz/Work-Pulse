/**
 * Seeds ActivityTag rows (by slug) and ActivityType rows under each tag.
 * Idempotent: skips existing tags/types (matches tag slug + activity name).
 *
 * Run from backend directory (so backend/.env loads):
 *   npm run seed:activity-catalog
 */
import '../config/env.js';
import { connectDB } from '../config/db.js';
import ActivityTag from '../models/ActivityTag.js';
import ActivityType from '../models/ActivityType.js';
import User from '../models/User.js';

/** Display name, unique slug, sort order, activity type labels */
const TAG_CATALOG = [
  {
    name: 'Meta Work',
    slug: 'meta-work',
    sortOrder: 10,
    activities: [
      'Email drafting',
      'Email responding',
      'Calendar management',
      'Meeting scheduling',
      'Meeting preparation',
      'Meeting participation',
      'Meeting facilitation',
      'Minutes of meeting documentation',
      'Action item tracking',
      'Follow-up coordination',
      'Task planning',
      'Task prioritization',
      'Status reporting',
      'Documentation creation',
      'Documentation revision',
      'Knowledge base updates',
      'Data entry',
      'Data validation',
      'File management',
      'Administrative coordination',
      'Travel planning',
      'Expense submission',
      'Timesheet entry',
    ],
  },
  {
    name: 'Product Management',
    slug: 'product-management',
    sortOrder: 20,
    activities: [
      'Product vision definition',
      'Roadmap planning',
      'Feature prioritization',
      'Requirement discovery',
      'PRD creation',
      'User story writing',
      'Backlog grooming',
      'Sprint planning',
      'Sprint review',
      'Stakeholder alignment',
      'User interviews',
      'Feedback synthesis',
      'Usability testing',
      'Feature validation',
      'GTM planning',
      'Product analytics tracking',
    ],
  },
  {
    name: 'Business Analyst',
    slug: 'business-analyst',
    sortOrder: 30,
    activities: [
      'Requirement elicitation',
      'Stakeholder interviews',
      'Workshop facilitation',
      'Process mapping',
      'As-is analysis',
      'To-be design',
      'BRD creation',
      'Functional spec writing',
      'Gap analysis',
      'Impact analysis',
      'Data validation',
      'UAT planning',
      'UAT execution support',
      'Test case creation',
      'Defect tracking',
      'Change request analysis',
      'Insight generation',
    ],
  },
  {
    name: 'Data Analyst / Data Work',
    slug: 'data-analyst-data-work',
    sortOrder: 40,
    activities: [
      'Data extraction',
      'Data ingestion',
      'Data cleaning',
      'Data transformation',
      'Data merging',
      'Data modeling',
      'Exploratory analysis',
      'Statistical analysis',
      'Forecast modeling',
      'KPI definition',
      'Dashboard design',
      'Dashboard development',
      'Report generation',
      'Report automation',
      'Data validation',
      'Query writing',
      'Query optimization',
      'Trend analysis',
      'Ad-hoc analysis',
    ],
  },
  {
    name: 'Operations',
    slug: 'operations',
    sortOrder: 50,
    activities: [
      'Production planning',
      'Production scheduling',
      'Production monitoring',
      'Quality inspection',
      'Inventory tracking',
      'Inventory reconciliation',
      'Logistics planning',
      'Dispatch coordination',
      'Vendor coordination',
      'Maintenance scheduling',
      'Downtime analysis',
      'Capacity planning',
      'Resource allocation',
      'Process optimization',
      'Compliance monitoring',
    ],
  },
  {
    name: 'Legal',
    slug: 'legal',
    sortOrder: 60,
    activities: [
      'Contract drafting',
      'Contract review',
      'Clause analysis',
      'Negotiation support',
      'Legal research',
      'Legal opinion drafting',
      'Litigation tracking',
      'Case documentation',
      'Notice drafting',
      'Notice response',
      'Dispute coordination',
      'Compliance review',
      'Risk assessment',
      'Policy vetting',
      'Due diligence',
      'IP filing',
      'External counsel coordination',
    ],
  },
  {
    name: 'Company Secretary (CS)',
    slug: 'company-secretary',
    sortOrder: 70,
    activities: [
      'Board meeting scheduling',
      'Agenda drafting',
      'Board note preparation',
      'Minutes drafting',
      'Action tracking',
      'Statutory filing preparation',
      'Filing submission',
      'Compliance tracking',
      'Secretarial audit coordination',
      'Annual report drafting',
      'Governance reporting',
      'Shareholder communication',
      'Dividend coordination',
      'Register maintenance',
      'ROC filing',
      'Listing compliance',
    ],
  },
  {
    name: 'Procurement / Supply Chain',
    slug: 'procurement-supply-chain',
    sortOrder: 80,
    activities: [
      'Vendor identification',
      'Vendor onboarding',
      'Vendor evaluation',
      'RFQ preparation',
      'RFP management',
      'Bid evaluation',
      'Purchase order creation',
      'Contract negotiation',
      'Procurement planning',
      'Inventory procurement',
      'Supplier coordination',
      'Cost benchmarking',
      'Procurement reporting',
    ],
  },
  {
    name: 'Customer Support',
    slug: 'customer-support',
    sortOrder: 90,
    activities: [
      'Ticket logging',
      'Ticket triaging',
      'Issue diagnosis',
      'Issue resolution',
      'Customer communication',
      'Escalation handling',
      'Complaint handling',
      'Feedback collection',
      'SLA tracking',
      'Root cause analysis',
    ],
  },
  {
    name: 'Strategy / Leadership',
    slug: 'strategy-leadership',
    sortOrder: 100,
    activities: [
      'Strategic planning',
      'Initiative prioritization',
      'Business case creation',
      'Financial modeling',
      'Scenario analysis',
      'Performance review',
      'Decision support',
      'Leadership reporting',
      'Cross-functional alignment',
      'Research / benchmarking',
      'Problem structuring',
      'M&A evaluation',
      'AI use-case identification',
      'Automation planning',
    ],
  },
  {
    name: 'Developer',
    slug: 'developer',
    sortOrder: 110,
    activities: [
      'Requirement analysis (technical)',
      'Feasibility analysis',
      'System architecture design',
      'Low-level design',
      'Database schema design',
      'API design',
      'Third-party integration design',
      'Backend development',
      'Frontend development',
      'Full-stack development',
      'API development',
      'Microservices development',
      'Script writing / automation scripting',
      'Code refactoring',
      'Code optimization',
      'Code review',
      'Peer programming',
      'Unit test writing',
      'Integration testing',
      'System testing',
      'Test data preparation',
      'Test case execution',
      'Bug identification',
      'Debugging',
      'Bug fixing',
      'Regression fixing',
      'Production bug fixing',
      'Build creation',
      'Deployment planning',
      'Release deployment',
      'Environment configuration',
      'CI/CD pipeline setup',
      'CI/CD pipeline maintenance',
      'Version control management',
      'Branch management',
      'Merge conflict resolution',
      'Application monitoring setup',
      'Log analysis',
      'Performance monitoring',
      'Performance optimization',
      'Load testing support',
      'Security implementation',
      'Vulnerability fixing',
      'Security testing support',
      'Production support',
      'Incident resolution',
      'Root cause analysis',
      'Technical documentation writing',
      'API documentation',
      'Code commenting',
      'Feature enhancement',
      'Feature customization',
      'Legacy system migration',
      'Codebase cleanup',
      'Data migration scripting',
      'Database performance tuning',
      'Dev environment setup',
      'Tool configuration',
      'Collaboration with product team',
      'Collaboration with QA team',
      'Collaboration with DevOps',
      'Sprint planning participation',
      'Sprint task updates',
      'Effort estimation',
    ],
  },
];

async function run() {
  await connectDB();

  const admin =
    (await User.findOne({ roles: 'Superadmin' })) ||
    (await User.findOne({ email: 'superadmin@adventz.com' }));

  if (!admin) {
    console.error('No Superadmin user found. Create one (seed.js) before running this script.');
    process.exit(1);
  }

  let tagsUpserted = 0;
  let typesCreated = 0;
  let typesSkipped = 0;

  for (const def of TAG_CATALOG) {
    let tag = await ActivityTag.findOne({ slug: def.slug });
    if (!tag) {
      tag = await ActivityTag.create({
        name: def.name,
        slug: def.slug,
        sortOrder: def.sortOrder,
      });
      tagsUpserted++;
      console.log(`Created tag: ${def.slug}`);
    } else {
      tag.name = def.name;
      tag.sortOrder = def.sortOrder;
      await tag.save();
    }

    const tagId = tag._id;

    for (const name of def.activities) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const exists = await ActivityType.findOne({ tagId, name: trimmed });
      if (exists) {
        typesSkipped++;
        continue;
      }
      await ActivityType.create({
        name: trimmed,
        tagId,
        createdBy: admin._id,
      });
      typesCreated++;
    }
  }

  console.log('Done.');
  console.log(`  New tags created: ${tagsUpserted}`);
  console.log(`  New activity types: ${typesCreated}`);
  console.log(`  Skipped (already existed): ${typesSkipped}`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
