import React from "react";
import Footer from "../Layouts/footer";

const Experience = () => {
    const experiences = [
        {
            logo: "https://firebasestorage.googleapis.com/v0/b/disco-beach-391702.appspot.com/o/images%2Fclients%2Fwuwenjin.png?alt=media&token=1d2ff297-a6a1-44e5-abae-e36f36d5199b",
            company: "Kejora Abadi Jaya",
            location: "Jakarta Barat, Indonesia",
            totalDuration: "7 Months",
            links: [
                { label: "27AN.ID", url: "https://companieshouse.id/kejora-abadi-jaya" },
                { label: "Demo", url: "https://shopee.co.id/wuwenjin" }
            ],
            positions: [
                {
                    role: "Content Development",
                    period: "February 2023 - April 2023",
                    duration: "7 Months",
                    responsibilities: [
                        "Creating engaging and informative visual communications through the use of images, typography, and illustrations, while utilizing tools such as Canva, Photoshop, and CorelDraw.",
                        "Promoting products or services through effective video content to reach and influence audiences across various online platforms, using CapCut and Filmora.",
                        "Managing digital content on social media to enhance brand awareness, sales, and audience engagement on platforms such as Instagram and TikTok.",
                        "Developing and implementing SEO-friendly content strategies to increase online visibility and attract organic traffic to the company's website or social media platforms.",
                        "Designing and managing creative content campaigns across various digital platforms to drive engagement, build communities, and increase conversions and sales.",
                        "Routinely analyzing data and content performance using SEO tools to optimize content strategies and ensure achievement of sales targets.",
                        "Creating persuasive and compelling content directly related to the company's products or services, including incorporating strong calls to action (CTAs) to drive purchases.",
                        "Collaborating with the marketing team to integrate content strategies with other marketing campaigns, ensuring message consistency, and enhancing the effectiveness of sales efforts on platforms such as Shopee, Tokopedia, Bukalapak, TikTok Seller, Taobao, and Tmall."
                    ]
                },
                {
                    role: "Content Editor",
                    period: "October 2022 - February 2023",
                    duration: "6 Months",
                    responsibilities: [
                        "Creating high-quality and creative videos by combining footage, audio, and visual effects, using software like CapCut and Filmora.",
                        "Developing strong visual stories through video that can reinforce brand messages and capture the audience's attention on platforms like Instagram and TikTok.",
                        "Optimizing videos for various formats and devices to ensure a consistent and engaging viewing experience across all digital platforms.",
                        "Designing and editing effective tutorial or product demo videos to support marketing efforts and enhance customer understanding of products or services.",
                        "Managing video production from pre-production to post-production, including scriptwriting, shooting, and final editing, using CapCut and Filmora.",
                        "Conducting A/B testing on different video versions to determine which elements are most effective in boosting conversions and audience engagement."
                    ]
                }
            ]
        },
        {
            logo: "https://firebasestorage.googleapis.com/v0/b/disco-beach-391702.appspot.com/o/images%2Fclients%2Fblitz.png?alt=media&token=8e7d08c7-4469-4663-b5ff-81f161e5beb3",
            company: "Blitz Electric Mobility",
            location: "Jakarta Selatan, Indonesia",
            totalDuration: "2 Years 8 Months",
            links: [
                { label: "Blitz Electric Mobility", url: "https://www.rideblitz.com/" },
                { label: "Demo", url: "https://rideblitz.id/" }
            ],
            positions: [
                {
                    role: "Operations System Specialist",
                    period: "November 2025 - Present",
                    duration: "3 Months",
                    responsibilities: [
                        "Leading strategic optimization initiatives for logistics operations systems, implementing advanced automation solutions to improve delivery efficiency and reduce operational costs.",
                        "Architecting and deploying scalable microservices infrastructure using Docker, Kubernetes, and cloud platforms to support growing business demands.",
                        "Designing and implementing comprehensive business intelligence dashboards with real-time data visualization for executive decision-making across all operational divisions.",
                        "Spearheading integration projects with external partners and third-party logistics providers, establishing standardized API protocols and data exchange frameworks.",
                        "Developing predictive analytics models using machine learning algorithms to forecast delivery demand, optimize route planning, and improve resource allocation.",
                        "Managing cross-functional teams to deliver complex system enhancements, coordinating between operations, finance, and technology departments.",
                        "Establishing data governance policies and implementing security protocols to ensure compliance with industry standards and protect sensitive operational data.",
                        "Creating automated workflow systems for operational approval processes, reducing manual intervention and improving response times.",
                        "Building advanced reporting systems for performance tracking across multiple KPIs including delivery success rates, driver productivity, and customer satisfaction metrics.",
                        "Conducting system architecture reviews and proposing strategic technology upgrades to support long-term business scalability.",
                        "Implementing automated alerting and monitoring systems to proactively identify and resolve operational bottlenecks.",
                        "Developing comprehensive technical documentation and training programs to ensure knowledge transfer and system maintainability.",
                        "Optimizing database performance and implementing data warehousing solutions for historical analysis and trend forecasting."
                    ]
                },
                {
                    role: "IT Support Engineer",
                    period: "May 2023 - October 2025",
                    duration: "2 Years 6 Months",
                    responsibilities: [
                        "Designing and implementing delivery task management features in driver mobile applications to streamline logistics workflows and improve operational efficiency.",
                        "Building comprehensive testing frameworks and automation tools to validate logistics operations and ensure system reliability across multiple environments.",
                        "Executing complex data migration projects to modernize legacy systems while maintaining data integrity and ensuring seamless third-party application integration.",
                        "Developing interactive analytics dashboards with statistical visualizations to provide real-time insights into pricing models, route optimization, driver performance metrics, and delivery success rates.",
                        "Implementing IoT-based tracking solutions for real-time driver monitoring and remote vehicle management systems to enhance fleet visibility and control.",
                        "Creating suite of internal automation tools for distance calculation, data aggregation, payroll processing, attendance tracking, and task allocation to reduce manual workload.",
                        "Managing and optimizing vehicle spare parts inventory system through data-driven forecasting and automated stock level monitoring.",
                        "Developing comprehensive payroll management platform to calculate driver compensation based on delivery metrics, providing performance insights for partners, clients, and internal stakeholders.",
                        "Maintaining partner and fleet operations databases to track vehicle utilization, monitor performance indicators, and generate accurate billing reports.",
                        "Building management reporting system with customizable time-based views for monitoring team productivity and generating actionable insights for operational improvements.",
                        "Designing rider performance evaluation system with visual analytics to identify productivity patterns, track active/inactive status, and assess performance trends for strategic workforce planning.",
                        "Architecting centralized database management systems for customer, partner, vendor, and delivery operations with interactive performance dashboards.",
                        "Collaborating with external technology partners to integrate project management platforms and ensure optimal system performance and stability."
                    ]
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-1 px-6 py-10 md:px-12 md:py-14 max-w-5xl w-full mx-auto">
                <div className="space-y-10">
                    <div className="space-y-3">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                            My work experience!
                        </h1>
                        <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                            Learn more about my professional experience on{" "}
                            <a 
                                href="https://www.linkedin.com/in/septa-anugrah-perkasa-6b707b249/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-900 hover:text-gray-700 underline decoration-2 underline-offset-4 decoration-gray-300 hover:decoration-gray-400 transition-colors font-medium"
                            >
                                LinkedIn
                            </a>
                        </p>
                    </div>

                    <div className="space-y-6">
                        {experiences.map((company, companyIndex) => (
                            <div 
                                key={companyIndex} 
                                className="bg-white rounded-xl overflow-hidden"
                            >
                                <div className="p-6 md:p-8">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-shrink-0">
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gray-50">
                                                <img 
                                                    src={company.logo} 
                                                    alt={company.company}
                                                    className="w-full h-full object-contain p-2"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-6">
                                            <div className="space-y-2">
                                                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                                                    {company.company}
                                                </h2>
                                                <div className="text-sm md:text-base text-gray-600">
                                                    <p className="font-medium text-gray-700">
                                                        {company.location}
                                                    </p>
                                                    <p className="text-gray-500">
                                                        {company.totalDuration}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                {company.positions.map((position, positionIndex) => (
                                                    <div 
                                                        key={positionIndex}
                                                        className={`space-y-4 ${positionIndex !== 0 ? 'pt-6 border-t border-gray-100' : ''}`}
                                                    >
                                                        <div className="space-y-2">
                                                            <h3 className="text-lg md:text-xl font-semibold text-gray-800">
                                                                {position.role}
                                                            </h3>
                                                            <div className="flex items-center gap-2 flex-wrap text-sm text-gray-500">
                                                                <span>{position.period}</span>
                                                                <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                                                                <span>{position.duration}</span>
                                                            </div>
                                                        </div>

                                                        <ul className="space-y-3">
                                                            {position.responsibilities.map((resp, idx) => (
                                                                <li 
                                                                    key={idx} 
                                                                    className="flex gap-3 text-sm md:text-base text-gray-600 leading-relaxed"
                                                                >
                                                                    <span className="flex-shrink-0 w-1 h-1 rounded-full bg-gray-400 mt-2"></span>
                                                                    <span>{resp}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex flex-wrap gap-3 pt-2">
                                                {company.links.map((link, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        <span>{link.label}</span>
                                                        <svg 
                                                            className="w-3.5 h-3.5" 
                                                            fill="none" 
                                                            stroke="currentColor" 
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Experience;