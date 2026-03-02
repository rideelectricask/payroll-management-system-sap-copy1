import React, { useEffect, useState } from "react";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { PLATFORMS_API } from "@/endpoints";
import useFetch from "../hooks/useFetch";
import Footer from "../Layouts/footer";
import { storage } from "../../Firebase";

const Home = () => {
    const [ownerProfile, setOwnerProfile] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);
    const resumeOwnerRef = ref(storage, "images/owner");
    const resumeFileExtensions = ["jpg", "jpeg", "png"];

    useEffect(() => {
        const fetchResumeImageInfo = async () => {
            try {
                const imageList = await listAll(resumeOwnerRef);
                const infoArray = imageList.items.map((item) => item.name);
                const matchingFiles = infoArray.filter((name) =>
                    resumeFileExtensions.some((ext) => name.toLowerCase().endsWith(`.${ext}`))
                );

                if (matchingFiles.length > 0) {
                    const resumeFileRef = ref(storage, `images/owner/${matchingFiles[0]}`);
                    const url = await getDownloadURL(resumeFileRef);
                    setOwnerProfile(url);
                }
            } catch (error) {
                console.error("Error fetching resume image info:", error);
            } finally {
                setImageLoading(false);
            }
        };

        fetchResumeImageInfo();
    }, []);

    const downloadResume = async (resumeFileName) => {
        try {
            const resumeFileRef = ref(storage, `images/owner/${resumeFileName}`);
            const resumeDownloadURL = await getDownloadURL(resumeFileRef);
            window.open(resumeDownloadURL, "_blank");
        } catch (error) {
            console.error("Error downloading resume:", error);
        }
    };

    const { data: socialMediaData, fetchData: fetchSocialMediaData } = useFetch(PLATFORMS_API, []);
    
    useEffect(() => {
        fetchSocialMediaData();
    }, []);
    
    const mailData = socialMediaData && socialMediaData.find((data) => data.platform.toLowerCase() === "mail");

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-5xl w-full mx-auto">
                <div className="space-y-6">
                    <div className="relative overflow-hidden rounded-2xl shadow-md bg-gradient-to-br from-gray-50 to-gray-100">
                        {imageLoading ? (
                            <div className="aspect-[4/3] flex items-center justify-center">
                                <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                            </div>
                        ) : ownerProfile ? (
                            <img 
                                src={ownerProfile} 
                                alt="Septa - Software Engineer" 
                                className="w-full h-auto object-cover"
                            />
                        ) : (
                            <div className="aspect-[4/3] flex items-center justify-center bg-gray-100">
                                <span className="text-gray-400">Image not available</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black text-gray-800">
                            Hi, I'm <span className="text-gray-500">Septa</span>
                        </h1>
                        
                        <p className="text-base md:text-lg text-gray-700 leading-relaxed font-medium">
                            I am a Software Engineer based in Indonesia, with a special interest in development and free thinking. 
                            With more than 3 years of experience, I have worked with large companies and startups, helping them 
                            create innovative software with unique and innovative features. If you are interested in my work, you can{" "}
                            {mailData ? (
                                <a 
                                    href={mailData.account}
                                    className="text-indigo-600 hover:text-indigo-700 border-b-2 border-dashed border-indigo-600 hover:border-indigo-700 transition-colors font-semibold"
                                >
                                    contact me
                                </a>
                            ) : (
                                <span className="text-indigo-600">contact me</span>
                            )}
                            {" "}or see{" "}
                            <button
                                onClick={() => downloadResume("Septa-Anugrah-Perkasa-Resume.pdf")}
                                className="text-indigo-600 hover:text-indigo-700 border-b-2 border-dashed border-indigo-600 hover:border-indigo-700 transition-colors font-semibold cursor-pointer"
                            >
                                my resume
                            </button>
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Home;