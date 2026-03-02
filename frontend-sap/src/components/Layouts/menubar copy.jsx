import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { PLATFORMS_API } from "@/endpoints";
import useFetch from "../hooks/useFetch";
import styles from "../../styles/Index.module.css";
import Button from "../Elements/Input/button";

const Menubar = () => {
    const [activeButton, setActiveButton] = useState(null);
    const [sidebarActive, setSidebarActive] = useState(false);
    const [openInActive, setOpenInActive] = useState(false);
    const navLinksRef = useRef(null);
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
        setOpenInActive(!openInActive);
    };

    useEffect(() => {
        const handleButtonClick = (event, buttonId) => {
            setActiveButton(buttonId);
        };
        const navLinks = navLinksRef.current;
        navLinks.childNodes.forEach((button, index) => {
            button.addEventListener("click", (event) => handleButtonClick(event, index));
        });

        return () => {
            navLinks.childNodes.forEach((button, index) => {
                button.removeEventListener("click", (event) => handleButtonClick(event, index));
            });
        };
    }, []);

    useEffect(() => {
        switch (location.pathname) {
            case "/":
                setActiveButton(0);
                break;
            case "/detailed-intro":
                setActiveButton(1);
                break;
            case "/capability":
                setActiveButton(2);
                break;
            case "/experience":
                setActiveButton(3);
                break;
            case "/project":
                setActiveButton(4);
                break;
            default:
                setActiveButton(0);
        }
    }, [location]);

    const { data: socialMediaData, loading: socialMediaLoading, error: socialMediaError, fetchData: fetchSocialMediaData } = useFetch(
        PLATFORMS_API,
        []
    );
    useEffect(() => {
        fetchSocialMediaData();
    }, []);

    return (
        <nav className={`${styles.sidebar}`}>
            <div className={`${styles.toggle} ${styles.openIn} ${sidebarActive ? styles.toggleAdd : ""} ${openInActive ? styles.active : ""}`}>
                <label className={styles.open} onClick={toggleSidebar} style={{ cursor: "pointer" }}>
                    <i className="fi fi-ts-circle-ellipsis"></i>
                </label>
            </div>
            <div className={`${styles.menuBar} ${sidebarActive ? styles.active : ""}`}>
                <div className={styles.toggle}>
                    <label className={styles.close} onClick={toggleSidebar} style={{ cursor: "pointer" }}>
                        <i className="fi fi-tr-circle-xmark"></i>
                    </label>
                </div>

                <div className={styles.menu}>
                    <ul className={styles.menuLinks} ref={navLinksRef}>
                        {buttonsData.map((button, index) => (
                            <Button.ButtonV1
                                key={index}
                                variant={button.variant}
                                link={button.link}
                                classNameV1={activeButton === null ? "" : index === activeButton ? styles.on : ""}
                            >
                                {button.text}
                            </Button.ButtonV1>
                        ))}
                    </ul>
                </div>

                <div className={styles.bottomContent}>
                    <h3>Let's connect</h3>
                    {/* {socialMediaLoading && <li>Loading...</li>} */}
                    {socialMediaError && <li>Error: {socialMediaError}</li>}
                    {socialMediaData &&
                        socialMediaData.map((platformData, index) => (
                            <Button.ButtonV2
                                key={index}
                                link={platformData.account}
                                variant={platformData.icon}
                                isDefault={platformData.platform.toLowerCase() !== "mail" ? "true" : undefined}
                            >
                                {platformData.platform}
                            </Button.ButtonV2>
                        ))}
                </div>
            </div>
        </nav>
    );
};

export default Menubar;