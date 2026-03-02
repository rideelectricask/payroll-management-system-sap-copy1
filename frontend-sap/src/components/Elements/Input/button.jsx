import React from "react";
import { Link } from "react-router-dom";

const Button = {
    ButtonV1: (props) => {
        const { children, variant, link, classNameV1 = "", classNameV2 = "" } = props;
        return (
            <li>
                <Link 
                    to={link} 
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${classNameV1}`}
                >
                    <i className={`${variant} ${classNameV2} text-lg w-5 flex items-center justify-center`}></i>
                    <span className="font-medium text-base">{children}</span>
                </Link>
            </li>
        );
    },

    ButtonV2: (props) => {
        const { children, variant, link, classNameV2 = "", isDefault = false } = props;
        return (
            <li>
                <a 
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group"
                >
                    <i className={`${variant} ${classNameV2} text-lg w-5 flex items-center justify-center`}></i>
                    <span className="font-medium text-base flex-1 flex items-center gap-2">
                        {children}
                        {isDefault && (
                            <svg 
                                className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        )}
                    </span>
                </a>
            </li>
        );
    },
};

export default Button;