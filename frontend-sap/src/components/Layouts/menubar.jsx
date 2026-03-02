import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { PLATFORMS_API } from "@/endpoints";
import useFetch from "../hooks/useFetch";

const Menubar = () => {
    const [activeButton, setActiveButton] = useState(0);
    const [sidebarActive, setSidebarActive] = useState(false);
    const location = useLocation();

    const buttonsData = [
        { variant: "fi fi-tr-house-blank", link: "/", text: "Home" },
        { variant: "fi fi-tr-comment-alt-dots", link: "/detailed-intro", text: "Detailed Intro" },
        { variant: "fi fi-brands-atom", link: "/capability", text: "Capability" },
        { variant: "fi fi-ts-hourglass-start", link: "/experience", text: "Experience" },
        { variant: "fi fi-tr-diagram-project", link: "/project", text: "Project" },
    ];

    const toggleSidebar = () => {
        setSidebarActive(!sidebarActive);
    };

    useEffect(() => {
        const pathIndex = buttonsData.findIndex(btn => btn.link === location.pathname);
        setActiveButton(pathIndex !== -1 ? pathIndex : 0);
    }, [location]);

    const { data: socialMediaData, error: socialMediaError, fetchData: fetchSocialMediaData } = useFetch(PLATFORMS_API, []);
    
    useEffect(() => {
        fetchSocialMediaData();
    }, []);

    return (
        <>
            <button
                onClick={toggleSidebar}
                className={`fixed right-6 bottom-6 z-50 lg:hidden flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-lg text-gray-700 hover:bg-gray-100 transition-all duration-300 ${sidebarActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                aria-label="Open menu"
            >
                <i className="fi fi-ts-circle-ellipsis text-2xl"></i>
            </button>

            <aside className={`fixed top-0 left-0 h-screen bg-white shadow-lg z-40 transition-transform duration-300 ease-in-out ${sidebarActive ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} w-64 overflow-y-auto`}>
                <div className="flex flex-col min-h-full p-6">
                    <div className="flex items-center justify-end mb-6 lg:mb-8">
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700 transition-all duration-200"
                            aria-label="Close menu"
                        >
                            <i className="fi fi-tr-circle-xmark text-2xl leading-none"></i>
                        </button>
                    </div>

                    <nav className="flex-1 mb-8">
                        <ul className="space-y-1.5">
                            {buttonsData.map((button, index) => (
                                <li key={index}>
                                    <Link
                                        to={button.link}
                                        onClick={() => {
                                            setActiveButton(index);
                                            setSidebarActive(false);
                                        }}
                                        className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 ${
                                            index === activeButton
                                                ? 'bg-gray-900 text-white shadow-md'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <i className={`${button.variant} text-lg w-5 h-5 flex items-center justify-center leading-none`}></i>
                                        <span className="font-medium text-[15px]">{button.text}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-gray-900 font-semibold text-base mb-4 px-1">Let's connect</h3>
                        {socialMediaError && (
                            <div className="text-red-500 text-sm mb-3 px-2">Error loading social links</div>
                        )}
                        <ul className="space-y-1.5">
                            {socialMediaData && socialMediaData.map((platformData, index) => (
                                <li key={index}>
                                    <a
                                        href={platformData.account}
                                        target={platformData.platform.toLowerCase() !== "mail" ? "_blank" : undefined}
                                        rel={platformData.platform.toLowerCase() !== "mail" ? "noopener noreferrer" : undefined}
                                        className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 group"
                                    >
                                        <i className={`${platformData.icon} text-lg w-5 h-5 flex items-center justify-center leading-none`}></i>
                                        <span className="font-medium text-[15px] flex-1">{platformData.platform}</span>
                                        {platformData.platform.toLowerCase() !== "mail" && (
                                            <svg 
                                                className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        )}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </aside>

            {sidebarActive && (
                <div
                    onClick={toggleSidebar}
                    className="fixed inset-0 bg-black bg-opacity-40 z-30 lg:hidden backdrop-blur-sm transition-opacity"
                    aria-hidden="true"
                ></div>
            )}
        </>
    );
};

export default Menubar;