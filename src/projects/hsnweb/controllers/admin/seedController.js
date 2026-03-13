/**
 * Seed Controller
 * Admin endpoint to seed database with initial data
 */
const dbManager = require('../../../../database/DatabaseManager');

// ========================================
// SEED DATA
// ========================================
const trainingsData = [
    {
        slug: 'fiori-dev-feb2026',
        title: 'SAP Fiori Development Masterclass',
        module: 'SAP Fiori/UI5',
        startDate: '2026-02-15',
        endDate: '2026-03-15',
        duration: '30 Days',
        mode: 'Online Live',
        timing: 'Weekends - 10:00 AM to 1:00 PM IST',
        instructor: 'Rajesh Kumar',
        level: 'Intermediate to Advanced',
        price: 25000,
        currency: 'INR',
        maxParticipants: 30,
        enrolledCount: 18,
        topics: ['UI5 Fundamentals', 'Fiori Elements', 'CAP Model Development', 'SAP Build Work Zone', 'Mobile App Development'],
        prerequisites: ['Basic JavaScript knowledge', 'Understanding of SAP basics', 'HTML/CSS familiarity'],
        certification: true,
        status: 'Open',
        isActive: true,
        sortOrder: 1
    },
    {
        slug: 'btp-bootcamp-mar2026',
        title: 'SAP BTP Cloud Development Bootcamp',
        module: 'SAP BTP',
        startDate: '2026-03-01',
        endDate: '2026-04-15',
        duration: '45 Days',
        mode: 'Online Live',
        timing: 'Weekdays - 7:00 PM to 9:00 PM IST',
        instructor: 'Priya Sharma',
        level: 'Beginner to Intermediate',
        price: 35000,
        currency: 'INR',
        maxParticipants: 25,
        enrolledCount: 12,
        topics: ['BTP Overview & Architecture', 'Cloud Foundry Basics', 'SAP HANA Cloud', 'CAP Development', 'SAP Build Apps', 'Integration Suite Basics'],
        prerequisites: ['Programming experience', 'Cloud concepts understanding'],
        certification: true,
        status: 'Open',
        isActive: true,
        sortOrder: 2
    },
    {
        slug: 'abap-rap-apr2026',
        title: 'ABAP RESTful Application Programming (RAP)',
        module: 'ABAP/RAP',
        startDate: '2026-04-01',
        endDate: '2026-05-01',
        duration: '30 Days',
        mode: 'Online Live',
        timing: 'Weekends - 2:00 PM to 5:00 PM IST',
        instructor: 'Amit Singh',
        level: 'Advanced',
        price: 30000,
        currency: 'INR',
        maxParticipants: 20,
        enrolledCount: 8,
        topics: ['CDS Views Advanced', 'Behavior Definitions', 'Business Object Development', 'Draft Handling', 'Unmanaged & Managed Scenarios', 'Fiori Elements Integration'],
        prerequisites: ['Strong ABAP background', 'CDS Views knowledge', 'OData understanding'],
        certification: true,
        status: 'Open',
        isActive: true,
        sortOrder: 3
    },
    {
        slug: 'sap-ai-may2026',
        title: 'SAP AI & Machine Learning',
        module: 'SAP AI',
        startDate: '2026-05-10',
        endDate: '2026-06-10',
        duration: '30 Days',
        mode: 'Hybrid',
        timing: 'Flexible Schedule',
        instructor: 'Dr. Neha Gupta',
        level: 'Intermediate',
        price: 40000,
        currency: 'INR',
        maxParticipants: 25,
        enrolledCount: 5,
        topics: ['SAP AI Core & Launchpad', 'Joule Integration', 'Machine Learning Use Cases', 'Predictive Analytics', 'AI in SAP Applications'],
        prerequisites: ['Basic AI/ML concepts', 'Python basics', 'SAP system familiarity'],
        certification: true,
        status: 'Open',
        isActive: true,
        sortOrder: 4
    }
];

const servicesData = [
    { slug: 'sap-fiori', title: 'SAP Fiori Development', category: 'core-sap', icon: 'fas fa-paint-brush', tagline: 'Beautiful, Intuitive, Modern', shortDescription: 'World-class Fiori apps with stunning UI/UX', description: 'We craft exceptional SAP Fiori applications that users love. Our design-first approach combines SAP Fiori Design Guidelines with modern UX principles to create interfaces that are not just functional, but truly delightful to use.', highlights: ['Custom Fiori Applications', 'Fiori Elements & Extensions', 'UI5 Freestyle Development', 'Fiori Launchpad Customization', 'Theme Designer & Branding'], features: ['Custom Fiori App Development', 'Fiori Elements Implementation', 'UI5 Freestyle Applications', 'SAP Work Zone Integration', 'Mobile App Development'], stats: { projects: '150+', satisfaction: '98%' }, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', isActive: true, sortOrder: 1 },
    { slug: 'sap-ui5', title: 'SAP UI5 & Frontend', category: 'core-sap', icon: 'fas fa-layer-group', tagline: 'Pixel-Perfect Interfaces', shortDescription: 'Advanced UI5 development with modern design patterns', description: 'Expert UI5 development leveraging the latest framework features. We build responsive, accessible, and high-performance applications following SAP best practices and modern frontend standards.', highlights: ['SAPUI5 Freestyle Apps', 'Responsive Design', 'Custom Controls & Libraries', 'Performance Optimization', 'Accessibility (WCAG 2.1)'], stats: { apps: '200+', performance: '40% faster' }, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', isActive: true, sortOrder: 2 },
    { slug: 'sap-btp', title: 'SAP BTP Development', category: 'core-sap', icon: 'fas fa-cloud', tagline: 'Cloud-Native Innovation', shortDescription: 'Full-stack development on SAP Business Technology Platform', description: 'Harness the full power of SAP BTP for cloud-native development. From CAP-based applications to complex integrations, we build scalable solutions that extend and enhance your SAP landscape.', highlights: ['SAP CAP Development', 'Cloud Foundry & Kyma', 'SAP HANA Cloud', 'Integration Suite', 'Extension Suite'], features: ['Cloud Foundry Development', 'SAP HANA Cloud', 'SAP Integration Suite', 'SAP Build Process Automation', 'Extension Suite Development'], stats: { deployments: '100+', uptime: '99.9%' }, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', isActive: true, sortOrder: 3 },
    { slug: 'btp-admin', title: 'BTP Administration', category: 'core-sap', icon: 'fas fa-server', tagline: 'Expert Platform Management', shortDescription: 'Professional BTP subaccount and service management', description: 'Comprehensive BTP administration services including subaccount setup, entitlement management, security configuration, and ongoing platform governance to ensure optimal performance and compliance.', highlights: ['Subaccount Management', 'Identity & Access Management', 'Service Provisioning', 'Security & Compliance', 'Cost Optimization'], stats: { accounts: '50+', savings: '30%' }, gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', isActive: true, sortOrder: 4 },
    { slug: 'sap-mobile', title: 'SAP Mobile Development', category: 'core-sap', icon: 'fas fa-mobile-alt', tagline: 'Mobile-First Solutions', shortDescription: 'Native and hybrid SAP mobile applications', description: 'Extend SAP to mobile with beautiful, performant applications. We build native iOS/Android apps and progressive web apps that bring SAP processes to users wherever they are.', highlights: ['SAP Mobile Development Kit', 'SAP BTP Mobile Services', 'Offline-First Architecture', 'Push Notifications', 'Biometric Authentication'], stats: { downloads: '10K+', rating: '4.8★' }, gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', isActive: true, sortOrder: 5 },
    { slug: 'sap-ai-fiori', title: 'AI-Powered Fiori', category: 'core-sap', icon: 'fas fa-brain', tagline: 'Intelligent User Experiences', shortDescription: 'Integrate AI & Joule into Fiori applications', description: 'Transform your Fiori apps with artificial intelligence. We integrate SAP Joule, Business AI, and custom ML models to create intelligent, predictive, and conversational user experiences.', highlights: ['Joule Copilot Integration', 'SAP Business AI', 'Predictive Analytics UI', 'Smart Recommendations', 'Conversational Interfaces'], stats: { efficiency: '+60%', automation: '85%' }, gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', isActive: true, sortOrder: 6 },
    { slug: 'sap-ai', title: 'SAP AI & Joule Integration', category: 'sap-services', icon: 'fas fa-robot', tagline: 'Intelligent Enterprise', shortDescription: 'Infuse intelligence into your SAP landscape', description: 'Harness the power of AI within SAP. We help integrate SAP Business AI, Joule copilot, and machine learning capabilities into your business processes.', features: ['SAP Business AI Implementation', 'Joule Copilot Integration', 'SAP AI Core & AI Launchpad', 'Predictive Analytics', 'Intelligent Process Automation'], isActive: true, sortOrder: 7 },
    { slug: 'sap-implementation', title: 'SAP Implementation', category: 'sap-services', icon: 'fas fa-cogs', tagline: 'End-to-End Delivery', shortDescription: 'End-to-end SAP implementation services', description: 'Complete SAP implementation services from planning to go-live. Our methodology ensures successful deployments with minimal disruption to your business.', features: ['S/4HANA Implementation', 'SAP Cloud Solutions', 'System Migration & Upgrade', 'Configuration & Customization', 'Data Migration'], isActive: true, sortOrder: 8 },
    { slug: 'sap-ams', title: 'SAP AMS', category: 'sap-services', icon: 'fas fa-headset', tagline: '24/7 Support', shortDescription: '24/7 Application Management Services', description: 'Keep your SAP systems running at peak performance with our Application Management Services. We provide comprehensive support, maintenance, and continuous improvement.', features: ['24/7 Support Services', 'Incident Management', 'Performance Optimization', 'Regular Health Checks', 'Continuous Improvement'], isActive: true, sortOrder: 9 },
    { slug: 'sap-bpa', title: 'SAP Build Process Automation', category: 'sap-services', icon: 'fas fa-project-diagram', tagline: 'Workflow Excellence', shortDescription: 'Automate and optimize business processes', description: 'Streamline operations with SAP Build Process Automation. We help design, automate, and optimize your business workflows for maximum efficiency.', features: ['Workflow Automation', 'RPA Bot Development', 'Process Mining & Analysis', 'Decision Management', 'Integration with SAP Systems'], isActive: true, sortOrder: 10 },
    { slug: 'cloud-solutions', title: 'Cloud Solutions', category: 'it-services', icon: 'fas fa-cloud-upload-alt', tagline: 'Cloud Excellence', shortDescription: 'Cloud infrastructure and migration services', description: 'Comprehensive cloud solutions including migration, optimization, and managed services across AWS, Azure, and Google Cloud platforms.', features: ['Cloud Migration', 'Infrastructure as Code', 'Multi-Cloud Management', 'Cloud Security', 'Cost Optimization'], isActive: true, sortOrder: 11 },
    { slug: 'enterprise-integration', title: 'Enterprise Integration', category: 'it-services', icon: 'fas fa-network-wired', tagline: 'Connected Systems', shortDescription: 'Seamless system and data integration', description: 'Connect your enterprise systems and enable seamless data flow across your organization with our integration expertise.', features: ['API Development & Management', 'Middleware Solutions', 'Data Integration', 'Legacy System Integration', 'B2B/EDI Integration'], isActive: true, sortOrder: 12 },
    { slug: 'custom-development', title: 'Custom Development', category: 'it-services', icon: 'fas fa-code', tagline: 'Tailored Solutions', shortDescription: 'Tailored software solutions', description: 'Custom software development to address your unique business challenges. We build scalable, maintainable solutions.', features: ['Full-Stack Development', 'Mobile Applications', 'Enterprise Applications', 'Microservices Architecture', 'DevOps Implementation'], isActive: true, sortOrder: 13 },
    { slug: 'sap-consultants', title: 'SAP Consultants', category: 'staff-augmentation', icon: 'fas fa-user-tie', tagline: 'Expert Talent', shortDescription: 'Expert SAP professionals for your projects', description: 'Access our pool of certified SAP consultants across all modules. Whether you need functional, technical, or solution architects, we have the right talent.', features: ['Functional Consultants', 'Technical Consultants', 'Solution Architects', 'Project Managers', 'Basis Administrators'], isActive: true, sortOrder: 14 },
    { slug: 'development-teams', title: 'Development Teams', category: 'staff-augmentation', icon: 'fas fa-users', tagline: 'Scale Your Team', shortDescription: 'Skilled development teams on demand', description: 'Extend your development capacity with our skilled teams. We provide dedicated developers who integrate seamlessly with your existing teams.', features: ['ABAP Developers', 'Fiori/UI5 Developers', 'BTP Developers', 'Full-Stack Developers', 'QA Engineers'], isActive: true, sortOrder: 15 },
    { slug: 'subcontracting', title: 'Project Subcontracting', category: 'staff-augmentation', icon: 'fas fa-handshake', tagline: 'Partnership Model', shortDescription: 'Complete project delivery partnerships', description: 'Partner with us for end-to-end project delivery. We take ownership of defined scopes and deliver quality outcomes.', features: ['Fixed-Price Projects', 'Time & Material', 'Dedicated Teams', 'Managed Services', 'Build-Operate-Transfer'], isActive: true, sortOrder: 16 }
];

const productsData = [
    { slug: 'aihunar', name: 'AiHunar', tagline: 'AI-Powered Talent Intelligence Platform', website: 'https://aihunar.com', logo: '/images/aihunar-logo.png', description: 'AiHunar is an innovative AI-powered platform designed search for best AI tools.', features: ['AI-Tools', 'AI content creator', 'AI Learning Programs', 'AI for Businesses', 'Latest AI News & Trends', 'TherapistBuddy - AI for Mental Wellness'], benefits: ['Find all AI tools in one place', 'Personalized AI recommendations', 'Expert-curated content', 'Stay updated with AI trends', 'Access AI learning resources', 'Improve mental wellness with AI'], gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', isFeatured: true, isActive: true, sortOrder: 1 },
    { slug: 'kotwal', name: 'Kotwal', tagline: 'Enterprise AI Security Gateway', website: 'https://aikotwal.com', logo: '/images/kotwal-logo.png', description: 'Kotwal is your enterprise AI security solution, ensuring safe and compliant use of AI across your organization. Protect sensitive data while enabling AI innovation.', features: ['AI Usage Monitoring', 'Data Loss Prevention for AI', 'PII Detection & Masking', 'Compliance Reporting', 'Policy Enforcement', 'Multi-LLM Support'], benefits: ['Secure AI adoption', 'Regulatory compliance', 'Visibility into AI usage', 'Protect sensitive data'], gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', isFeatured: true, isActive: true, sortOrder: 2 }
];

const sapAddonsData = [
    { slug: 'fiori-tracker', name: 'Fiori App Tracker', version: '2.1.0', category: 'Fiori', status: 'Available', shortDescription: 'Track and manage Fiori app deployments across your landscape', description: 'Comprehensive solution for tracking Fiori applications across development, quality, and production environments. Get insights into app usage, performance, and deployment status.', features: ['Multi-system app tracking', 'Deployment history', 'Usage analytics', 'Performance monitoring', 'Automated sync detection'], compatibility: ['S/4HANA 2020+', 'ECC 6.0 EHP7+'], demoAvailable: true, image: '/images/addons/fiori-tracker.png', isFeatured: true, isActive: true, sortOrder: 1 },
    { slug: 'smart-forms-converter', name: 'Smart Forms Converter', version: '1.5.0', category: 'Migration', status: 'Available', shortDescription: 'Automated conversion of Smart Forms to Adobe Forms', description: 'Accelerate your migration from Smart Forms to Adobe Forms with our intelligent conversion tool. Reduce manual effort and ensure consistency.', features: ['Automated layout conversion', 'Logic mapping', 'Batch processing', 'Validation reports', 'Custom template support'], compatibility: ['S/4HANA', 'ECC 6.0'], demoAvailable: true, image: '/images/addons/smart-forms-converter.png', isActive: true, sortOrder: 2 },
    { slug: 'btp-monitor', name: 'BTP Health Monitor', version: '3.0.0', category: 'BTP', status: 'Available', shortDescription: 'Real-time monitoring for SAP BTP services and applications', description: 'Comprehensive monitoring solution for your SAP BTP landscape. Track service health, application performance, and resource utilization in real-time.', features: ['Real-time dashboards', 'Alert management', 'Resource tracking', 'Cost analytics', 'Integration with SAP ALM'], compatibility: ['SAP BTP Cloud Foundry', 'SAP BTP Kyma'], demoAvailable: true, image: '/images/addons/btp-monitor.png', isActive: true, sortOrder: 3 },
    { slug: 'cds-analyzer', name: 'CDS Analyzer Pro', version: '2.0.0', category: 'Development', status: 'Available', shortDescription: 'Advanced CDS view analysis and optimization tool', description: 'Deep analysis of your CDS views for performance optimization. Identify bottlenecks, unused fields, and optimization opportunities.', features: ['Performance analysis', 'Dependency visualization', 'Code quality checks', 'Optimization suggestions', 'Documentation generator'], compatibility: ['S/4HANA 1909+', 'SAP BW/4HANA'], demoAvailable: false, image: '/images/addons/cds-analyzer.png', isActive: true, sortOrder: 4 },
    { slug: 'rap-generator', name: 'RAP Generator', version: '1.0.0', category: 'Development', status: 'Coming Soon', shortDescription: 'Generate complete RAP applications from database tables', description: 'Accelerate ABAP RESTful Application Programming development. Generate complete CRUD applications including CDS, behavior definitions, and Fiori apps.', features: ['One-click RAP generation', 'Custom logic injection', 'Fiori Elements integration', 'Draft handling support', 'Authorization template'], compatibility: ['S/4HANA 2020+', 'BTP ABAP Environment'], pricing: 'Coming Soon', demoAvailable: false, image: '/images/addons/rap-generator.png', isActive: true, sortOrder: 5 },
    { slug: 'workflow-insights', name: 'Workflow Insights', version: '1.8.0', category: 'Analytics', status: 'Available', shortDescription: 'Advanced analytics for SAP workflows and approvals', description: 'Gain deep insights into your SAP workflow processes. Track approval times, identify bottlenecks, and optimize your business processes.', features: ['Process analytics', 'Bottleneck identification', 'SLA monitoring', 'Trend analysis', 'Custom reports'], compatibility: ['S/4HANA', 'SAP Build Process Automation'], demoAvailable: true, image: '/images/addons/workflow-insights.png', isActive: true, sortOrder: 6 }
];

const testimonialsData = [
    { content: 'HSN Tech delivered our S/4HANA migration ahead of schedule. Their expertise in BTP and Fiori helped us modernize our entire SAP landscape.', author: 'Vikram Mehta', role: 'CTO', company: 'Tech Solutions Inc.', avatar: 'VM', rating: 5, isFeatured: true, isActive: true, sortOrder: 1 },
    { content: 'The Kotwal product has been instrumental in securing our AI initiatives. We now have complete visibility into how AI is being used across our organization.', author: 'Sarah Johnson', role: 'CISO', company: 'Global Manufacturing Corp', avatar: 'SJ', rating: 5, isFeatured: true, isActive: true, sortOrder: 2 },
    { content: 'Outstanding training programs! The Fiori development course gave our team the skills they needed to build modern applications.', author: 'Pradeep Kumar', role: 'IT Manager', company: 'Retail Innovations Ltd', avatar: 'PK', rating: 5, isFeatured: true, isActive: true, sortOrder: 3 }
];

const siteConfigData = [
    { key: 'company_name', value: 'Hanshivna Tech Private Limited', category: 'company' },
    { key: 'company_short_name', value: 'HSN Tech', category: 'company' },
    { key: 'company_tagline', value: 'Transforming Enterprises with SAP & AI Innovation', category: 'company' },
    { key: 'company_email', value: 'to@hanshivnatech.in', category: 'contact' },
    { key: 'company_phone', value: '+91 5443358781', category: 'contact' },
    { key: 'company_website', value: 'https://hsntech.in', category: 'company' },
    { key: 'stat_projects_completed', value: '200+', category: 'stats' },
    { key: 'stat_happy_clients', value: '20+', category: 'stats' },
    { key: 'stat_team_members', value: '50+', category: 'stats' },
    { key: 'stat_years_experience', value: '5+', category: 'stats' },
    { key: 'social_linkedin', value: 'https://linkedin.com/company/hsntech', category: 'social' },
    { key: 'social_twitter', value: 'https://twitter.com/aihuanr', category: 'social' },
    { key: 'social_facebook', value: 'https://facebook.com/aihunar', category: 'social' },
    { key: 'social_youtube', value: 'https://youtube.com/@aihunar', category: 'social' }
];

/**
 * Seed all content tables
 */
const seedAll = async (req, res) => {
    try {
        const results = {
            trainings: { created: 0, skipped: 0 },
            services: { created: 0, skipped: 0 },
            products: { created: 0, skipped: 0 },
            sapAddons: { created: 0, skipped: 0 },
            testimonials: { created: 0, skipped: 0 },
            siteConfig: { created: 0, skipped: 0 }
        };

        // Get models
        const Training = dbManager.getModel('hsnweb', 'Training');
        const Service = dbManager.getModel('hsnweb', 'Service');
        const Product = dbManager.getModel('hsnweb', 'Product');
        const SAPAddon = dbManager.getModel('hsnweb', 'SAPAddon');
        const Testimonial = dbManager.getModel('hsnweb', 'Testimonial');
        const SiteConfig = dbManager.getModel('hsnweb', 'SiteConfig');

        // Seed Trainings
        for (const data of trainingsData) {
            const [record, created] = await Training.findOrCreate({
                where: { slug: data.slug },
                defaults: data
            });
            created ? results.trainings.created++ : results.trainings.skipped++;
        }

        // Seed Services
        for (const data of servicesData) {
            const [record, created] = await Service.findOrCreate({
                where: { slug: data.slug },
                defaults: data
            });
            created ? results.services.created++ : results.services.skipped++;
        }

        // Seed Products
        for (const data of productsData) {
            const [record, created] = await Product.findOrCreate({
                where: { slug: data.slug },
                defaults: data
            });
            created ? results.products.created++ : results.products.skipped++;
        }

        // Seed SAP Add-ons
        for (const data of sapAddonsData) {
            const [record, created] = await SAPAddon.findOrCreate({
                where: { slug: data.slug },
                defaults: data
            });
            created ? results.sapAddons.created++ : results.sapAddons.skipped++;
        }

        // Seed Testimonials
        for (const data of testimonialsData) {
            const existing = await Testimonial.findOne({
                where: { author: data.author, company: data.company }
            });
            if (!existing) {
                await Testimonial.create(data);
                results.testimonials.created++;
            } else {
                results.testimonials.skipped++;
            }
        }

        // Seed Site Config
        for (const data of siteConfigData) {
            const [record, created] = await SiteConfig.findOrCreate({
                where: { key: data.key },
                defaults: data
            });
            created ? results.siteConfig.created++ : results.siteConfig.skipped++;
        }

        res.json({
            success: true,
            message: 'Database seeded successfully',
            results,
            totals: {
                created: Object.values(results).reduce((sum, r) => sum + r.created, 0),
                skipped: Object.values(results).reduce((sum, r) => sum + r.skipped, 0)
            }
        });

    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({
            success: false,
            message: 'Seeding failed',
            error: error.message
        });
    }
};

/**
 * Get seed status - check what data exists
 */
const getStatus = async (req, res) => {
    try {
        const Training = dbManager.getModel('hsnweb', 'Training');
        const Service = dbManager.getModel('hsnweb', 'Service');
        const Product = dbManager.getModel('hsnweb', 'Product');
        const SAPAddon = dbManager.getModel('hsnweb', 'SAPAddon');
        const Testimonial = dbManager.getModel('hsnweb', 'Testimonial');
        const SiteConfig = dbManager.getModel('hsnweb', 'SiteConfig');

        const status = {
            trainings: await Training.count(),
            services: await Service.count(),
            products: await Product.count(),
            sapAddons: await SAPAddon.count(),
            testimonials: await Testimonial.count(),
            siteConfig: await SiteConfig.count()
        };

        const isEmpty = Object.values(status).every(count => count === 0);

        res.json({
            success: true,
            isEmpty,
            counts: status,
            seedDataAvailable: {
                trainings: trainingsData.length,
                services: servicesData.length,
                products: productsData.length,
                sapAddons: sapAddonsData.length,
                testimonials: testimonialsData.length,
                siteConfig: siteConfigData.length
            }
        });

    } catch (error) {
        console.error('Seed status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get status',
            error: error.message
        });
    }
};

module.exports = {
    seedAll,
    getStatus
};
