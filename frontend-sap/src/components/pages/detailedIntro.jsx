import React, { useEffect } from "react";
import { PLATFORMS_API } from "@/endpoints";
import useFetch from "../hooks/useFetch";
import Footer from "../Layouts/footer";

const DetailedIntro = () => {
    const { data: socialMediaData, loading: socialMediaLoading, error: socialMediaError, fetchData: fetchSocialMediaData } = useFetch(
        PLATFORMS_API,
        []
    );
    
    useEffect(() => {
        fetchSocialMediaData();
    }, []);
    
    const linkedinData = socialMediaData && socialMediaData.find((data) => data.platform.toLowerCase() === "mail");

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-5xl w-full mx-auto">
                <div className="space-y-8">
                    <div className="space-y-6">
                        <h1 className="text-4xl md:text-5xl font-black text-gray-800">
                            Detailed introduction
                        </h1>

                        {socialMediaLoading && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                <span>Loading contact information...</span>
                            </div>
                        )}

                        {socialMediaError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                                Unable to load contact information
                            </div>
                        )}

                        <div className="prose prose-lg max-w-none">
                            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                                So, you may have already noticed my passion for digital product development, but this is not something I recently realized. In fact, I have been learning technology since the age of 15. After graduating from vocational high school, I chose to further develop my interest in programming. The part I enjoy about programming is the problem-solving aspect. I feel satisfied when I successfully solve a problem. I also enjoy developing various projects with different technologies and making them open source. I have been doing this for more than 4 years.
                            </p>

                            <p className="text-base md:text-lg text-gray-700 leading-relaxed mt-6">
                                In my spare time, I like to study{" "}
                                <a 
                                    href="https://en.wikipedia.org/wiki/Network_security" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-700 border-b-2 border-dashed border-indigo-600 hover:border-indigo-700 transition-colors font-semibold"
                                >
                                    network security
                                </a>
                                , as well as{" "}
                                <a 
                                    href="https://en.wikipedia.org/wiki/User_interface_design" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-700 border-b-2 border-dashed border-indigo-600 hover:border-indigo-700 transition-colors font-semibold"
                                >
                                    UI/UX design
                                </a>
                                .
                            </p>

                            <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                <p className="text-base md:text-lg font-semibold text-gray-800 mb-2">
                                    DO YOU HAVE A COOL WEBSITE OR APPLICATION?
                                </p>
                                <p className="text-base md:text-lg text-gray-700">
                                    I'D LIKE TO{" "}
                                    {linkedinData ? (
                                        <a 
                                            href={linkedinData.account} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:text-indigo-700 border-b-2 border-dashed border-indigo-600 hover:border-indigo-700 transition-colors font-semibold uppercase"
                                        >
                                            HEAR ABOUT IT
                                        </a>
                                    ) : (
                                        <span className="text-gray-500 uppercase">HEAR ABOUT IT</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default DetailedIntro;