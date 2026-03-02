import React, { useEffect } from "react";
import { PLATFORMS_API } from "@/endpoints";
import useFetch from "../hooks/useFetch";

const Footer = () => {
    const { data: socialMediaData, fetchData: fetchSocialMediaData } = useFetch(PLATFORMS_API, []);
    
    useEffect(() => {
        fetchSocialMediaData();
    }, []);
    
    const mailData = socialMediaData && socialMediaData.find((data) => data.platform.toLowerCase() === "mail");

    return (
        <footer className="mt-auto pt-12 pb-8 px-6 md:px-12 border-t border-gray-200">
            <div className="max-w-5xl mx-auto">
                <p className="text-sm text-gray-600 leading-relaxed">
                    <span className="block text-lg font-black text-gray-800 mb-2">
                        Publish with SaptaSHIFT
                    </span>
                    Powered by{" "}
                    {mailData ? (
                        <a 
                            href={mailData.account}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-700 border-b-2 border-dashed border-indigo-600 hover:border-indigo-700 transition-colors font-semibold"
                        >
                            SaptaSHIFT
                        </a>
                    ) : (
                        <span className="text-indigo-600 font-semibold">SaptaSHIFT</span>
                    )}
                    {" "}- Home for tech writers and readers
                </p>
            </div>
        </footer>
    );
};

export default Footer;