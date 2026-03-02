import React, { useEffect } from "react";
import { PLATFORMS_API } from "@/endpoints";
import useFetch from "../hooks/useFetch";
import styles from "../../styles/Footer.module.css";

const Footer = () => {
    const { data: socialMediaData, loading: socialMediaLoading, error: socialMediaError, fetchData: fetchSocialMediaData } = useFetch(
        PLATFORMS_API,
        []
    );
    
    useEffect(() => {
        fetchSocialMediaData();
    }, []);
    
    const linkedinData = socialMediaData && socialMediaData.find((data) => data.platform.toLowerCase() === "mail");

    return (
        <div className={styles.footer}>
            <p>
                <span>Publish with SaptaSHIFT</span>
                {" "}Powered by{" "}
                {linkedinData ? (
                    <a href={linkedinData.account} target="_blank" rel="noopener noreferrer">
                        SaptaSHIFT
                    </a>
                ) : (
                    "SaptaSHIFT"
                )}
                {" "}- Home for tech writers and readers
            </p>
        </div>
    );
};

export default Footer;